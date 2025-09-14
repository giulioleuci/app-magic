import type { Provider } from "@/lib/types";

export const availableProviders: Omit<Provider, 'name'>[] = [
  { id: 'scryfall' },
  { id: 'pokemontcg' },
];

export const defaultProviderId = availableProviders[0].id;
