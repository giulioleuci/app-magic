
"use client";

import type { NormalizedCard } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import Image from "next/image";
import { ScrollArea } from "./ui/scroll-area";
import { Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useMemo, useState } from "react";
import { Input } from "./ui/input";

interface CardSelectionModalProps {
  cards: NormalizedCard[];
  onCardSelect: (card: NormalizedCard) => void;
  onClose: () => void;
  query: string;
}

export default function CardSelectionModal({ cards, onCardSelect, onClose, query }: CardSelectionModalProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("");

  const filteredCards = useMemo(() => {
    if (!filter) return cards;
    return cards.filter(card => 
        card.name.toLowerCase().includes(filter.toLowerCase()) ||
        card.set.toLowerCase().includes(filter.toLowerCase()) ||
        card.artist.toLowerCase().includes(filter.toLowerCase())
    );
  }, [cards, filter]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('modal.title', { query })}</DialogTitle>
        </DialogHeader>
        <div className="p-4 border-b">
            <Input 
                placeholder={t('modal.filterPlaceholder')}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
        </div>
        <ScrollArea className="flex-grow">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            {filteredCards.map((card) => (
                <div key={card.id} className="cursor-pointer group relative" onClick={() => onCardSelect(card)}>
                    <Image
                        src={card.image_uris.front}
                        alt={card.name}
                        width={248}
                        height={346}
                        className="rounded-lg w-full h-auto transition-transform transform group-hover:scale-105"
                        data-ai-hint="card game"
                    />
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="text-white text-center">
                            <p className="font-bold">{card.name}</p>
                            <p className="text-sm opacity-80">{card.set}</p>
                        </div>
                    </div>
                </div>
            ))}
            </div>
            {filteredCards.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    {t('modal.noFilterResults')}
                </div>
            )}
        </ScrollArea>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                    {t('modal.close')}
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
