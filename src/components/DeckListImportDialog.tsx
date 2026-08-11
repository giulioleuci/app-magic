"use client";

import { useRef, useState } from 'react';
import { useCardContext } from '@/context/CardContext';
import { useSearchRows } from '@/hooks/useSearchRows';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { availableProviders, defaultProviderId } from '@/api/providers';
import { parseDeckList, type ParsedDeckRow } from '@/lib/deckList';
import { generateId } from '@/lib/utils';
import type { CardRow, ProviderId } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Upload } from 'lucide-react';

interface DeckListImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeckListImportDialog({ isOpen, onClose }: DeckListImportDialogProps) {
  const { state, dispatch } = useCardContext();
  const { searchRows } = useSearchRows();
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [provider, setProvider] = useState<ProviderId>(
    state.rows[state.rows.length - 1]?.providerId || defaultProviderId
  );
  const [parsed, setParsed] = useState<ParsedDeckRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [parseError, setParseError] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(false);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 }) as unknown[][];
      const result = parseDeckList(aoa, provider);
      setParsed(result.rows);
      setSkipped(result.skipped);
    } catch {
      setParsed([]);
      setSkipped(0);
      setParseError(true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAdd = async () => {
    if (parsed.length === 0) return;
    const newRows: CardRow[] = parsed.map(row => ({
      id: generateId(),
      query: row.name,
      quantity: row.quantity,
      providerId: row.providerId,
      card: null,
      identifiers: { name: row.name, set: row.set, number: row.number },
      status: 'idle',
    }));
    dispatch({ type: 'APPEND_ROWS', payload: newRows });
    toast({
      title: t('toast.importDeckSuccess.title'),
      description: t('toast.importDeckSuccess.description', { count: String(newRows.length) }),
    });
    onClose();
    await searchRows(newRows);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('deckImport.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>{t('deckImport.selectProvider')}</Label>
            <RadioGroup value={provider} onValueChange={(v) => setProvider(v as ProviderId)} className="flex flex-wrap gap-4">
              {availableProviders.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <RadioGroupItem value={p.id} id={`import-${p.id}`} />
                  <Label htmlFor={`import-${p.id}`}>{t(`providers.${p.id}`)}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label>{t('deckImport.fileLabel')}</Label>
            <Input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
            {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
            {parseError && <p className="text-sm text-destructive">{t('deckImport.parseFailed')}</p>}
          </div>
        </div>
        {parsed.length > 0 && (
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-64 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('deckImport.colQty')}</TableHead>
                    <TableHead>{t('deckImport.colName')}</TableHead>
                    <TableHead>{t('deckImport.colSet')}</TableHead>
                    <TableHead>{t('deckImport.colNumber')}</TableHead>
                    <TableHead>{t('deckImport.colGame')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.set || ''}</TableCell>
                      <TableCell>{row.number || ''}</TableCell>
                      <TableCell>{t(`providers.${row.providerId}`)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <p className="text-sm text-muted-foreground mt-2">
              {t('deckImport.previewTitle', { count: String(parsed.length) })}
            </p>
            {skipped > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('deckImport.skipped', { count: String(skipped) })}
              </p>
            )}
          </div>
        )}
        {parsed.length === 0 && !parseError && fileName && (
          <p className="text-sm text-muted-foreground">{t('deckImport.noRows')}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>{t('deckImport.cancel')}</Button>
          <Button type="button" onClick={handleAdd} disabled={parsed.length === 0}>
            <Upload className="h-4 w-4 mr-2" />
            {t('deckImport.addCards', { count: String(parsed.length) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
