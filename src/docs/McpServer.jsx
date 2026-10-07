import { LuArrowUpRight } from 'react-icons/lu';
import { TbBrandOpenai } from 'react-icons/tb';
import DocsButtonBar from './DocsButtonBar';
import CodeBlock from './CodeBlock';
import CommandList, { CopyButton } from './CommandList';
import CopyPageButton from './CopyPageButton';
import DocsStep from './DocsStep';
import useScrollToTop from '../hooks/useScrollToTop';
import claude from '../assets/icons/claude.svg';
import vscode from '../assets/icons/vscode.svg';
import cursor from '../assets/icons/cursor.svg';

const LOGO = { width: '15px', height: '15px' };

const CLIENTS = [
  {
    key: 'claude',
    icon: <img src={claude} alt="" style={LOGO} />,
    label: 'Claude Code',
    command: 'npx shadcn@latest mcp init --client claude',
    note: (
      <>
        Then restart Claude Code. If the server doesn&apos;t show up, run <code>/mcp</code> to debug it.
      </>
    )
  },
  {
    key: 'codex',
    icon: <TbBrandOpenai size={15} aria-hidden="true" />,
    label: 'Codex',
    command: `[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]`,
    note: (
      <>
        The CLI can&apos;t set up Codex for you. Add this to <code>~/.codex/config.toml</code>, then restart Codex.
      </>
    )
  },
  {
    key: 'cursor',
    icon: <img src={cursor} alt="" style={LOGO} />,
    label: 'Cursor',
    command: 'npx shadcn@latest mcp init --client cursor',
    note: 'Then open Cursor Settings and enable the shadcn MCP server.'
  },
  {
    key: 'vscode',
    icon: <img src={vscode} alt="" style={LOGO} />,
    label: 'VS Code',
    command: 'npx shadcn@latest mcp init --client vscode',
    note: (
      <>
        Then open <code>.vscode/mcp.json</code> and click Start next to the shadcn server.
      </>
    )
  }
];

const EXAMPLE_PROMPTS = [
  'Show me all the available backgrounds from the React Bits registry',
  'Add the Dither background from React Bits to the page, make it purple',
  'Add a new section which fades in on scroll using FadeContent from React Bits'
];

const REGISTRY_CONFIG = `{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}`;

const McpServer = () => {
  useScrollToTop();

  return (
    <section className="docs-section">
      <div className="docs-page-header">
        <h1 className="docs-title">MCP Server</h1>
        <CopyPageButton />
      </div>

      <p className="docs-lead">
        Let your AI assistant browse, search and install React Bits components for you, straight from a prompt.
      </p>

      <p className="docs-paragraph dim">
        It works through the shadcn MCP server.{' '}
        <a className="docs-inline-link" href="https://modelcontextprotocol.io/" target="_blank" rel="noreferrer">
          Model Context Protocol
        </a>{' '}
        is an open standard that lets AI assistants connect to tools and data.
      </p>

      <h2 className="docs-section-title">Setup</h2>

      <ol className="docs-steps">
        <DocsStep index={1} title="Add the React Bits registry">
          <p className="docs-step-text">
            In your project&apos;s <code>components.json</code>, add <code>@react-bits</code> to the registries:
          </p>
          <CodeBlock language="json" showLineNumbers>
            {REGISTRY_CONFIG}
          </CodeBlock>
        </DocsStep>

        <DocsStep index={2} title="Connect your AI client">
          <p className="docs-step-text">Set up the shadcn MCP server for your client:</p>
          <CommandList items={CLIENTS} />
        </DocsStep>

        <DocsStep index={3} title="Ask for components">
          <p className="docs-step-text">Describe what you want in plain language. Try one of these:</p>
          <ul className="docs-cmds">
            {EXAMPLE_PROMPTS.map(prompt => (
              <li className="docs-prompt" key={prompt}>
                <span className="docs-prompt-text">{prompt}</span>
                <CopyButton text={prompt} label="Copy prompt" />
              </li>
            ))}
          </ul>
        </DocsStep>
      </ol>

      <h2 className="docs-section-title">Learn more</h2>

      <a className="docs-link-tile" href="https://ui.shadcn.com/docs/mcp" target="_blank" rel="noreferrer">
        <span className="docs-link-tile-text">
          <span className="docs-link-tile-title">shadcn MCP documentation</span>
          <span className="docs-link-tile-desc">Manual setup for other clients, and more ways to use the server.</span>
        </span>
        <LuArrowUpRight aria-hidden="true" />
      </a>

      <DocsButtonBar
        next={{ label: 'Browse Components', route: '/get-started/index' }}
        previous={{ label: 'Installation', route: '/get-started/installation' }}
      />
    </section>
  );
};

export default McpServer;
