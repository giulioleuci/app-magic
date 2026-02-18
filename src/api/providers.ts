import type { Provider, ProviderId } from "@/lib/types";

export const availableProviders: Pick<Provider, 'id'>[] = [
  { id: 'scryfall' },
  { id: 'pokemontcg' },
];

export const defaultProviderId = availableProviders[0].id;
