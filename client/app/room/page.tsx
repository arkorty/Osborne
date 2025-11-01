"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  Suspense,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  WifiOff,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { CommentsPanel } from "@/components/RightPanel";
import { CodeEditor, CodeEditorRef } from "@/components/Editor";
import { LeftPanel } from "@/components/LeftPanel";
import RecordingPopup from "@/components/RecordingPopup";
import {
  getThemeById,
  getNextTheme,
  saveThemeToCookie,
  getThemeFromCookie,
  applyTheme,
} from "@/lib/themes";
import debounce from "lodash/debounce";
import dotenv from "dotenv";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ContentWarningModal } from "@/components/ContentWarningModal";
import { BetterHoverCard, HoverCardProvider } from "@/components/ui/BetterHoverCard";

dotenv.config();

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

interface TextUpdate {
  type: "text-update";
  content: string;
  code: string;
}

interface InitialContent {
  type: "initial-content";
  content: string;
  code: string;
}

interface JoinRoom {
  type: "join-room";
  code: string;
  user?: User;
}

interface PingMessage {
  type: "ping";
  code: string;
}

interface PongMessage {
  type: "pong";
  code: string;
}

interface User {
  id: string;
  name: string;
  color: string;
  lastSeen: Date;
  isTyping?: boolean;
  currentLine?: number;
}

interface Comment {
  id: string;
  lineNumber: number | null;
  lineRange?: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: Date;
}

interface CommentMessage {
  type: "comment-add" | "comment-update" | "comment-delete";
  code: string;
  comment: Comment;
}

interface CommentsSync {
  type: "comments-sync";
  code: string;
  comments: Comment[];
}

interface UserMessage {
  type: "user-joined" | "user-left";
  code: string;
  user: User;
}

interface UsersSync {
  type: "users-sync";
  code: string;
  users: User[];
}

interface UserActivity {
  type: "user-activity";
  code: string;
  userId: string;
  isTyping: boolean;
  currentLine?: number;
}

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

interface MediaMessage {
  type: "media-upload" | "media-delete";
  code: string;
  media: MediaFile;
}

interface MediaSync {
  type: "media-sync";
  code: string;
  mediaFiles: MediaFile[];
}

type Message =
  | TextUpdate
  | InitialContent
  | JoinRoom
  | PingMessage
  | PongMessage
  | CommentMessage
  | CommentsSync
  | UserMessage
  | UsersSync
  | UserActivity
  | MediaMessage
  | MediaSync;

