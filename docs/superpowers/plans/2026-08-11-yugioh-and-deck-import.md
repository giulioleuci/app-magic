# Yu-Gi-Oh! Provider + Deck-List Import — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Yu-Gi-Oh! (YGOPRODeck API) as a third provider, and let users build decks by uploading CSV/XLSX deck lists that carry the per-game fields uniquely identifying each card (name + set + number) plus quantity.

**Architecture:** A light provider registry (`src/api/providers/index.ts`) where each game is a descriptor exposing `uniqueFields`, `printSizeMm`, name-search, and identifier-search. `useCardSearch` delegates to the registry with an "exact first, fallback to name" resolution rule. A pure `parseDeckList` module turns uploaded sheets into rows; a new dialog appends rows via a new `APPEND_ROWS` reducer action and auto-searches them through a shared `useSearchRows` hook.

**Tech Stack:** Next.js 15 (client-only), React Context + `useReducer`, YGOPRODeck API v7, SheetJS `xlsx`, node-assert tests via `npx tsx`.

## Global Constraints

- **Verification gate:** `npm run typecheck` — the plan assumes it passes at the end of every task. Never run `npm run lint` (interactive, no ESLint config).
- **Tests:** no runner; node-assert scripts executed with `npx tsx`. Tests must avoid network calls.
- **Static export:** `npm run build` produces `out/`; `GITHUB_ACTIONS=true` sets basePath `/app-magic`. Path-dependent behavior only — ignore for this plan.
- **CSP & images:** any new image host/API endpoint must be added to BOTH the CSP meta tag in `src/app/layout.tsx` AND `images.remotePatterns` in `next.config.ts` (see AGENTS.md gotcha).
- **i18n:** every new user-facing string must be added to BOTH `src/lib/i18n/en.ts` and `it.ts`. `t()` is typed against `en` (`TranslationKey = Paths<typeof en>`), so the `en` key must exist before any component references it, or typecheck fails.
- **NormalizedCard:** never drop `image_uris.back` / `is_dfc` — the print/back-face logic depends on them.
- **Undo/redo:** `SET_SEARCH_STATUS` / `SET_CARD_DATA` / `SET_SEARCH_RESULTS` must NOT write to history (existing intentional quirk). Mutating actions (ADD/REMOVE/UPDATE/SET_ROWS/APPEND_ROWS) DO.
- **`@/` path alias:** `tsx` resolves it fine (v4.23.12), so `@/lib/...` imports are safe in tests too.

---

### Task 1: Types (`CardIdentifiers`, `yugioh`, NormalizedCard fields)

**Files:**
- Modify: `src/lib/types.ts`

**Interfaces:**
- Produces: `ProviderId = 'scryfall' | 'pokemontcg' | 'yugioh'`; `CardIdentifiers`; `YuGiOhSearchOptions`; `NormalizedCard.setCode?` / `number?`; `CardRow.identifiers?` / `CardRow.yugiohSearchOptions?`.

- [ ] **Step 1: Edit `src/lib/types.ts`**

Change line 2 to:
```ts
export type ProviderId = 'scryfall' | 'pokemontcg' | 'yugioh';
```

Add after `PokemonTcgSearchOptions` (line 27):
```ts
export interface YuGiOhSearchOptions {}

export interface CardIdentifiers {
  name?: string;
  set?: string;     // set code (e.g. "WAR", "swsh12", "LOB-EN005")
  number?: string;  // collector number within set (e.g. "35", "125")
}
```

Add `setCode` / `number` to `NormalizedCard` (after `set`):
```ts
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
```

Add to `CardRow` (after `query`):
```ts
  identifiers?: CardIdentifiers;
```
and after `pokemonTcgSearchOptions`:
```ts
  yugiohSearchOptions?: YuGiOhSearchOptions;
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add yugioh provider id, card identifiers, and normalized card fields to types"
```

---

### Task 2: Identifier query builders + tests

**Files:**
- Create: `src/lib/identifierQueries.ts`
- Test: `src/lib/identifierQueries.test.ts`

**Interfaces:**
- Produces:
  - `buildScryfallIdentifierQuery(identifiers: CardIdentifiers): string`
  - `buildPokemonIdentifierQuery(identifiers: CardIdentifiers, setField: 'id' | 'name'): string`
  - `matchYugiohPrint(card: any, set?: string): { set_name: string; set_code: string } | null`
- Consumes: `CardIdentifiers` from Task 1.

- [ ] **Step 1: Write the failing test**

