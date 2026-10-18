import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  Copy01Icon,
  Link04Icon,
  MouseScroll01Icon,
  ScreenShareIcon,
  SecurityCheckIcon,
  Tick02Icon
} from '@hugeicons/core-free-icons';
import { Icon } from '../../background-studio/components/ui';
import { pageRoom } from '../capture';

const HELPER_SRC = 'https://reactbits.dev/center-stage.js';
const HELPER_TAG = `<script src="${HELPER_SRC}" async></script>`;
const HELPER_POINTS = [
  'Only answers Center Stage on reactbits.dev or your localhost.',
  'Only scrolls the page and hides sticky bars while it captures.',
  'Reads no content and sends nothing anywhere. Under 3 KB gzipped.'
];
const TITLES = { url: 'Capture a website', helper: 'Automatic scrolling', opened: 'Share the window' };

const copyText = text => {
  const fallback = () => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  };
  if (!navigator.clipboard?.writeText) return Promise.resolve(fallback());
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => fallback()
  );
};

function Option({ icon, label, onClick }) {
  return (
    <button type="button" className="cst-capture-option" onClick={onClick}>
      <Icon icon={icon} size={16} />
      <span>{label}</span>
      <Icon icon={ArrowRight01Icon} size={14} />
    </button>
  );
}

function Helper({ copyRef }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () =>
    copyText(HELPER_TAG).then(done => {
      if (!done) return;
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    });

  return (
    <>
      <p className="cst-capture-lead">
        Optional. Add this tag to your site and Center Stage scrolls it for you, hides sticky headers and keeps
        animations whole.
      </p>
      <div className="cst-snippet">
        <div className="cst-snippet-bar">
          <span>Paste into your site’s head</span>
          <button ref={copyRef} type="button" className="cst-snippet-copy" onClick={copy}>
            <Icon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="cst-snippet-code">
          <span className="cst-code-tag">{'<script '}</span>
          <span className="cst-code-attr">src=</span>
          <span className="cst-code-value">{`"${HELPER_SRC}"`}</span>
          <span className="cst-code-attr"> async</span>
          <span className="cst-code-tag">{'></script>'}</span>
        </pre>
      </div>
      <div className="cst-trust">
        <p className="cst-trust-title">
          <Icon icon={SecurityCheckIcon} size={16} />
          <span>Safe by design</span>
        </p>
        <ul className="cst-trust-list">
          {HELPER_POINTS.map(point => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <a className="cst-trust-link" href="/center-stage.js" target="_blank" rel="noreferrer">
          <span>Read the script</span>
          <Icon icon={ArrowUpRight01Icon} size={14} />
        </a>
      </div>
    </>
  );
}

export default function CaptureDialog({ dialog, page, initialUrl, onOpen, onShare, onShareTab, onBack, onClose }) {
  const [value, setValue] = useState(initialUrl);
  const [helper, setHelper] = useState(false);
  const inputRef = useRef(null);
  const shareRef = useRef(null);
  const copyRef = useRef(null);
  const view = dialog.step === 'opened' ? 'opened' : helper ? 'helper' : 'url';

  useEffect(() => {
    const target = { url: inputRef, helper: copyRef, opened: shareRef }[view];
    target.current?.focus({ preventScroll: true });
  }, [view]);

  useEffect(() => {
    const onKey = event => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      if (view === 'helper') setHelper(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, view]);

  const [width, height] = pageRoom(page.size);
  const scaled = width < page.size[0];
  const back = view === 'helper' ? () => setHelper(false) : view === 'opened' ? onBack : null;

  return createPortal(
    <div
      className="bs-backdrop"
      onMouseDown={event => event.target === event.currentTarget && view === 'url' && onClose()}
    >
      <div className="bs-dialog cst-capture-dialog" role="dialog" aria-modal="true" aria-labelledby="cst-capture-title">
        <header className="bs-dialog-head">
          {back && (
            <button type="button" className="docs-tool bs-dialog-close" aria-label="Back" onClick={back}>
              <Icon icon={ArrowLeft01Icon} />
            </button>
          )}
          <h2 id="cst-capture-title" className="bs-dialog-title">
            {TITLES[view]}
          </h2>
          <button type="button" className="docs-tool bs-dialog-close" aria-label="Close" onClick={onClose}>
            <Icon icon={Cancel01Icon} />
          </button>
        </header>
        <div className="bs-dialog-body cst-capture-body" data-view={view}>
          {view === 'url' && (
            <>
              <form
                className="cst-page-form"
                onSubmit={event => {
                  event.preventDefault();
                  onOpen(value);
                }}
              >
                <label className="bs-search cst-page-field">
                  <Icon icon={Link04Icon} size={15} />
                  <input
                    ref={inputRef}
                    value={value}
                    onChange={event => setValue(event.target.value)}
                    placeholder="yoursite.com"
                    aria-label="Website address"
                    inputMode="url"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </label>
                <button type="submit" className="bs-export cst-page-open" disabled={!value.trim()}>
                  Open
                </button>
              </form>
              <p className="cst-capture-note">
                {scaled
                  ? `Opens a ${width} × ${height} window, the shape of the ${page.name} scaled to fit your screen.`
                  : `Opens a ${width} × ${height} window, the exact size of the ${page.name}.`}
              </p>
              <div className="cst-capture-options">
                <Option icon={MouseScroll01Icon} label="Set up automatic scrolling" onClick={() => setHelper(true)} />
                <Option icon={ScreenShareIcon} label="Share a tab you already have open" onClick={onShareTab} />
              </div>
            </>
          )}
          {view === 'helper' && <Helper copyRef={copyRef} />}
          {view === 'opened' && (
            <>
              <p className="cst-capture-lead">
                A small window for <strong>{dialog.host}</strong> is ready. Share it, and it grows to {width} × {height}{' '}
                to fit the {page.name}.
              </p>
              <button ref={shareRef} type="button" className="bs-export cst-capture-primary" onClick={onShare}>
                <Icon icon={ScreenShareIcon} />
                <span>Share window</span>
              </button>
              <p className="cst-capture-note">
                In Chrome’s dialog, pick the tab named {dialog.host}, then press Share.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
