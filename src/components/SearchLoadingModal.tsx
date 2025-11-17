"use client";

import { useSearch } from "@/context/SearchContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "./ui/progress";

export default function SearchLoadingModal() {
  const { isSearching, providerId, progress } = useSearch();
  const { t } = useLanguage();

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

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
          {progress.total > 0 && (
            <DialogDescription className="space-y-2 pt-2">
              <div className="text-sm">
                {t('progress.searching', {
                  current: progress.current.toString(),
                  total: progress.total.toString()
                })}
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('progress.found', { found: progress.found.toString() })}
                </span>
                {progress.failed > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    {t('progress.failed', { failed: progress.failed.toString() })}
                  </span>
                )}
              </div>
            </DialogDescription>
          )}
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
