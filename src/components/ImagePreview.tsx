"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface ImagePreviewProps {
  imageUrl: string;
  cardName: string;
  isOpen: boolean;
  onClose: () => void;
  backImageUrl?: string;
}

export default function ImagePreview({ imageUrl, cardName, isOpen, onClose, backImageUrl }: ImagePreviewProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t('imagePreview.close')}</span>
        </Button>
        <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
          <div className="relative">
            <Image
              src={imageUrl}
              alt={cardName}
              width={488}
              height={680}
              className="rounded-lg"
              data-ai-hint="card game"
            />
          </div>
          {backImageUrl && (
            <div className="relative">
              <Image
                src={backImageUrl}
                alt={`${cardName} (back)`}
                width={488}
                height={680}
                className="rounded-lg"
                data-ai-hint="card game"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
