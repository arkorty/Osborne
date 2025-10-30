import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MediaModal } from '@/components/MediaModal';
import { 
  Users, 
  Circle, 
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
  isConnected: boolean;
  className?: string;
  users?: ActiveUser[];
  mediaFiles?: MediaFile[];
  onFileUpload?: (files: FileList) => void;
  onFileDelete?: (fileId: string) => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  isVisible,
  className = '',
  users = [],
  mediaFiles = [],
  onFileDelete,
  onModalStateChange
}) => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>(users);
  const [localMediaFiles, setLocalMediaFiles] = useState<MediaFile[]>(mediaFiles);
  
  // Update local state when props change
  useEffect(() => {
    setActiveUsers(users);
  }, [users]);
  
  useEffect(() => {
    setLocalMediaFiles(mediaFiles);
  }, [mediaFiles]);

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [modalFile, setModalFile] = useState<MediaFile | null>(null);
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
        audioRefs.current[fileId] = new Audio(url);
        audioRefs.current[fileId].addEventListener('ended', () => {
          setPlayingAudio(null);
        });
      }
      audioRefs.current[fileId].play();
      setPlayingAudio(fileId);
    }
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

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement('a');
    link.href = getFileUrl(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`w-64 flex flex-col space-y-4 ${className}`}>
      {/* Users Panel */}
      <div className="bg-card border border-border rounded-md shadow-lg">
        <CardContent className="p-2 space-y-3 max-h-64 overflow-y-auto">
          {activeUsers.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <Users size={20} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No active users</p>
            </div>
          ) : (
            activeUsers.map((user) => {
              const { status, color } = getStatusIndicator(user);
              return (
                <Card key={user.id} className="bg-background border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <Circle
                            size={8}
                            className="absolute -bottom-0.5 -right-0.5 border-2 border-background rounded-full"
                            style={{ color, fill: color }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.name}
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
        </CardContent>
        <div className="px-4 pb-3 border-t border-border bg-muted/50 rounded-b-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3">
            <span>
              {activeUsers.filter(u => getStatusIndicator(u).status === 'online').length} online
            </span>
            <span>
              {activeUsers.filter(u => u.isTyping).length} typing
            </span>
          </div>
        </div>
      </div>

      {/* Media Panel */}
      <div className="bg-card border border-border rounded-md shadow-lg">
        <CardContent className="p-2 space-y-3 max-h-64 overflow-y-auto">
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
                    <div className="mt-2 flex items-center space-x-2">
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
                      <div className="flex-1 h-2 bg-muted rounded-full">
                        <div className="h-2 bg-primary rounded-full w-0"></div>
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
        </CardContent>
        <div className="px-4 pb-3 border-t border-border bg-muted/50 rounded-b-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3">
            <span>{localMediaFiles.length} files</span>
            <span>
              {formatFileSize(localMediaFiles.reduce((total, file) => total + file.size, 0))} total
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
      />
    </div>
  );
};