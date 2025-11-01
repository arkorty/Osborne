"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, X } from "lucide-react";

interface RecordingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (files: FileList) => Promise<void>;
}

const RecordingPopup: React.FC<RecordingPopupProps> = ({ isOpen, onClose, onFileUpload }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep popup within viewport bounds
    const maxX = window.innerWidth - 128; // popup width (w-32 = 8rem = 128px)
    const maxY = window.innerHeight - 120; // popup height (smaller now)

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging, dragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    // Keep popup within viewport bounds
    const maxX = window.innerWidth - 128; // popup width (w-32 = 8rem = 128px)
    const maxY = window.innerHeight - 120; // popup height (smaller now)

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setRecordedChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setRecordedChunks([]);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [mediaRecorder]);

  const downloadRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-upload recording when it stops
  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const fileName = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      const file = new File([blob], fileName, { type: 'audio/webm' });

      // Create a proper FileList
      const dt = new DataTransfer();
      dt.items.add(file);
      const fileList = dt.files;

      // Upload the recording
      onFileUpload(fileList);
      
      // Clear recorded chunks to prevent re-upload
      setRecordedChunks([]);
    }
  }, [recordedChunks, isRecording, onFileUpload]);

  // Clean up recording when popup is closed
  useEffect(() => {
    if (!isOpen && isRecording) {
      stopRecording();
    }
  }, [isOpen, isRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-32 bg-card border border-border rounded-3xl shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div
        className="flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          size="sm"
          className={`rounded-full p-2 ${isRecording ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isRecording ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>

        <div className="ui-font text-foreground">
          {formatTime(recordingTime)}
        </div>

        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {recordedChunks.length > 0 && (
        <div className="px-2 pb-1">
          <Button
            onClick={downloadRecording}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Download Recording
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecordingPopup;