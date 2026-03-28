import { useState } from 'react';
import DocsButtonBar from './DocsButtonBar';
import CodeBlock from './CodeBlock';
import MethodSelector from './MethodSelector';
import useScrollToTop from '../hooks/useScrollToTop';
import claude from '../assets/icons/claude.svg';
import vscode from '../assets/icons/vscode.svg';
import cursor from '../assets/icons/cursor.svg';

const IMG_STYLE = { width: '40px', height: '40px' };

const CLIENTS = [
  { key: 'claude', icon: <img src={claude} alt="Claude Code Logo" style={IMG_STYLE} />, label: 'Claude Code' },
  { key: 'cursor', icon: <img src={cursor} alt="Cursor Logo" style={IMG_STYLE} />, label: 'Cursor' },
  { key: 'vscode', icon: <img src={vscode} alt="VS Code Logo" style={IMG_STYLE} />, label: 'VS Code' }
];

const EXAMPLE_PROMPTS = [
  'Show me all the available backgrounds from the React Bits registry',
  'Add the Dither background from React Bits to the page, make it purple',
  'Add a new section which fades in on scroll using FadeContent from React Bits'
];

const PromptList = () => (
  <ul className="docs-list">
    {EXAMPLE_PROMPTS.map(prompt => (
      <li key={prompt} className="docs-list-item dim">
        {prompt}
      </li>
    ))}
  </ul>
);

const ClientInstructions = ({ client }) => {
  const initCommand = `npx shadcn@latest mcp init --client ${client}`;

  return (
    <>
      <p className="docs-paragraph short">Run this in your project:</p>
      <CodeBlock showLineNumbers>{initCommand}</CodeBlock>

      {client === 'claude' && (
        <>
          <p className="docs-paragraph">Restart Claude Code and try prompts like:</p>
          <PromptList />
          <p className="docs-paragraph dim">Tip: Use /mcp in Claude Code to debug the MCP server.</p>
        </>
      )}

      {client === 'cursor' && (
        <>
          <p className="docs-paragraph">
            Then open Cursor Settings and enable the shadcn MCP server. Try prompts like:
          </p>
          <PromptList />
        </>
      )}

      {client === 'vscode' && (
        <>
          <p className="docs-paragraph">
            Then open <span className="docs-highlight">.vscode/mcp.json</span> and click{' '}
            <span className="docs-highlight">Start</span> next to the shadcn server. Try prompts like:
          </p>
          <PromptList />
        </>
      )}
    </>
  );
};

const McpServer = () => {
  const [selectedClient, setSelectedClient] = useState('claude');

  useScrollToTop();

  return (
    <section className="docs-section">
      <h3 className="docs-category-title">MCP Server</h3>

      <p className="docs-paragraph">
        <a
          style={{ textDecoration: 'underline' }}
          href="https://modelcontextprotocol.io/"
          target="_blank"
          rel="noreferrer"
        >
          Model Context Protocol (MCP)
        </a>{' '}
        is an open standard that enables AI assistants to securely connect to external data sources and tools.
      </p>

      <p className="docs-paragraph dim">
        React Bits encourages the use of the shadcn MCP server to browse, search, and install components using natural
        language.
      </p>

      <h3 className="docs-category-title">Quick Start</h3>

      <p className="docs-paragraph">
        Registries are configured in your project&apos;s <span className="docs-highlight">components.json</span> file,
        where you should first add the <span className="docs-highlight">@react-bits</span> registry:
      </p>
      <CodeBlock showLineNumbers>{`{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}`}</CodeBlock>

      <p className="docs-paragraph dim">
        Then, from the options below, select your client & set up the shadcn MCP server.
      </p>

      <MethodSelector methods={CLIENTS} selected={selectedClient} onSelect={setSelectedClient} />

      <ClientInstructions client={selectedClient} />

      <h3 className="docs-category-title">Learn more</h3>

      <p className="docs-paragraph dim" style={{ marginBottom: '16px' }}>
        To learn more about using the shadcn MCP server, including manual setup for different clients, please visit the
        official documentation:
      </p>

      <a
        className="docs-paragraph"
        style={{ textDecoration: 'underline' }}
        href="https://ui.shadcn.com/docs/mcp"
        target="_blank"
        rel="noreferrer"
      >
        ui.shadcn.com/docs/mcp
      </a>

      <DocsButtonBar
        next={{ label: 'Browse Components', route: '/get-started/index' }}
        previous={{ label: 'Installation', route: '/get-started/installation' }}
      />
    </section>
  );
};

export default McpServer;
