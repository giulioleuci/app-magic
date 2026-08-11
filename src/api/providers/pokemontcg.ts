import type { ProviderDescriptor } from './index';
import type { CardIdentifiers, NormalizedCard, PokemonTcgSearchOptions } from '@/lib/types';
import { fetchWithRetry } from '@/lib/retry';
import { buildPokemonIdentifierQuery } from '@/lib/identifierQueries';

const normalizePokemonTcgData = (card: any): NormalizedCard => {
  return {
    id: card.id,
    name: card.name,
    set: card.set.name,
    setCode: card.set.id,
    number: card.number,
    artist: card.artist,
    image_uris: {
      front: card.images.large,
    },
    is_dfc: false,
    url: '',
  };
};

const fetchCards = async (q: string, options?: PokemonTcgSearchOptions): Promise<NormalizedCard[] | null> => {
  const params = new URLSearchParams();
  params.append('q', q);

  if (options?.order) {
    const direction = options.dir === 'desc' ? '-' : '';
    params.append('orderBy', `${direction}${options.order}`);
  }

  let response: Response;
  try {
    response = await fetchWithRetry(`https://api.pokemontcg.io/v2/cards?${params.toString()}`, undefined, 2);
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }

  const searchData = await response.json();

  if (searchData && searchData.data && searchData.data.length > 0) {
    return searchData.data.map(normalizePokemonTcgData);
  }

  return null;
};

const searchPokemonTcg = async (query: string, options?: PokemonTcgSearchOptions): Promise<NormalizedCard[] | null> => {
  return fetchCards(`name:"${query}"`, options);
};

const searchPokemonTcgByIdentifiers = async (identifiers: CardIdentifiers, options?: PokemonTcgSearchOptions): Promise<NormalizedCard[] | null> => {
  const queryById = buildPokemonIdentifierQuery(identifiers, 'id');
  if (!queryById) return null;

  const byId = await fetchCards(queryById, options);
  if (byId && byId.length > 0) return byId;

  // Some seller lists use set names instead of set ids; retry once with set.name.
  if (identifiers.set) {
    const byName = await fetchCards(buildPokemonIdentifierQuery(identifiers, 'name'), options);
    if (byName && byName.length > 0) return byName;
  }

  return null;
};

export const pokemonTcgDescriptor: ProviderDescriptor<PokemonTcgSearchOptions> = {
  id: 'pokemontcg',
  uniqueFields: { name: true, set: true, number: true },
  defaultOptions: {},
  printSizeMm: { width: 63, height: 88 },
  search: searchPokemonTcg,
  searchByIdentifiers: searchPokemonTcgByIdentifiers,
};
