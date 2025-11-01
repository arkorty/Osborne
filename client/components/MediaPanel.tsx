import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  ImageIcon, 
  Video, 
  Music, 
  FileText, 
  Download, 
  Play, 
  Pause,
  Trash2,
  X
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

interface MediaPanelProps {
  isVisible: boolean;
  className?: string;
}

export const MediaPanel: React.FC<MediaPanelProps> = ({
  isVisible,
  className = ''
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([
    // Mock data for demonstration
    {
      id: '1',
      name: 'demo-video.mp4',
      type: 'video/mp4',
      size: 12456789,
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      uploadedAt: new Date(Date.now() - 300000),
      uploadedBy: 'Alice'
    },
    {
      id: '2',
      name: 'background-music.mp3',
      type: 'audio/mpeg',
      size: 3456789,
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      uploadedAt: new Date(Date.now() - 600000),
      uploadedBy: 'Bob'
    },
    {
      id: '3',
      name: 'screenshot.png',
      type: 'image/png',
      size: 234567,
      url: 'https://picsum.photos/800/600',
      uploadedAt: new Date(Date.now() - 900000),
      uploadedBy: 'You'
    }
  ]);

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

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

  const handlePlayVideo = (fileId: string) => {
    if (playingVideo === fileId) {
      setPlayingVideo(null);
    } else {
      setPlayingVideo(fileId);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== fileId));
    
    // Clean up audio/video refs
    if (audioRefs.current[fileId]) {
      audioRefs.current[fileId].pause();
      delete audioRefs.current[fileId];
    }
    if (playingAudio === fileId) setPlayingAudio(null);
    if (playingVideo === fileId) setPlayingVideo(null);
  };

  const handleDownload = async (file: MediaFile) => {
    try {
      // Fetch the file as a blob to force download
      const response = await fetch(file.url);
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
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`w-64 bg-card border border-border rounded-md shadow-lg flex flex-col ${className}`}>
      {/* Header */}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Media Files</CardTitle>
      </CardHeader>

      {/* Files List */}
      <CardContent className="p-0 flex-1">
        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {mediaFiles.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Upload size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files uploaded</p>
              <p className="text-xs">Use upload button in toolbar</p>
            </div>
          ) : (
            mediaFiles.map((file) => (
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

                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getFileTypeColor(file.type)}`}
                    >
                      {file.type.split('/')[1] || 'file'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      by {file.uploadedBy}
                    </span>
                  </div>

                  {/* Media preview/player */}
                  {file.type.startsWith('image/') && (
                    <div className="mt-2">
                      <div 
                        className="w-full h-24 bg-cover bg-center rounded border"
                        style={{ backgroundImage: `url(${file.url})` }}
                      />
                    </div>
                  )}

                  {file.type.startsWith('video/') && (
                    <div className="mt-2">
                      {playingVideo === file.id ? (
                        <div className="relative">
                          <video 
                            ref={(el) => {
                              if (el) videoRefs.current[file.id] = el;
                            }}
                            src={file.url}
                            controls
                            className="w-full h-24 rounded border"
                            onEnded={() => setPlayingVideo(null)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                            onClick={() => setPlayingVideo(null)}
                          >
                            <X size={12} className="text-white" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="w-full h-24 bg-muted rounded border flex items-center justify-center cursor-pointer hover:bg-muted/80"
                          onClick={() => handlePlayVideo(file.id)}
                        >
                          <Play size={20} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}

                  {file.type.startsWith('audio/') && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePlayAudio(file.id, file.url)}
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
                  <div className="flex justify-end mt-2">
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
      </CardContent>

      {/* Footer with file count */}
      <div className="p-3 border-t border-border bg-muted/50 rounded-b-md">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{mediaFiles.length} files</span>
          <span>
            {formatFileSize(mediaFiles.reduce((total, file) => total + file.size, 0))} total
          </span>
        </div>
      </div>
    </div>
  );
};