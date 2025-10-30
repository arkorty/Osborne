import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

interface Comment {
  id: string;
  lineNumber: number | null;
  lineRange?: string;
  author: string;
  authorId?: string;
  content: string;
  timestamp: Date;
}

interface User {
  id: string;
  name: string;
  color: string;
  lastSeen: Date;
  isTyping?: boolean;
  currentLine?: number;
}

interface CommentsPageProps {
  isVisible: boolean;
  onToggle: () => void;
  selectedLineStart?: number;
  selectedLineEnd?: number;
  onCommentSelect?: (lineNumber: number, lineRange?: string) => void;
  comments?: Comment[];
  onAddComment?: (content: string, lineNumber?: number, lineRange?: string) => void;
  currentUser?: User | null;
}

export const CommentsPanel: React.FC<CommentsPageProps> = ({ 
  isVisible, 
  selectedLineStart,
  selectedLineEnd,
  onCommentSelect,
  comments = [],
  onAddComment,
  currentUser
}) => {
  const [newComment, setNewComment] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [scrollState, setScrollState] = useState({ top: false, bottom: false });
  
  const commentsScrollRef = useRef<HTMLDivElement>(null);

  // Update selected line when editor selection changes
  useEffect(() => {
    if (selectedLineStart && selectedLineEnd) {
      if (selectedLineStart === selectedLineEnd) {
        setSelectedLine(selectedLineStart);
      } else {
        setSelectedLine(selectedLineStart); // Use start line for range selections
      }
    } else {
      setSelectedLine(null);
    }
  }, [selectedLineStart, selectedLineEnd]);

  // Scroll detection function
  const handleScroll = () => {
    const element = commentsScrollRef.current;
    if (!element) return;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isScrolledFromTop = scrollTop > 5;
    const isScrolledFromBottom = scrollTop < scrollHeight - clientHeight - 5;
    
    setScrollState({
      top: isScrolledFromTop,
      bottom: isScrolledFromBottom && scrollHeight > clientHeight
    });
  };
  
  // Add scroll listener
  useEffect(() => {
    const element = commentsScrollRef.current;
    
    if (element) {
      element.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      
      return () => {
        element.removeEventListener('scroll', handleScroll);
      };
    }
  }, [comments]);

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment && currentUser) {
      const lineRange = selectedLineStart && selectedLineEnd && selectedLineStart !== selectedLineEnd 
        ? `${selectedLineStart}-${selectedLineEnd}` 
        : undefined;
      
      onAddComment(newComment.trim(), selectedLine || undefined, lineRange);
      setNewComment('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className={`fixed right-0 top-0 h-full w-full md:w-80 bg-card border-l border-border shadow-lg z-40 flex flex-col transition-transform duration-300 ease-in-out ${
        isVisible ? 'transform-none' : 'translate-x-full'
      }`}
    >
      {/* Comments List */}
      <div 
        ref={commentsScrollRef}
        className={`flex-1 overflow-y-auto hide-scrollbar scroll-shadow p-2 space-y-2 ${
          scrollState.top ? 'scroll-top' : ''
        } ${scrollState.bottom ? 'scroll-bottom' : ''}`}
      >
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <MessageSquare size={20} className="mx-auto mb-1 opacity-50" />
            <p className="text-xs">No comments yet</p>
            <p className="text-xs">Add a comment to get started</p>
          </div>
        ) : (
          comments
            .sort((a, b) => {
              // Comments with line numbers come first, sorted by line number
              // Comments without line numbers come last
              if (a.lineNumber === null && b.lineNumber === null) return 0;
              if (a.lineNumber === null) return 1;
              if (b.lineNumber === null) return -1;
              return a.lineNumber - b.lineNumber;
            })
            .map((comment) => (
              <Card 
                key={comment.id} 
                className="border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (comment.lineNumber && onCommentSelect) {
                    onCommentSelect(comment.lineNumber, comment.lineRange);
                  }
                }}
              >
                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-foreground">
                        {comment.author}
                      </span>
                      {comment.lineNumber !== null && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-1 py-0"
                        >
                          {comment.lineRange || `Line ${comment.lineNumber}`}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Add Comment Form */}
      <div className="border-t border-border p-2 bg-muted/20">
        <div className="space-y-1">
          <Textarea
            placeholder={
              selectedLine 
                ? `Add a comment on ${selectedLineStart && selectedLineEnd && selectedLineStart !== selectedLineEnd 
                    ? `lines ${selectedLineStart}-${selectedLineEnd}`
                    : `line ${selectedLine}`
                  }...`
                : "Add a general comment..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] bg-background border-border text-foreground placeholder:text-muted-foreground resize-none text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
              // Shift+Enter will naturally add a new line due to default behavior
            }}
          />
          
          <div className="text-xs text-muted-foreground text-center">
            <kbd className="px-1 py-0 text-xs bg-muted border border-border rounded">
              Shift
            </kbd>
            {' + '}
            <kbd className="px-1 py-0 text-xs bg-muted border border-border rounded">
              Enter
            </kbd>
            {' for new line'}
          </div>
        </div>
      </div>
    </div>
  );
};