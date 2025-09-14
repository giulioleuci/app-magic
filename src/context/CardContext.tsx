
"use client";

import type { CardRow, NormalizedCard, ScryfallSearchOptions } from '@/lib/types';
import { defaultProviderId } from '@/api/providers';
import React, { createContext, useContext, useReducer, type ReactNode, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './LanguageContext';

const generateId = () => `row-${Date.now()}-${Math.random()}`;

type State = {
  rows: CardRow[];
};

type Action =
  | { type: 'ADD_ROW' }
  | { type: 'REMOVE_ROW'; payload: { id: string } }
  | { type: 'UPDATE_ROW'; payload: { id: string; data: Partial<Omit<CardRow, 'id'>> } }
  | { type: 'SET_SEARCH_STATUS'; payload: { id: string; status: CardRow['status']; error?: string | null } }
  | { type: 'SET_CARD_DATA'; payload: { id: string; card: NormalizedCard | null; searchResults?: NormalizedCard[] | null } }
  | { type: 'SET_SEARCH_RESULTS'; payload: { id: string, searchResults: NormalizedCard[] } }
  | { type: 'SET_ROWS'; payload: Partial<CardRow>[] };

const initialState: State = {
  rows: [],
};

const cardReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_ROW':
      const lastRow = state.rows[state.rows.length - 1];
      const newRow: CardRow = {
        id: generateId(),
        query: '',
        quantity: 1,
        providerId: lastRow ? lastRow.providerId : defaultProviderId,
        card: null,
        scryfallSearchOptions: {
          unique: 'prints',
          include_extras: true,
        },
        pokemonTcgSearchOptions: {},
        status: 'idle',
      };
      return { ...state, rows: [...state.rows, newRow] };
    case 'REMOVE_ROW':
      return {
        ...state,
        rows: state.rows.filter((row) => row.id !== action.payload.id),
      };
    case 'UPDATE_ROW':
      return {
        ...state,
        rows: state.rows.map((row) =>
          row.id === action.payload.id ? { ...row, ...action.payload.data } : row
        ),
      };
    case 'SET_SEARCH_STATUS':
      return {
        ...state,
        rows: state.rows.map((row) =>
          row.id === action.payload.id
            ? { ...row, status: action.payload.status, error: action.payload.error || null, card: action.payload.status === 'error' ? null : row.card, searchResults: action.payload.status === 'error' ? null : row.searchResults }
            : row
        ),
      };
    case 'SET_CARD_DATA':
      return {
        ...state,
        rows: state.rows.map((row) =>
          row.id === action.payload.id
            ? { ...row, card: action.payload.card, searchResults: action.payload.searchResults, status: action.payload.card ? 'found' : 'error', error: action.payload.card ? null : 'Card not found' }
            : row
        ),
      };
    case 'SET_SEARCH_RESULTS':
        return {
            ...state,
            rows: state.rows.map((row) => 
                row.id === action.payload.id 
                ? { ...row, searchResults: action.payload.searchResults, status: 'multiple', card: null }
                : row
            ),
        };
    case 'SET_ROWS':
      const newRows: CardRow[] = action.payload.map(item => ({
        id: generateId(),
        query: item.query || '',
        quantity: item.quantity || 1,
        providerId: item.providerId || defaultProviderId,
        card: item.card || null,
        scryfallSearchOptions: item.scryfallSearchOptions || { unique: 'prints', include_extras: true },
        status: item.status || 'idle',
        error: item.error,
      }));
      return { ...state, rows: newRows };
    default:
      return state;
  }
};

interface CardContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export const CardProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(cardReducer, initialState);
  const previousRows = useRef(state.rows);
  const { t } = useLanguage();

  useEffect(() => {
    state.rows.forEach(currentRow => {
      const prevRow = previousRows.current.find(r => r.id === currentRow.id);
      
      // Check if the status has changed to 'error'
      if (prevRow && currentRow.status === 'error' && prevRow.status !== 'error') {
        toast({
            variant: "destructive",
            title: t('toast.searchFailed.title'),
            description: currentRow.error || t('toast.searchFailed.cardNotFound', { query: currentRow.query }),
        });
      }
    });

    previousRows.current = state.rows;
  }, [state.rows, toast, t]);


  return (
    <CardContext.Provider value={{ state, dispatch }}>
      {children}
    </CardContext.Provider>
  );
};

export const useCardContext = () => {
  const context = useContext(CardContext);
  if (context === undefined) {
    throw new Error('useCardContext must be used within a CardProvider');
  }
  return context;
};
