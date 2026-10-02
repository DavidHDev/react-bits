/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { getActiveRoute } from './activeRoute.js';
import { generateCliCommands } from './cli.js';

test('reads component routes with and without the /c prefix', () => {
  for (const prefix of ['', '/c']) {
    for (const suffix of ['', '/']) {
      assert.deepEqual(getActiveRoute(`${prefix}/text-animations/tech-text${suffix}`), {
        category: 'text-animations',
        subcategory: 'tech-text',
        isCategoryRoute: true
      });
    }
  }
});

test('does not treat category index or single-segment routes as component routes', () => {
  for (const pathname of ['/', '/favorites', '/text-animations', '/c', '/c/text-animations', '/c/text-animations/']) {
    assert.deepEqual(getActiveRoute(pathname), {
      category: null,
      subcategory: null,
      isCategoryRoute: false
    });
  }
});

test('generates component CLI commands for every selected stack on both route formats', () => {
  const runners = { pnpm: 'pnpm dlx', npx: 'npx', yarn: 'yarn', bun: 'bun x --bun' };
  for (const prefix of ['', '/c']) {
    for (const [categorySlug, componentSlug, componentName] of [
      ['text-animations', 'tech-text', 'TechText'],
      ['backgrounds', 'aurora', 'Aurora']
    ]) {
      const { category, subcategory } = getActiveRoute(`${prefix}/${categorySlug}/${componentSlug}`);
      for (const language of ['JS', 'TS']) {
        for (const style of ['CSS', 'Tailwind']) {
          const variant = `${language}-${style === 'Tailwind' ? 'TW' : 'CSS'}`;
          const commands = generateCliCommands(language, style, category, subcategory);
          for (const [manager, runner] of Object.entries(runners)) {
            assert.equal(
              commands.shadcn[manager],
              `${runner} shadcn@latest add @react-bits/${componentName}-${variant}`
            );
            assert.equal(
              commands.jsrepo[manager],
              `${runner} jsrepo@latest add https://reactbits.dev/r/${componentName}-${variant}`
            );
          }
        }
      }
    }
  }
});
