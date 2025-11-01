import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MediaModal } from '@/components/MediaModal';
import { AnimatedAvatar } from '@/components/AnimatedAvatar';
import { 
  Users, 
  Upload, 
  File, 
  ImageIcon, 
  Video, 
  Music, 
  FileText, 
  Download, 
  Play, 
  Pause,
  Trash2
} from 'lucide-react';

interface ActiveUser {
  id: string;
  name: string;
  color: string;
  lastSeen: Date;
  isTyping?: boolean;
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

interface LeftPanelProps {
  isVisible: boolean;
  className?: string;
  users?: ActiveUser[];
  currentUser?: ActiveUser | null;
  mediaFiles?: MediaFile[];
  onFileUpload?: (files: FileList) => void;
  onFileDelete?: (fileId: string) => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  isVisible,
  users = [],
  currentUser,
  mediaFiles = [],
  onFileDelete,
  onModalStateChange
}) => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>(users);
  const [localMediaFiles, setLocalMediaFiles] = useState<MediaFile[]>(mediaFiles);
  const [usersScrollState, setUsersScrollState] = useState({ top: false, bottom: false });
  const [mediaScrollState, setMediaScrollState] = useState({ top: false, bottom: false });
  const [statusUpdateTrigger, setStatusUpdateTrigger] = useState(0);
  
  const usersScrollRef = useRef<HTMLDivElement>(null);
  const mediaScrollRef = useRef<HTMLDivElement>(null);
  
  // Update local state when props change
  useEffect(() => {
    setActiveUsers(users);
  }, [users]);
  
  // Update user statuses periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusUpdateTrigger(prev => prev + 1);
    }, 5000); // Update every 5 seconds to be more responsive
    
    return () => clearInterval(interval);
  }, []);
  
  // Force re-render when status should be updated (dependency on statusUpdateTrigger)
  useEffect(() => {
    // This effect doesn't need to do anything, just triggers re-render
  }, [statusUpdateTrigger]);
  
  // Scroll detection function
  const handleScroll = (element: HTMLDivElement | null, setState: (state: { top: boolean; bottom: boolean }) => void) => {
    if (!element) return;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isScrolledFromTop = scrollTop > 5;
    const isScrolledFromBottom = scrollTop < scrollHeight - clientHeight - 5;
    
    setState({
      top: isScrolledFromTop,
      bottom: isScrolledFromBottom && scrollHeight > clientHeight
    });
  };
  
  // Add scroll listeners
  useEffect(() => {
    const usersElement = usersScrollRef.current;
    const mediaElement = mediaScrollRef.current;
    
    const handleUsersScroll = () => handleScroll(usersElement, setUsersScrollState);
    const handleMediaScroll = () => handleScroll(mediaElement, setMediaScrollState);
    
    if (usersElement) {
      usersElement.addEventListener('scroll', handleUsersScroll);
      // Initial check
      handleUsersScroll();
    }
    
    if (mediaElement) {
      mediaElement.addEventListener('scroll', handleMediaScroll);
      // Initial check
      handleMediaScroll();
    }
    
    return () => {
      if (usersElement) usersElement.removeEventListener('scroll', handleUsersScroll);
      if (mediaElement) mediaElement.removeEventListener('scroll', handleMediaScroll);
    };
  }, [activeUsers, localMediaFiles]);
  
  useEffect(() => {
    setLocalMediaFiles(mediaFiles);
  }, [mediaFiles]);

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [modalFile, setModalFile] = useState<MediaFile | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: { currentTime: number; duration: number } }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Helper function to get the correct file URL using HTTP server
  const getFileUrl = (file: MediaFile) => {
    const httpUrl = process.env.NEXT_PUBLIC_HTTP_URL || 'http://localhost:8081';
    return file.url.startsWith('http') ? file.url : `${httpUrl}${file.url}`;
  };

  // Helper function to handle modal state changes
  const handleModalChange = (file: MediaFile | null) => {
    setModalFile(file);
    if (onModalStateChange) {
      onModalStateChange(file !== null);
    }
  };

  // Users Panel Functions
  const getStatusIndicator = (user: ActiveUser) => {
    const timeDiff = Date.now() - user.lastSeen.getTime();
    if (timeDiff < 60000) { // Less than 1 minute
      return { status: 'online', color: 'rgb(184, 187, 38)' }; // success color
    } else if (timeDiff < 300000) { // Less than 5 minutes
      return { status: 'away', color: 'rgb(250, 189, 47)' }; // warning color
    } else {
      return { status: 'offline', color: 'rgb(146, 131, 116)' }; // muted color
    }
  };

  const formatLastSeen = (date: Date) => {
    const timeDiff = Date.now() - date.getTime();
    if (timeDiff < 60000) {
      return 'Just now';
    } else if (timeDiff < 3600000) {
      const minutes = Math.floor(timeDiff / 60000);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(timeDiff / 3600000);
      return `${hours}h ago`;
    }
  };

  // Media Panel Functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date) => {
    const timeDiff = Date.now() - date.getTime();
    if (timeDiff < 60000) {
      return 'Just now';
    } else if (timeDiff < 3600000) {
      const minutes = Math.floor(timeDiff / 60000);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(timeDiff / 3600000);
      return `${hours}h ago`;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} className="text-blue-500" />;
    if (type.startsWith('video/')) return <Video size={16} className="text-purple-500" />;
    if (type.startsWith('audio/')) return <Music size={16} className="text-green-500" />;
    if (type.includes('text') || type.includes('json') || type.includes('xml')) 
      return <FileText size={16} className="text-yellow-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (type.startsWith('video/')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    if (type.startsWith('audio/')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const handlePlayAudio = (fileId: string, url: string) => {
    // Stop any currently playing audio
    if (playingAudio && audioRefs.current[playingAudio]) {
      audioRefs.current[playingAudio].pause();
    }

    if (playingAudio === fileId) {
      setPlayingAudio(null);
    } else {
      if (!audioRefs.current[fileId]) {
        const audio = new Audio(url);
        audioRefs.current[fileId] = audio;
        
        // Add event listeners for progress tracking
        audio.addEventListener('loadedmetadata', () => {
          setAudioProgress(prev => ({
            ...prev,
            [fileId]: { currentTime: 0, duration: audio.duration }
          }));
        });
        
        audio.addEventListener('timeupdate', () => {
          setAudioProgress(prev => ({
            ...prev,
            [fileId]: { currentTime: audio.currentTime, duration: audio.duration }
          }));
        });
        
        audio.addEventListener('ended', () => {
          setPlayingAudio(null);
          setAudioProgress(prev => ({
            ...prev,
            [fileId]: { currentTime: 0, duration: audio.duration }
          }));
        });
      }
      audioRefs.current[fileId].play();
      setPlayingAudio(fileId);
    }
  };

  const handleSeekAudio = (fileId: string, seekTime: number) => {
    const audio = audioRefs.current[fileId];
    if (audio) {
      audio.currentTime = seekTime;
    }
  };

  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDeleteFile = (fileId: string) => {
    // Call parent delete handler if available
    if (onFileDelete) {
      onFileDelete(fileId);
    }
    
    // Don't update local state here - let the parent's WebSocket update flow through props
    // setLocalMediaFiles(prev => prev.filter(file => file.id !== fileId));
    
    // Clean up audio/video refs
    if (audioRefs.current[fileId]) {
      audioRefs.current[fileId].pause();
      delete audioRefs.current[fileId];
    }
    if (playingAudio === fileId) setPlayingAudio(null);
  };

  const handleDownload = async (file: MediaFile) => {
    try {
      // Fetch the file as a blob to force download
      const response = await fetch(getFileUrl(file));
      const blob = await response.blob();
      
      // Create object URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to direct link
      const link = document.createElement('a');
      link.href = getFileUrl(file);
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div 
      className={`fixed left-0 top-0 h-full w-full md:w-80 bg-card border-r border-border shadow-lg z-40 flex flex-col transition-transform duration-300 ease-in-out ui-font ${
        isVisible ? 'transform-none' : '-translate-x-full'
      }`}
    >
      {/* Media Panel */}
      <div className="h-[65%] flex flex-col border-b border-border">
        <div className="flex items-center justify-center py-2 border-b border-border/50 bg-muted/20">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Upload size={16} />
            Media
          </h3>
        </div>
        
        <div 
          ref={mediaScrollRef}
          className={`flex-1 overflow-y-auto hide-scrollbar scroll-shadow p-2 space-y-2 ${
            mediaScrollState.top ? 'scroll-top' : ''
          } ${mediaScrollState.bottom ? 'scroll-bottom' : ''}`}
        >
          {localMediaFiles.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <Upload size={20} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No files uploaded</p>
              <p className="text-xs">Use upload button in toolbar</p>
            </div>
          ) : (
            localMediaFiles.map((file) => (
              <Card key={file.id} className="bg-background border-border">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {formatTimeAgo(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>

                  {/* Media preview/player */}
                  {file.type.startsWith('image/') && (
                    <div className="mt-2">
                      <div 
                        className="w-full h-24 bg-cover bg-center rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundImage: `url(${getFileUrl(file)})` }}
                        onClick={() => handleModalChange(file)}
                        title="Click to view full size"
                      />
                    </div>
                  )}

                  {file.type.startsWith('video/') && (
                    <div className="mt-2">
                      <div 
                        className="w-full h-24 bg-muted rounded border flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleModalChange(file)}
                        title="Click to play video"
                      >
                        <Play size={20} className="text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {file.type.startsWith('audio/') && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePlayAudio(file.id, getFileUrl(file))}
                        >
                          {playingAudio === file.id ? (
                            <Pause size={12} />
                          ) : (
                            <Play size={12} />
                          )}
                        </Button>
                        <div className="flex-1 flex flex-col space-y-1">
                          <div 
                            className="h-2 bg-muted rounded-full cursor-pointer hover:bg-muted/80 transition-colors relative"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const width = rect.width;
                              const progress = audioProgress[file.id];
                              if (progress) {
                                const seekTime = (clickX / width) * progress.duration;
                                handleSeekAudio(file.id, seekTime);
                              }
                            }}
                          >
                            <div 
                              className="h-2 bg-green-500 dark:bg-green-600 rounded-full transition-all duration-100"
                              style={{
                                width: audioProgress[file.id] 
                                  ? `${(audioProgress[file.id].currentTime / audioProgress[file.id].duration) * 100}%`
                                  : '0%'
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {audioProgress[file.id] ? formatAudioTime(audioProgress[file.id].currentTime) : '0:00'}
                            </span>
                            <span>
                              {audioProgress[file.id] ? formatAudioTime(audioProgress[file.id].duration) : '0:00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between mt-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getFileTypeColor(file.type)}`}
                    >
                      {file.type.split('/')[1] || 'file'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleDownload(file)}
                    >
                      <Download size={12} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{localMediaFiles.length} files</span>
            <span>
              {formatFileSize(localMediaFiles.reduce((total, file) => total + file.size, 0))} total
            </span>
          </div>
        </div>
      </div>

      {/* Users Panel */}
      <div className="h-[35%] flex flex-col">
        <div className="flex items-center justify-center py-2 border-b border-border/50 bg-muted/20">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users size={16} />
            Users
          </h3>
        </div>
        
        <div 
          ref={usersScrollRef}
          className={`flex-1 overflow-y-auto hide-scrollbar scroll-shadow p-2 space-y-2 ${
            usersScrollState.top ? 'scroll-top' : ''
          } ${usersScrollState.bottom ? 'scroll-bottom' : ''}`}
        >
          {activeUsers.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <Users size={20} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No active users</p>
            </div>
          ) : (
            activeUsers.map((user) => {
              const { status } = getStatusIndicator(user);
              const isCurrentUser = currentUser && user.id === currentUser.id;
              return (
                <Card key={user.id} className="bg-background border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          {isCurrentUser ? (
                            <AnimatedAvatar />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {isCurrentUser ? 'You' : user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatLastSeen(user.lastSeen)}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: user.color, color: user.color }}
                      >
                        {status}
                      </Badge>
                    </div>
                    
                    {user.currentLine && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Line {user.currentLine}
                        </span>
                        {user.isTyping && (
                          <div className="flex space-x-1">
                            <div 
                              className="w-1 h-1 rounded-full animate-pulse"
                              style={{ backgroundColor: user.color }}
                            />
                            <div 
                              className="w-1 h-1 rounded-full animate-pulse"
                              style={{ 
                                backgroundColor: user.color,
                                animationDelay: '0.1s'
                              }}
                            />
                            <div 
                              className="w-1 h-1 rounded-full animate-pulse"
                              style={{ 
                                backgroundColor: user.color,
                                animationDelay: '0.2s'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {activeUsers.filter(u => getStatusIndicator(u).status === 'online').length} online
            </span>
            <span>
              {activeUsers.filter(u => u.isTyping).length} typing
            </span>
          </div>
        </div>
      </div>

      {/* Media Modal */}
      <MediaModal
        file={modalFile}
        isOpen={modalFile !== null}
        onClose={() => handleModalChange(null)}
        onDelete={onFileDelete}
        getFileUrl={getFileUrl}
        currentUser={currentUser}
      />
    </div>
  );
};