
"use client";

import { useState } from "react";
import type { ScryfallSearchOptions } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";

interface ScryfallSearchModalProps {
  options: ScryfallSearchOptions;
  onSave: (options: ScryfallSearchOptions) => void;
  onClose: () => void;
}

export default function ScryfallSearchModal({ options, onSave, onClose }: ScryfallSearchModalProps) {
  const { t } = useLanguage();
  const [currentOptions, setCurrentOptions] = useState<ScryfallSearchOptions>(options);

  const handleSave = () => {
    onSave(currentOptions);
  };

  const uniqueOptions = ['cards', 'art', 'prints'];
  const orderOptions = ['name', 'set', 'released', 'rarity', 'color', 'usd', 'tix', 'eur', 'cmc', 'power', 'toughness', 'edhrec', 'artist'];
  const dirOptions = ['auto', 'asc', 'desc'];

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
