import type { CardIdentifiers } from './types';

export function buildScryfallIdentifierQuery(identifiers: CardIdentifiers): string {
  const parts: string[] = [];
  if (identifiers.name) parts.push(`!"${identifiers.name}"`);
  if (identifiers.set) parts.push(`set:${identifiers.set}`);
  if (identifiers.number) parts.push(`cn:${identifiers.number}`);
  return parts.join(' ');
}

export function buildPokemonIdentifierQuery(identifiers: CardIdentifiers, setField: 'id' | 'name'): string {
  const parts: string[] = [];
  if (identifiers.name) parts.push(`name:"${identifiers.name}"`);
  if (identifiers.set) parts.push(`set.${setField}:"${identifiers.set}"`);
  if (identifiers.number) parts.push(`number:"${identifiers.number}"`);
  return parts.join(' ');
}

export interface YuGiOhPrint {
  set_name: string;
  set_code: string;
}

export function matchYugiohPrint(card: any, set?: string): YuGiOhPrint | null {
  if (!set || !Array.isArray(card?.card_sets)) return null;
  const normalized = set.trim().toUpperCase();
  const match = card.card_sets.find(
    (s: any) => s?.set_code && String(s.set_code).trim().toUpperCase() === normalized
  );
  return match ? { set_name: match.set_name, set_code: match.set_code } : null;
}
