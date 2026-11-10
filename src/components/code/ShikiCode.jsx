import { useEffect, useState } from 'react';
import { highlightCode, peekHighlight } from '../../utils/shiki';

const ShikiCode = ({ code, language = 'jsx', showLineNumbers = true }) => {
  const source = String(code ?? '');
  const [html, setHtml] = useState(() => peekHighlight(source, language));

  useEffect(() => {
    let active = true;

    setHtml(peekHighlight(source, language));
    highlightCode(source, language)
      .then(result => {
        if (active) setHtml(result);
      })
      .catch(error => {
        console.error('Failed to highlight code with Shiki:', error);
      });

    return () => {
      active = false;
    };
  }, [source, language]);

  const className = `shiki-code${showLineNumbers ? ' has-line-numbers' : ''}${html ? '' : ' is-loading'}`;

  if (!html) {
    return (
      <div className={className}>
        <pre className="shiki-fallback">
          <code>{source}</code>
        </pre>
      </div>
    );
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default ShikiCode;
