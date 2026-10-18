import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cancel01Icon, Download04Icon, Link04Icon, MusicNote01Icon, SourceCodeIcon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { Icon, Track } from '../../background-studio/components/ui';
import { downloadBlob } from '../../background-studio/utils/download';
import CodeExample from '../../../components/code/CodeExample';
import { ComponentPropsProvider } from '../../../components/context/ComponentPropsContext';
import { ActiveRouteContext } from '../../../components/context/ActiveRouteContext/ActiveRouteContext';
import { useOptions } from '../../../components/context/OptionsContext/useOptions';
import { renderSound } from '../../../sounds/ts/react-bits-sound';
import engineTs from '../../../sounds/ts/react-bits-sound.ts?raw';
import engineJs from '../../../sounds/js/react-bits-sound.js?raw';
import { canEncode, encodeAudio } from '../export/encode';
import { soundSource, usageSource } from '../export/code';
import { shareRows, shareUrl } from '../sounds/share';
import Orb from './Orb';
import { formatSeconds } from '../sounds/browse';

const TABS = [
  { value: 'code', label: 'Code', icon: SourceCodeIcon },
  { value: 'audio', label: 'Audio', icon: MusicNote01Icon },
  { value: 'link', label: 'Link', icon: Link04Icon }
];

const FORMATS = [
  { value: 'wav', label: 'WAV' },
  { value: 'mp3', label: 'MP3' },
  { value: 'ogg', label: 'OGG' }
];

const DEPTHS = [
  { value: 16, label: '16-bit' },
  { value: 24, label: '24-bit' },
  { value: 32, label: '32-bit' }
];

const BITRATES = {
  mp3: [128, 192, 320],
  ogg: [96, 128, 160]
};

const RATES = [
  { value: 44100, label: '44.1k', long: '44.1 kHz' },
  { value: 48000, label: '48k', long: '48 kHz' },
  { value: 96000, label: '96k', long: '96 kHz' }
];

const CHANNELS = [
  { value: 2, label: 'Stereo' },
  { value: 1, label: 'Mono' }
];

const NOTES = {
  wav: 'Lossless. 24-bit at 48 kHz is the standard for video editors and DAWs.',
  mp3: 'Small and plays everywhere, a safe pick for websites and apps.',
  ogg: 'Opus in an Ogg file, the smallest download with excellent quality on the web.'
};

const noop = () => {};

const Choice = ({ title, value, options, onChange }) => (
  <div className="scrubber">
    <div className="scrubber-track bs-choice">
      <span className="bs-choice-label">{title}</span>
      <Track label={title} value={value} options={options} onChange={onChange} />
    </div>
  </div>
);

const formatBytes = bytes =>
  bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;

let remembered = { tab: 'code', format: 'wav', depth: 24, bitrate: { mp3: 320, ogg: 160 }, rate: 48000, channels: 2 };

function CodeTab({ sound, tune }) {
  const { languagePreset } = useOptions();
  const typescript = String(languagePreset || '').toUpperCase() === 'TS';
  const route = useMemo(
    () => ({ category: 'sounds', subcategory: `sound-${sound.id}`, isCategoryRoute: true }),
    [sound.id]
  );
  const codeObject = useMemo(
    () => ({
      dependencies: '',
      usage: usageSource(sound, tune),
      code: soundSource(sound, false),
      tsCode: soundSource(sound, true),
      [typescript ? 'react-bits-sound.ts' : 'react-bits-sound.js']: typescript ? engineTs : engineJs
    }),
    [sound, tune, typescript]
  );
  return (
    <ActiveRouteContext.Provider value={route}>
      <ComponentPropsProvider props={{}} defaultProps={{}} hasChanges={false} resetProps={noop}>
        <div className="bs-code snd-code">
          <CodeExample codeObject={codeObject} componentName={sound.name} />
        </div>
      </ComponentPropsProvider>
    </ActiveRouteContext.Provider>
  );
}

const OrbWell = ({ sound, info, player, onPlay }) => (
  <div className="bs-xp-well snd-xp-well">
    <button type="button" className="snd-xp-orb" onClick={() => onPlay(sound.id)} aria-label={`Play ${sound.name}`}>
      <Orb player={player} />
    </button>
    <p className="snd-xp-caption">
      <strong>{sound.name}</strong>
      <span>{formatSeconds(info?.duration || 0)}</span>
    </p>
  </div>
);

