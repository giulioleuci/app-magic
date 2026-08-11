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
