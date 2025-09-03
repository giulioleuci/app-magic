
"use client";
import { Plus, Search, FileDown, Printer, FileUp, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCardContext } from "@/context/CardContext";
import { useCardSearch } from "@/hooks/useCardSearch";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { CardRow, NormalizedCard } from "@/lib/types";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppHeader() {
  const { state, dispatch } = useCardContext();
  const { search } = useCardSearch();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, setLanguage, language } = useLanguage();

  const handleAddRow = () => {
    dispatch({ type: 'ADD_ROW' });
  };

  const handleSearchAll = async () => {
    toast({ title: t('toast.searchingAll.title'), description: t('toast.searchingAll.description') });
    const searchPromises = state.rows.map(async (row) => {
      if (row.query && row.status !== 'found') {
        dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'loading' } });
        try {
          const cardData = await search(row.query);
          if (cardData && cardData.length > 0) {
            dispatch({ type: 'SET_CARD_DATA', payload: { id: row.id, card: cardData[0], searchResults: cardData } });
          } else {
            dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: 'No cards found' } });
          }
        } catch (e) {
          dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: 'Failed to fetch' } });
        }
      }
    });
    
    try {
        await Promise.all(searchPromises);
        toast({ title: t('toast.searchComplete.title'), description: t('toast.searchComplete.description') });
    } catch {
        toast({ variant: "destructive", title: t('toast.searchFailed.title'), description: t('toast.searchFailed.description') });
    }
  };

  const handlePrint = () => {
    const cardsToPrint = state.rows.filter(row => row.card && row.quantity > 0);
    if (cardsToPrint.length === 0) {
      toast({
        variant: "destructive",
        title: t('toast.noCardsToPrint.title'),
        description: t('toast.noCardsToPrint.description'),
      });
      return;
    }
    router.push('/print');
  };

  const handleExport = () => {
    if (state.rows.length === 0) {
      toast({
        variant: 'destructive',
        title: t('toast.noCardsToExport.title'),
        description: t('toast.noCardsToExport.description'),
      });
      return;
    }

    const exportData = state.rows.map(({ query, quantity, providerId, card }) => ({
      query,
      quantity,
      providerId,
      cardId: card?.id || '',
      cardName: card?.name || '',
      cardSet: card?.set || '',
      cardArtist: card?.artist || '',
      cardImageFront: card?.image_uris.front || '',
      cardImageBack: card?.image_uris.back || '',
      cardIsDfc: card?.is_dfc || false,
      cardUrl: card?.url || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cards');
    XLSX.writeFile(workbook, 'proxyforge_export.xlsx');
    toast({
      title: t('toast.exportSuccess.title'),
      description: t('toast.exportSuccess.description'),
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedRows = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (Array.isArray(importedRows)) {
            const newRows: Partial<CardRow>[] = importedRows.map((r: any) => {
              let card: NormalizedCard | null = null;
              if (r.cardId) {
                card = {
                  id: r.cardId,
                  name: r.cardName,
                  set: r.cardSet,
                  artist: r.cardArtist,
                  image_uris: {
                    front: r.cardImageFront,
                    back: r.cardImageBack,
                  },
                  is_dfc: r.cardIsDfc,
                  url: r.cardUrl,
                }
              }

              return { 
                query: r.query, 
                quantity: r.quantity,
                providerId: r.providerId,
                card: card,
                status: card ? 'found' : 'idle',
              };
            });
            dispatch({ type: 'SET_ROWS', payload: newRows });
            toast({ title: t('toast.importSuccess.title'), description: t('toast.importSuccess.description') });
        } else {
            throw new Error("Invalid file format");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: t('toast.importFailed.title'),
          description: t('toast.importFailed.description'),
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };


  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
        ProxyForge Web
      </h1>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleAddRow}><Plus /> {t('header.addCard')}</Button>
        <Button onClick={handleSearchAll} variant="secondary"><Search /> {t('header.searchAll')}</Button>
        <Button onClick={handleImportClick} variant="secondary"><FileUp /> {t('header.import')}</Button>
        <Button onClick={handleExport} variant="secondary"><FileDown /> {t('header.export')}</Button>
        <Button onClick={handlePrint} variant="outline"><Printer /> {t('header.printPdf')}</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Languages />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setLanguage('en')} disabled={language === 'en'}>English</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLanguage('it')} disabled={language === 'it'}>Italiano</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
        />
      </div>
    </header>
  );
}

