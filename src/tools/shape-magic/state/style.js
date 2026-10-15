import { defaultValues } from '../engine/materialParams';
import { PROCEDURAL_BY_ID } from '../materials';

export const proceduralFor = doc =>
  doc.material?.id?.startsWith('fx:') ? PROCEDURAL_BY_ID[doc.material.id.slice(3)] || null : null;

export const styleFor = (doc, { forMask = false } = {}) => {
  if (forMask) {
    return { fill: { kind: 'solid', color1: '#ffffff' }, background: { kind: 'none' } };
  }
  const procedural = proceduralFor(doc);
  if (procedural) {
    const material = {
      def: procedural,
      values: { ...defaultValues(procedural.params), ...(doc.material.props || {}) }
    };
    return {
      fill: procedural.kind === 'fill' ? { kind: 'material' } : { kind: 'solid', color1: '#ffffff' },
      material,
      outline: doc.effects.outline,
      shadow: doc.effects.shadow,
      glow: doc.effects.glow,
      gloss: procedural.kind === 'fill' ? doc.effects.gloss : { on: false },
      background: doc.artboard.background
    };
  }
  const flat = !doc.material || doc.material.id === 'flat';
  const background = doc.material?.id?.startsWith('bg:');
  return {
    fill: flat ? doc.fill : background ? { kind: 'texture', color1: doc.material.base ?? '#0c0b10' } : { kind: 'none' },
    outline: doc.effects.outline,
    shadow: doc.effects.shadow,
    glow: doc.effects.glow,
    gloss: flat || background ? doc.effects.gloss : { on: false },
    background: doc.artboard.background
  };
};
