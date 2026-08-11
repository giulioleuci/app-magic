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
