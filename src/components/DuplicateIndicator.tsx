"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Copy } from "lucide-react";

interface DuplicateIndicatorProps {
  count: number;
}

export default function DuplicateIndicator({ count }: DuplicateIndicatorProps) {
  const { t } = useLanguage();

  if (count <= 1) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="ml-2 bg-yellow-500/20 text-yellow-600 border-yellow-600/30">
            <Copy className="h-3 w-3 mr-1" />
            {count}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('duplicates.tooltip', { count: count.toString() })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