const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL}`;

// Utility functions
const generateUserId = () =>
  `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateUserName = () => {
  const adjectives = [
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Purple",
    "Orange",
    "Pink",
    "Brown",
  ];
  const nouns = ["Cat", "Dog", "Bird", "Fish", "Bear", "Lion", "Tiger", "Wolf"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`;
};

const generateUserColor = () => {
  const colors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#34495e",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Room = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code");

  const socketRef = useRef<WebSocket | null>(null);
  const editorRef = useRef<CodeEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserRef = useRef<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [showReconnectOverlay, setShowReconnectOverlay] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState("one-dark");
  const [selectedLineStart, setSelectedLineStart] = useState<number>();
  const [selectedLineEnd, setSelectedLineEnd] = useState<number>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [leftPanelForced, setLeftPanelForced] = useState(false);
  const [rightPanelForced, setRightPanelForced] = useState(false);
  const [popupMessage, setPopupMessage] = useState<{text: string; type?: 'default' | 'warning'} | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Array<{fileName: string; progress: number; status: 'uploading' | 'completed' | 'error'}>>([]);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile swipe gesture handling & Escape key to close panels
  useEffect(() => {
    // Swipe gesture (mobile only)
    if (isMobile) {
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;

      const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const touchEndTime = Date.now();

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const deltaTime = touchEndTime - touchStartTime;

        // Only consider it a swipe if:
        // 1. The gesture is fast enough (less than 500ms)
        // 2. The horizontal distance is significant (at least 100px)
        // 3. The vertical distance is less than horizontal (to avoid conflicting with scrolling)
        if (
          deltaTime < 500 &&
          Math.abs(deltaX) > 100 &&
          Math.abs(deltaX) > Math.abs(deltaY)
        ) {
          if (deltaX < 0 && leftPanelForced) {
            // Swipe left - close left panel
            setLeftPanelForced(false);
          } else if (deltaX > 0 && rightPanelForced) {
            // Swipe right - close right panel
            setRightPanelForced(false);
          }
        }
      };

      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });

      // Clean up swipe listeners
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }

    // Escape key closes panels (all devices)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (leftPanelForced) setLeftPanelForced(false);
        if (rightPanelForced) setRightPanelForced(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobile, leftPanelForced, rightPanelForced]);

  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    setIsClient(true);
    
    // Set initial window width
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      
      // Force immediate panel state reset when crossing the breakpoint to larger
      if (newWidth >= 1280) {
        setLeftPanelForced(false);
        setRightPanelForced(false);
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate panel visibility based on window width
  // Minimum width needed: 320px (left) + 640px (main content) + 320px (right) = 1280px
  const showSidePanels = windowWidth >= 1280;
  
  // Auto-hide forced panels when screen size increases (do this before calculating visibility)
  useEffect(() => {
    if (showSidePanels) {
      setLeftPanelForced(false);
      setRightPanelForced(false);
    }
  }, [showSidePanels]);
  
  // Calculate final panel visibility - when shouldShowPanels is true, always show panels regardless of forced state
  const showLeftPanel = showSidePanels || (!showSidePanels && leftPanelForced);
  const showRightPanel = showSidePanels || (!showSidePanels && rightPanelForced);

  // Initialize theme from cookie
  useEffect(() => {
    if (isClient) {
      const savedThemeId = getThemeFromCookie();
      if (savedThemeId) {
        const savedTheme = getThemeById(savedThemeId);
        if (savedTheme) {
          setCurrentThemeId(savedThemeId);
          applyTheme(savedTheme);
        }
      } else {
        // Apply default theme
        const defaultTheme = getThemeById("one-dark-pro");
        if (defaultTheme) {
          applyTheme(defaultTheme);
        }
      }
    }
  }, [isClient]);

  // Apply theme when currentThemeId changes
  useEffect(() => {
    const currentTheme = getThemeById(currentThemeId);
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentThemeId]);

  // Show reconnect overlay only if still disconnected after a delay
  useEffect(() => {
    let showTimer: NodeJS.Timeout | null = null;
    if (status === "Disconnected") {
      // Wait 800ms before showing overlay
      showTimer = setTimeout(() => {
        setShowReconnectOverlay(true);
      }, 800);
    } else {
      setShowReconnectOverlay(false);
    }
    return () => {
      if (showTimer) clearTimeout(showTimer);
    };
  }, [status]);

  // Calculate panel visibility based on viewport width
  // Left panel (256px) + Right panel (320px) + Main content (1280px) + padding (~100px) = ~1956px

  const debouncedSend = useMemo(
    () =>
      debounce((ws: WebSocket, content: string, code: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          const message: TextUpdate = {
            type: "text-update",
            content,
            code,
          };
          ws.send(JSON.stringify(message));
        }
      }, 100),
    []
  );

  const connectSocket = useCallback(() => {
    if (!roomCode || socketRef.current?.readyState === WebSocket.OPEN) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("Connected");
      setError("");

      // Create user if not exists
      const user: User = {
        id: generateUserId(),
        name: generateUserName(),
        color: generateUserColor(),
        lastSeen: new Date(),
        isTyping: false,
      };
      setCurrentUser(user);

      const message: JoinRoom = {
        type: "join-room",
        code: roomCode,
        user: user,
      };
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);

      switch (message.type) {
        case "initial-content":
        case "text-update":
          if (message.content !== contentRef.current) {
            setContent(message.content);
          }
          break;

        case "pong":
          // Handle pong response
          break;

        case "comments-sync":
          setComments(
            message.comments
              ? message.comments.map((c) => ({
                  ...c,
                  timestamp: new Date(c.timestamp),
                }))
              : []
          );
          break;

        case "comment-add":
          setComments((prev) => [
            ...prev,
            {
              ...message.comment,
              timestamp: new Date(message.comment.timestamp),
            },
          ]);
          break;

        case "comment-update":
          setComments((prev) =>
            prev.map((c) =>
              c.id === message.comment.id
                ? {
                    ...message.comment,
                    timestamp: new Date(message.comment.timestamp),
                  }
                : c
            )
          );
          break;

        case "comment-delete":
          setComments((prev) =>
            prev.filter((c) => c.id !== message.comment.id)
          );
          break;

        case "users-sync":
          setUsers(
            message.users
              ? message.users.map((u) => ({
                  ...u,
                  lastSeen: new Date(u.lastSeen),
                }))
              : []
          );
          break;

        case "user-joined":
          setUsers((prev) => [
            ...prev,
            {
              ...message.user,
              lastSeen: new Date(message.user.lastSeen),
            },
          ]);
          break;

        case "user-left":
          setUsers((prev) => prev.filter((u) => u.id !== message.user.id));
          break;

        case "user-activity":
          setUsers((prev) =>
            prev.map((u) =>
              u.id === message.userId
                ? {
                    ...u,
                    isTyping: message.isTyping,
                    currentLine: message.currentLine,
                    lastSeen: new Date(),
                  }
                : u
            )
          );
          break;

        case "media-sync":
          setMediaFiles(
            message.mediaFiles
              ? message.mediaFiles.map((m) => ({
                  ...m,
                  uploadedAt: new Date(m.uploadedAt),
                }))
              : []
          );
          break;

        case "media-upload":
          setMediaFiles((prev) => [
            ...prev,
            {
              ...message.media,
              uploadedAt: new Date(message.media.uploadedAt),
            },
          ]);
          break;

        case "media-delete":
          setMediaFiles((prev) =>
            prev.filter((m) => m.id !== message.media.id)
          );
          break;
      }
    };

    ws.onclose = () => {
      setStatus("Disconnected");

      setTimeout(() => {
        if (socketRef.current === ws) {
          socketRef.current = null;
        }
      }, 0);
    };

    ws.onerror = () => {
      setTimeout(() => {
        if (socketRef.current === ws) {
          connectSocket();
        }
      }, 1000);
    };
  }, [roomCode]);

  useEffect(() => {
    if (!isClient || !roomCode) return;

    connectSocket();

    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping", code: roomCode }));
        
        // Also send user activity update to keep status current
        if (currentUserRef.current) {
          const activityMessage: UserActivity = {
            type: "user-activity",
            code: roomCode,
            userId: currentUserRef.current.id,
            isTyping: false,
            currentLine: undefined
          };
          socketRef.current.send(JSON.stringify(activityMessage));
        }
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      debouncedSend.cancel();
    };
  }, [roomCode, isClient, connectSocket, debouncedSend]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      debouncedSend(socketRef.current, newContent, roomCode!);
    } else if (status === "Disconnected") {
      debouncedSend.cancel();
      connectSocket();
    }
  };

  const handleSelectionChange = (lineStart: number, lineEnd: number) => {
    setSelectedLineStart(lineStart);
    setSelectedLineEnd(lineEnd);
  };

  const handleCommentSelect = (lineNumber: number, lineRange?: string) => {
    if (editorRef.current) {
      if (lineRange) {
        // Parse line range like "5-8"
        const [start, end] = lineRange
          .split("-")
          .map((n) => parseInt(n.trim()));
        editorRef.current.selectLines(start, end);
      } else {
        editorRef.current.selectLines(lineNumber);
      }
    }
  };

  const handleAddComment = (
    content: string,
    lineNumber?: number,
    lineRange?: string
  ) => {
    if (!socketRef.current || !currentUser) return;

    const comment: Comment = {
      id: "", // Will be set by server
      lineNumber: lineNumber || null,
      lineRange: lineRange,
      author: currentUser.name,
      authorId: currentUser.id,
      content: content,
      timestamp: new Date(),
    };

    const message: CommentMessage = {
      type: "comment-add",
      code: roomCode!,
      comment: comment,
    };

    socketRef.current.send(JSON.stringify(message));
  };

  const handleDeleteComment = (commentId: string) => {
    if (!socketRef.current || !currentUser) return;

    const message: CommentMessage = {
      type: "comment-delete",
      code: roomCode!,
      comment: {
        id: commentId,
        lineNumber: null,
        author: "",
        authorId: "",
        content: "",
        timestamp: new Date(),
      },
    };

    socketRef.current.send(JSON.stringify(message));
  };

  const handlePurgeRoom = async () => {
    if (!roomCode) return;
    
    try {
      const httpUrl = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:8090";
      const response = await fetch(`${httpUrl}/purge/${roomCode}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Purge failed: ${response.statusText}`);
      }

      router.push("/");
    } catch (error) {
      console.error("Error purging room:", error);
      setPurgeError("Failed to purge room");
    }
    
    setIsPurgeModalOpen(false);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0 || !currentUser) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    const httpUrl = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:8090";

    // Initialize progress for all files
    const initialProgress = Array.from(files).map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const
    }));
    setUploadProgress(initialProgress);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size limit
      if (file.size > maxFileSize) {
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        setFileSizeError(`File "${file.name}" (${fileSizeInMB}MB) exceeds 10MB limit`);
        setUploadProgress(prev => prev.map(p => 
          p.fileName === file.name ? { ...p, status: 'error' as const } : p
        ));
        continue; // Skip this file and continue with others
      }

      try {
        // Create form data for file upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomCode", roomCode!);
        formData.append("uploadedBy", currentUser.name);

        // Use XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(prev => prev.map(p => 
                p.fileName === file.name ? { ...p, progress } : p
              ));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadProgress(prev => prev.map(p => 
                p.fileName === file.name ? { ...p, progress: 100, status: 'completed' as const } : p
              ));
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
          });

          xhr.open('POST', `${httpUrl}/upload`);
          xhr.send(formData);
        });

        console.log("File uploaded successfully:", file.name);
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadProgress(prev => prev.map(p => 
          p.fileName === file.name ? { ...p, status: 'error' as const } : p
        ));
      }
    }

    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
  };

  const handleFileDelete = async (fileId: string) => {
    if (!roomCode) return;

    const httpUrl = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:8090";

    try {
      const response = await fetch(`${httpUrl}/delete/${roomCode}/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      // Don't remove from local state here - the WebSocket broadcast will handle it
      // This prevents issues when the server broadcasts the deletion

      console.log("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const showPopup = (message: string, type: 'default' | 'warning' = 'default') => {
    setPopupMessage({text: message, type});
    setTimeout(() => setPopupMessage(null), 3000);
  };

  if (!isClient) return null;

  if (!roomCode) {
    router.push("/");
    return null;
  }

  return (
    <HoverCardProvider>
      <div className="relative min-h-screen bg-background dark:bg-background ui-font">
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          left: isMobile ? '0px' : (showLeftPanel ? '320px' : '0px'),
          right: isMobile ? '0px' : (showRightPanel ? '320px' : '0px'),
        }}
      >
        <div
          className={`flex flex-col items-center relative z-10 w-full h-full bg-card dark:bg-card shadow-md transition-all duration-300 ${
            isModalOpen || isPurgeModalOpen ? "blur-sm" : ""
          }`}
        >
          <div className="flex flex-row items-center justify-between p-1 w-full">
            <div className="flex gap-1 mr-1">
              <BetterHoverCard
                trigger={
                  <Button
                    variant="default"
                    className="text-foreground bg-secondary px-2 py-0 h-5 rounded-sm text-xs btn-micro"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showPopup("Room link copied to clipboard!");
                    }}
                  >
                    share
                  </Button>
                }
                contentClassName="py-1 px-2 w-auto text-popover-foreground bg-popover text-xs border-foreground"
              >
                copy link to clipboard
              </BetterHoverCard>
              <BetterHoverCard
                trigger={
                  <Button
                    className="bg-destructive px-2 py-0 h-5 text-xs rounded-sm hover:bg-destructive/80 btn-micro"
                    variant="destructive"
                    onClick={() => setIsPurgeModalOpen(true)}
                  >
                    purge
                  </Button>
                }
                contentClassName="py-1 px-2 w-auto text-popover-foreground bg-popover text-xs border-foreground"
              >
                permanently delete this room
              </BetterHoverCard>
              <BetterHoverCard
                trigger={
                  <Button
                    className="bg-destructive px-2 py-0 h-5 text-xs rounded-sm hover:bg-destructive/80 btn-micro"
                    variant="destructive"
                    onClick={() => router.push("/")}
                  >
                    exit
                  </Button>
                }
                contentClassName="py-1 px-2 w-auto text-popover-foreground bg-popover text-xs border-foreground"
              >
                return to home
              </BetterHoverCard>
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              <BetterHoverCard
                trigger={
                  <Button
                    className="bg-chart-2 px-2 py-0 h-5 text-xs rounded-sm hover:bg-chart-2/80 btn-micro"
                    onClick={() => {
                      console.log("Upload button clicked");
                      fileInputRef.current?.click();
                    }}
                  >
                    upload
                  </Button>
                }
                contentClassName="py-1 px-2 w-auto text-xs border-foreground"
              >
                upload files
              </BetterHoverCard>
              <BetterHoverCard
                trigger={
                  <Button
                    className="bg-chart-4 px-2 py-0 h-5 text-xs rounded-sm hover:bg-chart-4/80 btn-micro"
                    onClick={() => {
                      const nextTheme = getNextTheme(currentThemeId);
                      setCurrentThemeId(nextTheme.id);
                      applyTheme(nextTheme);
                      saveThemeToCookie(nextTheme.id);
                    }}
                  >
                    theme
                  </Button>
                }
                contentClassName="py-1 px-2 w-auto text-xs border-foreground"
              >
                {`switch to ${getThemeById(getNextTheme(currentThemeId)?.id)?.name}`}
              </BetterHoverCard>
              <BetterHoverCard
                trigger={
                  <Button
                    className="bg-red-500 px-2 py-0 h-5 text-xs rounded-sm hover:bg-red-600 btn-micro"
                    onClick={() => setIsRecordingOpen(true)}
                  >
                    record
                  </Button>
                }
                contentClassName="py-1 px-2 w-auto text-xs border-foreground"
              >
                record audio
              </BetterHoverCard>
              
              {/* Panel Controls for mobile and when panels are hidden due to width */}
              {(isMobile || !showSidePanels) && (
                <>
                  <BetterHoverCard
                    trigger={
                      <Button
                        className="bg-chart-1 px-2 py-0 h-5 text-xs rounded-sm hover:bg-chart-1/80 btn-micro"
                        onClick={() => setLeftPanelForced(!leftPanelForced)}
                      >
                        media
                      </Button>
                    }
                    contentClassName="py-1 px-2 w-auto text-xs border-foreground z-[999]"
                  >
                    show media
                  </BetterHoverCard>
                  <BetterHoverCard
                    trigger={
                      <Button
                        className="bg-chart-3 px-2 py-0 h-5 text-xs rounded-sm hover:bg-chart-3/80 btn-micro"
                        onClick={() => setRightPanelForced(!rightPanelForced)}
                      >
                        notes
                      </Button>
                    }
                    contentClassName="py-1 px-2 w-auto text-xs border-foreground"
                  >
                    show comments
                  </BetterHoverCard>
                </>
              )}
            </div>
          </div>
          <div className="flex-grow flex flex-col p-1 w-full">
            {error && status !== "Connected" && (
              <div className="mb-2 p-2 bg-destructive/10 text-destructive rounded text-sm">
                {error}
              </div>
            )}
            {isMobile ? (
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="flex-grow w-full p-3 bg-background text-foreground border border-border rounded resize-none font-mono text-sm focus:outline-none focus:border-primary"
                placeholder="Start typing..."
                style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace' }}
              />
            ) : (
              <CodeEditor
                ref={editorRef}
                value={content}
                onChange={handleContentChange}
                onSelectionChange={handleSelectionChange}
                language="plaintext"
                className="flex-grow w-full"
                themeConfig={getThemeById(currentThemeId)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.txt,.json,.xml,.csv"
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(e.target.files);
            // Reset the input so the same file can be selected again
            e.target.value = "";
          }
        }}
      />

      {/* Comments Panel */}
      <CommentsPanel
        isVisible={isMobile ? rightPanelForced : showRightPanel}
        onToggle={() => setRightPanelForced(!rightPanelForced)}
        selectedLineStart={selectedLineStart}
        selectedLineEnd={selectedLineEnd}
        onCommentSelect={handleCommentSelect}
        comments={comments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        currentUser={currentUser}
      />

      {/* File Size Error Modal */}
      {fileSizeError && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setFileSizeError(null)}>
          <Card className="max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <TriangleAlert className="mx-auto mb-2 text-warning" size={48} />
              <CardTitle className="text-lg text-warning">
                File Too Large
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                {fileSizeError}
              </p>
              <Button
                onClick={() => setFileSizeError(null)}
                className="w-full"
              >
                OK
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Purge Error Modal */}
      {purgeError && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPurgeError(null)}>
          <Card className="max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <TriangleAlert className="mx-auto mb-2 text-destructive" size={48} />
              <CardTitle className="text-lg text-destructive">
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                {purgeError}
              </p>
              <Button
                onClick={() => setPurgeError(null)}
                className="w-full"
              >
                OK
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {uploadProgress.length > 0 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle className="text-lg text-center">
                Uploading Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadProgress.map((upload, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="truncate max-w-[200px]" title={upload.fileName}>
                      {upload.fileName}
                    </span>
                    <span className={`text-xs ${
                      upload.status === 'completed' ? 'text-green-600' :
                      upload.status === 'error' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {upload.status === 'completed' ? '✓' :
                       upload.status === 'error' ? '✗' :
                       `${upload.progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        upload.status === 'completed' ? 'bg-green-600' :
                        upload.status === 'error' ? 'bg-destructive' :
                        'bg-primary'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Popup for non-critical messages */}
      {popupMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-3 py-2 border rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
            popupMessage.type === 'warning' 
              ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700'
              : 'bg-popover text-popover-foreground border-border'
          }`}>
            <span className="text-sm font-medium">{popupMessage.text}</span>
          </div>
        </div>
      )}

      {/* Overlay for mobile when panels are forced open */}
      {!showSidePanels && (leftPanelForced || rightPanelForced) && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => {
            setLeftPanelForced(false);
            setRightPanelForced(false);
          }}
        />
      )}

      {/* Left Panel (Users, Media & ECG) */}
      <LeftPanel
        isVisible={isMobile ? leftPanelForced : showLeftPanel}
        users={users}
        currentUser={currentUser}
        mediaFiles={mediaFiles}
        onFileUpload={handleFileUpload}
        onFileDelete={handleFileDelete}
        onModalStateChange={setIsModalOpen}
      />

      {/* Purge Confirmation Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsPurgeModalOpen(false)}>
          <Card className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Purge Room</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to permanently delete this room and all its contents? 
                This action cannot be undone and will remove:
              </p>
              <ul className="text-sm text-muted-foreground mb-4 list-disc list-inside space-y-1">
                <li>All code content</li>
                <li>All comments</li>
                <li>All uploaded files</li>
                <li>Room history</li>
              </ul>
            </CardContent>
            <CardFooter className="flex gap-3 justify-end">
               <Button
                variant="outline"
                onClick={() => setIsPurgeModalOpen(false)}
                className="text-sm text-foreground"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handlePurgeRoom}
                className="text-sm"
              >
                Purge Room
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Reconnect Overlay */}
      {showReconnectOverlay && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <WifiOff className="mx-auto mb-2 text-destructive" size={48} />
              <CardTitle className="text-lg text-destructive">
                Connection Lost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                The connection to the server was lost. Please check your
                internet connection and try to reconnect.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Warning Modal */}
      <ContentWarningModal />

        {/* Content Warning Modal */}
        <ContentWarningModal />

      {/* Recording Popup */}
      <RecordingPopup 
        isOpen={isRecordingOpen} 
        onClose={() => setIsRecordingOpen(false)} 
        onFileUpload={handleFileUpload}
      />
    </div>
    </HoverCardProvider>
  );
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <Card className="max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </CardContent>
    </Card>
  </div>
);

const RoomWrapper = () => (
  <ThemeProvider attribute="class" defaultTheme="dark">
    <Suspense fallback={<LoadingOverlay />}>
      <div className={`${jetbrainsMono.variable} font-sans`}>
        <Room />
      </div>
    </Suspense>
  </ThemeProvider>
);

export default RoomWrapper;
