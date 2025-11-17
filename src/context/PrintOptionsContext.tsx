"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

export type CutGuideStyle = 'none' | 'dashed' | 'solid' | 'corners';

interface PrintOptionsContextType {
  cutGuides: CutGuideStyle;
  setCutGuides: (style: CutGuideStyle) => void;
}

const PrintOptionsContext = createContext<PrintOptionsContextType | undefined>(undefined);

export const PrintOptionsProvider = ({ children }: { children: ReactNode }) => {
  const [cutGuides, setCutGuides] = useState<CutGuideStyle>('dashed');

  return (
    <PrintOptionsContext.Provider value={{ cutGuides, setCutGuides }}>
      {children}
    </PrintOptionsContext.Provider>
  );
};

export const usePrintOptions = () => {
  const context = useContext(PrintOptionsContext);
  if (context === undefined) {
    throw new Error('usePrintOptions must be used within a PrintOptionsProvider');
  }
  return context;
};
