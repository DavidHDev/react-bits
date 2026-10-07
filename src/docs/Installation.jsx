import DocsButtonBar from './DocsButtonBar';
import CodeBlock from './CodeBlock';
import CommandList from './CommandList';
import CopyPageButton from './CopyPageButton';
import DocsStep from './DocsStep';
import useScrollToTop from '../hooks/useScrollToTop';
import { useOptions } from '../components/context/OptionsContext/useOptions';

const USAGE = `import SplitText from "./SplitText";

<SplitText
  text="Hello, you!"
  delay={100}
  duration={0.6}
/>`;

const Installation = () => {
  const { languagePreset, stylePreset } = useOptions();

  useScrollToTop();

  const language = languagePreset === 'TS' ? 'TS' : 'JS';
  const variant = `${language}-${stylePreset === 'TW' ? 'TW' : 'CSS'}`;

  const commands = [
    { key: 'shadcn', label: 'shadcn', command: `npx shadcn@latest add @react-bits/SplitText-${variant}` },
    { key: 'jsrepo', label: 'jsrepo', command: `npx jsrepo@latest add https://reactbits.dev/r/SplitText-${variant}` }
  ];

  return (
    <section className="docs-section">
      <div className="docs-page-header">
        <h1 className="docs-title">Installation</h1>
        <CopyPageButton />
      </div>

      <p className="docs-lead">
        Every component installs as source code you own. Pull it in with one CLI command, or copy the files by hand.
      </p>

      <h2 className="docs-section-title">With the CLI</h2>

      <ol className="docs-steps">
        <DocsStep index={1} title="Run the add command">
          <p className="docs-step-text">Use whichever CLI you already have. Both install the same source.</p>
          <CommandList items={commands} />
          <p className="docs-step-note">
            Swap <code>SplitText</code> for any component. The <code>{variant}</code> ending picks the variant: JS or
            TS, then CSS or TW. On pnpm, yarn or bun, replace <code>npx</code> with <code>pnpm dlx</code>,{' '}
            <code>yarn</code> or <code>bun x --bun</code>.
          </p>
        </DocsStep>

        <DocsStep index={2} title="Import and use it">
          <p className="docs-step-text">Render it like any other component:</p>
          <CodeBlock language="jsx" showLineNumbers>
            {USAGE}
          </CodeBlock>
        </DocsStep>
      </ol>

      <h2 className="docs-section-title">By hand</h2>

      <ol className="docs-steps">
        <DocsStep index={1} title="Open a component's Code tab">
          <p className="docs-step-text">
            It shows the full source. Pick JavaScript or TypeScript and CSS or Tailwind in the Preferences menu in the
            header, and every Code tab follows.
          </p>
        </DocsStep>

        <DocsStep index={2} title="Copy the files into your project">
          <p className="docs-step-text">
            Paste the component into a new file, for example <code>SplitText.{language === 'TS' ? 'tsx' : 'jsx'}</code>.
          </p>
        </DocsStep>

        <DocsStep index={3} title="Install its dependencies">
          <p className="docs-step-text">The Code tab lists what each component needs. Split Text uses GSAP:</p>
          <CodeBlock language="bash">npm install gsap</CodeBlock>
        </DocsStep>

        <DocsStep index={4} title="Import and use it">
          <p className="docs-step-text">Import and render it the same way as the CLI example above.</p>
        </DocsStep>
      </ol>

      <h2 className="docs-section-title">That&apos;s all</h2>

      <p className="docs-paragraph">The code is yours now, so change the styles, props or behavior however you like.</p>

      <DocsButtonBar
        next={{ label: 'MCP Server', route: '/get-started/mcp' }}
        previous={{ label: 'Introduction', route: '/get-started/introduction' }}
      />
    </section>
  );
};

export default Installation;
