const TYPE_DEPENDENCIES = {
  three: '@types/three',
  '@react-three/fiber': '@types/three',
  '@react-three/drei': '@types/three',
  'matter-js': '@types/matter-js'
};

const INSTALL_COMMANDS = {
  pnpm: 'pnpm add',
  npm: 'npm install',
  yarn: 'yarn add',
  bun: 'bun add'
};

export const getTypeDependencies = dependencies =>
  [
    ...new Set(
      dependencies
        .map(dependency => {
          const specifier = dependency.replace(/@[^/@]+$/, '');
          const name = specifier
            .split('/')
            .slice(0, specifier.startsWith('@') ? 2 : 1)
            .join('/');
          return TYPE_DEPENDENCIES[name];
        })
        .filter(Boolean)
    )
  ].sort();

export const generateDependencyCommands = (dependencies = '', language = 'JS') => {
  const depsString = typeof dependencies === 'string' ? dependencies.trim() : dependencies.join(' ');
  if (!depsString) return null;

  const typeDependencies =
    (language || 'JS').toUpperCase() === 'TS' ? getTypeDependencies(depsString.split(/\s+/)) : [];

  return Object.fromEntries(
    Object.entries(INSTALL_COMMANDS).map(([manager, command]) => [
      manager,
      `${command} ${depsString}${typeDependencies.length ? ` && ${command} -D ${typeDependencies.join(' ')}` : ''}`
    ])
  );
};
