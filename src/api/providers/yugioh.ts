import type { ProviderDescriptor } from './index';
import type { CardIdentifiers, NormalizedCard, YuGiOhSearchOptions } from '@/lib/types';
import { fetchWithRetry } from '@/lib/retry';
import { matchYugiohPrint, type YuGiOhPrint } from '@/lib/identifierQueries';

const normalizeYugiohData = (card: any, matchedPrint?: YuGiOhPrint | null): NormalizedCard => {
  const print = matchedPrint || card?.card_sets?.[0] || null;
  return {
    id: String(card.id),
    name: card.name,
    set: print?.set_name || '',
    setCode: print?.set_code || '',
    artist: '',
    image_uris: { front: card?.card_images?.[0]?.image_url_cropped || '' },
    is_dfc: false,
    url: card.ygoprodeck_url,
  };
};

const fetchYugiohCards = async (params: URLSearchParams): Promise<any[] | null> => {
  let response: Response;
  try {
    response = await fetchWithRetry(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${params.toString()}`, undefined, 2);
  } catch (error: any) {
    // 400/404 both mean "no card matches" on this endpoint.
    if (error?.status === 400 || error?.status === 404) {
      return null;
    }
    throw error;
  }

  const searchData = await response.json();

  if (searchData && searchData.data && searchData.data.length > 0) {
    return searchData.data;
  }

  return null;
};

const searchYugioh = async (query: string, _options?: YuGiOhSearchOptions): Promise<NormalizedCard[] | null> => {
  const cards = await fetchYugiohCards(new URLSearchParams({ fname: query }));
  if (!cards) return null;
  return cards.map((card: any) => normalizeYugiohData(card));
};

const searchYugiohByIdentifiers = async (identifiers: CardIdentifiers, _options?: YuGiOhSearchOptions): Promise<NormalizedCard[] | null> => {
  if (!identifiers.name) return null;

  // YGOPRODeck cannot query set code + number directly. Search the exact name
  // (single card object), then match the set code against card_sets.
  const cards = await fetchYugiohCards(new URLSearchParams({ name: identifiers.name }));
  const card = cards?.[0];
  if (!card) return null;

  const print = matchYugiohPrint(card, identifiers.set);
  return [normalizeYugiohData(card, print)];
};

export const yugiohDescriptor: ProviderDescriptor<YuGiOhSearchOptions> = {
  id: 'yugioh',
  uniqueFields: { name: true, set: true, number: true },
  defaultOptions: {},
  printSizeMm: { width: 59, height: 86 },
  search: searchYugioh,
  searchByIdentifiers: searchYugiohByIdentifiers,
};
