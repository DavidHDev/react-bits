import { useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Copy01Icon,
  Download04Icon,
  File01Icon,
  Share08Icon,
  Tick02Icon
} from '@hugeicons/core-free-icons';
import ShikiCode from '../code/ShikiCode';
import { dateLabel } from '../common/AdventCalendar/days';
import ScrollArea from './ScrollArea';
import { zipFiles } from './zip';
import './GiftView.css';

const LANGUAGE = {
  tsx: 'tsx',
  ts: 'tsx',
  jsx: 'jsx',
  js: 'jsx',
  mjs: 'jsx',
  css: 'css',
  json: 'json',
  md: 'text',
  sql: 'text',
  gitignore: 'text',
  example: 'shellscript',
  svg: 'jsx',
  html: 'jsx',
  sh: 'shellscript'
};

const languageOf = path => LANGUAGE[path.split('.').pop()] || 'jsx';

const useFlash = () => {
  const [on, setOn] = useState(false);
  const flash = () => {
    setOn(true);
    window.setTimeout(() => setOn(false), 1800);
  };
  return [on, flash];
};

const CopyButton = ({ text, label }) => {
  const [done, flash] = useFlash();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      flash();
    } catch {
      return;
    }
  };
  return (
    <button type="button" className="agv-icon-btn" onClick={copy} aria-label={done ? 'Copied' : label}>
      <HugeiconsIcon icon={done ? Tick02Icon : Copy01Icon} size={15} strokeWidth={1.8} />
    </button>
  );
};

const Segmented = ({ value, options, onChange, label }) => (
  <div className="agv-seg" role="tablist" aria-label={label}>
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        role="tab"
        aria-selected={value === option.value}
        className={`agv-seg-item${value === option.value ? ' is-active' : ''}`}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const STYLES = [
  { value: 'tw', label: 'Tailwind', name: 'tailwind' },
  { value: 'css', label: 'CSS', name: 'css' }
];

const LANGUAGES = [
  { value: 'ts', label: 'TypeScript' },
  { value: 'js', label: 'JavaScript' }
];

const PREFERENCE = 'rb-advent-code';

const readPreference = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFERENCE)) || {};
  } catch {
    return {};
  }
};

const TREE_FROM = 9;
const START = 'README.md';

const keyOf = path => path.replace(/\.[jt]s(x?)$/, '.s$1').replace(/\.mjs$/, '.s');

const branch = () => ({ folders: new Map(), files: [] });

const toTree = files => {
  const root = branch();
  files.forEach(file => {
    let node = root;
    file.path
      .split('/')
      .slice(0, -1)
      .forEach(part => {
        if (!node.folders.has(part)) node.folders.set(part, branch());
        node = node.folders.get(part);
      });
    node.files.push(file);
  });
  return root;
};

