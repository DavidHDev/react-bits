import { backgroundDefaults, backgroundValues, materialFor, METAL_DEFINITIONS } from '../presets/materials';
import { ratioOf } from '../state/doc';
import { proceduralCode } from './proceduralCode';

const METALLIC_DEFAULTS = {
  color: '#ffffff',
  density: 2,
  softness: 0.1,
  dispersion: 0.3,
  distortion: 0.07,
  edgeBend: 0.6,
  angle: 70,
  speed: 1,
  mouseTilt: 0.5
};

const round = value => (typeof value === 'number' ? Math.round(value * 1000) / 1000 : value);

const propValue = value => {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? '' : '={false}';
  return `{${JSON.stringify(round(value))}}`;
};

const propsString = (props, indent) =>
  Object.entries(props)
    .map(([name, value]) => {
      const rendered = propValue(value);
      if (rendered === '') return `${indent}${name}`;
      return rendered.startsWith('=') ? `${indent}${name}${rendered}` : `${indent}${name}=${rendered}`;
    })
    .join('\n');

const changed = (props, defaults) =>
  Object.fromEntries(
    Object.entries(props).filter(
      ([name, value]) => JSON.stringify(round(value)) !== JSON.stringify(round(defaults[name]))
    )
  );

const aspectOf = doc => {
  const ratio = ratioOf(doc.artboard);
  return `${ratio.w} / ${ratio.h}`;
};

export const componentName = name =>
  (String(name || 'Logo')
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[^a-zA-Z]+/, '')
    .replace(/^./, char => char.toUpperCase()) || 'Logo') + (/(logo|mark)$/i.test(name || '') ? '' : 'Mark');

export function materialCode(doc, { assetName = 'logo.svg' } = {}) {
  const material = materialFor(doc);
  const name = componentName(doc.name);
  if (material.kind === 'procedural') {
    return proceduralCode(material.def, material.props, {
      name,
      gloss: doc.effects.gloss,
      assetName,
      aspect: aspectOf(doc)
    });
  }
  if (material.kind === 'metal') {
    const props = changed(
      Object.fromEntries(METAL_DEFINITIONS.map(item => [item.name, material.props[item.name] ?? item.default])),
      METALLIC_DEFAULTS
    );
    const list = propsString({ imageSrc: '__LOGO__', ...props, scale: 1 }, '        ').replace(
      'imageSrc="__LOGO__"',
      'imageSrc={logo}'
    );
    return {
      install: 'npx shadcn@latest add "https://reactbits.dev/default/animations/metallic-paint"',
      code: `import MetallicPaint from './MetallicPaint';
import logo from './${assetName}';

export default function ${name}() {
  return (
    <div style={{ width: 480, aspectRatio: '${aspectOf(doc)}' }}>
      <MetallicPaint
${list}
      />
    </div>
  );
}
`
    };
  }
  if (material.kind === 'background') {
    const entry = material.entry;
    const defaults = backgroundDefaults(entry);
    const props = changed(backgroundValues(material), defaults);
    const component = entry.label.replace(/[^a-zA-Z0-9]/g, '');
    const list = Object.keys(props).length ? `\n${propsString(props, '        ')}\n      ` : ' ';
    return {
      install: entry.installCommand,
      code: `import ${component} from './${component}';
import logo from './${assetName}';

export default function ${name}() {
  return (
    <div
      style={{
        width: 480,
        aspectRatio: '${aspectOf(doc)}',
        background: '${doc.material.base ?? '#0c0b10'}',
        WebkitMaskImage: \`url(\${logo})\`,
        maskImage: \`url(\${logo})\`,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%'
      }}
    >
      <${component}${list}/>
    </div>
  );
}
`
    };
  }
  return null;
}
