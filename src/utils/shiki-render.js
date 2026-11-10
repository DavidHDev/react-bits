import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import css from '@shikijs/langs/css';
import json from '@shikijs/langs/json';
import jsx from '@shikijs/langs/jsx';
import shellscript from '@shikijs/langs/shellscript';
import tsx from '@shikijs/langs/tsx';
import { reactBitsDarkTheme, reactBitsLightTheme } from './shiki-themes';

const LANGUAGE_ALIASES = {
  js: 'jsx',
  javascript: 'jsx',
  ts: 'tsx',
  typescript: 'tsx',
  bash: 'shellscript',
  sh: 'shellscript',
  shell: 'shellscript',
  zsh: 'shellscript'
};

let highlighterPromise = null;

export const renderCode = async (code, language = 'jsx') => {
  highlighterPromise ||= createHighlighterCore({
    themes: [reactBitsLightTheme, reactBitsDarkTheme],
    langs: [jsx, tsx, css, shellscript, json],
    engine: createJavaScriptRegexEngine()
  });
  const highlighter = await highlighterPromise;
  const lang = LANGUAGE_ALIASES[language] || language || 'jsx';

  return highlighter.codeToHtml(String(code), {
    lang,
    themes: {
      light: 'react-bits-light',
      dark: 'react-bits-dark'
    },
    defaultColor: false
  });
};
