import type { NormalizedCard, PokemonTcgSearchOptions, ScryfallSearchOptions } from '@/lib/types';
import { fetchWithRetry } from '@/lib/retry';

const normalizeScryfallData = (card: any): NormalizedCard => {
    const image_uris = card.image_uris || (card.card_faces && card.card_faces[0].image_uris);
    const back_image_uris = card.card_faces && card.card_faces.length > 1 ? card.card_faces[1].image_uris : null;
    
    return {
      id: card.id,
      name: card.name,
      set: card.set_name,
      artist: card.artist,
      image_uris: {
        front: image_uris?.large || image_uris?.normal || '',
        back: back_image_uris?.large || back_image_uris?.normal,
      },
      is_dfc: !!back_image_uris,
      url: card.scryfall_uri,
    };
  };

const normalizePokemonTcgData = (card: any): NormalizedCard => {
  return {
    id: card.id,
    name: card.name,
    set: card.set.name,
    artist: card.artist,
    image_uris: {
      front: card.images.large,
    },
    is_dfc: false,
    url: '',
  };
};

const searchScryfall = async (query: string, options?: ScryfallSearchOptions): Promise<NormalizedCard[] | null> => {
  const params = new URLSearchParams();
  let fullQuery = query;

  if (options) {
    if (options.type_line) fullQuery += ` t:"${options.type_line}"`;
    if (options.is_token) fullQuery += ` is:token`;
    if (options.legalities) {
      for (const [format, legality] of Object.entries(options.legalities)) {
        if (legality === 'legal') fullQuery += ` f:${format}`;
        else fullQuery += ` -f:${format}`;
      }
    }
    if (options.foil) fullQuery += ` is:foil`;
    if (options.rarity) fullQuery += ` r:${options.rarity}`;
    if (options.artist) fullQuery += ` a:"${options.artist}"`;

    if (options.unique) params.append('unique', options.unique);
    if (options.order) params.append('order', options.order);
    if (options.dir) params.append('dir', options.dir);
    if (options.include_extras) params.append('include_extras', 'true');
    if (options.include_multilingual) params.append('include_multilingual', 'true');
    if (options.include_variations) params.append('include_variations', 'true');
  } else {
    // Default search behavior
    params.append('unique', 'prints');
    params.append('include_extras', 'true');
  }

  params.append('q', fullQuery);

  const response = await fetchWithRetry(`https://api.scryfall.com/cards/search?${params.toString()}`, undefined, 2);

  // Scryfall API has a rate limit, a small delay helps to avoid hitting it.
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`Card "${query}" not found on Scryfall.`);
      return null;
    }
    const errorData = await response.json();
    throw new Error(`Scryfall API error: ${errorData.details || response.statusText}`);
  }

  const searchData = await response.json();

  if (searchData && searchData.data && searchData.data.length > 0) {
    return searchData.data.map(normalizeScryfallData);
  }

  return null;
};

const searchPokemonTcg = async (query: string, options?: PokemonTcgSearchOptions): Promise<NormalizedCard[] | null> => {
    const params = new URLSearchParams();
    // PokemonTCG uses a query syntax, so we build it here.
    // We'll assume the query is just the card name for now.
    params.append('q', `name:"${query}"`);

    if (options?.order) {
        const direction = options.dir === 'desc' ? '-' : '';
        params.append('orderBy', `${direction}${options.order}`);
    }

    const response = await fetchWithRetry(`https://api.pokemontcg.io/v2/cards?${params.toString()}`, undefined, 2);

    if (!response.ok) {
        if (response.status === 404) {
            console.warn(`Card "${query}" not found on Pokemon TCG.`);
            return null;
        }
        const errorData = await response.json();
        throw new Error(`Pokemon TCG API error: ${errorData.error?.message || response.statusText}`);
    }

    const searchData = await response.json();

    if (searchData && searchData.data && searchData.data.length > 0) {
        return searchData.data.map(normalizePokemonTcgData);
    }

    return null;
}

interface SearchOptions {
    scryfall?: ScryfallSearchOptions;
    pokemontcg?: PokemonTcgSearchOptions;
}

export const useCardSearch = () => {
  const search = async (providerId: string, query: string, options?: SearchOptions): Promise<NormalizedCard[] | null> => {
    if (!query) return null;

    try {
      if (providerId === 'scryfall') {
        return await searchScryfall(query, options?.scryfall);
      } else if (providerId === 'pokemontcg') {
        return await searchPokemonTcg(query, options?.pokemontcg);
      } else {
        throw new Error(`Unknown provider: ${providerId}`);
      }
    } catch (error) {
        console.error(`Failed to fetch from ${providerId}`, error);
        // Let the caller handle the error state
        throw error;
    }
  };

  return { search };
};