Create `src/lib/identifierQueries.test.ts`:
```ts
import assert from 'node:assert';
import { buildScryfallIdentifierQuery, buildPokemonIdentifierQuery, matchYugiohPrint } from './identifierQueries';

async function test() {
  console.log('Running tests for identifierQueries.ts...');

  // Scryfall: all fields
  assert.strictEqual(
    buildScryfallIdentifierQuery({ name: 'Lightning Bolt', set: 'WAR', number: '35' }),
    '!"Lightning Bolt" set:WAR cn:35',
    'Scryfall: all fields'
  );
  // Scryfall: no number
  assert.strictEqual(
    buildScryfallIdentifierQuery({ name: 'Lightning Bolt', set: 'WAR' }),
    '!"Lightning Bolt" set:WAR',
    'Scryfall: missing number'
  );
  // Scryfall: no set
  assert.strictEqual(
    buildScryfallIdentifierQuery({ name: 'Lightning Bolt', number: '35' }),
    '!"Lightning Bolt" cn:35',
    'Scryfall: missing set'
  );
  // Scryfall: empty
  assert.strictEqual(buildScryfallIdentifierQuery({}), '', 'Scryfall: empty identifiers');

  // Pokemon: set.id
  assert.strictEqual(
    buildPokemonIdentifierQuery({ name: 'Pikachu', set: 'swsh12', number: '25' }, 'id'),
    'name:"Pikachu" set.id:"swsh12" number:"25"',
    'Pokemon: set.id query'
  );
  // Pokemon: set.name
  assert.strictEqual(
    buildPokemonIdentifierQuery({ name: 'Pikachu', set: 'Sword & Shield' }, 'name'),
    'name:"Pikachu" set.name:"Sword & Shield"',
    'Pokemon: set.name query'
  );
  // Pokemon: name only
  assert.strictEqual(
    buildPokemonIdentifierQuery({ name: 'Pikachu' }, 'id'),
    'name:"Pikachu"',
    'Pokemon: name only'
  );

  // Yu-Gi-Oh: matching print (case-insensitive set code)
  const card = {
    card_sets: [
      { set_name: 'Metal Raiders', set_code: 'MRD-EN000' },
      { set_name: 'Legend of Blue Eyes White Dragon', set_code: 'LOB-EN005' },
    ],
  };
  const match = matchYugiohPrint(card, 'lob-en005');
  assert.ok(match, 'YGO: should match a print');
  assert.strictEqual(match?.set_code, 'LOB-EN005', 'YGO: matched set_code');
  assert.strictEqual(match?.set_name, 'Legend of Blue Eyes White Dragon', 'YGO: matched set_name');

  // Yu-Gi-Oh: no matching set code
  assert.strictEqual(matchYugiohPrint(card, 'SDY-046'), null, 'YGO: no matching print');

  // Yu-Gi-Oh: card without card_sets
  assert.strictEqual(matchYugiohPrint({ card_sets: [] }, 'LOB-EN005'), null, 'YGO: empty card_sets');
  assert.strictEqual(matchYugiohPrint({}, 'LOB-EN005'), null, 'YGO: missing card_sets');
  assert.strictEqual(matchYugiohPrint(card, undefined), null, 'YGO: no set provided');

  console.log('All identifierQueries tests passed!');
}

test().catch(err => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/lib/identifierQueries.test.ts`
Expected: FAIL with "Cannot find module './identifierQueries'".

- [ ] **Step 3: Write the implementation**

Create `src/lib/identifierQueries.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/lib/identifierQueries.test.ts`
Expected: PASS — "All identifierQueries tests passed!".

- [ ] **Step 5: Commit**

```bash
git add src/lib/identifierQueries.ts src/lib/identifierQueries.test.ts
git commit -m "feat: add per-provider identifier query builders with tests"
```

---

### Task 3: Provider registry + Yu-Gi-Oh! descriptor + useCardSearch rewrite

