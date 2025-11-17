"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchProgress {
  current: number;
  total: number;
  found: number;
  failed: number;
}

interface SearchContextType {
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  providerId: string;
  setProviderId: (providerId: string) => void;
  progress: SearchProgress;
  setProgress: (progress: SearchProgress) => void;
  updateProgress: (delta: { found?: number; failed?: number }) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [progress, setProgress] = useState<SearchProgress>({
    current: 0,
    total: 0,
    found: 0,
    failed: 0,
  });

  const updateProgress = (delta: { found?: number; failed?: number }) => {
    setProgress(prev => ({
      ...prev,
      current: prev.current + 1,
      found: prev.found + (delta.found || 0),
      failed: prev.failed + (delta.failed || 0),
    }));
  };

  return (
    <SearchContext.Provider value={{
      isSearching,
      setIsSearching,
      providerId,
      setProviderId,
      progress,
      setProgress,
      updateProgress
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
