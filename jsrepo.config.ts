import fs from 'node:fs';
import { defineConfig, type RegistryItem, type RegistryItemFile } from 'jsrepo';
import { output } from '@jsrepo/shadcn';
import { type Category, componentMetadata, type Variant } from './src/constants/Information';

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
    outputs: [output({ dir: 'public/r', format: true })],
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
      )
    ].flat()
  }
});

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
    meta,
    ...(title === 'Lanyard' ? { dependencyResolution: 'manual' as const } : {})
  };

  const filesForVariant = (basePath: string, sourceFile: string, styleFile?: string): RegistryItemFile[] => {
    // Lanyard also ships binary assets (card.glb, lanyard.png) which can't go through the registry,
    // so only its source files are listed instead of the whole folder.
    if (title === 'Lanyard') {
      return [...(styleFile ? [defineStylesheet(basePath, styleFile)] : []), { path: `${basePath}/${sourceFile}` }];
    }

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
            files: filesForVariant(`src/content/${category}/${title}`, `${title}.jsx`, `${title}.css`)
          }
        ]
      : []),

    // JS + Tailwind
    ...(variants.includes('JS-TW')
      ? [
          {
            ...baseItem,
            name: `${baseItem.title}-JS-TW`,
            files: filesForVariant(`src/tailwind/${category}/${title}`, `${title}.jsx`)
          }
        ]
      : []),

    // TS + CSS
    ...(variants.includes('TS-CSS')
      ? [
          {
            ...baseItem,
            name: `${baseItem.title}-TS-CSS`,
            files: filesForVariant(`src/ts-default/${category}/${title}`, `${title}.tsx`, `${title}.css`)
          }
        ]
      : []),

    // TS + Tailwind
    ...(variants.includes('TS-TW')
      ? [
          {
            ...baseItem,
            name: `${baseItem.title}-TS-TW`,
            files: filesForVariant(`src/ts-tailwind/${category}/${title}`, `${title}.tsx`)
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
