"use client";

import { availableProviders } from "@/api/providers";
import { useCardContext } from "@/context/CardContext";
import { useSearch } from "@/context/SearchContext";
import { useCardSearch } from "@/hooks/useCardSearch";
import { useMultiSelect } from "@/context/MultiSelectContext";
import { useDebounce } from "@/hooks/useDebounce";
import type { CardRow, NormalizedCard, ScryfallSearchOptions, PokemonTcgSearchOptions } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Minus, Plus, Search, Trash2, AlertTriangle, Replace, Settings2, ExternalLink } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useState, useEffect } from "react";
import CardSelectionModal from "./CardSelectionModal";
import { useLanguage } from "@/context/LanguageContext";
import ScryfallSearchModal from "./ScryfallSearchModal";
import PokemonTcgSearchModal from "./PokemonTcgSearchModal";
import Link from "next/link";
import CachedImage from "./CachedImage";
import ImagePreview from "./ImagePreview";
import DuplicateIndicator from "./DuplicateIndicator";

interface CardRowProps {
  row: CardRow;
}

export default function CardRowComponent({ row }: CardRowProps) {
  const { state, dispatch } = useCardContext();
  const { search } = useCardSearch();
  const { setIsSearching, setProviderId } = useSearch();
  const { isSelected, toggleSelect } = useMultiSelect();
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isScryfallSettingsOpen, setIsScryfallSettingsOpen] = useState(false);
  const [isPokemonTcgSettingsOpen, setIsPokemonTcgSettingsOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(row.query);
  const debouncedQuery = useDebounce(localQuery, 300);
  const { t } = useLanguage();

  // Update query after debounce
  useEffect(() => {
    if (debouncedQuery !== row.query) {
      handleUpdate({ query: debouncedQuery });
    }
  }, [debouncedQuery]);

  // Sync local query with row query when it changes externally
  useEffect(() => {
    setLocalQuery(row.query);
  }, [row.query]);

  // Count duplicates
  const duplicateCount = state.rows.filter(r =>
    r.card && row.card && r.card.id === row.card.id
  ).length;

  const handleUpdate = (updates: Partial<Omit<CardRow, 'id'>>) => {
    dispatch({ type: 'UPDATE_ROW', payload: { id: row.id, data: updates } });
  };

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_ROW', payload: { id: row.id } });
  };

  const handleSearch = async () => {
    if (!row.query) return;
    dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'loading' } });
    setIsSearching(true);
    setProviderId(row.providerId);
    try {
        const options = {
            scryfall: row.scryfallSearchOptions,
            pokemontcg: row.pokemonTcgSearchOptions,
        }
        const searchResults = await search(row.providerId, row.query, options);
        if (searchResults && searchResults.length === 1) {
            dispatch({ type: 'SET_CARD_DATA', payload: { id: row.id, card: searchResults[0], searchResults: [searchResults[0]] } });
        } else if (searchResults && searchResults.length > 1) {
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: { id: row.id, searchResults } });
            setIsSelectionModalOpen(true);
        } else {
            dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: t('card.notFound') } });
        }
    } catch (e) {
        dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: t('card.fetchError') } });
    } finally {
        setIsSearching(false);
    }
  };

  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, row.quantity + amount);
    handleUpdate({ quantity: newQuantity });
  };

  const handleCardSelect = (card: NormalizedCard) => {
    dispatch({ type: 'SET_CARD_DATA', payload: { id: row.id, card, searchResults: row.searchResults } });
    setIsSelectionModalOpen(false);
  }

  const openChangeCardModal = () => {
    if (row.searchResults && row.searchResults.length > 1) {
      setIsSelectionModalOpen(true);
    }
  }

  const handleScryfallSearchOptionsSave = (options: ScryfallSearchOptions) => {
    handleUpdate({ scryfallSearchOptions: options });
    setIsScryfallSettingsOpen(false);
  };

  const handlePokemonTcgSearchOptionsSave = (options: PokemonTcgSearchOptions) => {
    handleUpdate({ pokemonTcgSearchOptions: options });
    setIsPokemonTcgSettingsOpen(false);
  };

  return (
    <TableRow className={isSelected(row.id) ? "bg-primary/10" : ""}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected(row.id)}
          onCheckedChange={() => toggleSelect(row.id)}
        />
      </TableCell>
      <TableCell>
        <div className="relative cursor-pointer" onClick={() => row.card && setIsImagePreviewOpen(true)}>
          {row.status === 'loading' && <Skeleton className="h-[88px] w-[63px] rounded-md" />}
          {row.status === 'error' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="h-[88px] w-[63px] rounded-md bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{row.error || t('card.notFound')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {row.status === 'found' && row.card && (
            <>
              <CachedImage
                src={row.card.image_uris.front}
                alt={row.card.name}
                width={63}
                height={88}
                className="rounded-md hover:ring-2 hover:ring-primary transition-all"
              />
               {row.searchResults && row.searchResults.length > 1 && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openChangeCardModal(); }} className="text-white hover:text-primary">
                        <Replace className="h-6 w-6" />
                    </Button>
                 </div>
               )}
            </>
          )}
          {(row.status === 'idle' || row.status === 'multiple') && <Skeleton className="h-[88px] w-[63px] rounded-md bg-muted/20" />}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
            <Input
            placeholder={t('card.placeholder')}
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-background"
            />
            {row.card && <DuplicateIndicator count={duplicateCount} />}
            {row.card?.url && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={row.card.url} target="_blank">
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View on Scryfall</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(-1)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={row.quantity}
            onChange={(e) => handleUpdate({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-16 text-center bg-background"
          />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Select
            value={row.providerId}
            onValueChange={(value) => handleUpdate({ providerId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('card.selectProvider')} />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map(p => (
                <SelectItem key={p.id} value={p.id}>{t(`providers.${p.id}` as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {row.providerId === 'scryfall' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsScryfallSettingsOpen(true)}>
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('card.scryfallSettings')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {row.providerId === 'pokemontcg' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsPokemonTcgSettingsOpen(true)}>
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('card.pokemonTcgSettings')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="outline" size="icon" onClick={handleSearch} disabled={row.status === 'loading'}>
          {row.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button variant="destructive" size="icon" onClick={handleRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
      {isSelectionModalOpen && row.searchResults && (
        <CardSelectionModal
          cards={row.searchResults}
          onCardSelect={handleCardSelect}
          onClose={() => setIsSelectionModalOpen(false)}
          query={row.query}
        />
      )}
       {isScryfallSettingsOpen && (
        <ScryfallSearchModal
          options={row.scryfallSearchOptions || {}}
          onSave={handleScryfallSearchOptionsSave}
          onClose={() => setIsScryfallSettingsOpen(false)}
        />
      )}
      {isPokemonTcgSettingsOpen && (
        <PokemonTcgSearchModal
          options={row.pokemonTcgSearchOptions || {}}
          onSave={handlePokemonTcgSearchOptionsSave}
          onClose={() => setIsPokemonTcgSettingsOpen(false)}
        />
      )}
      {isImagePreviewOpen && row.card && (
        <ImagePreview
          imageUrl={row.card.image_uris.front}
          cardName={row.card.name}
          isOpen={isImagePreviewOpen}
          onClose={() => setIsImagePreviewOpen(false)}
          backImageUrl={row.card.image_uris.back}
        />
      )}
    </TableRow>
  );
}
