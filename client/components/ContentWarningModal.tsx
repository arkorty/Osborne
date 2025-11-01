"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import { getCookie, setCookie } from "@/lib/cookies";

export const ContentWarningModal = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the warning
    const hasAcknowledged = getCookie('osborne-cwa') === 'true';
    if (!hasAcknowledged) {
      setShowWarning(true);
    }
  }, []);

  const handleAcknowledge = () => {
    setCookie('osborne-cwa', 'true', 365); // 1 year
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardHeader>
          <TriangleAlert className="mx-auto mb-2 text-yellow-600 dark:text-yellow-400" size={48} />
          <CardTitle className="text-center text-lg text-yellow-600 dark:text-yellow-400">Content Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="text-center">
            <p className="mb-3">
              <strong>This is a public collaborative text editor.</strong>
            </p>
            <p className="mb-3">
              Users can upload and share any type of content. We do not monitor, 
              review, or control user-generated content and are not responsible for 
              anything shared in these rooms.
            </p>
            <p className="mb-4 font-semibold text-yellow-600 dark:text-yellow-400">
              Proceed at your own discretion and use appropriate judgment when 
              viewing or sharing content.
            </p>
          </div>
          <Button 
            onClick={handleAcknowledge}
            className="w-full"
          >
            I Understand - Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};