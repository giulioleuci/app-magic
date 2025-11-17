"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface MultiSelectContextType {
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
  hasSelection: boolean;
}

const MultiSelectContext = createContext<MultiSelectContextType | undefined>(undefined);

export const MultiSelectProvider = ({ children }: { children: ReactNode }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  const hasSelection = selectedIds.length > 0;

  return (
    <MultiSelectContext.Provider
      value={{
        selectedIds,
        toggleSelect,
        selectAll,
        deselectAll,
        isSelected,
        hasSelection,
      }}
    >
      {children}
    </MultiSelectContext.Provider>
  );
};

export const useMultiSelect = () => {
  const context = useContext(MultiSelectContext);
  if (context === undefined) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider');
  }
  return context;
};
