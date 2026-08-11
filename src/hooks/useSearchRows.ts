"use client";

import { useCardContext } from '@/context/CardContext';
import { useCardSearch } from '@/hooks/useCardSearch';
import { useSearch } from '@/context/SearchContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { limitConcurrency } from '@/lib/utils';
import type { CardRow } from '@/lib/types';

export const useSearchRows = () => {
  const { dispatch } = useCardContext();
  const { search } = useCardSearch();
  const { setIsSearching, setProviderId, setProgress, updateProgress } = useSearch();
  const { t } = useLanguage();
  const { toast } = useToast();

  const searchRows = async (rows: CardRow[]): Promise<void> => {
    if (rows.length === 0) return;

    if (rows.some(row => row.providerId === 'pokemontcg')) {
      setProviderId('pokemontcg');
    } else {
      setProviderId('');
    }

    setProgress({ current: 0, total: rows.length, found: 0, failed: 0 });
    setIsSearching(true);
    toast({ title: t('toast.searchingAll.title'), description: t('toast.searchingAll.description') });

    try {
      await limitConcurrency(rows, 5, async (row) => {
        dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'loading' } });
        try {
          const options = {
            scryfall: row.scryfallSearchOptions,
            pokemontcg: row.pokemonTcgSearchOptions,
            yugioh: row.yugiohSearchOptions,
          };
          const cardData = await search(row.providerId, row.query, options, row.identifiers);
          if (cardData && cardData.length > 0) {
            dispatch({ type: 'SET_CARD_DATA', payload: { id: row.id, card: cardData[0], searchResults: cardData } });
            updateProgress({ found: 1 });
          } else {
            dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: t('card.notFound') } });
            updateProgress({ failed: 1 });
          }
        } catch {
          dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: t('card.fetchError') } });
          updateProgress({ failed: 1 });
        }
      });

      toast({ title: t('toast.searchComplete.title'), description: t('toast.searchComplete.description') });
    } catch {
      toast({ variant: 'destructive', title: t('toast.searchFailed.title'), description: t('toast.searchFailed.description') });
    } finally {
      setIsSearching(false);
    }
  };

  return { searchRows };
};
