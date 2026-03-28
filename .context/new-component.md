# React Bits – New Component Creation Context

This file provides complete, concrete context for an AI agent to reliably create new components in this repository. It is based on the OrbitImages component as a reference implementation.

---

## 0. Prerequisites

Run the scaffolding script first. It creates empty files and registers the component in `Components.js`, `Categories.js`, and `Information.js` automatically.

```bash
npm run new:component -- <Category> <ComponentName>
# Example: npm run new:component -- Animations OrbitImages
```

This creates:

- `src/content/<Category>/<ComponentName>/<ComponentName>.jsx` (empty)
- `src/content/<Category>/<ComponentName>/<ComponentName>.css` (empty)
- `src/tailwind/<Category>/<ComponentName>/<ComponentName>.jsx` (empty)
- `src/ts-default/<Category>/<ComponentName>/<ComponentName>.tsx` (empty)
- `src/ts-default/<Category>/<ComponentName>/<ComponentName>.css` (empty)
- `src/ts-tailwind/<Category>/<ComponentName>/<ComponentName>.tsx` (empty)
- `src/demo/<Category>/<ComponentName>Demo.jsx` (scaffold with Noise component placeholder)
- `src/constants/code/<Category>/<camelCaseName>Code.js` (empty)
- Entries in `Components.js`, `Categories.js`, `Information.js`

After scaffolding, you fill in the 8 files (4 variants + demo + code metadata + 2 CSS files for CSS variants).

---

## 1. Four Variant Rules

All four variants must produce **identical visual output and behavior**. The differences are only:

| Variant       | Path                                   | Language   | Styling                               |
| ------------- | -------------------------------------- | ---------- | ------------------------------------- |
| JS + CSS      | `src/content/…/<Name>.jsx` + `.css`    | JavaScript | CSS classes imported via `./Name.css` |
| JS + Tailwind | `src/tailwind/…/<Name>.jsx`            | JavaScript | Tailwind utility classes inline       |
| TS + CSS      | `src/ts-default/…/<Name>.tsx` + `.css` | TypeScript | CSS classes imported via `./Name.css` |
| TS + Tailwind | `src/ts-tailwind/…/<Name>.tsx`         | TypeScript | Tailwind utility classes inline       |

### JS + CSS variant rules

- Import `'./ComponentName.css'`
- Use named CSS classes for layout/styling (e.g. `.orbit-container`, `.orbit-item`)
- No TypeScript, no type annotations
- Props destructured with defaults in function signature
- `export default function ComponentName({ ... }) {}`

### JS + Tailwind variant rules

- **No** CSS import
- Replace every CSS class with Tailwind utility classes inline
- Same logic, same props, same defaults as JS+CSS

### TS + CSS variant rules

- Same CSS file content (duplicated into `ts-default/`)
- Import `'./ComponentName.css'`
- Add TypeScript `interface` for props
- Add `type` aliases for union types
- Type all refs: `useRef<HTMLDivElement>(null)`
- Type function params and return types for helpers
- Type motion values: `MotionValue<number>`

### TS + Tailwind variant rules

- **No** CSS import
- TypeScript interfaces + types (same as TS+CSS)
- Tailwind utility classes inline (same as JS+Tailwind)
- **No `cn()` utility**

### CSS file conventions

- Use component-scoped class names prefixed with component name (e.g. `.orbit-container`, `.orbit-item`)
- The CSS file in `ts-default/` is an exact copy of the one in `content/`
- Keep styles minimal – only what's needed for layout/positioning

---

## 2. Demo File Pattern

Location: `src/demo/<Category>/<ComponentName>Demo.jsx`

### Standard imports

```jsx
import { useMemo } from 'react';
import { Flex } from '@chakra-ui/react'; // or Box, depending on layout needs
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import CodeExample from '../../components/code/CodeExample';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

// Import the JS+CSS component (always from content/)
import ComponentName from '../../content/<Category>/<ComponentName>/<ComponentName>';
// Import code metadata
import { camelCaseName } from '../../constants/code/<Category>/<camelCaseName>Code';
```

### Demo structure

```jsx
const DEFAULT_PROPS = {
  // Only include props that have demo controls
  someProp: defaultValue
};

const ComponentNameDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { someProp } = props;

  const propData = useMemo(
    () => [
      // ALL public props documented, not just controlled ones
      { name: 'propName', type: 'type', default: 'value', description: 'Description.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Flex
            overflow="hidden"
            justifyContent="center"
            alignItems="center"
            minH="400px"
            position="relative"
            className="demo-container"
          >
            <ComponentName key={key} {...controlledProps} />
            <RefreshButton onClick={forceRerender} />
          </Flex>

          <Customize>{/* Controls here */}</Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['dep1']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={camelCaseName} componentName="ComponentName" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ComponentNameDemo;
```

### Control types

