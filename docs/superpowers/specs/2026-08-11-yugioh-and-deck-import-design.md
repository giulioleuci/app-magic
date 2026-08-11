# Yu-Gi-Oh! Provider + Deck-List Import — Design

Date: 2026-08-11
Status: Approved (brainstorming design review)

## Goal

1. Add Yu-Gi-Oh! as a third game provider using the YGOPRODeck API.
2. Let all three games define the fields that uniquely determine a card, and let users build decks by uploading purchased deck lists (CSV/XLSX) with quantity + identifying fields.

## Decisions (from brainstorming)

- **Deck-list input:** file upload (CSV/XLSX), not text paste.
- **File structure:** generic columns — `quantity`, `name`, `set`, `number`, plus an optional `game`/`provider` column so one file can mix games.
- **Resolution strategy:** exact first, fallback to name (name+set+number → 1 result → auto-select; nothing → name search → selection modal).
- **Uniqueness config:** fixed presets per game (no user-facing settings UI).
- **YGO print size:** per-game print sizes (YGO 59×86 mm; MTG/Pokémon 63×88 mm).
- **Import behavior:** append to existing list.
- **Overall approach:** light provider registry + import engine.

## Section A — Data model & provider registry

### Types (`src/lib/types.ts`)

- `ProviderId` gains `'yugioh'`.
- New `CardIdentifiers`:
  ```ts
  export interface CardIdentifiers {
    name?: string;
    set?: string;     // set code (e.g. "WAR", "swsh12", "LOB-EN005")
    number?: string;  // collector number within set (e.g. "35", "125")
  }
  ```
- `NormalizedCard` gains optional `setCode?: string` and `number?: string`, captured at search time and carried through export/import.
- New `YuGiOhSearchOptions` (empty for now, extensible later; no settings modal this round).
- `CardRow` gains `identifiers?: CardIdentifiers` and `yugiohSearchOptions?: YuGiOhSearchOptions`. Existing `scryfallSearchOptions`/`pokemonTcgSearchOptions` stay unchanged (options plumbing is not refactored).

### Provider registry (`src/api/providers.ts` → `src/api/providers/`)

A per-provider descriptor replaces the `if/else` chain in `useCardSearch.ts`:

```ts
interface ProviderDescriptor {
  id: ProviderId;
  uniqueFields: { name: boolean; set: boolean; number: boolean };
  defaultOptions: unknown;
  printSizeMm: { width: number; height: number };
  search(query, options): Promise<NormalizedCard[] | null>;
  searchByIdentifiers(identifiers, options): Promise<NormalizedCard[] | null>;
}
```

- Files: `src/api/providers/scryfall.ts`, `pokemontcg.ts`, `yugioh.ts`, `index.ts`. Each exports its descriptor + normalizer. Search functions move out of `useCardSearch.ts`.
- `availableProviders` and `defaultProviderId` are derived from the registry, so the header dropdown, filter bar, and `ADD_ROW` defaults pick up YGO automatically.
- `useCardSearch.search(providerId, query, options, identifiers?)` looks up the descriptor and applies exact-first, fallback-to-name:
  - if `identifiers` has `set` or `number`, try `searchByIdentifiers`;
  - if that returns nothing, fall back to `search(query)`.
- Both CardRow's single-row search and Search All use it unchanged.
- `uniqueFields` is `{name,set,number}: true` for all three games today; it is the formal hook for "the fields that uniquely determine a card" and drives the importer's column handling.

## Section B — Yu-Gi-Oh! provider (YGOPRODeck)

- API: `https://db.ygoprodeck.com/api/v7/cardinfo.php`, free, no key, 20 req/s.
  - Name search: `?name=Dark Magician` (exact → single card object) or `?fname=` (fuzzy).
  - Response fields used: `id` (passcode), `name`, `card_sets[]` (`set_name`, `set_code` like `LOB-EN005`, `set_rarity`), `card_images[]` (`image_url_cropped`), `ygoprodeck_url`.
- Normalizer (`normalizeYugiohData`):
  - `id` → passcode; `name`; `set` → matched print's `set_name` (or `card_sets[0].set_name`); `setCode` → matched `set_code`; `image_uris.front` → `image_url_cropped`; `is_dfc: false`; `url` → `ygoprodeck_url`.
  - YGO cards share the same art across reprints, so print ambiguity is low.
