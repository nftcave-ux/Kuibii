import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('README links to the public Kuibii site', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

  assert.match(readme, /\*\*Live app\*\*:\s*https:\/\/kuibii\.fun\//);
});
