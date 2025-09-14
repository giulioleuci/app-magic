"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  providerId: string;
  setProviderId: (providerId: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [providerId, setProviderId] = useState('');

  return (
    <SearchContext.Provider value={{ isSearching, setIsSearching, providerId, setProviderId }}>
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
