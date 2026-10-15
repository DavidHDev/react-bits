import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIMITIVES, PRIMITIVE_INDEX } from './primitives.js';
import { buildFragment } from './shader.js';
import { MAX_LAYERS, markLayers, shaderVariant, variantKey } from './shaderVariant.js';

test('scene variants keep the original primitive indices across both morph marks', () => {
  const scene = {
    a: { layers: [{ type: 'box' }, { type: 'circle', visible: false }, { type: 'text' }] },
    b: { layers: [{ type: 'spiral' }, { type: 'image' }, { type: 'legacy-unknown' }] }
  };
  const variant = shaderVariant(scene);
  assert.equal(variant.capacity, 3);
  assert.deepEqual(variant.types, [0, PRIMITIVE_INDEX.box, PRIMITIVE_INDEX.spiral]);
  const source = buildFragment(null, variant);
  for (const [index, primitive] of PRIMITIVES.entries()) {
    assert.equal(source.includes(`float sd_${primitive.id}(`), variant.types.includes(index), primitive.id);
    if (variant.types.includes(index)) {
      assert.ok(source.includes(`if (t == ${index}) return sd_${primitive.id}(p, a, b);`));
    }
  }
  assert.ok(source.includes('#define MAXL 3'));
  assert.ok(source.includes('uniform int uType[6];'));
});

test('visible layers retain the full editor limit and mask-only scenes remain valid', () => {
  const layers = [
    { type: 'box', visible: false },
    ...Array.from({ length: MAX_LAYERS + 2 }, () => ({ type: 'image' }))
  ];
  assert.equal(markLayers({ layers }).length, MAX_LAYERS);
  assert.deepEqual(shaderVariant({ a: { layers } }), {
    capacity: MAX_LAYERS,
    types: [],
    morph: false,
    patterns: false,
    radialCopies: false,
    linearCopies: false,
    shadow: false,
    bevel: false
  });
  const empty = shaderVariant();
  assert.equal(empty.capacity, 1);
  assert.deepEqual(empty.types, []);
});

test('uniform edits reuse shaders while geometry and sampling changes invalidate them', () => {
  const scene = { a: { layers: [{ type: 'box', x: 0 }] } };
  const initial = variantKey(shaderVariant(scene));
  assert.equal(variantKey(shaderVariant({ a: { layers: [{ type: 'box', x: 0.7, rotation: 45 }] } })), initial);
  assert.equal(variantKey(shaderVariant(scene, { fill: { color1: '#ff0000' } })), initial);
  assert.notEqual(variantKey(shaderVariant({ a: { layers: [{ type: 'circle' }] } })), initial);
  assert.notEqual(variantKey(shaderVariant({ a: { layers: [{ type: 'box' }, { type: 'box' }] } })), initial);
  assert.notEqual(variantKey(shaderVariant(scene, { shadow: { on: true } })), initial);
  assert.notEqual(variantKey(shaderVariant(scene, { gloss: { on: true } })), initial);
  assert.equal(variantKey(shaderVariant(scene, { shadow: { on: true, opacity: 0 } })), initial);
});

test('unused nested sampling paths are omitted and enabled by the matching scene features', () => {
  const scene = { a: { layers: [{ type: 'box' }] } };
  const source = buildFragment(null, shaderVariant(scene));
  assert.ok(!source.includes('int passes ='));
  assert.ok(!source.slice(source.indexOf('float layerSD('), source.indexOf('float combine(')).includes('for ('));
  assert.ok(!source.includes('for (int j = -1;'));
  assert.ok(!source.includes('if (uPat[i].x > 0.5)'));
  assert.ok(!source.includes('vec2 points[6]'));
  const copies = shaderVariant({
    a: {
      layers: [
        { type: 'circle', repeat: 4 },
        { type: 'box', repeat: 3, layout: 'column', pattern: 'dots' }
      ]
    },
    b: { layers: [] }
  });
  assert.ok(copies.morph && copies.patterns && copies.radialCopies && copies.linearCopies);
  assert.notEqual(variantKey(copies), variantKey(shaderVariant(scene)));
  assert.ok(buildFragment(null, copies).includes('if (k < -reach || k > reach) continue;'));
  assert.ok(buildFragment(null, copies).includes('for (int j = -1;'));
});