- `searchByIdentifiers` (YGOPRODeck cannot query set code + number directly):
  1. `?name=` exact-name search → the one card object.
  2. Filter `card_sets` for `set_code === identifiers.set` (file's `set` column holds the full set code, e.g. `LOB-EN005`).
  3. Matched → return card with that print's set info; card exists but no set-code match (or no `set` provided) → still return the name match (best effort).
- Scryfall exact (`buildScryfallIdentifierQuery`): `!Name set:WAR cn:35` — build from whichever of name/set/number are present (`cn:` collector number, `set:` set code). No set/number → behaves like today's name search.
- Pokémon exact (`buildPokemonIdentifierQuery`): `q=name:"..." set.id:"..." number:"..."`; if `set` matches nothing as `set.id`, retry once as `set.name:"..."` (covers seller lists using set names).
- Settings modal: none for YGO this round (empty `YuGiOhSearchOptions`); the `Settings2` button does not render for `yugioh`.
- CSP (`src/app/layout.tsx`) and `next.config.ts` both updated (per AGENTS.md gotcha):
  - `img-src` + `images.remotePatterns`: add `https://images.ygoprodeck.com`
  - `connect-src`: add `https://db.ygoprodeck.com`

## Section C — Deck-list import

- New header button "Import Deck List" opens a dialog (separate from existing XLSX export/import, which stays full-replace).
- Flow:
  1. **Provider picker** — MTG / Pokémon / YGO (default: current provider). Applies to all rows unless the file has a game column.
  2. **File drop/select** — `.csv`, `.xlsx`, `.xls`, parsed with the existing `xlsx` package (SheetJS handles CSV).
  3. **Parse + preview** — header row mapped through column synonyms (`quantity`|`qty`|`count`, `name`|`card name`, `set`|`set code`|`code`, `number`|`collector number`|`#`, optional `game`|`provider`). Each row → `{ quantity, providerId, name, set, number }` in a preview table; empty rows and rows without a name are skipped (counted).
  4. **Append** — new reducer action `APPEND_ROWS` (existing `SET_ROWS` replaces; `APPEND_ROWS` appends with undo/redo history). Each imported row becomes `CardRow` with `query: name`, `quantity`, `providerId`, `identifiers: {name, set, number}`, status `idle`.
  5. **Auto-search** — the per-row search loop in `AppHeader.handleSearchAll` is extracted into a shared `searchRows(rows, onProgress)` helper (same `SearchContext` progress modal). After append, imported rows run through it automatically; exact-first → fallback-to-name; ambiguous rows keep Search-All behavior (auto-pick `[0]`); per-row search still opens the selection modal.
- Reducer: add `APPEND_ROWS` in `cardReducer.ts` + a test in `cardReducer.test.ts` (mirroring existing style).
- Parsing in a pure module `src/lib/deckList.ts`: `parseDeckList(rows: unknown[][], defaultProviderId)` → `ParsedDeckRow[]`, unit-testable via `npx tsx`.

## Section D — Print, config, i18n

- **Per-game print sizes** (`PrintView.tsx` + `print.css`):
  - `printSizeMm` per provider: MTG & Pokémon `63×88`, YGO `59×86`.
  - `printableCards` partitioned by size class, then chunked into 9-per-page; each page's grid uses the size class (`repeat(3, 63mm)` or `repeat(3, 59mm)` columns, matching row heights).
  - Mixed decks print YGO pages and MTG/Pokémon pages separately (both 3×3 fit on A4: 189×264 mm and 177×258 mm). No DFC back-face change (YGO has no DFCs).
- **Security/config** — CSP + `remotePatterns` additions as in Section B.
- **i18n** (both `en.ts` and `it.ts`): `header.importDeck`, `providers.yugioh`, `filters.showYuGiOh`, `deckImport.*` (dialog title, provider label, file label, preview title, append/confirm, skip-empty notice, row columns, success/failure toasts).
- **Export/import round-trip** — `handleExport`/`handleFileChange` in `AppHeader.tsx` extend to include `cardSetCode`, `cardNumber`, and `identifiers` so a saved list re-imports with unique fields intact.

## Section E — Testing & verification

- No test runner; plain node-assert via `npx tsx`. `npm run typecheck` is the verification gate.
- New unit tests:
  - `src/lib/deckList.test.ts` — parser: header synonyms, quantity defaulting, empty-row skipping, game-column override vs default provider.
  - Per-provider identifier-query builders (`buildScryfallIdentifierQuery`, `buildPokemonIdentifierQuery`): all-fields, missing set, missing number, no identifiers.
  - YGO `matchYugiohPrint(card, identifiers)` — set-code matching (hit, miss, absent).
  - `cardReducer.test.ts` — extend with `APPEND_ROWS` (append + history + undo).
- Verification: `npm run typecheck`, `npm run build` (static export), existing tests still green.

## Out of scope (YAGNI)

- No YGO settings modal.
- No user-editable unique fields.
- No column-mapping UI.
- No text-paste import.
