
"use client";

import { useState } from "react";
import { useCardContext } from "@/context/CardContext";
import CardTable from "@/components/CardTable";
import AppHeader from "./AppHeader";
import CardList from "./CardList";
import SearchLoadingModal from "./SearchLoadingModal";
import FilterBar, { type FilterOptions } from "./FilterBar";
import MultiSelectToolbar from "./MultiSelectToolbar";

export default function AppClient() {
  const { state } = useCardContext();
  const [filters, setFilters] = useState<FilterOptions>({});

  const filteredRows = state.rows.filter(row => {
    if (filters.provider && row.providerId !== filters.provider) return false;
    if (filters.status && row.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <AppHeader />
      <SearchLoadingModal />
      <FilterBar onFilterChange={setFilters} />
      <MultiSelectToolbar />
      <div className="hidden md:block">
        <CardTable rows={filteredRows} />
      </div>
      <div className="block md:hidden">
        <CardList rows={filteredRows} />
      </div>
    </div>
  );
}