function AudioTab({ sound, tune, info, player, onPlay, onBusyChange }) {
  const [settings, setSettings] = useState(remembered);
  const [support, setSupport] = useState({ wav: true, mp3: true, ogg: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all(FORMATS.map(item => canEncode(item.value).catch(() => false))).then(results => {
      if (alive) setSupport(Object.fromEntries(FORMATS.map((item, index) => [item.value, results[index]])));
    });
    return () => {
      alive = false;
    };
  }, []);

  const set = (key, value) =>
    setSettings(previous => {
      const next = { ...previous, [key]: value };
      if (next.format === 'ogg') next.rate = 48000;
      if (next.format === 'mp3' && next.rate === 96000) next.rate = 48000;
      remembered = { ...remembered, ...next };
      return next;
    });

  const { format, depth, rate, channels } = settings;
  const bitrate = settings.bitrate[format] || 320;
  const duration = info?.duration || 0;
  const bytes =
    format === 'wav' ? duration * rate * channels * (depth / 8) + 44 : (duration * bitrate * 1000) / 8 + 1200;
  const extension = format === 'ogg' ? 'ogg' : format;

  const download = async () => {
    setBusy(true);
    onBusyChange(true);
    setError(null);
    try {
      const buffer = await renderSound(sound.recipe, tune, { sampleRate: rate, channels: 2 });
      const blob = await encodeAudio(buffer, { format, bitDepth: depth, bitrate, channels });
      downloadBlob(blob, `${sound.id}.${extension}`);
      toast.success(`${sound.name} downloaded`);
    } catch (problem) {
      setError(problem?.message || 'That format could not be encoded in this browser.');
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  };

  return (
    <div className="bs-xp">
      <OrbWell sound={sound} info={info} player={player} onPlay={onPlay} />
      <div className="bs-xp-side">
        <div className="customize-frame bs-xp-card">
          <div className="preview-options bs-options">
            <Choice
              title="Format"
              value={format}
              options={FORMATS.map(item => ({ ...item, disabled: !support[item.value] }))}
              onChange={value => set('format', value)}
            />
            {format === 'wav' ? (
              <Choice title="Bit depth" value={depth} options={DEPTHS} onChange={value => set('depth', value)} />
            ) : (
              <Choice
                title="Bitrate"
                value={bitrate}
                options={BITRATES[format].map(value => ({ value, label: `${value}k` }))}
                onChange={value => set('bitrate', { ...settings.bitrate, [format]: value })}
              />
            )}
            <Choice
              title="Sample rate"
              value={rate}
              options={RATES.map(item => ({
                value: item.value,
                label: item.label,
                disabled: (format === 'ogg' && item.value !== 48000) || (format === 'mp3' && item.value === 96000)
              }))}
              onChange={value => set('rate', value)}
            />
            <Choice title="Channels" value={channels} options={CHANNELS} onChange={value => set('channels', value)} />
          </div>
        </div>
        <div className="bs-xp-notes">
          <p>{NOTES[format]}</p>
          {error && <p className="bs-xp-error">{error}</p>}
        </div>
        <div className="bs-xp-footer">
          <p className="bs-xp-meta">
            {[
              format.toUpperCase(),
              format === 'wav' ? (depth === 32 ? '32-bit float' : `${depth}-bit`) : `${bitrate} kbps`,
              RATES.find(item => item.value === rate)?.long,
              channels === 2 ? 'Stereo' : 'Mono',
              formatBytes(bytes)
            ].join(' · ')}
          </p>
          <div className="bs-xp-actions">
            <button type="button" className="bs-export bs-wide-button" onClick={download} disabled={busy}>
              {busy ? <span className="bs-spinner" /> : <Icon icon={Download04Icon} />}
              <span>{busy ? 'Encoding' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkTab({ sound, tune, info, player, onPlay }) {
  const url = useMemo(() => shareUrl(sound, tune), [sound, tune]);
  const rows = useMemo(() => shareRows(tune), [tune]);

  const copy = () =>
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Link copied'))
      .catch(() => toast.error('Could not copy'));

  return (
    <div className="bs-xp">
      <OrbWell sound={sound} info={info} player={player} onPlay={onPlay} />
      <div className="bs-xp-side">
        <div className="customize-frame bs-xp-card">
          <div className="preview-options bs-options">
            <p className="snd-xp-link" title={url}>
              {url.replace(/^https?:\/\//, '')}
            </p>
            {rows.length ? (
              <dl className="snd-xp-rows">
                {rows.map(row => (
                  <div className="snd-xp-row" key={row.key}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="snd-xp-empty">No changes yet. Tune it or add effects and the link keeps them.</p>
            )}
          </div>
        </div>
        <div className="bs-xp-notes">
          <p>The link opens {sound.name} in Sound Lab with every tune and effect setting, ready to play or export.</p>
        </div>
        <div className="bs-xp-footer">
          <div className="bs-xp-actions">
            <button type="button" className="bs-export bs-wide-button" onClick={copy}>
              <Icon icon={Link04Icon} />
              <span>Copy link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExportDialog({ initialTab, sound, tune, info, player, onPlay, onClose }) {
  const [tab, setTabState] = useState(() => (initialTab && initialTab !== 'last' ? initialTab : remembered.tab));
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  const setTab = value => {
    remembered = { ...remembered, tab: value };
    setTabState(value);
  };

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = event => {
      if (event.key !== 'Escape' || busyRef.current) return;
      if (event.target?.closest?.('[data-scope="menu"], [role="menu"], [role="listbox"]')) return;
      event.stopPropagation();
      closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div
      className="bs-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="bs-dialog lab-dialog snd-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="snd-export-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="bs-dialog-head">
          <h2 id="snd-export-title" className="bs-dialog-title">
            Export {sound.name}
          </h2>
          <Track
            label="Export as"
            value={tab}
            options={TABS.map(item => ({ ...item, disabled: busy && item.value !== tab }))}
            onChange={setTab}
          />
          <button
            type="button"
            className="docs-tool bs-dialog-close"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
          >
            <Icon icon={Cancel01Icon} />
          </button>
        </header>
        <div className="bs-dialog-body">
          {tab === 'code' ? (
            <CodeTab sound={sound} tune={tune} />
          ) : tab === 'link' ? (
            <LinkTab sound={sound} tune={tune} info={info} player={player} onPlay={onPlay} />
          ) : (
            <AudioTab sound={sound} tune={tune} info={info} player={player} onPlay={onPlay} onBusyChange={setBusy} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
