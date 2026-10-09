import { generateCliCommands } from '../../../utils/cli';

export function generateExportCode(background, props, options = {}) {
  if (!background) return { commands: null, jsxCode: '' };

  const { label, id } = background;
  const { language = 'JS', style = 'Tailwind' } = options;
  const componentName = label.replace(/\s+/g, '');

  const commands = generateCliCommands(language, style, 'backgrounds', id);

  const allProps = background.props || [];
  const definedPropNames = new Set(allProps.map(propDef => propDef.name));

  const definedPropsEntries = allProps.map(propDef => {
    const value = props[propDef.name] !== undefined ? props[propDef.name] : propDef.default;
    return [propDef.name, value];
  });
  const themePropsEntries = Object.entries(props).filter(([name]) => !definedPropNames.has(name));
  const propsEntries = [...definedPropsEntries, ...themePropsEntries];

  let propsString = '';
  if (propsEntries.length > 0) {
    propsString = propsEntries
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `  ${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? `  ${key}` : `  ${key}={false}`;
        } else if (Array.isArray(value)) {
          return `  ${key}={${JSON.stringify(value)}}`;
        } else if (typeof value === 'object') {
          return `  ${key}={${JSON.stringify(value)}}`;
        } else {
          return `  ${key}={${value}}`;
        }
      })
      .join('\n');
  }

  const jsxCode =
    propsEntries.length > 0
      ? `<div style={{ width: '1080px', height: '1080px', position: 'relative' }}>\n  <${componentName}\n  ${propsString.split('\n').join('\n  ')}\n  />\n</div>`
      : `<div style={{ width: '1080px', height: '1080px', position: 'relative' }}>\n  <${componentName} />\n</div>`;

  return {
    commands,
    jsxCode
  };
}
