
"use client";

import { useCardContext } from "@/context/CardContext";
import type { NormalizedCard } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

const chunk = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export default function PrintView() {
  const [isClient, setIsClient] = useState(false);
  const { state } = useCardContext();
  const { t } = useLanguage();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const printableCards = useMemo(() => {
    if (!isClient) return [];
    const allCards: NormalizedCard[] = [];
    state.rows.forEach(row => {
      if (row.card) {
        for (let i = 0; i < row.quantity; i++) {
          allCards.push(row.card);
          if (row.card.is_dfc && row.card.image_uris.back) {
            // Add the back face as a separate "card" for printing
            const backFaceCard: NormalizedCard = {
              ...row.card,
              id: `${row.card.id}-back`,
              image_uris: {
                front: row.card.image_uris.back,
              },
              is_dfc: false, // Treat it as a single face for printing logic
            };
            allCards.push(backFaceCard);
          }
        }
      }
    });
    return allCards;
  }, [state.rows, isClient]);

  const pages = useMemo(() => chunk(printableCards, 9), [printableCards]);

  if (!isClient) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container bg-background text-foreground">
        <header className="non-printable sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="font-headline text-2xl font-bold text-primary">{t('printPreview.title')}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/"><ArrowLeft /> {t('printPreview.backToEditor')}</Link>
                    </Button>
                    <Button onClick={handlePrint}><Printer /> {t('printPreview.saveAsPdf')}</Button>
                </div>
            </div>
        </header>
      
      {pages.length === 0 ? (
        <div className="container mx-auto text-center py-20">
             <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold">{t('printPreview.noCardsTitle')}</h2>
                    <p className="text-muted-foreground mt-2">{t('printPreview.noCardsMessage')}</p>
                </CardContent>
            </Card>
        </div>
      ) : (
        <div className="card-grid-container">
            {pages.map((pageCards, pageIndex) => (
            <div key={pageIndex} className="print-page">
                <div className="card-grid">
                {pageCards.map((card, cardIndex) => (
                    <div key={`${card.id}-${cardIndex}`} className="card-item">
                    <Image
                        src={card.image_uris.front}
                        alt={card.name}
                        width={248}
                        height={346}
                        layout="responsive"
                        priority
                        data-ai-hint="card game"
                    />
                    </div>
                ))}
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
}
