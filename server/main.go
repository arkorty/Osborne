package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
)

type MessageType string

const (
	TextUpdate     MessageType = "text-update"
	InitialContent MessageType = "initial-content"
	JoinRoom       MessageType = "join-room"
	Ping           MessageType = "ping"
	Pong           MessageType = "pong"
	CommentAdd     MessageType = "comment-add"
	CommentUpdate  MessageType = "comment-update"
	CommentDelete  MessageType = "comment-delete"
	CommentsSync   MessageType = "comments-sync"
	UserJoined     MessageType = "user-joined"
	UserLeft       MessageType = "user-left"
	UserActivity   MessageType = "user-activity"
	UsersSync      MessageType = "users-sync"
	MediaUpload    MessageType = "media-upload"
	MediaDelete    MessageType = "media-delete"
	MediaSync      MessageType = "media-sync"
)

type BaseMessage struct {
	Type MessageType `json:"type"`
	Code string      `json:"code"`
}

type TextUpdateMessage struct {
	BaseMessage
	Content string `json:"content"`
}

type InitialContentMessage struct {
	BaseMessage
	Content string `json:"content"`
}

type JoinRoomMessage struct {
	BaseMessage
	User User `json:"user"`
}

type PingMessage struct {
	BaseMessage
}

type PongMessage struct {
	BaseMessage
}

type Comment struct {
	ID         string    `json:"id"`
	LineNumber *int      `json:"lineNumber"`
	LineRange  *string   `json:"lineRange"`
	Author     string    `json:"author"`
	AuthorID   string    `json:"authorId"`
	Content    string    `json:"content"`
	Timestamp  time.Time `json:"timestamp"`
}

type CommentMessage struct {
	BaseMessage
	Comment Comment `json:"comment"`
}

type CommentsMessage struct {
	BaseMessage
	Comments []Comment `json:"comments"`
}

type User struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Color       string    `json:"color"`
	LastSeen    time.Time `json:"lastSeen"`
	IsTyping    bool      `json:"isTyping"`
	CurrentLine *int      `json:"currentLine"`
}

type UserMessage struct {
	BaseMessage
	User User `json:"user"`
}

type UsersMessage struct {
	BaseMessage
	Users []User `json:"users"`
}

type UserActivityMessage struct {
	BaseMessage
	UserID      string `json:"userId"`
	IsTyping    bool   `json:"isTyping"`
	CurrentLine *int   `json:"currentLine"`
}

type MediaFile struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Size       int64     `json:"size"`
	URL        string    `json:"url"`
	UploadedAt time.Time `json:"uploadedAt"`
	UploadedBy string    `json:"uploadedBy"`
}

type MediaMessage struct {
	BaseMessage
	Media MediaFile `json:"media"`
}

type MediaSyncMessage struct {
	BaseMessage
	MediaFiles []MediaFile `json:"mediaFiles"`
}

type Client struct {
	Conn     *websocket.Conn
	User     User
	LastPing time.Time
}

type Room struct {
	Content    string
	Clients    map[string]*Client
	Comments   []Comment
	MediaFiles []MediaFile
	mutex      sync.RWMutex
	CreatedAt  time.Time
}