```jsx
// Slider
<PreviewSlider
  title="Label"
  min={0} max={100} step={1}
  value={propValue}
  valueUnit="px"  // optional suffix
  onChange={val => { updateProp('propName', val); forceRerender(); }}
/>

// Switch (boolean toggle)
<PreviewSwitch
  title="Label"
  isChecked={propValue}
  onChange={checked => { updateProp('propName', checked); forceRerender(); }}
/>

// Select (dropdown)
<PreviewSelect
  title="Label"
  name="unique-name"
  width={140}
  value={propValue}
  options={[{ label: 'Display', value: 'value' }]}
  onChange={val => { updateProp('propName', val); forceRerender(); }}
/>
```

### When to call `forceRerender()`

- Always call it for props that affect animation initialization or layout
- For live-updating props (like autoplay toggle), it may not be needed
- When in doubt, call it

---

## 3. Code Metadata File

Location: `src/constants/code/<Category>/<camelCaseName>Code.js`

```js
import code from '@content/<Category>/<ComponentName>/<ComponentName>.jsx?raw';
import css from '@content/<Category>/<ComponentName>/<ComponentName>.css?raw';
import tailwind from '@tailwind/<Category>/<ComponentName>/<ComponentName>.jsx?raw';
import tsCode from '@ts-default/<Category>/<ComponentName>/<ComponentName>.tsx?raw';
import tsTailwind from '@ts-tailwind/<Category>/<ComponentName>/<ComponentName>.tsx?raw';

export const camelCaseName = {
  dependencies: `dep1 dep2`, // space-separated npm package names
  usage: `import ComponentName from './ComponentName'

<ComponentName
  prop1={value1}
  prop2={value2}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
```

- `dependencies`: space-separated string of npm packages (e.g. `"motion"`, `"gsap"`)
- `usage`: JSX code snippet showing basic usage (imports + JSX)
- Path aliases: `@content`, `@tailwind`, `@ts-default`, `@ts-tailwind` map to `src/content`, `src/tailwind`, etc.
- The `?raw` suffix imports file contents as a raw string (Vite feature)

---

## 4. Registration (Auto-generated by scaffolding)

These are handled by `npm run new:component` but for reference:

### `src/constants/Components.js`

```js
'kebab-case-name': () => import('../demo/<Category>/<ComponentName>Demo')
```

### `src/constants/Categories.js`

Component name added to the category's subcategories array and optionally to `NEW` array:

```js
export const NEW = ['Component Name', ...];
// And in the subcategories:
{ heading: 'Category', subcategories: ['Component Name', ...] }
```

### `src/constants/Information.js`

```js
'Category/ComponentName': {
  videoUrl: '/assets/video/componentname.webm',
  description: 'Short description.',
  category: 'Category',
  name: 'ComponentName',
  docsUrl: 'https://reactbits.dev/category/kebab-case-name',
  tags: []
},
```

---

## 5. Background Studio (backgrounds only)

If the component is in the `Backgrounds` category, also register it in:
`src/tools/background-studio/backgrounds/index.js`

And add `OpenInStudioButton` to the demo:

```jsx
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

// After the preview, before <Customize>:
<Flex justify="flex-end" mt={2} mb={-2}>
  <OpenInStudioButton backgroundId="kebab-case-id" currentProps={{ ...controlledProps }} defaultProps={DEFAULT_PROPS} />
</Flex>;
```

---

## 6. Naming Conventions

| Context               | Format                        | Example              |
| --------------------- | ----------------------------- | -------------------- |
| Component name        | PascalCase                    | `OrbitImages`        |
| File names            | PascalCase matching component | `OrbitImages.jsx`    |
| CSS class prefix      | kebab-case component name     | `.orbit-container`   |
| Route slug            | kebab-case                    | `orbit-images`       |
| Code metadata export  | camelCase                     | `orbitImages`        |
| Code metadata file    | camelCase + `Code.js`         | `orbitImagesCode.js` |
| Category display name | Space-separated               | `Orbit Images`       |
| Folder name           | PascalCase                    | `OrbitImages/`       |

---

## 7. Checklist

Before considering a component complete:

- [ ] All 4 variant files are implemented with identical behavior
- [ ] CSS files in `content/` and `ts-default/` are identical
- [ ] TS variants have proper interfaces and type annotations
- [ ] Demo imports from `content/` (JS+CSS variant)
- [ ] Demo has `DEFAULT_PROPS`, `useComponentProps`, `ComponentPropsProvider`
- [ ] Demo has `RefreshButton`, `Customize` controls, `PropTable`, `Dependencies`
- [ ] Demo has `CodeTab` with `CodeExample`
- [ ] Code metadata uses `?raw` imports with correct path aliases
- [ ] Code metadata has `dependencies`, `usage`, `code`, `css`, `tailwind`, `tsCode`, `tsTailwind`
- [ ] Component is registered in `Components.js`, `Categories.js`, and `Information.js`
- [ ] Props/defaults are consistent across component, demo, and code metadata usage example
