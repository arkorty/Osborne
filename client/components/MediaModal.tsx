import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Trash2,
  X,
  File, 
  ImageIcon, 
  Video, 
  Music, 
  FileText
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

interface MediaModalProps {
  file: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (fileId: string) => void;
  getFileUrl: (file: MediaFile) => string;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  file,
  isOpen,
  onClose,
  onDelete,
  getFileUrl
}) => {
  if (!isOpen || !file) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} className="text-blue-500" />;
    if (type.startsWith('video/')) return <Video size={20} className="text-purple-500" />;
    if (type.startsWith('audio/')) return <Music size={20} className="text-green-500" />;
    if (type.includes('text') || type.includes('json') || type.includes('xml')) return <FileText size={20} className="text-yellow-500" />;
    return <File size={20} className="text-gray-500" />;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
    if (type.startsWith('video/')) return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
    if (type.startsWith('audio/')) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement('a');
    link.href = getFileUrl(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <Card className="relative max-w-[95vw] max-h-[95vh] w-auto h-auto bg-card border-border shadow-xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
        <div 
          className="relative flex flex-col h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              {getFileIcon(file.type)}
              <div>
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {file.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} • {formatTimeAgo(file.uploadedAt)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-muted"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </CardHeader>

          {/* Media Content */}
          <CardContent className="p-0 flex-1 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center min-h-[300px] max-h-[75vh] bg-muted/50">
              {file.type.startsWith('image/') && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={getFileUrl(file)}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain"
                  style={{ 
                    width: 'auto', 
                    height: 'auto',
                    maxWidth: 'min(90vw, 1200px)',
                    maxHeight: 'min(75vh, 800px)'
                  }}
                />
              )}

              {file.type.startsWith('video/') && (
                <video 
                  src={getFileUrl(file)}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                  style={{ 
                    width: 'auto', 
                    height: 'auto',
                    maxWidth: 'min(90vw, 1200px)',
                    maxHeight: 'min(75vh, 800px)'
                  }}
                />
              )}
            </div>
          </CardContent>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getFileTypeColor(file.type)}`}
                >
                  {file.type.split('/')[1] || 'file'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Uploaded by {file.uploadedBy}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                >
                  <Download size={14} className="mr-2" />
                  Download
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      onDelete(file.id);
                      onClose();
                    }}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};