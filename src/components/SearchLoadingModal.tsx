"use client";

import { useSearch } from "@/context/SearchContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Loader2 } from "lucide-react";

export default function SearchLoadingModal() {
  const { isSearching, providerId } = useSearch();
  const { t } = useLanguage();

  return (
    <Dialog open={isSearching}>
      <DialogContent
        className="sm:max-w-3xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="animate-spin" />
            <span>{t('toast.searchingAll.title')}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <Skeleton className="h-[240px] w-[170px] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        {providerId === 'pokemontcg' && (
          <Alert variant="destructive" className="bg-destructive text-destructive-foreground [&>svg]:text-destructive-foreground">
            <AlertTitle>{t('pokemonTcgModal.apiInfo.title')}</AlertTitle>
            <AlertDescription>
              {t('loadingModal.slowServiceWarning')}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
