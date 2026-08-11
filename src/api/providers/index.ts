import type { Provider } from '@/lib/types';
import type { CardIdentifiers, NormalizedCard, ProviderId } from '@/lib/types';
import { scryfallDescriptor } from './scryfall';
import { pokemonTcgDescriptor } from './pokemontcg';
import { yugiohDescriptor } from './yugioh';

export interface ProviderDescriptor<T = unknown> {
  id: ProviderId;
  uniqueFields: { name: boolean; set: boolean; number: boolean };
  defaultOptions: T;
  printSizeMm: { width: number; height: number };
  search: (query: string, options?: T) => Promise<NormalizedCard[] | null>;
  searchByIdentifiers: (identifiers: CardIdentifiers, options?: T) => Promise<NormalizedCard[] | null>;
}

export const providerRegistry: Record<ProviderId, ProviderDescriptor<any>> = {
  scryfall: scryfallDescriptor,
  pokemontcg: pokemonTcgDescriptor,
  yugioh: yugiohDescriptor,
};

export const availableProviders: Pick<Provider, 'id'>[] =
  Object.values(providerRegistry).map(p => ({ id: p.id }));

export const defaultProviderId: ProviderId = availableProviders[0].id;
