import test from 'node:test';
import assert from 'node:assert/strict';

const { CHAINS, isValidWallet } = await import('../src/lib/distribution.ts');

test('network list includes Avalanche, keeps Fuse and orders networks alphabetically', () => {
  assert.deepEqual(
    CHAINS.map((chain) => chain.label),
    ['Arbitrum', 'Avalanche', 'Base', 'Ethereum', 'Fuse', 'Polygon'],
  );
  assert.deepEqual(
    CHAINS.map((chain) => chain.id),
    ['arbitrum', 'avalanche', 'base', 'ethereum', 'fuse', 'polygon'],
  );
  assert.equal(CHAINS.some((chain) => chain.id === 'solana'), false);
});

test('Fuse is the only usable network for now', () => {
  assert.deepEqual(
    CHAINS.filter((chain) => 'usable' in chain).map((chain) => chain.id),
    ['fuse'],
  );
});

test('Fuse uses EVM wallet validation and rejects Solana-style addresses', () => {
  assert.equal(isValidWallet('fuse', '0x1234567890abcdef1234567890abcdef12345678'), true);
  assert.equal(isValidWallet('fuse', '111111111111111111111111111111111111111111'), false);
  assert.equal(isValidWallet('solana', '111111111111111111111111111111111111111'), true);
});
