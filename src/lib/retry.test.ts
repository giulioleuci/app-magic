import { retryWithBackoff } from './retry';
import assert from 'node:assert';

async function test() {
  console.log('Running tests for retry.ts...');

  // Test 1: Successful execution
  try {
    const result = await retryWithBackoff(async () => 'success', 3);
    assert.strictEqual(result, 'success', 'Test 1 Failed: Should return result on success');
    console.log('Test 1 Passed: Successful execution');
  } catch (error) {
    console.error('Test 1 Failed:', error);
    process.exit(1);
  }

  // Test 2: Retry on failure and succeed
  try {
    let attempts = 0;
    const result = await retryWithBackoff(async () => {
      attempts++;
      if (attempts < 2) throw new Error('First attempt failed');
      return 'success';
    }, 3, 10); // Short delay for testing
    assert.strictEqual(result, 'success', 'Test 2 Failed: Should return result after retry');
    assert.strictEqual(attempts, 2, 'Test 2 Failed: Should have retried once');
    console.log('Test 2 Passed: Retry on failure and succeed');
  } catch (error) {
    console.error('Test 2 Failed:', error);
    process.exit(1);
  }

  // Test 3: Retry max times and fail
  try {
    await retryWithBackoff(async () => {
      throw new Error('Always fail');
    }, 2, 10);
    console.error('Test 3 Failed: Should have thrown error');
    process.exit(1);
  } catch (error) {
    if (error instanceof Error && error.message === 'Always fail') {
      console.log('Test 3 Passed: Retry max times and fail');
    } else {
      console.error('Test 3 Failed: Wrong error thrown:', error);
      process.exit(1);
    }
  }

  // Test 4: Negative maxRetries (Current bug: throws undefined)
  try {
    await retryWithBackoff(async () => 'success', -1);
    console.error('Test 4 Failed: Should have thrown error');
  } catch (error) {
    if (error === undefined) {
      console.error('Test 4 Failed: Caught undefined (expected bug)');
      process.exit(1); // Fail the test suite if bug is present
    } else {
      // Once fixed, this should be an Error
      if (error instanceof Error && error.message === 'Retry failed with unknown error') {
         console.log('Test 4 Passed (fixed): Caught fallback error');
      } else {
         console.error('Test 4 Failed: Caught unexpected error:', error);
         process.exit(1);
      }
    }
  }
}

test().catch(err => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
});
