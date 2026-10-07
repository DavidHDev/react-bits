import { useState } from 'react';
import { TbCheck, TbCopy } from 'react-icons/tb';

const COPY_RESET_MS = 2000;

export const CopyButton = ({ text, label = 'Copy command' }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_RESET_MS);
  };

  return (
    <button
      type="button"
      className="docs-row-copy"
      onClick={copy}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied!' : label}
    >
      {copied ? <TbCheck /> : <TbCopy />}
    </button>
  );
};

const CommandList = ({ items }) => (
  <ul className="docs-cmds">
    {items.map(item => (
      <li className="docs-cmd" key={item.key}>
        <span className="docs-cmd-head">
          {item.icon}
          {item.label}
        </span>
        <span className={`docs-cmd-line${item.command.includes('\n') ? ' is-block' : ''}`}>
          <code className="docs-cmd-code">{item.command}</code>
          <CopyButton text={item.command} />
        </span>
        {item.note && <span className="docs-cmd-note">{item.note}</span>}
      </li>
    ))}
  </ul>
);

export default CommandList;
