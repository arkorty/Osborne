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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentsPanel } from "@/components/RightPanel";
import { CodeEditor, CodeEditorRef } from "@/components/Editor";
import { LeftPanel } from "@/components/LeftPanel";
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
  const [isClient, setIsClient] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [showDisconnectToast, setShowDisconnectToast] = useState(false);
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

  // Show disconnect toast only if still disconnected after a delay
  useEffect(() => {
    let showTimer: NodeJS.Timeout | null = null;
    let hideTimer: NodeJS.Timeout | null = null;
    if (status === "Disconnected") {
      // Wait 800ms before showing toast
      showTimer = setTimeout(() => {
        setShowDisconnectToast(true);
        // Auto-hide after 10 seconds
        hideTimer = setTimeout(() => {
          setShowDisconnectToast(false);
        }, 10000);
      }, 800);
    } else {
      setShowDisconnectToast(false);
    }
    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
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
        socketRef.current.send(JSON.stringify({ type: "ping" }));
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
      showPopup("Failed to purge room", "warning");
    }
    
    setIsPurgeModalOpen(false);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0 || !currentUser) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    const httpUrl = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:8090";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size limit
      if (file.size > maxFileSize) {
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        showPopup(`File "${file.name}" (${fileSizeInMB}MB) exceeds 10MB limit`, 'warning');
        continue; // Skip this file and continue with others
      }

      try {
        // Create form data for file upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomCode", roomCode!);
        formData.append("uploadedBy", currentUser.name);

        // Upload file to HTTP server
        const response = await fetch(`${httpUrl}/o/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const mediaFile: MediaFile = await response.json();

        // Don't add to local state here - the WebSocket broadcast will handle it
        // This prevents duplicate entries when the server broadcasts the upload

        console.log("File uploaded successfully:", mediaFile);
      } catch (error) {
        console.error("Error uploading file:", error);
        // You could show a toast notification here
      }
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!roomCode) return;

    const httpUrl = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:8090";

    try {
      const response = await fetch(`${httpUrl}/o/delete/${roomCode}/${fileId}`, {
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
            <div className="flex gap-1">
              <HoverCard>
                <HoverCardTrigger>
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
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto text-popover-foreground bg-popover text-xs border-foreground">
                  copy link to this page
                </HoverCardContent>
              </HoverCard>
              <HoverCard>
                <HoverCardTrigger>
                  <Button
                    className="bg-destructive px-2 py-0 h-5 text-xs rounded-sm hover:bg-destructive/80 btn-micro"
                    variant="destructive"
                    onClick={() => setIsPurgeModalOpen(true)}
                  >
                    purge
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto text-popover-foreground bg-popover text-xs border-foreground">
                  permanently delete this room and all its contents
                </HoverCardContent>
              </HoverCard>
              <HoverCard>
                <HoverCardTrigger>
                  <Button
                    className="bg-destructive px-2 py-0 h-5 text-xs rounded-sm hover:bg-destructive/80 btn-micro"
                    variant="destructive"
                    onClick={() => router.push("/")}
                  >
                    exit
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto text-popover-foreground bg-popover text-xs border-foreground">
                  return to home
                </HoverCardContent>
              </HoverCard>
            </div>
            <div className="flex gap-1">
              <HoverCard>
                <HoverCardTrigger>
                  <Button
                    className="bg-chart-2 px-2 py-0 h-5 text-xs rounded-sm hover:bg-chart-2/80 btn-micro"
                    onClick={() => {
                      console.log("Upload button clicked");
                      fileInputRef.current?.click();
                    }}
                  >
                    upload
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto text-xs border-foreground">
                  upload files
                </HoverCardContent>
              </HoverCard>
              <HoverCard>
                <HoverCardTrigger>
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
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto text-xs border-foreground">
                  {getThemeById(currentThemeId)?.name || "Switch theme"}
                </HoverCardContent>
              </HoverCard>
              
              {/* Panel Controls for mobile and when panels are hidden due to width */}
              {(isMobile || !showSidePanels) && (
                <>
                  <HoverCard>
                    <HoverCardTrigger>
                      <Button
                        className="bg-chart-1 px-2 py-0 h-5 text-xs rounded-sm hover:bg-chart-1/80 btn-micro"
                        onClick={() => setLeftPanelForced(!leftPanelForced)}
                      >
                        media
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="py-1 px-2 w-auto text-xs border-foreground z-[999]">
                      toggle users & media panel
                    </HoverCardContent>
                  </HoverCard>
                  <HoverCard>
                    <HoverCardTrigger>
                      <Button
                        className="bg-chart-3 px-2 py-0 h-5 text-xs rounded-sm hover:bg-chart-3/80 btn-micro"
                        onClick={() => setRightPanelForced(!rightPanelForced)}
                      >
                        notes
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="py-1 px-2 w-auto text-xs border-foreground">
                      toggle comments panel
                    </HoverCardContent>
                  </HoverCard>
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
                className="flex-grow w-full p-3 bg-background text-foreground border border-border rounded resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Start typing your code here..."
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

      {/* Custom Popup */}
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
        mediaFiles={mediaFiles}
        onFileUpload={handleFileUpload}
        onFileDelete={handleFileDelete}
        onModalStateChange={setIsModalOpen}
      />

      {/* Purge Confirmation Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred overlay */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-all duration-300"
            onClick={() => setIsPurgeModalOpen(false)}
          />
          {/* Modal */}
          <div className="relative bg-card border border-border rounded-lg shadow-lg p-6 max-w-md w-full mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-foreground mb-4">Purge Room</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to permanently delete this room and all its contents? 
              This action cannot be undone and will remove:
            </p>
            <ul className="text-sm text-muted-foreground mb-6 list-disc list-inside space-y-1">
              <li>All code content</li>
              <li>All comments</li>
              <li>All uploaded files</li>
              <li>Room history</li>
            </ul>
            <div className="flex gap-3 justify-end">
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
            </div>
          </div>
        </div>
      )}

      {/* Comments Panel */}
      {showDisconnectToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Blurred overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto transition-all duration-300" />
          {/* Toast */}
          <div
            className="relative pointer-events-auto flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border animate-in fade-in duration-300"
            style={{
              background: "var(--popover, var(--card, #fff))",
              color: "var(--popover-foreground, var(--foreground, #222))",
              borderColor: "var(--border, #e5e7eb)",
              borderWidth: 1,
              borderStyle: "solid",
              fontWeight: 500,
              width: "auto",
              minWidth: undefined,
              maxWidth: undefined,
            }}
          >
            <WifiOff size={18} className="text-destructive" />
            <span className="text-sm font-medium">Connection Lost</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-2 bg-primary/10 hover:bg-primary/20 text-primary rounded p-1 transition-colors"
              title="Refresh to reconnect"
              style={{ display: "flex", alignItems: "center" }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Content Warning Modal */}
      <ContentWarningModal />

        {/* Content Warning Modal */}
        <ContentWarningModal />
    </div>
  );
};

const SkeletonMirror = () => {
  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col items-center p-4 relative z-10">
        <div className="w-full max-w-6xl bg-inherit backdrop-blur-sm bg-opacity-0">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-[6.3rem] h-[2.25rem] rounded bg-chart-3" />
            </div>
            <Skeleton className="w-20 h-6 rounded bg-chart-2" />
          </div>
          <div>
            <Skeleton className="w-full min-h-[80vh] p-4  bg-muted border border-border" />
            <div className="mt-4 flex justify-end items-center">
              <div className="flex gap-2">
                <Skeleton className="w-10 h-10 rounded bg-chart-1" />
                <Skeleton className="w-10 h-10 rounded bg-destructive" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoomWrapper = () => (
  <ThemeProvider attribute="class" defaultTheme="dark">
    <Suspense fallback={<SkeletonMirror />}>
      <div className={`${jetbrainsMono.variable} font-sans`}>
        <Room />
      </div>
    </Suspense>
  </ThemeProvider>
);

export default RoomWrapper;