const FileTree = ({ files, current, onPick }) => {
  const tree = useMemo(() => toTree(files), [files]);
  const [closed, setClosed] = useState(() => new Set());

  const toggle = path =>
    setClosed(previous => {
      const next = new Set(previous);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const rows = [];
  const visit = (node, base, depth) => {
    [...node.folders.keys()].sort().forEach(name => {
      const path = `${base}${name}/`;
      const open = !closed.has(path);
      rows.push(
        <button
          key={path}
          type="button"
          className="agv-tree-row"
          style={{ '--agv-depth': depth }}
          aria-expanded={open}
          onClick={() => toggle(path)}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={13} strokeWidth={2} aria-hidden="true" />
          {name}
        </button>
      );
      if (open) visit(node.folders.get(name), path, depth + 1);
    });
    node.files.forEach(file => {
      const active = file === current;
      rows.push(
        <button
          key={file.path}
          type="button"
          className={`agv-tree-row${active ? ' is-active' : ''}`}
          style={{ '--agv-depth': depth }}
          aria-current={active ? 'true' : undefined}
          onClick={() => onPick(file)}
        >
          <HugeiconsIcon icon={File01Icon} size={13} strokeWidth={1.8} aria-hidden="true" />
          {file.path.split('/').pop()}
        </button>
      );
    });
  };
  visit(tree, '', 0);

  return (
    <nav className="agv-tree-list" aria-label="Files">
      {rows}
    </nav>
  );
};

const Files = ({ files, slug }) => {
  const groups = useMemo(() => (files.ts ? { all: files } : files), [files]);
  const styles = STYLES.filter(option => groups[option.value]);
  const [choice, setChoice] = useState(readPreference);
  const [picked, setPicked] = useState(null);
  const style = styles.find(option => option.value === choice.style) || styles[0];
  const group = (style ? groups[style.value] : groups.all) || {};
  const languages = LANGUAGES.filter(option => group[option.value]?.length);
  const language = languages.find(option => option.value === choice.language) || languages[0];
  const list = (language && group[language.value]) || [];
  const browse = list.length >= TREE_FROM;
  const file =
    list.find(item => keyOf(item.path) === picked) || (browse && list.find(item => item.path === START)) || list[0];

  const choose = patch => {
    const next = { ...choice, ...patch };
    setChoice(next);
    try {
      localStorage.setItem(PREFERENCE, JSON.stringify(next));
    } catch {
      return;
    }
  };

  const download = () => {
    const suffix = [styles.length > 1 ? style.name : '', languages.length > 1 ? language.value : '']
      .filter(Boolean)
      .map(part => `-${part}`)
      .join('');
    const blob = zipFiles(list);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}${suffix}.zip`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!file) return null;

  return (
    <div className="agv-files">
      <div className="agv-files-bar">
        {browse ? (
          <p className="agv-path">
            {file.path.slice(0, file.path.lastIndexOf('/') + 1)}
            <span className="agv-path-name">{file.path.split('/').pop()}</span>
          </p>
        ) : (
          <div className="agv-tabs" role="tablist" aria-label="Files">
            {list.map(item => (
              <button
                key={item.path}
                type="button"
                role="tab"
                aria-selected={item === file}
                className={`agv-tab${item === file ? ' is-active' : ''}`}
                onClick={() => setPicked(keyOf(item.path))}
              >
                {item.path.split('/').pop()}
              </button>
            ))}
          </div>
        )}
        {(languages.length > 1 || styles.length > 1) && (
          <div className="agv-files-switches">
            {languages.length > 1 && (
              <Segmented
                value={language.value}
                options={languages}
                onChange={value => choose({ language: value })}
                label="Language"
              />
            )}
            {styles.length > 1 && (
              <Segmented
                value={style.value}
                options={styles}
                onChange={value => choose({ style: value })}
                label="Styling"
              />
            )}
          </div>
        )}
        <div className="agv-files-tools">
          <CopyButton text={file.code} label={`Copy ${file.path}`} />
          <button type="button" className="agv-icon-btn" onClick={download} aria-label="Download all files">
            <HugeiconsIcon icon={Download04Icon} size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <div className={`agv-files-body${browse ? ' has-tree' : ''}`}>
        {browse && (
          <ScrollArea className="agv-tree" label="Files">
            <FileTree files={list} current={file} onPick={item => setPicked(keyOf(item.path))} />
          </ScrollArea>
        )}
        <ScrollArea
          className="agv-code"
          label={`${file.path} source`}
          resetKey={`${style?.value}:${language?.value}:${file.path}`}
        >
          <ShikiCode code={file.code} language={languageOf(file.path)} />
        </ScrollArea>
      </div>
    </div>
  );
};

const GiftView = ({ day, meta, Demo, files, deps = [], theme, onCalendar }) => {
  const [shared, flashShared] = useFlash();
  const install = deps.length ? `npm install ${deps.join(' ')}` : '';

  const share = async () => {
    const url = `https://reactbits.dev/advent/${day}`;
    try {
      if (navigator.share && window.matchMedia?.('(pointer: coarse)').matches) {
        await navigator.share({ title: `${meta.title} | React Bits Advent`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flashShared();
    } catch {
      return;
    }
  };

  return (
    <div className="agv">
      <header className="agv-head">
        <div className="agv-actions">
          <button type="button" className="agv-action agv-back" onClick={onCalendar}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>Advent calendar</span>
          </button>
          <button type="button" className="agv-action" onClick={share}>
            <HugeiconsIcon icon={shared ? Tick02Icon : Share08Icon} size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>{shared ? 'Link copied' : 'Share'}</span>
          </button>
        </div>
        <p className="agv-eyebrow">
          <span className="agv-day">Day {day}</span>
          <span aria-hidden="true">·</span>
          {dateLabel(day)}
        </p>
        <h1 className="agv-title">{meta.title}</h1>
        <p className="agv-sub">{meta.summary}</p>
      </header>
      <div className={`agv-stage${meta.stage === 'tall' ? ' agv-stage--tall' : ''}`}>
        {Demo ? <Demo theme={theme} /> : null}
      </div>
      {(install || files) && (
        <section className="agv-get">
          <h2 className="agv-get-title">Get it</h2>
          {install && (
            <div className="agv-install">
              <code>{install}</code>
              <CopyButton text={install} label="Copy install command" />
            </div>
          )}
          {meta.notes && <p className="agv-notes">{meta.notes}</p>}
          {files && <Files files={files} slug={meta.slug || `day-${day}`} />}
        </section>
      )}
    </div>
  );
};

export default GiftView;
