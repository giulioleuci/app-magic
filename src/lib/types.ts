
export type ProviderId = 'scryfall' | 'pokemontcg' | 'yugioh';

export interface Provider {
  id: ProviderId;
  name: string;
}

export interface ScryfallSearchOptions {
  unique?: 'cards' | 'art' | 'prints';
  order?: 'name' | 'set' | 'released' | 'rarity' | 'color' | 'usd' | 'tix' | 'eur' | 'cmc' | 'power' | 'toughness' | 'edhrec' | 'artist';
  dir?: 'auto' | 'asc' | 'desc';
  include_extras?: boolean;
  include_multilingual?: boolean;
  include_variations?: boolean;
  type_line?: string;
  is_token?: boolean;
  legalities?: { [key: string]: 'legal' | 'not_legal' };
  foil?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'mythic';
  artist?: string;
}

export interface PokemonTcgSearchOptions {
  order?: 'name' | 'set.releaseDate' | 'set.name' | 'number' | 'artist' | 'rarity' | 'nationalPokedexNumbers';
  dir?: 'asc' | 'desc';
}

export interface YuGiOhSearchOptions {}

export interface CardIdentifiers {
  name?: string;
  set?: string;     // set code (e.g. "WAR", "swsh12", "LOB-EN005")
  number?: string;  // collector number within set (e.g. "35", "125")
}

export interface NormalizedCard {
  id: string;
  name: string;
  set: string;
  setCode?: string;
  number?: string;
  artist: string;
  image_uris: {
    front: string;
    back?: string;
  };
  is_dfc: boolean;
  url: string;
}

export interface CardRow {
  id: string;
  query: string;
  quantity: number;
  providerId: ProviderId;
  card: NormalizedCard | null;
  searchResults?: NormalizedCard[] | null;
  identifiers?: CardIdentifiers;
  scryfallSearchOptions?: ScryfallSearchOptions;
  pokemonTcgSearchOptions?: PokemonTcgSearchOptions;
  yugiohSearchOptions?: YuGiOhSearchOptions;
  status: 'idle' | 'loading' | 'found' | 'error' | 'multiple';
  error?: string | null;
}
