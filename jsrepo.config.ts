import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Output, type RegistryItem, type RegistryItemFile } from 'jsrepo';
import { output } from '@jsrepo/shadcn';
import { type Category, componentMetadata, type Variant } from './src/constants/Information';
import { SOUNDS } from './src/tools/sound-lab/sounds/catalog';
import { fileName, registryName } from './src/tools/sound-lab/export/code';

const SOUND_LANGUAGES = [
  { variant: 'JS', extension: 'js' },
  { variant: 'TS', extension: 'ts' }
] as const;

const soundFile = (extension: string, name: string): RegistryItemFile => ({
  path: `src/sounds/${extension}/${name}.${extension}`,
  target: `@components/sounds/${name}.${extension}`
});

export default defineConfig({
  registry: {
    name: '@react-bits',
    description:
      'An open source collection of animated, interactive & fully customizable React components for building stunning, memorable user interfaces.',
    homepage: 'https://reactbits.dev',
    authors: ['David Haz'],
    bugs: 'https://github.com/DavidHDev/react-bits/issues',
    repository: 'https://github.com/DavidHDev/react-bits',
    tags: [
      'react',
      'javascript',
      'components',
      'web',
      'reactjs',
      'css-animations',
      'component-library',
      'ui-components',
      '3d',
      'ui-library',
      'tailwind',
      'tailwindcss',
      'components',
      'components-library'
    ],
    excludeDeps: ['react'],
    outputs: [withLinkedDependencies(output({ dir: 'public/r', format: true }), 'public/r')],
    items: [
      ...Object.values(componentMetadata).map(component =>
        defineComponent({
          title: component.name,
          description: component.description,
          category: component.category,
          categories: [component.category],
          meta: component.meta,
          variants: component.variants
        })
      ),
      ...defineSoundEngine(),
      ...SOUNDS.map(sound => defineSound(sound))
    ].flat()
  }
});

function defineSoundEngine(): RegistryItem[] {
  return SOUND_LANGUAGES.map(({ variant, extension }) => ({
    title: 'SoundEngine',
    name: `SoundEngine-${variant}`,
    description: 'The tiny Web Audio engine that renders and plays React Bits sounds, with a useSound hook.',
    type: 'registry:component',
    categories: ['Sounds'],
    files: [soundFile(extension, 'react-bits-sound')]
  }));
}

function defineSound(sound: { id: string; name: string; description: string }): RegistryItem[] {
  const title = registryName(sound);
  return SOUND_LANGUAGES.map(({ variant, extension }) => ({
    title,
    name: `${title}-${variant}`,
    description: sound.description,
    type: 'registry:component',
    categories: ['Sounds'],
    registryDependencies: [`SoundEngine-${variant}`],
    files: [soundFile(extension, fileName(sound))]
  }));
}

function withLinkedDependencies(base: Output, dir: string): Output {
  return {
    ...base,
    output: async (registry, options) => {
      await base.output(registry, options);
      for (const item of registry.items) {
        if (!item.registryDependencies?.length) continue;
        const file = path.join(options.cwd, dir, `${item.name}.json`);
        const json = JSON.parse(fs.readFileSync(file, 'utf8'));
        json.registryDependencies = item.registryDependencies.map(name => `${registry.homepage}/r/${name}.json`);
        fs.writeFileSync(file, JSON.stringify(json, null, '\t'));
      }
    }
  };
}

/**
 * Define a component to be exposed from the registry. Creates the 4 different variants of the component and ensures the correct files are included.
 *
 * @param title The title of the component.
 * @param description The description of the component.
 * @param category The category of the component.
 * @param categories Organize the component into multiple categories.
 * @param meta Optional meta data for the component.
 * @param variants The variants of the component that are available through the registry (default: all variants)
 * @returns An array of RegistryItem objects.
 */
function defineComponent({
  title,
  description,
  category,
  categories,
  meta,
  variants = ['JS-CSS', 'JS-TW', 'TS-CSS', 'TS-TW']
}: {
  title: string;
  description: string;
  category: Category;
  categories?: string[];
  meta?: Record<string, string>;
  variants?: readonly Variant[];
}): RegistryItem[] {
  const baseItem: Omit<RegistryItem, 'files' | 'name'> = {
    title,
    description,
    type: 'registry:component',
    categories: [category, ...(categories ?? [])],
    meta
  };

  const filesForVariant = (basePath: string, styleFile?: string): RegistryItemFile[] => {
    // Variants without a stylesheet can ship the whole folder as-is.
    if (!styleFile || !fs.existsSync(`${basePath}/${styleFile}`)) return [{ path: basePath }];

    // A folder can't declare a type per file, so variants that ship a stylesheet are listed file by
    // file to give the stylesheet its own type. See defineStylesheet.
    return fs
      .readdirSync(basePath)
      .sort()
      .map(file => (file === styleFile ? defineStylesheet(basePath, file) : { path: `${basePath}/${file}` }));
  };

  // this might warrant a bit of explanation
  // basically we check if the variant is included in the variants array and if so we return the item as part of an array
  // otherwise we return an empty array
  // we then spread that array empty or otherwise into the return array
  return [
    // JS + CSS
    ...(variants.includes('JS-CSS')
      ? [
          {
            ...baseItem,
            name: `${baseItem.title}-JS-CSS`,
            files: filesForVariant(`src/content/${category}/${title}`, `${title}.css`)
          }
        ]
      : []),

    // JS + Tailwind
    ...(variants.includes('JS-TW')
      ? [
          {
            ...baseItem,
            name: `${baseItem.title}-JS-TW`,
            files: filesForVariant(`src/tailwind/${category}/${title}`)
          }
        ]
      : []),

    // TS + CSS
    ...(variants.includes('TS-CSS')
      ? [
          {
            ...baseItem,
            name: `${baseItem.title}-TS-CSS`,
            files: filesForVariant(`src/ts-default/${category}/${title}`, `${title}.css`)
          }
        ]
      : []),

    // TS + Tailwind
    ...(variants.includes('TS-TW')
      ? [
          {
            ...baseItem,
            name: `${baseItem.title}-TS-TW`,
            files: filesForVariant(`src/ts-tailwind/${category}/${title}`)
          }
        ]
      : [])
  ];
}

/**
 * Define a stylesheet to be exposed from the registry.
 *
 * The shadcn CLI parses every file it installs as JavaScript/TypeScript unless the file is typed as
 * `registry:file`, so a stylesheet shipped as `registry:component` makes `shadcn add` fail with
 * `Unexpected token (1:0)`. `registry:file` requires an explicit target, and pointing it at the
 * `components` alias puts the stylesheet next to the component itself so the component's relative
 * `./<Component>.css` import keeps resolving.
 *
 * @param basePath The path to the component folder.
 * @param styleFile The name of the stylesheet inside that folder.
 * @returns A RegistryItemFile object for the stylesheet.
 */
function defineStylesheet(basePath: string, styleFile: string): RegistryItemFile {
  return {
    path: `${basePath}/${styleFile}`,
    type: 'file',
    target: `@components/${styleFile}`
  };
}
