const variantForShadcn = (language, style) =>
  `${(language || 'JS').toUpperCase()}-${(style || 'CSS').toUpperCase().replace('TAILWIND', 'TW')}`;

const UPPERCASE_PARTS = new Set(['ascii', 'crt']);

const slugToComponentName = slug => {
  if (!slug) return '';
  return slug
    .split('-')
    .map(part => {
      if (UPPERCASE_PARTS.has(part.toLowerCase())) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
};

export const generateCliCommands = (language, style, category, subcategory, dependencies = '') => {
  if (!category || !subcategory) return null;

  const shadcnVariant = category === 'sounds' ? (language || 'JS').toUpperCase() : variantForShadcn(language, style);

  const componentName = slugToComponentName(subcategory);
  const baseUrl = 'https://reactbits.dev';

  const jsrepoUrl = `${baseUrl}/r/${componentName}-${shadcnVariant}`;
  const shadcnUrl = `@react-bits/${componentName}-${shadcnVariant}`;

  const prefixCommands = {
    pnpm: 'pnpm dlx',
    npx: 'npx',
    yarn: 'yarn',
    bun: 'bun x --bun'
  };

  const jsrepo = Object.fromEntries(
    Object.entries(prefixCommands).map(([mgr, prefix]) => [mgr, `${prefix} jsrepo@latest add ${jsrepoUrl}`])
  );

  const shadcn = Object.fromEntries(
    Object.entries(prefixCommands).map(([mgr, prefix]) => [mgr, `${prefix} shadcn@latest add ${shadcnUrl}`])
  );

  const depsString = typeof dependencies === 'string' ? dependencies.trim() : '';
  const manual = depsString
    ? {
        pnpm: `pnpm add ${depsString}`,
        npm: `npm install ${depsString}`,
        yarn: `yarn add ${depsString}`,
        bun: `bun add ${depsString}`
      }
    : null;

  return { manual, jsrepo, shadcn };
};
