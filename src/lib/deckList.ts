import type { ProviderId } from './types';

export interface ParsedDeckRow {
  quantity: number;
  providerId: ProviderId;
  name: string;
  set?: string;
  number?: string;
}

export interface ParseDeckListResult {
  rows: ParsedDeckRow[];
  skipped: number;
}

const QUANTITY_COLS = ['quantity', 'qty', 'count', 'copies', 'n'];
const NAME_COLS = ['name', 'card name', 'cardname', 'card'];
const SET_COLS = ['set', 'set code', 'setcode', 'code'];
const NUMBER_COLS = ['number', 'collector number', 'collector', 'num', '#'];
const GAME_COLS = ['game', 'provider'];

const GAME_ALIASES: Record<string, ProviderId> = {
  scryfall: 'scryfall',
  magic: 'scryfall',
  mtg: 'scryfall',
  'magic the gathering': 'scryfall',
  pokemon: 'pokemontcg',
  pokemontcg: 'pokemontcg',
  'pokemon tcg': 'pokemontcg',
  'pokémon': 'pokemontcg',
  'pokémon tcg': 'pokemontcg',
  yugioh: 'yugioh',
  ygo: 'yugioh',
  'yu-gi-oh': 'yugioh',
  'yu gi oh': 'yugioh',
};

const findColumnIndex = (header: string[], aliases: string[]): number =>
  header.findIndex(h => aliases.includes(h.trim().toLowerCase()));

export function parseDeckList(rows: unknown[][], defaultProviderId: ProviderId): ParseDeckListResult {
  const result: ParsedDeckRow[] = [];
  let skipped = 0;

  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const cells = Array.isArray(rows[i]) ? rows[i] : [];
    if (cells.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return { rows: [], skipped: 0 };

  const header = rows[headerIndex].map(cell => String(cell ?? '').trim().toLowerCase());
  const quantityIdx = findColumnIndex(header, QUANTITY_COLS);
  const nameIdx = findColumnIndex(header, NAME_COLS);
  const setIdx = findColumnIndex(header, SET_COLS);
  const numberIdx = findColumnIndex(header, NUMBER_COLS);
  const gameIdx = findColumnIndex(header, GAME_COLS);

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const cells = Array.isArray(rows[i]) ? rows[i] : [];
    const get = (idx: number) => (idx >= 0 && idx < cells.length ? String(cells[idx] ?? '').trim() : '');

    const name = get(nameIdx);
    if (!name) {
      skipped++;
      continue;
    }

    let providerId = defaultProviderId;
    const game = get(gameIdx).toLowerCase();
    if (game && GAME_ALIASES[game]) providerId = GAME_ALIASES[game];

    const qtyRaw = parseInt(get(quantityIdx), 10);
    const quantity = Number.isNaN(qtyRaw) || qtyRaw < 1 ? 1 : qtyRaw;

    const set = get(setIdx) || undefined;
    const number = get(numberIdx) || undefined;

    result.push({ quantity, providerId, name, set, number });
  }

  return { rows: result, skipped };
}
