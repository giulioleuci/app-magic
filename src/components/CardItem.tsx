
import { availableProviders } from "@/api/providers";
import { useCardContext } from "@/context/CardContext";
import { useCardSearch } from "@/hooks/useCardSearch";
import type { CardRow, NormalizedCard, ScryfallSearchOptions } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Minus, Plus, Search, Trash2, AlertTriangle, Replace, Settings2, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useState } from "react";
import CardSelectionModal from "./CardSelectionModal";
import { useLanguage } from "@/context/LanguageContext";
import ScryfallSearchModal from "./ScryfallSearchModal";
import Link from "next/link";

interface CardItemProps {
  row: CardRow;
}

export default function CardItem({ row }: CardItemProps) {
  const { dispatch } = useCardContext();
  const { search } = useCardSearch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchSettingsOpen, setIsSearchSettingsOpen] = useState(false);
  const { t } = useLanguage();

  const handleUpdate = (updates: Partial<Omit<CardRow, 'id'>>) => {
    dispatch({ type: 'UPDATE_ROW', payload: { id: row.id, data: updates } });
  };

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_ROW', payload: { id: row.id } });
  };

  const handleSearch = async () => {
    if (!row.query) return;
    dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'loading' } });
    try {
      const searchResults = await search(row.query, row.scryfallSearchOptions);
      if (searchResults && searchResults.length === 1) {
          dispatch({ type: 'SET_CARD_DATA', payload: { id: row.id, card: searchResults[0], searchResults: [searchResults[0]] } });
      } else if (searchResults && searchResults.length > 1) {
          dispatch({ type: 'SET_SEARCH_RESULTS', payload: { id: row.id, searchResults } });
          setIsModalOpen(true);
      } else {
          dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: t('card.notFound') } });
      }
    } catch (e) {
        dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: t('card.fetchError') } });
    }
  };

  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, row.quantity + amount);
    handleUpdate({ quantity: newQuantity });
  };

  const handleCardSelect = (card: NormalizedCard) => {
    dispatch({ type: 'SET_CARD_DATA', payload: { id: row.id, card, searchResults: row.searchResults } });
    setIsModalOpen(false);
  }

  const openChangeCardModal = () => {
    if (row.searchResults && row.searchResults.length > 1) {
      setIsModalOpen(true);
    }
  }

  const handleSearchOptionsSave = (options: ScryfallSearchOptions) => {
    handleUpdate({ scryfallSearchOptions: options });
    setIsSearchSettingsOpen(false);
  };


  return (
    <Card>
      <CardHeader className="flex flex-row gap-4 space-y-0">
        <div className="flex-shrink-0 relative">
          {row.status === 'loading' && <Skeleton className="h-[110px] w-[79px] rounded-md" />}
          {row.status === 'error' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="h-[110px] w-[79px] rounded-md bg-destructive/20 flex items-center justify-center">
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
                <Image
                src={row.card.image_uris.front}
                alt={row.card.name}
                width={79}
                height={110}
                className="rounded-md"
                data-ai-hint="card game"
                />
                {row.searchResults && row.searchResults.length > 1 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md">
                        <Button variant="ghost" size="icon" onClick={openChangeCardModal} className="text-white hover:text-primary">
                            <Replace className="h-5 w-5" />
                        </Button>
                    </div>
                )}
             </>
          )}
          {(row.status === 'idle' || row.status === 'multiple') && <Skeleton className="h-[110px] w-[79px] rounded-md bg-muted/20" />}
        </div>
        <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
                <Input
                placeholder={t('card.placeholder')}
                value={row.query}
                onChange={(e) => handleUpdate({ query: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-background"
                />
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
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {row.providerId === 'scryfall' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => setIsSearchSettingsOpen(true)}>
                        <Settings2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('card.scryfallSettings')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(-1)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={row.quantity}
            onChange={(e) => handleUpdate({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-20 text-center bg-background"
          />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleSearch} disabled={row.status === 'loading'}>
          {row.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2">{t('card.search')}</span>
        </Button>
        <Button variant="destructive" onClick={handleRemove}>
          <Trash2 className="h-4 w-4" />
          <span className="ml-2">{t('card.remove')}</span>
        </Button>
      </CardFooter>
      {isModalOpen && row.searchResults && (
        <CardSelectionModal
          cards={row.searchResults}
          onCardSelect={handleCardSelect}
          onClose={() => setIsModalOpen(false)}
          query={row.query}
        />
      )}
       {isSearchSettingsOpen && (
        <ScryfallSearchModal
          options={row.scryfallSearchOptions || {}}
          onSave={handleSearchOptionsSave}
          onClose={() => setIsSearchSettingsOpen(false)}
        />
      )}
    </Card>
  );
}
