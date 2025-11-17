"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "./ui/button";
import { Filter, X } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";

export type FilterOptions = {
  provider?: 'scryfall' | 'pokemontcg' | null;
  status?: 'found' | 'idle' | 'error' | null;
};

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<FilterOptions>({});

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleProviderFilter = (provider: 'scryfall' | 'pokemontcg') => {
    updateFilters({
      ...filters,
      provider: filters.provider === provider ? null : provider,
    });
  };

  const toggleStatusFilter = (status: 'found' | 'idle' | 'error') => {
    updateFilters({
      ...filters,
      status: filters.status === status ? null : status,
    });
  };

  const clearFilters = () => {
    updateFilters({});
  };

  const hasActiveFilters = filters.provider || filters.status;
  const filterCount = (filters.provider ? 1 : 0) + (filters.status ? 1 : 0);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            {t('filters.title')}
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {filterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Provider</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.provider === 'scryfall'}
            onCheckedChange={() => toggleProviderFilter('scryfall')}
          >
            {t('filters.showScryfall')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.provider === 'pokemontcg'}
            onCheckedChange={() => toggleProviderFilter('pokemontcg')}
          >
            {t('filters.showPokemon')}
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.status === 'found'}
            onCheckedChange={() => toggleStatusFilter('found')}
          >
            {t('filters.showFound')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.status === 'error'}
            onCheckedChange={() => toggleStatusFilter('error')}
          >
            {t('filters.showNotFound')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.status === 'idle'}
            onCheckedChange={() => toggleStatusFilter('idle')}
          >
            {t('filters.showPending')}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          {t('filters.clear')}
        </Button>
      )}
    </div>
  );
}
