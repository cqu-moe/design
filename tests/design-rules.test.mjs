import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSource } from '../scripts/check-design.mjs';
test('rejects local colors and arbitrary size utilities', () => {
  assert.ok(checkSource('page.css', '.page {color:#333333}').length);
  assert.ok(checkSource('page.tsx', '<div className="text-[15px] p-[19px]"/>').length);
  assert.equal(
    checkSource('page.css', '.page {color:var(--foreground);padding:var(--space-4)}').length,
    0,
  );
});
test('rejects direct primitives, copied components and cross-package internals', () => {
  for (const name of [
    'radix-ui',
    'sonner',
    '@radix-ui/react-dialog',
    './components/ui/button',
    '@cqu-moe/ui/src/button',
  ])
    assert.ok(checkSource('page.tsx', `import {Button} from '${name}';`).length);
  assert.equal(checkSource('page.tsx', "import {Button} from '@cqu-moe/ui';").length, 0);
});
test('explicit scoped exception needs a reason and an end marker', () => {
  assert.equal(
    checkSource(
      'page.css',
      '/* design-exception-start: sample of both themes */\n.sample{color:#fff}\n/* design-exception-end */',
    ).length,
    0,
  );
  assert.ok(checkSource('page.css', '/* design-exception-start: */\n.sample{color:#fff}').length);
  assert.ok(
    checkSource(
      'page.css',
      '/* design-exception-start: sample */\n.sample{color:#fff}\n/* design-exception-end */\n.other{color:#000}',
    ).length,
  );
});
