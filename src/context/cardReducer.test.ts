import { cardReducer, initialState } from './CardContext';
import assert from 'node:assert';
import { defaultProviderId } from '../api/providers';
import type { NormalizedCard, CardRow } from '../lib/types';

async function test() {
  console.log('Running tests for cardReducer...');

  // Test ADD_ROW
  let state = cardReducer(initialState, { type: 'ADD_ROW' });
  assert.strictEqual(state.rows.length, 1, 'ADD_ROW should add one row');
  assert.strictEqual(state.history.length, 2, 'History length should be 2 after first ADD_ROW');
  assert.strictEqual(state.historyIndex, 1, 'historyIndex should be 1');

  const row1 = state.rows[0];
  assert.strictEqual(row1.query, '');
  assert.strictEqual(row1.quantity, 1);
  assert.strictEqual(row1.providerId, defaultProviderId);
  assert.strictEqual(row1.status, 'idle');

  // Test ADD_ROW inheriting providerId
  state = cardReducer(state, { type: 'UPDATE_ROW', payload: { id: row1.id, data: { providerId: 'pokemontcg' } } });
  state = cardReducer(state, { type: 'ADD_ROW' });
  assert.strictEqual(state.rows.length, 2);
  const row2 = state.rows[1];
  assert.strictEqual(row2.providerId, 'pokemontcg', 'ADD_ROW should inherit providerId from the last row');

  // Test REMOVE_ROW
  state = cardReducer(state, { type: 'REMOVE_ROW', payload: { id: row1.id } });
  assert.strictEqual(state.rows.length, 1);
  assert.strictEqual(state.rows[0].id, row2.id, 'REMOVE_ROW should remove the specified row');

  // Test REMOVE_ROWS
  state = cardReducer(state, { type: 'REMOVE_ROWS', payload: { ids: [row2.id] } });
  assert.strictEqual(state.rows.length, 0);

  // Setup state for more tests
  state = cardReducer(initialState, { type: 'ADD_ROW' });
  const rowId = state.rows[0].id;

  // Test UPDATE_ROW
  state = cardReducer(state, { type: 'UPDATE_ROW', payload: { id: rowId, data: { query: 'Pikachu', quantity: 4 } } });
  assert.strictEqual(state.rows[0].query, 'Pikachu');
  assert.strictEqual(state.rows[0].quantity, 4);

  // Test UPDATE_ROWS
  state = cardReducer(state, { type: 'ADD_ROW' });
  const rowId2 = state.rows[1].id;
  state = cardReducer(state, { type: 'UPDATE_ROWS', payload: { ids: [rowId, rowId2], data: { quantity: 2 } } });
  assert.strictEqual(state.rows[0].quantity, 2);
  assert.strictEqual(state.rows[1].quantity, 2);

  // Clean up back to 1 row for simplicity
  state = cardReducer(state, { type: 'REMOVE_ROW', payload: { id: rowId2 } });

  // Test SET_SEARCH_STATUS
  const prevHistoryLength = state.history.length;
  state = cardReducer(state, { type: 'SET_SEARCH_STATUS', payload: { id: rowId, status: 'loading' } });
  assert.strictEqual(state.rows[0].status, 'loading');
  assert.strictEqual(state.history.length, prevHistoryLength, 'SET_SEARCH_STATUS should not add to history');

  // Test SET_CARD_DATA - Found
  const dummyCard: NormalizedCard = { id: 'c1', name: 'Pikachu', set: 'Base', artist: 'Mitsuhiro Arita', image_uris: { front: 'url' }, is_dfc: false, url: 'url' };
  state = cardReducer(state, { type: 'SET_CARD_DATA', payload: { id: rowId, card: dummyCard } });
  assert.strictEqual(state.rows[0].status, 'found');
  assert.deepStrictEqual(state.rows[0].card, dummyCard);
  assert.strictEqual(state.history.length, prevHistoryLength, 'SET_CARD_DATA should not add to history');

  // Test SET_CARD_DATA - Error
  state = cardReducer(state, { type: 'SET_CARD_DATA', payload: { id: rowId, card: null } });
  assert.strictEqual(state.rows[0].status, 'error');
  assert.strictEqual(state.rows[0].error, 'Card not found');
  assert.strictEqual(state.rows[0].card, null);

  // Test SET_SEARCH_RESULTS
  const searchResults = [dummyCard];
  state = cardReducer(state, { type: 'SET_SEARCH_RESULTS', payload: { id: rowId, searchResults } });
  assert.strictEqual(state.rows[0].status, 'multiple');
  assert.strictEqual(state.rows[0].card, null);
  assert.deepStrictEqual(state.rows[0].searchResults, searchResults);
  assert.strictEqual(state.history.length, prevHistoryLength, 'SET_SEARCH_RESULTS should not add to history');

  // Test SET_ROWS
  state = cardReducer(state, { type: 'SET_ROWS', payload: [{ query: 'Charizard' }, { query: 'Blastoise' }] });
  assert.strictEqual(state.rows.length, 2);
  assert.strictEqual(state.rows[0].query, 'Charizard');
  assert.strictEqual(state.rows[1].query, 'Blastoise');

  // Test UNDO
  const stateBeforeUndo = state;
  state = cardReducer(state, { type: 'UNDO' });
  // After undo, we go back to the state before SET_ROWS
  assert.strictEqual(state.rows.length, 1);
  assert.strictEqual(state.rows[0].query, 'Pikachu');
  assert.strictEqual(state.historyIndex, stateBeforeUndo.historyIndex - 1);

  // Test REDO
  state = cardReducer(state, { type: 'REDO' });
  assert.strictEqual(state.rows.length, 2);
  assert.strictEqual(state.rows[0].query, 'Charizard');
  assert.strictEqual(state.historyIndex, stateBeforeUndo.historyIndex);

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

  console.log('All cardReducer tests passed!');
}

test().catch(err => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
});
