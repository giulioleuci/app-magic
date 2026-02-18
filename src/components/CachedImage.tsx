"use client";

import { useImageCache } from '@/hooks/useImageCache';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

interface CachedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onClick?: () => void;
}

export default function CachedImage({ src, alt, width, height, className, onClick }: CachedImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { cachedUrl } = useImageCache(src, isVisible);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} style={{ width, height }} className={className} onClick={onClick}>
      {!hasLoaded && <Skeleton className="w-full h-full rounded-md" />}
      {isVisible && cachedUrl && (
        <Image
          src={cachedUrl}
          alt={alt}
          width={width}
          height={height}
          className={className}
          onLoad={() => setHasLoaded(true)}
          style={{ display: hasLoaded ? 'block' : 'none' }}
          data-ai-hint="card game"
        />
      )}
    </div>
  );
}
