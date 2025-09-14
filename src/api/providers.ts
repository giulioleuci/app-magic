
import type { Provider } from "@/lib/types";

export const availableProviders: Provider[] = [
  { id: 'scryfall', name: 'Scryfall' },
  { id: 'pokemontcg', name: 'Pokemon TCG' },
];

export const defaultProviderId = availableProviders[0].id;