var (
	rooms      = make(map[string]*Room)
	roomsMutex sync.RWMutex
	upgrader   = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	db       *sql.DB
	filesDir string
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	// Get files directory from environment
	filesDir = os.Getenv("FILES_DIR")
	if filesDir == "" {
		filesDir = "./uploads"
	}

	// Create files directory if it doesn't exist
	if err := os.MkdirAll(filesDir, 0755); err != nil {
		log.Fatal("Failed to create files directory:", err)
	}

	var err error
	db, err = sql.Open("sqlite3", "./rooms.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create tables
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS rooms (
		code TEXT PRIMARY KEY,
		content TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS comments (
		id TEXT PRIMARY KEY,
		room_code TEXT,
		line_number INTEGER,
		line_range TEXT,
		author TEXT,
		author_id TEXT,
		content TEXT,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(room_code) REFERENCES rooms(code)
	)`)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS media_files (
		id TEXT PRIMARY KEY,
		room_code TEXT,
		name TEXT,
		type TEXT,
		size INTEGER,
		url TEXT,
		uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		uploaded_by TEXT,
		FOREIGN KEY(room_code) REFERENCES rooms(code)
	)`)
	if err != nil {
		log.Fatal(err)
	}

	go startRoomCleanup()
	go startPingChecker()

	// Start HTTP server for file operations in a separate goroutine
	go func() {
		httpMux := http.NewServeMux()
		httpMux.HandleFunc("/o/upload", corsMiddleware(handleFileUpload))
		httpMux.HandleFunc("/o/files/", corsMiddleware(handleFileServe))
		httpMux.HandleFunc("/o/delete/", corsMiddleware(handleFileDelete))
		httpMux.HandleFunc("/o/purge/", corsMiddleware(handleRoomPurge))

		http_port := 8090

		log.Printf("HTTP file server starting on port %d...", http_port)
		if err := http.ListenAndServe(fmt.Sprintf("0.0.0.0:%d", http_port), httpMux); err != nil {
			log.Fatal("HTTP server error:", err)
		}
	}()

	wsMux := http.NewServeMux()
	wsMux.HandleFunc("/o/socket", handleWebSocket)

	ws_port := 8100
	log.Printf("WebSocket server starting on port %d...", ws_port)
	if err := http.ListenAndServe(fmt.Sprintf("0.0.0.0:%d", ws_port), wsMux); err != nil {
		log.Fatal("WebSocket server error:", err)
	}
}

func addCORSHeaders(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		addCORSHeaders(w, r)

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func startPingChecker() {
	for {
		time.Sleep(45 * time.Second) // Check every 45 seconds
		checkClientPings()
	}
}

func handleFileUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(32 << 20) // 32MB max memory
	if err != nil {
		http.Error(w, "Failed to parse multipart form", http.StatusBadRequest)
		return
	}

	roomCode := r.FormValue("roomCode")
	if roomCode == "" {
		http.Error(w, "Room code is required", http.StatusBadRequest)
		return
	}

	uploadedBy := r.FormValue("uploadedBy")
	if uploadedBy == "" {
		uploadedBy = "Unknown"
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to get file from form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Generate unique filename with UUID
	fileID := fmt.Sprintf("file_%d_%d", time.Now().UnixNano(), rand.Intn(10000))
	filename := fmt.Sprintf("%s_%s", fileID, header.Filename)

	// Create room directory if it doesn't exist
	roomDir := filepath.Join(filesDir, roomCode)
	if err := os.MkdirAll(roomDir, 0755); err != nil {
		http.Error(w, "Failed to create room directory", http.StatusInternalServerError)
		return
	}

	// Save file to disk
	filePath := filepath.Join(roomDir, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Failed to create file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Create media file object
	mediaFile := MediaFile{
		ID:         fileID,
		Name:       header.Filename,
		Type:       header.Header.Get("Content-Type"),
		Size:       header.Size,
		URL:        fmt.Sprintf("/files/%s/%s", roomCode, filename),
		UploadedAt: time.Now(),
		UploadedBy: uploadedBy,
	}

	// Save to database
	if err := saveMediaFile(roomCode, mediaFile); err != nil {
		log.Printf("Error saving media file to database: %v", err)
		http.Error(w, "Failed to save file metadata", http.StatusInternalServerError)
		return
	}

	// Add to room and broadcast
	roomsMutex.RLock()
	room, exists := rooms[roomCode]
	roomsMutex.RUnlock()

	if exists {
		room.mutex.Lock()
		room.MediaFiles = append(room.MediaFiles, mediaFile)
		room.mutex.Unlock()

		// Broadcast to all clients in the room
		mediaMsg := MediaMessage{
			BaseMessage: BaseMessage{Type: MediaUpload, Code: roomCode},
			Media:       mediaFile,
		}
		broadcastToRoom(room, mediaMsg, "")
	}

	// Return file info as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mediaFile)
}

func handleFileServe(w http.ResponseWriter, r *http.Request) {
	// Extract room code and filename from URL path
	path := r.URL.Path[9:] // Remove "/files/" prefix
	if path == "" {
		http.Error(w, "Invalid file path", http.StatusBadRequest)
		return
	}

	// Split path into room code and filename using forward slash
	dir, filename := filepath.Split(path)
	if dir == "" || filename == "" {
		http.Error(w, "Invalid file path format", http.StatusBadRequest)
		return
	}

	// Remove trailing slash from directory part and use as room code
	roomCode := filepath.Clean(dir)

	// Construct full file path
	filePath := filepath.Join(filesDir, roomCode, filename)

	// Security check: ensure the file is within the allowed directory
	absFilesDir, _ := filepath.Abs(filesDir)
	absFilePath, _ := filepath.Abs(filePath)
	relPath, err := filepath.Rel(absFilesDir, absFilePath)
	if err != nil || filepath.IsAbs(relPath) || len(relPath) > 0 && relPath[0] == '.' {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Set headers to force download
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Type", "application/octet-stream")

	// Serve the file
	http.ServeFile(w, r, filePath)
}

func handleFileDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract room code and file ID from URL path
	path := r.URL.Path[10:] // Remove "/o/delete/" prefix
	if path == "" {
		http.Error(w, "Invalid file path", http.StatusBadRequest)
		return
	}

	// Split path into room code and file ID
	dir, fileID := filepath.Split(path)
	if dir == "" || fileID == "" {
		http.Error(w, "Invalid file path format", http.StatusBadRequest)
		return
	}

	// Remove trailing slash from directory part and use as room code
	roomCode := filepath.Clean(dir)

	// Get file info from database first
	var filename, url string
	err := db.QueryRow("SELECT name, url FROM media_files WHERE id = ? AND room_code = ?", fileID, roomCode).Scan(&filename, &url)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "File not found", http.StatusNotFound)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	// Delete file from filesystem
	filePath := filepath.Join(filesDir, roomCode, filename)
	if err := os.Remove(filePath); err != nil {
		log.Printf("Warning: Could not delete file %s: %v", filePath, err)
	}

	// Delete from database
	if err := deleteMediaFile(fileID); err != nil {
		http.Error(w, "Failed to delete file metadata", http.StatusInternalServerError)
		return
	}

	// Remove from room and broadcast
	roomsMutex.RLock()
	room, exists := rooms[roomCode]
	roomsMutex.RUnlock()

	if exists {
		room.mutex.Lock()
		for i, media := range room.MediaFiles {
			if media.ID == fileID {
				room.MediaFiles = append(room.MediaFiles[:i], room.MediaFiles[i+1:]...)
				break
			}
		}
		room.mutex.Unlock()

		// Broadcast to all clients in the room
		mediaMsg := MediaMessage{
			BaseMessage: BaseMessage{Type: MediaDelete, Code: roomCode},
			Media:       MediaFile{ID: fileID},
		}
		broadcastToRoom(room, mediaMsg, "")
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("File deleted successfully"))
}

func handleRoomPurge(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract room code from URL path
	path := r.URL.Path[9:] // Remove "/purge/" prefix
	if path == "" {
		http.Error(w, "Room code required", http.StatusBadRequest)
		return
	}

	roomCode := path

	// First, disconnect all clients and remove room from memory
	roomsMutex.Lock()
	room, exists := rooms[roomCode]
	if exists {
		// Disconnect all clients
		room.mutex.Lock()
		for _, client := range room.Clients {
			if client.Conn != nil {
				client.Conn.Close()
			}
		}
		room.mutex.Unlock()

		// Remove room from memory
		delete(rooms, roomCode)
	}
	roomsMutex.Unlock()

	// Delete from database - room content
	if err := deleteRoomContent(roomCode); err != nil {
		log.Printf("Error deleting room content: %v", err)
		http.Error(w, "Failed to delete room content", http.StatusInternalServerError)
		return
	}

	// Delete all comments for this room
	if err := deleteRoomComments(roomCode); err != nil {
		log.Printf("Error deleting room comments: %v", err)
		http.Error(w, "Failed to delete room comments", http.StatusInternalServerError)
		return
	}

	// Delete all media files for this room
	if err := deleteRoomMedia(roomCode); err != nil {
		log.Printf("Error deleting room media files: %v", err)
		http.Error(w, "Failed to delete room media files", http.StatusInternalServerError)
		return
	}

	// Delete physical files from filesystem
	roomDir := filepath.Join(filesDir, roomCode)
	if err := os.RemoveAll(roomDir); err != nil {
		log.Printf("Warning: Could not delete room directory %s: %v", roomDir, err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Room purged successfully"))
}

func checkClientPings() {
	roomsMutex.RLock()
	defer roomsMutex.RUnlock()

	for roomCode, room := range rooms {
		room.mutex.Lock()
		var disconnectedClients []string

		for clientID, client := range room.Clients {
			if time.Since(client.LastPing) > 60*time.Second { // 60 second timeout
				disconnectedClients = append(disconnectedClients, clientID)
			}
		}

		for _, clientID := range disconnectedClients {
			if client, exists := room.Clients[clientID]; exists {
				client.Conn.Close()
				delete(room.Clients, clientID)
				log.Printf("Client %s timed out in room %s", clientID, roomCode)

				// Broadcast user left
				userLeftMsg := UserMessage{
					BaseMessage: BaseMessage{Type: UserLeft, Code: roomCode},
					User:        client.User,
				}
				broadcastToRoom(room, userLeftMsg, "")
			}
		}
		room.mutex.Unlock()
	}
}

func startRoomCleanup() {
	for {
		time.Sleep(2 * time.Hour)
		deleteOldRooms()
	}
}

func deleteOldRooms() {
	roomsMutex.Lock()
	defer roomsMutex.Unlock()

	now := time.Now()
	rows, err := db.Query("SELECT code FROM rooms WHERE created_at < ?", now.Add(-24*time.Hour))
	if err != nil {
		log.Printf("Error querying old rooms: %v", err)
		return
	}
	defer rows.Close()

	var roomCode string
	for rows.Next() {
		if err := rows.Scan(&roomCode); err != nil {
			log.Printf("Error scanning room code: %v", err)
			continue
		}

		deleteRoomContent(roomCode)
		deleteRoomComments(roomCode)
		deleteRoomMedia(roomCode)

		if _, exists := rooms[roomCode]; exists {
			delete(rooms, roomCode)
			log.Printf("Deleted room %s (older than 1 day)", roomCode)
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error after scanning rows: %v", err)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("New client connected from %s", conn.RemoteAddr())

	var currentRoom string
	var clientID string

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Error reading message from %s: %v", conn.RemoteAddr(), err)
			handleClientDisconnection(currentRoom, clientID)
			break
		}

		if messageType != websocket.TextMessage {
			continue
		}

		var baseMsg BaseMessage
		if err := json.Unmarshal(message, &baseMsg); err != nil {
			log.Printf("Error unmarshaling message from %s: %v", conn.RemoteAddr(), err)
			continue
		}

		switch baseMsg.Type {
		case JoinRoom:
			clientID = handleJoinRoom(conn, message, &currentRoom)
		case TextUpdate:
			handleTextUpdate(conn, message, currentRoom, clientID)
		case Ping:
			handlePing(conn, message, currentRoom, clientID)
		case CommentAdd:
			handleCommentAdd(conn, message, currentRoom, clientID)
		case CommentUpdate:
			handleCommentUpdate(conn, message, currentRoom, clientID)
		case CommentDelete:
			handleCommentDelete(conn, message, currentRoom, clientID)
		case UserActivity:
			handleUserActivity(conn, message, currentRoom, clientID)
		case MediaUpload:
			handleMediaUpload(conn, message, currentRoom, clientID)
		case MediaDelete:
			handleMediaDelete(conn, message, currentRoom, clientID)
		default:
			log.Printf("Unknown message type received: %s", baseMsg.Type)
		}
	}
}

func generateClientID() string {
	return fmt.Sprintf("client_%d_%d", time.Now().UnixNano(), rand.Intn(10000))
}

func generateUserColor() string {
	colors := []string{"#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#34495e"}
	return colors[rand.Intn(len(colors))]
}

func generateUserName() string {
	adjectives := []string{"Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Pink", "Brown"}
	nouns := []string{"Cat", "Dog", "Bird", "Fish", "Bear", "Lion", "Tiger", "Wolf"}
	return fmt.Sprintf("%s %s", adjectives[rand.Intn(len(adjectives))], nouns[rand.Intn(len(nouns))])
}

func broadcastToRoom(room *Room, message interface{}, excludeClientID string) {
	for clientID, client := range room.Clients {
		if clientID != excludeClientID {
			if err := client.Conn.WriteJSON(message); err != nil {
				log.Printf("Error broadcasting to client %s: %v", clientID, err)
			}
		}
	}
}

func handleJoinRoom(conn *websocket.Conn, message []byte, currentRoom *string) string {
	var joinMsg JoinRoomMessage
	if err := json.Unmarshal(message, &joinMsg); err != nil {
		log.Printf("Error unmarshaling join room message: %v", err)
		return ""
	}

	if *currentRoom != "" {
		leaveRoom(*currentRoom, "")
	}

	*currentRoom = joinMsg.Code
	clientID := generateClientID()

	// Create user if not provided
	user := joinMsg.User
	if user.ID == "" {
		user.ID = clientID
	}
	if user.Name == "" {
		user.Name = generateUserName()
	}
	if user.Color == "" {
		user.Color = generateUserColor()
	}
	user.LastSeen = time.Now()

	log.Printf("Client %s joining room: %s as user %s", conn.RemoteAddr(), *currentRoom, user.Name)

	roomsMutex.Lock()
	if _, exists := rooms[*currentRoom]; !exists {
		content, err := getRoomContent(*currentRoom)
		if err != nil {
			log.Printf("Error retrieving content for room %s: %v", *currentRoom, err)
		}

		comments, err := getRoomComments(*currentRoom)
		if err != nil {
			log.Printf("Error retrieving comments for room %s: %v", *currentRoom, err)
		}

		mediaFiles, err := getRoomMedia(*currentRoom)
		if err != nil {
			log.Printf("Error retrieving media for room %s: %v", *currentRoom, err)
		}

		rooms[*currentRoom] = &Room{
			Content:    content,
			Clients:    make(map[string]*Client),
			Comments:   comments,
			MediaFiles: mediaFiles,
			mutex:      sync.RWMutex{},
			CreatedAt:  time.Now(),
		}
		log.Printf("Created new room: %s", *currentRoom)
	}
	room := rooms[*currentRoom]
	room.mutex.Lock()
	room.Clients[clientID] = &Client{
		Conn:     conn,
		User:     user,
		LastPing: time.Now(),
	}
	room.mutex.Unlock()
	roomsMutex.Unlock()

	// Send initial content
	initialMsg := InitialContentMessage{
		BaseMessage: BaseMessage{
			Type: InitialContent,
			Code: *currentRoom,
		},
		Content: room.Content,
	}

	if err := conn.WriteJSON(initialMsg); err != nil {
		log.Printf("Error sending initial content to %s: %v", conn.RemoteAddr(), err)
	}

	// Send comments
	commentsMsg := CommentsMessage{
		BaseMessage: BaseMessage{Type: CommentsSync, Code: *currentRoom},
		Comments:    room.Comments,
	}
	if err := conn.WriteJSON(commentsMsg); err != nil {
		log.Printf("Error sending comments to %s: %v", conn.RemoteAddr(), err)
	}

	// Send media files
	mediaMsg := MediaSyncMessage{
		BaseMessage: BaseMessage{Type: MediaSync, Code: *currentRoom},
		MediaFiles:  room.MediaFiles,
	}
	if err := conn.WriteJSON(mediaMsg); err != nil {
		log.Printf("Error sending media to %s: %v", conn.RemoteAddr(), err)
	}

	// Send current users
	var users []User
	for _, client := range room.Clients {
		users = append(users, client.User)
	}
	usersMsg := UsersMessage{
		BaseMessage: BaseMessage{Type: UsersSync, Code: *currentRoom},
		Users:       users,
	}
	if err := conn.WriteJSON(usersMsg); err != nil {
		log.Printf("Error sending users to %s: %v", conn.RemoteAddr(), err)
	}

	// Broadcast user joined to others
	userJoinedMsg := UserMessage{
		BaseMessage: BaseMessage{Type: UserJoined, Code: *currentRoom},
		User:        user,
	}
	broadcastToRoom(room, userJoinedMsg, clientID)

	return clientID
}

func handleTextUpdate(conn *websocket.Conn, message []byte, currentRoom string, clientID string) {
	if currentRoom == "" || clientID == "" {
		return
	}

	var updateMsg TextUpdateMessage
	if err := json.Unmarshal(message, &updateMsg); err != nil {
		log.Printf("Error unmarshaling text update message: %v", err)
		return
	}

	roomsMutex.RLock()
	room, exists := rooms[currentRoom]
	roomsMutex.RUnlock()

	if !exists {
		return
	}

	room.mutex.Lock()
	room.Content = updateMsg.Content
	room.mutex.Unlock()

	if err := saveRoomContent(currentRoom, room.Content); err != nil {
		log.Printf("Error saving content for room %s: %v", currentRoom, err)
	}

	log.Printf("Broadcasting text update in room %s from client %s", currentRoom, clientID)

	room.mutex.RLock()
	broadcastToRoom(room, updateMsg, clientID)
	room.mutex.RUnlock()
}

func handlePing(conn *websocket.Conn, message []byte, currentRoom string, clientID string) {
	if currentRoom == "" || clientID == "" {
		return
	}

	roomsMutex.RLock()
	room, exists := rooms[currentRoom]
	roomsMutex.RUnlock()

	if !exists {
		return
	}

	room.mutex.Lock()
	if client, exists := room.Clients[clientID]; exists {
		client.LastPing = time.Now()
		client.User.LastSeen = time.Now()
	}
	room.mutex.Unlock()

	// Send pong response
	pongMsg := PongMessage{
		BaseMessage: BaseMessage{Type: Pong, Code: currentRoom},
	}
	conn.WriteJSON(pongMsg)
}

func handleCommentAdd(conn *websocket.Conn, message []byte, currentRoom string, clientID string) {
	if currentRoom == "" || clientID == "" {
		return
	}

	var commentMsg CommentMessage
	if err := json.Unmarshal(message, &commentMsg); err != nil {
		log.Printf("Error unmarshaling comment message: %v", err)
		return
	}

	roomsMutex.RLock()
	room, exists := rooms[currentRoom]
	roomsMutex.RUnlock()

	if !exists {
		return
	}

	// Generate comment ID and set timestamp
	commentMsg.Comment.ID = fmt.Sprintf("comment_%d", time.Now().UnixNano())
	commentMsg.Comment.Timestamp = time.Now()

	// Set author from client user
	room.mutex.RLock()
	if client, exists := room.Clients[clientID]; exists {
		commentMsg.Comment.Author = client.User.Name
		commentMsg.Comment.AuthorID = client.User.ID
	}
	room.mutex.RUnlock()

	// Save to database
	if err := saveComment(currentRoom, commentMsg.Comment); err != nil {
		log.Printf("Error saving comment: %v", err)
		return
	}

	// Add to room
	room.mutex.Lock()
	room.Comments = append(room.Comments, commentMsg.Comment)
	room.mutex.Unlock()

	// Broadcast to all clients
	broadcastToRoom(room, commentMsg, "")
}

func handleCommentUpdate(conn *websocket.Conn, message []byte, currentRoom string, clientID string) {
	// Similar implementation for comment updates
}

func handleCommentDelete(conn *websocket.Conn, message []byte, currentRoom string, clientID string) {
	if currentRoom == "" || clientID == "" {
		return
	}

	var commentMsg CommentMessage
	if err := json.Unmarshal(message, &commentMsg); err != nil {
		log.Printf("Error unmarshaling comment delete message: %v", err)
		return
	}

	roomsMutex.RLock()
	room, exists := rooms[currentRoom]
	roomsMutex.RUnlock()

	if !exists {
		return
	}

	// Allow anyone to delete comments - no authorization check needed

	// Delete from database
	if err := deleteComment(commentMsg.Comment.ID); err != nil {
		log.Printf("Error deleting comment from database: %v", err)
		return
	}

	// Remove from room
	room.mutex.Lock()
	for i, comment := range room.Comments {
		if comment.ID == commentMsg.Comment.ID {
			room.Comments = append(room.Comments[:i], room.Comments[i+1:]...)
			break
		}
	}
	room.mutex.Unlock()

	// Broadcast to all clients
	broadcastToRoom(room, commentMsg, "")
}

func handleUserActivity(conn *websocket.Conn, message []byte, currentRoom string, clientID string) {
	if currentRoom == "" || clientID == "" {
		return
	}

	var activityMsg UserActivityMessage
	if err := json.Unmarshal(message, &activityMsg); err != nil {
		log.Printf("Error unmarshaling user activity message: %v", err)
		return
	}

	roomsMutex.RLock()
	room, exists := rooms[currentRoom]
	roomsMutex.RUnlock()

	if !exists {
		return
	}

	room.mutex.Lock()
	if client, exists := room.Clients[clientID]; exists {
		client.User.IsTyping = activityMsg.IsTyping
		client.User.CurrentLine = activityMsg.CurrentLine
		client.User.LastSeen = time.Now()
	}
	room.mutex.Unlock()

	// Broadcast activity to others
	broadcastToRoom(room, activityMsg, clientID)
}

func handleMediaUpload(conn *websocket.Conn, message []byte, currentRoom string, clientID string) {
	if currentRoom == "" || clientID == "" {
		return
	}

	var mediaMsg MediaMessage
	if err := json.Unmarshal(message, &mediaMsg); err != nil {
		log.Printf("Error unmarshaling media upload message: %v", err)
		return
	}

	roomsMutex.RLock()
	room, exists := rooms[currentRoom]
	roomsMutex.RUnlock()

	if !exists {
		return
	}

	// Set upload metadata from client user
	room.mutex.RLock()
	if client, exists := room.Clients[clientID]; exists {
		mediaMsg.Media.UploadedBy = client.User.Name
	}
	room.mutex.RUnlock()

	// Generate unique ID if not provided
	if mediaMsg.Media.ID == "" {
		mediaMsg.Media.ID = fmt.Sprintf("media_%d", time.Now().UnixNano())
	}

	// Save to database
	if err := saveMediaFile(currentRoom, mediaMsg.Media); err != nil {
		log.Printf("Error saving media file: %v", err)
		return
	}

	// Add to room
	room.mutex.Lock()
	room.MediaFiles = append(room.MediaFiles, mediaMsg.Media)
	room.mutex.Unlock()

	// Broadcast to all clients
	broadcastToRoom(room, mediaMsg, "")
}

func handleMediaDelete(_ *websocket.Conn, message []byte, currentRoom string, clientID string) {
	if currentRoom == "" || clientID == "" {
		return
	}

	var mediaMsg MediaMessage
	if err := json.Unmarshal(message, &mediaMsg); err != nil {
		log.Printf("Error unmarshaling media delete message: %v", err)
		return
	}

	roomsMutex.RLock()
	room, exists := rooms[currentRoom]
	roomsMutex.RUnlock()

	if !exists {
		return
	}

	// Remove from database
	if err := deleteMediaFile(mediaMsg.Media.ID); err != nil {
		log.Printf("Error deleting media file: %v", err)
		return
	}

	// Remove from room
	room.mutex.Lock()
	for i, media := range room.MediaFiles {
		if media.ID == mediaMsg.Media.ID {
			room.MediaFiles = append(room.MediaFiles[:i], room.MediaFiles[i+1:]...)
			break
		}
	}
	room.mutex.Unlock()

	// Broadcast to all clients
	broadcastToRoom(room, mediaMsg, "")
}

func leaveRoom(roomCode string, clientID string) {
	roomsMutex.Lock()
	defer roomsMutex.Unlock()

	if room, exists := rooms[roomCode]; exists {
		room.mutex.Lock()
		if client, exists := room.Clients[clientID]; exists {
			delete(room.Clients, clientID)

			// Broadcast user left
			userLeftMsg := UserMessage{
				BaseMessage: BaseMessage{Type: UserLeft, Code: roomCode},
				User:        client.User,
			}
			broadcastToRoom(room, userLeftMsg, "")
		}

		clientCount := len(room.Clients)
		room.mutex.Unlock()

		if clientCount == 0 && time.Since(room.CreatedAt) > 24*time.Hour {
			deleteRoomContent(roomCode)
			deleteRoomComments(roomCode)
			deleteRoomMedia(roomCode)
			delete(rooms, roomCode)
			log.Printf("Room %s deleted (no clients remaining and older than 1 day)", roomCode)
		}
		log.Printf("Client %s left room %s", clientID, roomCode)
	}
}

func handleClientDisconnection(currentRoom string, clientID string) {
	if currentRoom != "" && clientID != "" {
		leaveRoom(currentRoom, clientID)
	}
	log.Printf("Client %s disconnected", clientID)
}

func saveRoomContent(code, content string) error {
	_, err := db.Exec("INSERT OR REPLACE INTO rooms (code, content) VALUES (?, ?)", code, content)
	return err
}

func getRoomContent(code string) (string, error) {
	var content string
	err := db.QueryRow("SELECT content FROM rooms WHERE code = ?", code).Scan(&content)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return content, nil
}

func deleteRoomContent(code string) error {
	_, err := db.Exec("DELETE FROM rooms WHERE code = ?", code)
	return err
}

func saveComment(roomCode string, comment Comment) error {
	_, err := db.Exec(`INSERT INTO comments (id, room_code, line_number, line_range, author, author_id, content, timestamp) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		comment.ID, roomCode, comment.LineNumber, comment.LineRange,
		comment.Author, comment.AuthorID, comment.Content, comment.Timestamp)
	return err
}

func deleteComment(commentID string) error {
	_, err := db.Exec(`DELETE FROM comments WHERE id = ?`, commentID)
	return err
}

func getRoomComments(roomCode string) ([]Comment, error) {
	rows, err := db.Query(`SELECT id, line_number, line_range, author, author_id, content, timestamp 
		FROM comments WHERE room_code = ? ORDER BY timestamp ASC`, roomCode)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var comment Comment
		err := rows.Scan(&comment.ID, &comment.LineNumber, &comment.LineRange,
			&comment.Author, &comment.AuthorID, &comment.Content, &comment.Timestamp)
		if err != nil {
			log.Printf("Error scanning comment: %v", err)
			continue
		}
		comments = append(comments, comment)
	}
	return comments, nil
}

func deleteRoomComments(roomCode string) error {
	_, err := db.Exec("DELETE FROM comments WHERE room_code = ?", roomCode)
	return err
}

func getRoomMedia(roomCode string) ([]MediaFile, error) {
	rows, err := db.Query(`SELECT id, name, type, size, url, uploaded_at, uploaded_by 
		FROM media_files WHERE room_code = ? ORDER BY uploaded_at ASC`, roomCode)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mediaFiles []MediaFile
	for rows.Next() {
		var media MediaFile
		err := rows.Scan(&media.ID, &media.Name, &media.Type, &media.Size,
			&media.URL, &media.UploadedAt, &media.UploadedBy)
		if err != nil {
			log.Printf("Error scanning media file: %v", err)
			continue
		}
		mediaFiles = append(mediaFiles, media)
	}
	return mediaFiles, nil
}

func deleteRoomMedia(roomCode string) error {
	_, err := db.Exec("DELETE FROM media_files WHERE room_code = ?", roomCode)
	return err
}

func saveMediaFile(roomCode string, media MediaFile) error {
	_, err := db.Exec(`INSERT INTO media_files (id, room_code, name, type, size, url, uploaded_at, uploaded_by) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		media.ID, roomCode, media.Name, media.Type, media.Size,
		media.URL, media.UploadedAt, media.UploadedBy)
	return err
}

func deleteMediaFile(mediaID string) error {
	_, err := db.Exec("DELETE FROM media_files WHERE id = ?", mediaID)
	return err
}
