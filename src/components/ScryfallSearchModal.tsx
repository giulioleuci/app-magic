
"use client";

import { useState } from "react";
import type { ScryfallSearchOptions } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

interface ScryfallSearchModalProps {
  options: ScryfallSearchOptions;
  onSave: (options: ScryfallSearchOptions) => void;
  onClose: () => void;
}

export default function ScryfallSearchModal({ options, onSave, onClose }: ScryfallSearchModalProps) {
  const { t } = useLanguage();
  const [currentOptions, setCurrentOptions] = useState<ScryfallSearchOptions>(options);
  const [newLegalityFormat, setNewLegalityFormat] = useState('');

  const handleSave = () => {
    onSave(currentOptions);
  };

  const addLegality = () => {
    if (newLegalityFormat && currentOptions.legalities && !currentOptions.legalities[newLegalityFormat]) {
      setCurrentOptions(prev => ({
        ...prev,
        legalities: {
          ...prev.legalities,
          [newLegalityFormat]: 'legal'
        }
      }));
      setNewLegalityFormat('');
    }
  };

  const removeLegality = (format: string) => {
    const newLegalities = {...currentOptions.legalities};
    delete newLegalities[format];
    setCurrentOptions(prev => ({...prev, legalities: newLegalities}));
  };

  const uniqueOptions = ['cards', 'art', 'prints'];
  const orderOptions = ['name', 'set', 'released', 'rarity', 'color', 'usd', 'tix', 'eur', 'cmc', 'power', 'toughness', 'edhrec', 'artist'];
  const dirOptions = ['auto', 'asc', 'desc'];
  const rarityOptions = ['common', 'uncommon', 'rare', 'mythic'];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('scryfallModal.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unique" className="text-right">{t('scryfallModal.unique')}</Label>
            <Select
              value={currentOptions.unique}
              onValueChange={(value) => setCurrentOptions(prev => ({...prev, unique: value as ScryfallSearchOptions['unique']}))}
            >
              <SelectTrigger id="unique" className="col-span-3">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {uniqueOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`scryfallModal.uniqueOptions.${opt}` as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order" className="text-right">{t('scryfallModal.order')}</Label>
            <Select
              value={currentOptions.order}
              onValueChange={(value) => setCurrentOptions(prev => ({...prev, order: value as ScryfallSearchOptions['order']}))}
            >
              <SelectTrigger id="order" className="col-span-3">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {orderOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`scryfallModal.orderOptions.${opt}` as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dir" className="text-right">{t('scryfallModal.dir')}</Label>
            <Select
              value={currentOptions.dir}
              onValueChange={(value) => setCurrentOptions(prev => ({...prev, dir: value as ScryfallSearchOptions['dir']}))}
            >
              <SelectTrigger id="dir" className="col-span-3">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {dirOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`scryfallModal.dirOptions.${opt}` as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type_line" className="text-right">{t('scryfallModal.type_line')}</Label>
            <Input id="type_line" value={currentOptions.type_line || ''} onChange={(e) => setCurrentOptions(prev => ({...prev, type_line: e.target.value}))} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="artist" className="text-right">{t('scryfallModal.artist')}</Label>
            <Input id="artist" value={currentOptions.artist || ''} onChange={(e) => setCurrentOptions(prev => ({...prev, artist: e.target.value}))} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rarity" className="text-right">{t('scryfallModal.rarity')}</Label>
            <Select
              value={currentOptions.rarity}
              onValueChange={(value) => setCurrentOptions(prev => ({...prev, rarity: value as ScryfallSearchOptions['rarity']}))}
            >
              <SelectTrigger id="rarity" className="col-span-3">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {rarityOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`scryfallModal.rarityOptions.${opt}` as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 justify-center">
            <Checkbox id="is_token" checked={currentOptions.is_token} onCheckedChange={(checked) => setCurrentOptions(prev => ({...prev, is_token: !!checked}))} />
            <Label htmlFor="is_token">{t('scryfallModal.is_token')}</Label>
          </div>

          <div className="flex items-center space-x-2 justify-center">
            <Checkbox id="foil" checked={currentOptions.foil} onCheckedChange={(checked) => setCurrentOptions(prev => ({...prev, foil: !!checked}))} />
            <Label htmlFor="foil">{t('scryfallModal.foil')}</Label>
          </div>

          <div>
            <Label>{t('scryfallModal.legalities')}</Label>
            {currentOptions.legalities && Object.entries(currentOptions.legalities).map(([format, legality]) => (
              <div key={format} className="grid grid-cols-3 items-center gap-2 mt-2">
                <Input value={format} readOnly className="col-span-1" />
                <Select
                  value={legality}
                  onValueChange={(value) => setCurrentOptions(prev => ({...prev, legalities: {...prev.legalities, [format]: value as 'legal' | 'not_legal'}}))}
                >
                  <SelectTrigger className="col-span-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">{t('scryfallModal.legal')}</SelectItem>
                    <SelectItem value="not_legal">{t('scryfallModal.not_legal')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="destructive" onClick={() => removeLegality(format)}>{t('scryfallModal.remove')}</Button>
              </div>
            ))}
            <div className="grid grid-cols-3 items-center gap-2 mt-2">
              <Input placeholder={t('scryfallModal.format')} value={newLegalityFormat} onChange={(e) => setNewLegalityFormat(e.target.value)} className="col-span-2" />
              <Button type="button" onClick={addLegality}>{t('scryfallModal.add')}</Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 justify-center">
            <Checkbox id="include_extras" checked={currentOptions.include_extras} onCheckedChange={(checked) => setCurrentOptions(prev => ({...prev, include_extras: !!checked}))} />
            <Label htmlFor="include_extras">{t('scryfallModal.include_extras')}</Label>
          </div>
          <div className="flex items-center space-x-2 justify-center">
            <Checkbox id="include_multilingual" checked={currentOptions.include_multilingual} onCheckedChange={(checked) => setCurrentOptions(prev => ({...prev, include_multilingual: !!checked}))} />
            <Label htmlFor="include_multilingual">{t('scryfallModal.include_multilingual')}</Label>
          </div>
          <div className="flex items-center space-x-2 justify-center">
            <Checkbox id="include_variations" checked={currentOptions.include_variations} onCheckedChange={(checked) => setCurrentOptions(prev => ({...prev, include_variations: !!checked}))} />
            <Label htmlFor="include_variations">{t('scryfallModal.include_variations')}</Label>
          </div>

        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>{t('scryfallModal.cancel')}</Button>
          <Button type="submit" onClick={handleSave}>{t('scryfallModal.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
