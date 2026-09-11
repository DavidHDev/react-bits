/* eslint-env node */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { auditPropDocs, readSourceDefaults } from './checkPropDocs.js';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'react-bits-props-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return (file, contents) => {
    const fullPath = path.join(root, file);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, contents);
    return fullPath;
  };
}

test('reads typed and wrapped props without treating internal defaults as public props', t => {
  const write = fixture(t);
  const file = write(
    'Example.tsx',
    `
    const SPEED = 2;
    const Inner = (props: Props) => {
      const { speed = SPEED, bend = -0.5, enabled = true, color = '#fff', options = [] } = props;
      const internal = ({ speed = 99 }) => null;
      return null;
    };
    const Example = React.memo(Inner);
    export default Example;
  `
  );
  assert.deepEqual(Object.fromEntries(readSourceDefaults(file, 'Example')), {
    speed: 2,
    bend: -0.5,
    enabled: true,
    color: '#fff'
  });
});

test('compares semantic scalar defaults and reports docs and variant drift', t => {
  const write = fixture(t);
  let root;
  for (const variant of ['content', 'tailwind', 'ts-default', 'ts-tailwind']) {
    const file = write(
      `src/${variant}/Animations/Example/Example.${variant.startsWith('ts-') ? 'tsx' : 'jsx'}`,
      `
      const Example = ({ speed = ${variant === 'tailwind' ? 3 : 2}, color = '#fff', enabled = true, title = 'Actual', src = 'https://example.com/image.jpg' }) => null;
    `
    );
    root = file.split('/src/')[0];
  }
  write(
    'src/demo/Animations/ExampleDemo.jsx',
    `
    const propData = useMemo(() => [
      { name: 'speed', default: '2.0' },
      { name: 'color', default: '"#FFFFFF"' },
      { name: 'enabled', default: 'true' },
      { name: 'title', default: 'Outdated' },
      { name: 'src', default: 'https://example.com/...' }
    ], []);
  `
  );
  const result = auditPropDocs(root);
  assert.equal(result.components, 1);
  assert.equal(result.comparedDefaults, 4);
  assert.equal(result.descriptiveDefaults, 1);
  assert.deepEqual(
    result.errors.map(({ kind, prop }) => ({ kind, prop })),
    [
      { kind: 'variants', prop: 'speed' },
      { kind: 'docs', prop: 'title' }
    ]
  );
});

test('fails instead of silently skipping an unsupported component signature', t => {
  const write = fixture(t);
  const file = write('Example.jsx', 'const Example = props => null;');
  assert.throws(() => readSourceDefaults(file, 'Example'), /Cannot read prop defaults/);
});
