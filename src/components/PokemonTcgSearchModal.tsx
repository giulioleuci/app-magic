"use client";

import { useState } from "react";
import type { PokemonTcgSearchOptions } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Info } from "lucide-react";

interface PokemonTcgSearchModalProps {
  options: PokemonTcgSearchOptions;
  onSave: (options: PokemonTcgSearchOptions) => void;
  onClose: () => void;
}

export default function PokemonTcgSearchModal({ options, onSave, onClose }: PokemonTcgSearchModalProps) {
  const { t } = useLanguage();
  const [currentOptions, setCurrentOptions] = useState<PokemonTcgSearchOptions>(options);

  const handleSave = () => {
    onSave(currentOptions);
  };

  const orderOptions = ['name', 'set.releaseDate', 'set.name', 'number', 'artist', 'rarity', 'nationalPokedexNumbers'];
  const dirOptions = ['asc', 'desc'];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pokemonTcgModal.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t('pokemonTcgModal.apiInfo.title')}</AlertTitle>
            <AlertDescription>
              {t('pokemonTcgModal.apiInfo.description')}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order" className="text-right">{t('pokemonTcgModal.order')}</Label>
            <Select
              value={currentOptions.order}
              onValueChange={(value: PokemonTcgSearchOptions['order']) => setCurrentOptions(prev => ({...prev, order: value}))}
            >
              <SelectTrigger id="order" className="col-span-3">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {orderOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`pokemonTcgModal.orderOptions.${opt}` as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dir" className="text-right">{t('pokemonTcgModal.dir')}</Label>
            <Select
              value={currentOptions.dir}
              onValueChange={(value: PokemonTcgSearchOptions['dir']) => setCurrentOptions(prev => ({...prev, dir: value}))}
            >
              <SelectTrigger id="dir" className="col-span-3">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {dirOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`pokemonTcgModal.dirOptions.${opt}` as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>{t('pokemonTcgModal.cancel')}</Button>
          <Button type="submit" onClick={handleSave}>{t('pokemonTcgModal.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
