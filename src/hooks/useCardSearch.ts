import type { CardIdentifiers, NormalizedCard, PokemonTcgSearchOptions, ScryfallSearchOptions, YuGiOhSearchOptions } from '@/lib/types';
import { providerRegistry } from '@/api/providers';

interface SearchOptions {
    scryfall?: ScryfallSearchOptions;
    pokemontcg?: PokemonTcgSearchOptions;
    yugioh?: YuGiOhSearchOptions;
}

export const useCardSearch = () => {
  const search = async (
    providerId: string,
    query: string,
    options?: SearchOptions,
    identifiers?: CardIdentifiers
  ): Promise<NormalizedCard[] | null> => {
    if (!query) return null;

    const provider = providerRegistry[providerId as keyof typeof providerRegistry];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    const providerOptions = options?.[providerId as keyof SearchOptions];

    try {
      // Exact first: when identifying fields are present, try the identifier query.
      if (identifiers && (identifiers.set || identifiers.number)) {
        const exact = await provider.searchByIdentifiers(identifiers, providerOptions as any);
        if (exact && exact.length > 0) return exact;
      }
      // Fallback to name search.
      return await provider.search(query, providerOptions as any);
    } catch (error) {
        console.error(`Failed to fetch from ${providerId}`, error);
        throw error;
    }
  };

  return { search };
};
