import test from 'node:test';
import assert from 'node:assert/strict';

const { CHAINS, isValidWallet } = await import('../src/lib/distribution.ts');

test('network list replaces Solana with Fuse and orders networks alphabetically', () => {
  assert.deepEqual(
    CHAINS.map((chain) => chain.label),
    ['Arbitrum', 'Base', 'Ethereum', 'Fuse', 'Polygon'],
  );
  assert.deepEqual(
    CHAINS.map((chain) => chain.id),
    ['arbitrum', 'base', 'ethereum', 'fuse', 'polygon'],
  );
  assert.equal(CHAINS.some((chain) => chain.id === 'solana'), false);
});

test('Fuse uses EVM wallet validation and rejects Solana-style addresses', () => {
  assert.equal(isValidWallet('fuse', '0x1234567890abcdef1234567890abcdef12345678'), true);
  assert.equal(isValidWallet('fuse', '111111111111111111111111111111111111111111'), false);
  assert.equal(isValidWallet('solana', '111111111111111111111111111111111111111'), true);
});