**Files:**
- Create: `src/api/providers/scryfall.ts`, `src/api/providers/pokemontcg.ts`, `src/api/providers/yugioh.ts`, `src/api/providers/index.ts`
- Delete: `src/api/providers.ts`
- Rewrite: `src/hooks/useCardSearch.ts`
- Modify: `src/components/CardRow.tsx` (options object + pass identifiers), `src/components/CardItem.tsx` (same)
- Modify: `src/app/layout.tsx` (CSP), `next.config.ts` (remotePatterns)
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/it.ts` (`providers.yugioh`)

**Interfaces:**
- Consumes: Task 1 types; Task 2 `buildScryfallIdentifierQuery`, `buildPokemonIdentifierQuery`, `matchYugiohPrint`.
- Produces:
  - `ProviderDescriptor<T>` interface, `providerRegistry: Record<ProviderId, ProviderDescriptor<any>>`, `availableProviders: Pick<Provider,'id'>[]`, `defaultProviderId: ProviderId` — all exported from `@/api/providers` (now `src/api/providers/index.ts`).
  - `useCardSearch.search(providerId: string, query: string, options?: SearchOptions, identifiers?: CardIdentifiers): Promise<NormalizedCard[] | null>` where `SearchOptions` includes `yugioh?: YuGiOhSearchOptions`.

- [ ] **Step 1: Create `src/api/providers/scryfall.ts`**

Move the Scryfall logic out of `useCardSearch.ts` and add identifier search + `setCode`/`number`:
```ts
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
```

- [ ] **Step 2: Create `src/api/providers/pokemontcg.ts`**

```ts
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

  const response = await fetchWithRetry(`https://api.pokemontcg.io/v2/cards?${params.toString()}`, undefined, 2);

  if (!response.ok) {
    if (response.status === 404) {
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
```

- [ ] **Step 3: Create `src/api/providers/yugioh.ts`**

```ts
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
  const response = await fetchWithRetry(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${params.toString()}`, undefined, 2);

  if (!response.ok) {
    // 400/404 both mean "no card matches" on this endpoint.
    if (response.status === 400 || response.status === 404) {
      return null;
    }
    throw new Error(`YGOPRODeck API error: ${response.statusText}`);
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
```

- [ ] **Step 4: Create `src/api/providers/index.ts` and delete `src/api/providers.ts`**

```ts
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
```

Then delete the old file:
```bash
rm src/api/providers.ts
```

- [ ] **Step 5: Rewrite `src/hooks/useCardSearch.ts`**

Replace the entire file with:
```ts
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
```

- [ ] **Step 6: Pass identifiers + yugioh options in `CardRow.tsx` and `CardItem.tsx`**

In both files, in `handleSearch`, replace the options object construction (currently `{ scryfall: ..., pokemontcg: ... }`) with:
```ts
      const options = {
        scryfall: row.scryfallSearchOptions,
        pokemontcg: row.pokemonTcgSearchOptions,
        yugioh: row.yugiohSearchOptions,
      };
```
and replace the search call
```ts
      const searchResults = await search(row.providerId, row.query, options);
```
with
```ts
      const searchResults = await search(row.providerId, row.query, options, row.identifiers);
```

- [ ] **Step 7: Update CSP and `next.config.ts`**

In `src/app/layout.tsx`, change the CSP lines (add YGO hosts):
```ts
    img-src 'self' blob: data: https://cards.scryfall.io https://placehold.co https://picsum.photos https://images.pokemontcg.io https://images.ygoprodeck.com;
    connect-src 'self' https://api.scryfall.com https://api.pokemontcg.io https://db.ygoprodeck.com https://cards.scryfall.io https://images.pokemontcg.io https://images.ygoprodeck.com https://placehold.co https://picsum.photos;
```

In `next.config.ts`, add to `images.remotePatterns`:
```ts
      {
        protocol: 'https',
        hostname: 'images.ygoprodeck.com',
        port: '',
        pathname: '/**',
      }
```

- [ ] **Step 8: Add `providers.yugioh` to i18n (both files)**

In `src/lib/i18n/en.ts`, change `providers` to:
```ts
  providers: {
    scryfall: 'Scryfall',
    pokemontcg: 'Pokemon TCG',
    yugioh: 'Yu-Gi-Oh!',
  },
```
In `src/lib/i18n/it.ts`, change `providers` to:
```ts
  providers: {
    scryfall: 'Scryfall',
    pokemontcg: 'Pokemon TCG',
    yugioh: 'Yu-Gi-Oh!',
  },
```

- [ ] **Step 9: Verify typecheck + build**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run build`
Expected: static export completes; `out/` produced.

- [ ] **Step 10: Run existing tests**

Run:
```bash
npx tsx src/context/cardReducer.test.ts
npx tsx src/lib/retry.test.ts
```
Expected: both PASS (cardReducer test imports `../api/providers`, which now resolves to `src/api/providers/index.ts`).

- [ ] **Step 11: Commit**

```bash
git add src/api/providers src/hooks/useCardSearch.ts src/components/CardRow.tsx src/components/CardItem.tsx src/app/layout.tsx next.config.ts src/lib/i18n/en.ts src/lib/i18n/it.ts
git commit -m "feat: add provider registry with Yu-Gi-Oh! (YGOPRODeck) provider"
```

---

### Task 4: `APPEND_ROWS` reducer action + tests

**Files:**
- Modify: `src/context/CardContext.tsx`, `src/lib/utils.ts`
- Test: `src/context/cardReducer.test.ts`

**Interfaces:**
- Consumes: Task 1 `CardRow` changes.
- Produces:
  - `generateId: () => string` exported from `@/lib/utils`.
  - New action `{ type: 'APPEND_ROWS'; payload: Partial<CardRow>[] }` (appends, writes history, preserves provided ids).
  - `SET_ROWS` now also preserves `identifiers`, `pokemonTcgSearchOptions`, `yugiohSearchOptions`.

- [ ] **Step 1: Move `generateId` to `src/lib/utils.ts`**

Add to `src/lib/utils.ts`:
```ts
export const generateId = () => `row-${Date.now()}-${Math.random()}`;
```

In `src/context/CardContext.tsx`, delete the local definition (`const generateId = () => \`row-${Date.now()}-${Math.random()}\`;`) and import it:
```ts
import { generateId } from '@/lib/utils';
```

- [ ] **Step 2: Add the `APPEND_ROWS` action type + `SET_ROWS` preservation**

In `CardContext.tsx`, add to the `Action` union:
```ts
  | { type: 'APPEND_ROWS'; payload: Partial<CardRow>[] }
```

In `ADD_ROW`, add `yugiohSearchOptions` to the new row (after `pokemonTcgSearchOptions: {},`):
```ts
        yugiohSearchOptions: {},
```

Replace the `SET_ROWS` case with:
```ts
    case 'SET_ROWS':
      const newRows: CardRow[] = action.payload.map(item => ({
        id: generateId(),
        query: item.query || '',
        quantity: item.quantity || 1,
        providerId: item.providerId || defaultProviderId,
        card: item.card || null,
        identifiers: item.identifiers,
        scryfallSearchOptions: item.scryfallSearchOptions || { unique: 'prints', include_extras: true },
        pokemonTcgSearchOptions: item.pokemonTcgSearchOptions || {},
        yugiohSearchOptions: item.yugiohSearchOptions || {},
        status: item.status || 'idle',
        error: item.error,
      }));
      return addToHistory(state, newRows);

    case 'APPEND_ROWS':
      const appendedRows: CardRow[] = action.payload.map(item => ({
        id: item.id || generateId(),
        query: item.query || '',
        quantity: item.quantity || 1,
        providerId: item.providerId || defaultProviderId,
        card: item.card || null,
        identifiers: item.identifiers,
        scryfallSearchOptions: item.scryfallSearchOptions || { unique: 'prints', include_extras: true },
        pokemonTcgSearchOptions: item.pokemonTcgSearchOptions || {},
        yugiohSearchOptions: item.yugiohSearchOptions || {},
        status: item.status || 'idle',
        error: item.error,
      }));
      return addToHistory(state, [...state.rows, ...appendedRows]);
```

- [ ] **Step 3: Add tests for `APPEND_ROWS` and `SET_ROWS` identifiers**

In `src/context/cardReducer.test.ts`, after the existing REDO test block (just before `console.log('All cardReducer tests passed!')`), insert:

```ts
  // Test SET_ROWS preserves identifiers
  state = cardReducer(state, { type: 'SET_ROWS', payload: [{ query: 'Pikachu', identifiers: { name: 'Pikachu', set: 'swsh12', number: '25' } }] });
  assert.deepStrictEqual(state.rows[0].identifiers, { name: 'Pikachu', set: 'swsh12', number: '25' }, 'SET_ROWS should preserve identifiers');

  // Test APPEND_ROWS appends to the end and preserves ids
  const firstAppend: Partial<CardRow>[] = [{ id: 'custom-id-1', query: 'Lightning Bolt', quantity: 4, providerId: 'scryfall', identifiers: { name: 'Lightning Bolt', set: 'WAR', number: '35' } }];
  state = cardReducer(state, { type: 'APPEND_ROWS', payload: firstAppend });
  assert.strictEqual(state.rows.length, 2, 'APPEND_ROWS should append rows');
  assert.strictEqual(state.rows[1].id, 'custom-id-1', 'APPEND_ROWS should keep provided ids');
  assert.deepStrictEqual(state.rows[1].identifiers, { name: 'Lightning Bolt', set: 'WAR', number: '35' }, 'APPEND_ROWS should preserve identifiers');

  // Test APPEND_ROWS generates ids when missing and adds history
  const historyBeforeAppend = state.history.length;
  state = cardReducer(state, { type: 'APPEND_ROWS', payload: [{ query: 'Blue-Eyes White Dragon', providerId: 'yugioh' }] });
  assert.strictEqual(state.rows.length, 3, 'APPEND_ROWS should append second batch');
  assert.ok(state.rows[2].id.startsWith('row-'), 'APPEND_ROWS should generate an id when missing');
  assert.strictEqual(state.rows[2].providerId, 'yugioh', 'APPEND_ROWS should set providerId');
  assert.strictEqual(state.rows[2].quantity, 1, 'APPEND_ROWS should default quantity to 1');
  assert.strictEqual(state.history.length, historyBeforeAppend + 1, 'APPEND_ROWS should add to history');
```

You will also need to import `CardRow` in the test file. Add to the imports at the top:
```ts
import type { CardRow } from '../lib/types';
```

- [ ] **Step 4: Run tests**

Run: `npx tsx src/context/cardReducer.test.ts`
Expected: PASS — "All cardReducer tests passed!".

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/context/CardContext.tsx src/context/cardReducer.test.ts src/lib/utils.ts
git commit -m "feat: add APPEND_ROWS reducer action for deck list import"
```

---

### Task 5: Deck list parser + tests

**Files:**
- Create: `src/lib/deckList.ts`
- Test: `src/lib/deckList.test.ts`

**Interfaces:**
- Consumes: Task 1 `ProviderId`.
- Produces:
  - `ParsedDeckRow { quantity: number; providerId: ProviderId; name: string; set?: string; number?: string }`
  - `ParseDeckListResult { rows: ParsedDeckRow[]; skipped: number }`
  - `parseDeckList(rows: unknown[][], defaultProviderId: ProviderId): ParseDeckListResult`

- [ ] **Step 1: Write the failing test**

Create `src/lib/deckList.test.ts`:
```ts
import assert from 'node:assert';
import { parseDeckList } from './deckList';

async function test() {
  console.log('Running tests for deckList.ts...');

  // Standard header
  let result = parseDeckList(
    [
      ['quantity', 'name', 'set', 'number'],
      ['4', 'Lightning Bolt', 'WAR', '35'],
      ['2', 'Pikachu', 'swsh12', '25'],
    ],
    'scryfall'
  );
  assert.strictEqual(result.rows.length, 2, 'should parse two rows');
  assert.deepStrictEqual(result.rows[0], { quantity: 4, providerId: 'scryfall', name: 'Lightning Bolt', set: 'WAR', number: '35' });
  assert.strictEqual(result.skipped, 0);

  // Header synonyms
  result = parseDeckList(
    [
      ['Qty', 'Card Name', 'Set Code', 'Collector #'],
      ['3', 'Dark Magician', 'LOB-EN005', ''],
    ],
    'yugioh'
  );
  assert.strictEqual(result.rows.length, 1, 'should recognize synonym headers');
  assert.deepStrictEqual(result.rows[0], { quantity: 3, providerId: 'yugioh', name: 'Dark Magician', set: 'LOB-EN005', number: undefined });

  // Game column overrides default provider
  result = parseDeckList(
    [
      ['qty', 'name', 'game'],
      ['1', 'Lightning Bolt', 'MTG'],
      ['1', 'Charizard', 'pokemon'],
      ['1', 'Blue-Eyes White Dragon', 'YGO'],
      ['1', 'No Game Column', ''],
    ],
    'scryfall'
  );
  assert.strictEqual(result.rows[0].providerId, 'scryfall', 'MTG maps to scryfall');
  assert.strictEqual(result.rows[1].providerId, 'pokemontcg', 'pokemon maps to pokemontcg');
  assert.strictEqual(result.rows[2].providerId, 'yugioh', 'YGO maps to yugioh');
  assert.strictEqual(result.rows[3].providerId, 'scryfall', 'unknown game falls back to default');

  // Quantity defaulting
  result = parseDeckList(
    [
      ['name', 'qty'],
      ['Pikachu', ''],
      ['Charizard', 'abc'],
      ['Blastoise', '0'],
      ['Bulbasaur', '-3'],
    ],
    'scryfall'
  );
  for (const row of result.rows) {
    assert.strictEqual(row.quantity, 1, `invalid qty "${row.name}" should default to 1`);
  }

  // Empty rows and rows without a name are skipped + counted
  result = parseDeckList(
    [
      ['name', 'qty'],
      ['Pikachu', '1'],
      ['', '2'],
      [],
      ['   ', '3'],
    ],
    'scryfall'
  );
  assert.strictEqual(result.rows.length, 1, 'only rows with a name are kept');
  assert.strictEqual(result.skipped, 3, 'empty rows counted as skipped');

  // No header row
  result = parseDeckList([], 'scryfall');
  assert.strictEqual(result.rows.length, 0, 'empty sheet returns no rows');

  console.log('All deckList tests passed!');
}

test().catch(err => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/lib/deckList.test.ts`
Expected: FAIL with "Cannot find module './deckList'".

- [ ] **Step 3: Write the implementation**

Create `src/lib/deckList.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/lib/deckList.test.ts`
Expected: PASS — "All deckList tests passed!".

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/lib/deckList.ts src/lib/deckList.test.ts
git commit -m "feat: add deck list CSV/XLSX parser"
```

---

### Task 6: `useSearchRows` hook + AppHeader "Search All" refactor

**Files:**
- Create: `src/hooks/useSearchRows.ts`
- Modify: `src/components/AppHeader.tsx`

**Interfaces:**
- Consumes: Task 3 `useCardSearch.search(providerId, query, options, identifiers)`; `CardRow` fields from Task 1.
- Produces: `useSearchRows() → { searchRows(rows: CardRow[]): Promise<void> }` — runs the concurrency-limited search loop (progress modal, per-row dispatch, found/failed counting) with exact-first identifier resolution.

- [ ] **Step 1: Create `src/hooks/useSearchRows.ts`**

```ts
"use client";

import { useCardContext } from '@/context/CardContext';
import { useCardSearch } from '@/hooks/useCardSearch';
import { useSearch } from '@/context/SearchContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { limitConcurrency } from '@/lib/utils';
import type { CardRow } from '@/lib/types';

export const useSearchRows = () => {
  const { dispatch } = useCardContext();
  const { search } = useCardSearch();
  const { setIsSearching, setProviderId, setProgress, updateProgress } = useSearch();
  const { t } = useLanguage();
  const { toast } = useToast();

  const searchRows = async (rows: CardRow[]): Promise<void> => {
    if (rows.length === 0) return;

    if (rows.some(row => row.providerId === 'pokemontcg')) {
      setProviderId('pokemontcg');
    } else {
      setProviderId('');
    }

    setProgress({ current: 0, total: rows.length, found: 0, failed: 0 });
    setIsSearching(true);
    toast({ title: t('toast.searchingAll.title'), description: t('toast.searchingAll.description') });

    try {
      await limitConcurrency(rows, 5, async (row) => {
        dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'loading' } });
        try {
          const options = {
            scryfall: row.scryfallSearchOptions,
            pokemontcg: row.pokemonTcgSearchOptions,
            yugioh: row.yugiohSearchOptions,
          };
          const cardData = await search(row.providerId, row.query, options, row.identifiers);
          if (cardData && cardData.length > 0) {
            dispatch({ type: 'SET_CARD_DATA', payload: { id: row.id, card: cardData[0], searchResults: cardData } });
            updateProgress({ found: 1 });
          } else {
            dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: t('card.notFound') } });
            updateProgress({ failed: 1 });
          }
        } catch {
          dispatch({ type: 'SET_SEARCH_STATUS', payload: { id: row.id, status: 'error', error: t('card.fetchError') } });
          updateProgress({ failed: 1 });
        }
      });

      toast({ title: t('toast.searchComplete.title'), description: t('toast.searchComplete.description') });
    } catch {
      toast({ variant: 'destructive', title: t('toast.searchFailed.title'), description: t('toast.searchFailed.description') });
    } finally {
      setIsSearching(false);
    }
  };

  return { searchRows };
};
```

- [ ] **Step 2: Refactor `AppHeader.tsx`**

1. Add import: `import { useSearchRows } from "@/hooks/useSearchRows";`
2. In the component body, replace the destructures:
   - Remove `const { search } = useCardSearch();`
   - Remove `const { setIsSearching, setProviderId, setProgress, updateProgress } = useSearch();`
   - Remove `import { useSearch } from "@/context/SearchContext";`
   - Remove `import { useCardSearch } from "@/hooks/useCardSearch";`
   - Remove `import { limitConcurrency } from "@/lib/utils";`
   - Add `const { searchRows } = useSearchRows();`
3. Replace the whole `handleSearchAll` body with:
```ts
  const handleSearchAll = async () => {
    const rowsToSearch = state.rows.filter(row => row.query && row.status !== 'found');
    if (rowsToSearch.length === 0) return;
    await searchRows(rowsToSearch);
    setShowSuccess(true);
  };
```
4. Keep `import type { CardRow, NormalizedCard } from "@/lib/types";` — `CardRow` is still used by `handleExport`'s map and the import callback.

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS. If `CardRow` import is now unused, remove it from the type import.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSearchRows.ts src/components/AppHeader.tsx
git commit -m "refactor: extract shared useSearchRows hook for batch card search"
```

---

### Task 7: i18n keys + FilterBar Yu-Gi-Oh! filter

**Files:**
- Modify: `src/lib/i18n/en.ts`, `src/lib/i18n/it.ts`
- Modify: `src/components/FilterBar.tsx`

**Interfaces:**
- Consumes: Task 3 `providers.yugioh`.
- Produces: `header.importDeck`, `filters.showYuGiOh`, `deckImport.*`, `toast.importDeckSuccess.*` translation keys; `FilterOptions.provider` includes `'yugioh'`.

- [ ] **Step 1: Add keys to `en.ts`**

In `header`, add after `import`/`export`:
```ts
    importDeck: 'Import Deck List',
```
In `filters`, add after `showPokemon`:
```ts
    showYuGiOh: 'Yu-Gi-Oh!',
```
Add a new top-level section (after `pokemonTcgModal` block, before `printPreview`):
```ts
  deckImport: {
    title: 'Import Deck List',
    selectProvider: 'Game',
    fileLabel: 'Choose a .csv or .xlsx file',
    parseFailed: 'Could not read this file. Please use a .csv or .xlsx file.',
    noRows: 'No usable rows found in this file.',
    previewTitle: 'Parsed rows ({count})',
    colGame: 'Game',
    colQty: 'Qty',
    colName: 'Name',
    colSet: 'Set',
    colNumber: 'Number',
    skipped: '{count} empty or invalid rows skipped',
    addCards: 'Add {count} cards',
    cancel: 'Cancel',
  },
```
In `toast`, add after `importFailed`:
```ts
    importDeckSuccess: {
      title: 'Deck imported',
      description: '{count} cards added to the list.',
    },
```

- [ ] **Step 2: Add keys to `it.ts`**

In `header`, add:
```ts
    importDeck: 'Importa Lista Deck',
```
In `filters`, add after `showPokemon`:
```ts
    showYuGiOh: 'Yu-Gi-Oh!',
```
Add a new top-level section (after `pokemonTcgModal` block, before `printPreview`):
```ts
  deckImport: {
    title: 'Importa Lista Deck',
    selectProvider: 'Gioco',
    fileLabel: 'Scegli un file .csv o .xlsx',
    parseFailed: 'Impossibile leggere questo file. Usa un file .csv o .xlsx.',
    noRows: 'Nessuna riga utilizzabile trovata in questo file.',
    previewTitle: 'Righe analizzate ({count})',
    colGame: 'Gioco',
    colQty: 'Q.tà',
    colName: 'Nome',
    colSet: 'Set',
    colNumber: 'Numero',
    skipped: '{count} righe vuote o non valide saltate',
    addCards: 'Aggiungi {count} carte',
    cancel: 'Annulla',
  },
```
In `toast`, add after `importFailed`:
```ts
    importDeckSuccess: {
      title: 'Deck importato',
      description: '{count} carte aggiunte alla lista.',
    },
```

- [ ] **Step 3: Add Yu-Gi-Oh! to `FilterBar.tsx`**

Change the `FilterOptions` type:
```ts
export type FilterOptions = {
  provider?: 'scryfall' | 'pokemontcg' | 'yugioh' | null;
  status?: 'found' | 'idle' | 'error' | null;
};
```
Change `toggleProviderFilter` signature:
```ts
  const toggleProviderFilter = (provider: 'scryfall' | 'pokemontcg' | 'yugioh') => {
```
After the Pokémon checkbox item, add:
```tsx
          <DropdownMenuCheckboxItem
            checked={filters.provider === 'yugioh'}
            onCheckedChange={() => toggleProviderFilter('yugioh')}
          >
            {t('filters.showYuGiOh')}
          </DropdownMenuCheckboxItem>
```

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/en.ts src/lib/i18n/it.ts src/components/FilterBar.tsx
git commit -m "feat: add deck import i18n keys and Yu-Gi-Oh! filter"
```

---

### Task 8: Deck list import dialog + header button

**Files:**
- Create: `src/components/DeckListImportDialog.tsx`
- Modify: `src/components/AppHeader.tsx`

**Interfaces:**
- Consumes: Task 4 `APPEND_ROWS`, Task 5 `parseDeckList`, Task 6 `useSearchRows`, Task 7 i18n keys, `generateId` from `@/lib/utils`.
- Produces: `DeckListImportDialog` component (props `{ isOpen: boolean; onClose: () => void }`) and the header "Import Deck List" button.

- [ ] **Step 1: Create `src/components/DeckListImportDialog.tsx`**

```tsx
"use client";

import { useRef, useState } from 'react';
import { useCardContext } from '@/context/CardContext';
import { useSearchRows } from '@/hooks/useSearchRows';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { availableProviders, defaultProviderId } from '@/api/providers';
import { parseDeckList, type ParsedDeckRow } from '@/lib/deckList';
import { generateId } from '@/lib/utils';
import type { CardRow, ProviderId } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Upload } from 'lucide-react';

interface DeckListImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeckListImportDialog({ isOpen, onClose }: DeckListImportDialogProps) {
  const { state, dispatch } = useCardContext();
  const { searchRows } = useSearchRows();
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [provider, setProvider] = useState<ProviderId>(
    state.rows[state.rows.length - 1]?.providerId || defaultProviderId
  );
  const [parsed, setParsed] = useState<ParsedDeckRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [parseError, setParseError] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(false);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 }) as unknown[][];
      const result = parseDeckList(aoa, provider);
      setParsed(result.rows);
      setSkipped(result.skipped);
    } catch {
      setParsed([]);
      setSkipped(0);
      setParseError(true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAdd = async () => {
    if (parsed.length === 0) return;
    const newRows: CardRow[] = parsed.map(row => ({
      id: generateId(),
      query: row.name,
      quantity: row.quantity,
      providerId: row.providerId,
      card: null,
      identifiers: { name: row.name, set: row.set, number: row.number },
      status: 'idle',
    }));
    dispatch({ type: 'APPEND_ROWS', payload: newRows });
    toast({
      title: t('toast.importDeckSuccess.title'),
      description: t('toast.importDeckSuccess.description', { count: String(newRows.length) }),
    });
    onClose();
    await searchRows(newRows);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('deckImport.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>{t('deckImport.selectProvider')}</Label>
            <RadioGroup value={provider} onValueChange={(v) => setProvider(v as ProviderId)} className="flex flex-wrap gap-4">
              {availableProviders.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <RadioGroupItem value={p.id} id={`import-${p.id}`} />
                  <Label htmlFor={`import-${p.id}`}>{t(`providers.${p.id}`)}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label>{t('deckImport.fileLabel')}</Label>
            <Input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
            {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
            {parseError && <p className="text-sm text-destructive">{t('deckImport.parseFailed')}</p>}
          </div>
        </div>
        {parsed.length > 0 && (
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-64 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('deckImport.colQty')}</TableHead>
                    <TableHead>{t('deckImport.colName')}</TableHead>
                    <TableHead>{t('deckImport.colSet')}</TableHead>
                    <TableHead>{t('deckImport.colNumber')}</TableHead>
                    <TableHead>{t('deckImport.colGame')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.set || ''}</TableCell>
                      <TableCell>{row.number || ''}</TableCell>
                      <TableCell>{t(`providers.${row.providerId}`)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <p className="text-sm text-muted-foreground mt-2">
              {t('deckImport.previewTitle', { count: String(parsed.length) })}
            </p>
            {skipped > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('deckImport.skipped', { count: String(skipped) })}
              </p>
            )}
          </div>
        )}
        {parsed.length === 0 && !parseError && fileName && (
          <p className="text-sm text-muted-foreground">{t('deckImport.noRows')}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>{t('deckImport.cancel')}</Button>
          <Button type="button" onClick={handleAdd} disabled={parsed.length === 0}>
            <Upload className="h-4 w-4 mr-2" />
            {t('deckImport.addCards', { count: String(parsed.length) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Add the header button in `AppHeader.tsx`**

1. Add import: `import DeckListImportDialog from "./DeckListImportDialog";`
2. Add state after `const [showSuccess, setShowSuccess] = useState(false);`:
```ts
  const [isDeckImportOpen, setIsDeckImportOpen] = useState(false);
```
3. Add a button after the existing Import button:
```tsx
          <Button onClick={() => setIsDeckImportOpen(true)} variant="secondary"><FilePlus /> {t('header.importDeck')}</Button>
```
4. Add `FilePlus` to the lucide import line (which currently starts `import { Plus, Search, FileDown, Printer, FileUp, ... }`).
5. Just before the closing `</header>` (after the hidden file input), add:
```tsx
          {isDeckImportOpen && (
            <DeckListImportDialog isOpen onClose={() => setIsDeckImportOpen(false)} />
          )}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Build + commit**

Run: `npm run build`
Expected: static export completes.

```bash
git add src/components/DeckListImportDialog.tsx src/components/AppHeader.tsx
git commit -m "feat: add deck list import dialog"
```

---

### Task 9: Per-game print sizes

**Files:**
- Modify: `src/app/print/PrintView.tsx`, `src/app/print/print.css`

**Interfaces:**
- Consumes: `providerRegistry` from Task 3 (`printSizeMm`), `ProviderId` type.
- Produces: printable pages grouped by size class; YGO pages use the `59x86` grid.

- [ ] **Step 1: Update `PrintView.tsx`**

1. Add import: `import { providerRegistry } from "@/api/providers";`
2. Change the type import to include `ProviderId`:
```ts
import type { NormalizedCard, ProviderId } from "@/lib/types";
```
3. Add a helper above the component:
```ts
const sizeKeyFor = (providerId: ProviderId): string => {
  const provider = providerRegistry[providerId];
  return provider ? `${provider.printSizeMm.width}x${provider.printSizeMm.height}` : '63x88';
};
```
4. Replace the `printableCards` memo so each entry carries its provider, and replace the `pages` memo to group by size:
```ts
  const printableCards = useMemo(() => {
    if (!isClient) return [];
    const allCards: { card: NormalizedCard; providerId: ProviderId }[] = [];
    state.rows.forEach(row => {
      if (row.card) {
        for (let i = 0; i < row.quantity; i++) {
          allCards.push({ card: row.card, providerId: row.providerId });
          if (row.card.is_dfc && row.card.image_uris.back) {
            // Add the back face as a separate "card" for printing
            const backFaceCard: NormalizedCard = {
              ...row.card,
              id: `${row.card.id}-back`,
              image_uris: {
                front: row.card.image_uris.back,
              },
              is_dfc: false, // Treat it as a single face for printing logic
            };
            allCards.push({ card: backFaceCard, providerId: row.providerId });
          }
        }
      }
    });
    return allCards;
  }, [state.rows, isClient]);

  const pages = useMemo(() => {
    const grouped = new Map<string, NormalizedCard[]>();
    printableCards.forEach(entry => {
      const key = sizeKeyFor(entry.providerId);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(entry.card);
    });
    return [...grouped.entries()].flatMap(([key, cards]) =>
      chunk(cards, 9).map(pageCards => ({ key, pageCards }))
    );
  }, [printableCards]);
```
5. Update the render loop (currently maps `pages` with `pageCards`) to use the new shape:
```tsx
            {pages.map((page, pageIndex) => (
              <div key={pageIndex} className="print-page">
                <div className={page.key === '63x88' ? 'card-grid' : `card-grid card-grid-${page.key}`}>
                  {page.pageCards.map((card, cardIndex) => (
                    <div key={`${card.id}-${cardIndex}`} className="card-item">
                      <Image
                        src={card.image_uris.front}
                        alt={card.name}
                        width={248}
                        height={346}
                        layout="responsive"
                        priority
                        data-ai-hint="card game"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
```

- [ ] **Step 2: Add the YGO grid to `print.css`**

After the `.card-item img` rule (or anywhere in the non-media section), add:
```css
.card-grid-59x86 {
    grid-template-columns: repeat(3, 59mm);
    grid-template-rows: repeat(3, 86mm);
}

.card-grid-59x86 .card-item {
    width: 59mm;
    height: 86mm;
}
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run build`
Expected: static export completes.

- [ ] **Step 4: Commit**

```bash
git add src/app/print/PrintView.tsx src/app/print/print.css
git commit -m "feat: print Yu-Gi-Oh! cards at 59x86mm grid"
```

---

### Task 10: Export/import round-trip for identifiers

**Files:**
- Modify: `src/components/AppHeader.tsx`

**Interfaces:**
- Consumes: Task 4 `SET_ROWS` preservation of `identifiers`; `NormalizedCard.setCode`/`number` from Task 1.

- [ ] **Step 1: Extend `handleExport`**

Replace the `exportData` mapping:
```ts
    const exportData = state.rows.map(({ query, quantity, providerId, card, identifiers }) => ({
      query,
      quantity,
      providerId,
      cardId: card?.id || '',
      cardName: card?.name || '',
      cardSet: card?.set || '',
      cardSetCode: card?.setCode || '',
      cardNumber: card?.number || '',
      cardArtist: card?.artist || '',
      cardImageFront: card?.image_uris.front || '',
      cardImageBack: card?.image_uris.back || '',
      cardIsDfc: card?.is_dfc || false,
      cardUrl: card?.url || '',
      idSet: identifiers?.set || '',
      idNumber: identifiers?.number || '',
    }));
```

- [ ] **Step 2: Extend `handleFileChange` import mapping**

Replace the `card` construction inside the import callback:
```ts
              if (r.cardId) {
                card = {
                  id: r.cardId,
                  name: r.cardName,
                  set: r.cardSet,
                  setCode: r.cardSetCode,
                  number: r.cardNumber,
                  artist: r.cardArtist,
                  image_uris: {
                    front: r.cardImageFront,
                    back: r.cardImageBack,
                  },
                  is_dfc: r.cardIsDfc,
                  url: r.cardUrl,
                }
              }
```
and replace the returned object so identifiers are rebuilt:
```ts
              return {
                query: r.query,
                quantity: r.quantity,
                providerId: r.providerId,
                card: card,
                identifiers: r.idSet || r.idNumber ? { name: r.query, set: r.idSet, number: r.idNumber } : undefined,
                status: card ? 'found' : 'idle',
              };
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppHeader.tsx
git commit -m "feat: round-trip card identifiers through export/import"
```

---

### Task 11: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run all unit tests**

Run:
```bash
npx tsx src/lib/identifierQueries.test.ts
npx tsx src/lib/deckList.test.ts
npx tsx src/context/cardReducer.test.ts
npx tsx src/lib/retry.test.ts
```
Expected: all PASS.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: static export completes into `out/`.

- [ ] **Step 4: Manual smoke test (dev server)**

Run: `npm run dev` (port 9002). Verify:
1. Provider dropdown on a row shows "Yu-Gi-Oh!"; search "Blue-Eyes White Dragon" resolves and the cropped image renders (CSP + remotePatterns working).
2. "Import Deck List" with a small CSV (`qty,name,set,number` rows for each game) appends rows, auto-searches them, and YGO rows resolve via set-code match.
3. A mixed MTG+YGO list prints on separate pages; YGO cards are smaller (59×86) on screen preview.
4. Export the list, re-import it, and confirm identifiers survive (rows re-search to the same cards).

- [ ] **Step 5: Commit any verification fixes**

If the smoke test found issues, fix them in the relevant task file and commit:
```bash
git add -A
git commit -m "fix: address smoke test findings"
```

---

## Self-Review Notes

- **Spec coverage:** A→Task 1 (types) + Task 3 (registry); B→Task 3 (YGO descriptor) + Task 2 (identifier queries); C→Task 4 (reducer) + Task 5 (parser) + Task 6 (searchRows) + Task 7 (i18n/filter) + Task 8 (dialog); D→Task 3 (CSP/config) + Task 9 (print) + Task 10 (round-trip); E→Tasks 2/4/5 (tests) + Task 11 (verification).
- **Out of scope respected:** no YGO settings modal (YGO descriptor has empty `YuGiOhSearchOptions`; CardRow's `Settings2` button is already conditional on `scryfall`/`pokemontcg`), no user-editable unique fields, no column-mapping UI, no text-paste import.
- **Type consistency:** `search` signature `(providerId, query, options, identifiers)` is defined in Task 3 and consumed identically in Tasks 6/8. `APPEND_ROWS` payload is `Partial<CardRow>[]` in Task 4 and Task 8 passes `CardRow[]` (assignable). `generateId` moves to `@/lib/utils` in Task 4 and is used there and in Task 8. Size keys are `${width}x${height}` strings in both Task 3 (`printSizeMm`) and Task 9 (`sizeKeyFor`).
