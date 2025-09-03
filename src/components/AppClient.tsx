
"use client";

import { useCardContext } from "@/context/CardContext";
import CardTable from "@/components/CardTable";
import AppHeader from "./AppHeader";
import CardList from "./CardList";

export default function AppClient() {
  const { state } = useCardContext();

  return (
    <div className="space-y-8">
      <AppHeader />
      <div className="hidden md:block">
        <CardTable rows={state.rows} />
      </div>
      <div className="block md:hidden">
        <CardList rows={state.rows} />
      </div>
    </div>
  );
}
