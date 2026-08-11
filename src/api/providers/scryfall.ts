import type { ProviderDescriptor } from './index';
import type { CardIdentifiers, NormalizedCard, ScryfallSearchOptions } from '@/lib/types';
import { fetchWithRetry } from '@/lib/retry';
import { buildScryfallIdentifierQuery } from '@/lib/identifierQueries';

const normalizeScryfallData = (card: any): NormalizedCard => {
  const image_uris = card.image_uris || (card.card_faces && card.card_faces[0].image_uris);
  const back_image_uris = card.card_faces && card.card_faces.length > 1 ? card.card_faces[1].image_uris : null;

  return {
    id: card.id,
    name: card.name,
    set: card.set_name,
    setCode: card.set,
    number: card.collector_number,
    artist: card.artist,
    image_uris: {
      front: image_uris?.large || image_uris?.normal || '',
      back: back_image_uris?.large || back_image_uris?.normal,
    },
    is_dfc: !!back_image_uris,
    url: card.scryfall_uri,
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
    params.append('unique', 'prints');
    params.append('include_extras', 'true');
  }

  params.append('q', fullQuery);

  let response: Response;
  try {
    response = await fetchWithRetry(`https://api.scryfall.com/cards/search?${params.toString()}`, undefined, 2);
  } catch (error: any) {
    if (error?.status === 404) {
      console.warn(`Card "${query}" not found on Scryfall.`);
      return null;
    }
    throw error;
  }

  // Scryfall API has a rate limit, a small delay helps to avoid hitting it.
  await new Promise(resolve => setTimeout(resolve, 100));

  const searchData = await response.json();

  if (searchData && searchData.data && searchData.data.length > 0) {
    return searchData.data.map(normalizeScryfallData);
  }

  return null;
};

const searchScryfallByIdentifiers = async (identifiers: CardIdentifiers, options?: ScryfallSearchOptions): Promise<NormalizedCard[] | null> => {
  const query = buildScryfallIdentifierQuery(identifiers);
  if (!query) return null;
  return searchScryfall(query, options);
};

export const scryfallDescriptor: ProviderDescriptor<ScryfallSearchOptions> = {
  id: 'scryfall',
  uniqueFields: { name: true, set: true, number: true },
  defaultOptions: { unique: 'prints', include_extras: true },
  printSizeMm: { width: 63, height: 88 },
  search: searchScryfall,
  searchByIdentifiers: searchScryfallByIdentifiers,
};
