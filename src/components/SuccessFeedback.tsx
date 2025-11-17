"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessFeedbackProps {
  show: boolean;
  onComplete?: () => void;
}

export default function SuccessFeedback({ show, onComplete }: SuccessFeedbackProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={cn(
        "bg-green-500/90 text-white rounded-full p-8 shadow-2xl",
        "animate-in zoom-in-50 duration-300",
        "fade-out"
      )}>
        <CheckCircle2 className="h-16 w-16" strokeWidth={2.5} />
      </div>
    </div>
  );
}
