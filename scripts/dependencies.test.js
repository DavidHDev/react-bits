/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { generateDependencyCommands, getTypeDependencies } from '../src/utils/dependencies.js';
import { generateCliCommands } from '../src/utils/cli.js';

test('manual TypeScript installs include the matching development types for every package manager', () => {
  const commands = generateCliCommands('TS', 'CSS', 'components', 'lanyard', 'three').manual;
  assert.deepEqual(commands, {
    pnpm: 'pnpm add three && pnpm add -D @types/three',
    npm: 'npm install three && npm install -D @types/three',
    yarn: 'yarn add three && yarn add -D @types/three',
    bun: 'bun add three && bun add -D @types/three'
  });
});

test('JavaScript installs and packages with bundled types keep their existing commands', () => {
  assert.deepEqual(generateDependencyCommands('three', 'JS'), {
    pnpm: 'pnpm add three',
    npm: 'npm install three',
    yarn: 'yarn add three',
    bun: 'bun add three'
  });
  assert.equal(generateDependencyCommands('gsap motion', 'TS').pnpm, 'pnpm add gsap motion');
  assert.equal(generateDependencyCommands('', 'TS'), null);
  assert.equal(generateDependencyCommands([], 'JS'), null);
});

test('both documentation dependency formats produce the same commands and deduplicate type packages', () => {
  const dependencies = ['three', '@react-three/fiber', '@react-three/drei', 'matter-js'];
  const fromPanel = generateDependencyCommands(dependencies, 'TS');
  const fromCodeTab = generateCliCommands('TS', 'TW', 'components', 'lanyard', dependencies.join(' ')).manual;
  assert.deepEqual(fromPanel, fromCodeTab);
  assert.equal(
    fromPanel.pnpm,
    'pnpm add three @react-three/fiber @react-three/drei matter-js && pnpm add -D @types/matter-js @types/three'
  );
});

test('registry imports and versioned manual dependencies resolve to the same type packages', () => {
  assert.deepEqual(
    getTypeDependencies(['three/examples/jsm/loaders/GLTFLoader.js', '@react-three/fiber', 'matter-js']),
    ['@types/matter-js', '@types/three']
  );
  assert.deepEqual(getTypeDependencies(['three@^0.180.0', '@react-three/fiber@^9.3.0', 'matter-js@^0.20.0']), [
    '@types/matter-js',
    '@types/three'
  ]);
});
