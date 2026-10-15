import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Cancel01Icon,
  CodeIcon,
  Copy01Icon,
  DashboardSquare01Icon,
  Download04Icon,
  Image01Icon,
  ShapesIcon,
  Video01Icon
} from '@hugeicons/core-free-icons';
import PreviewSwitch from '../../../components/common/Preview/PreviewSwitch';
import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import PreviewColorPickerCustom from '../../../components/common/Preview/PreviewColorPickerCustom';
import { Icon, Tip, Track } from '../../../tools/background-studio/components/ui';
import { downloadBlob } from '../../../tools/background-studio/utils/download';
import { materialFor } from '../presets/materials';
import { ratioOf } from '../state/doc';
import {
  FAVICON_HTML,
  defaultDuration,
  hasMotion,
  outputSize,
  renderFavicons,
  renderGif,
  renderPNG,
  renderVideo
} from '../export/exporters';
import { materialCode, componentName } from '../export/code';
import { markSVG } from '../export/vector';

const formatBytes = bytes =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const Choice = ({ title, value, options, onChange }) => (
  <div className="scrubber">
    <div className="scrubber-track bs-choice">
      <span className="bs-choice-label">{title}</span>
      <Track label={title} value={value} options={options} onChange={onChange} />
    </div>
  </div>
);

const IMAGE_SIZES = [
  { value: 512, label: '512' },
  { value: 1024, label: '1K' },
  { value: 2048, label: '2K' },
  { value: 4096, label: '4K' }
];

const VIDEO_FORMATS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' },
  { value: 'gif', label: 'GIF' }
];

const VIDEO_SIZES = [
  { value: 720, label: '720' },
  { value: 1080, label: '1080' },
  { value: 1440, label: '1440' }
];

const FRAME_RATES = [24, 30, 60].map(value => ({ value, label: String(value) }));

const GIF_SIZES = [
  { value: 320, label: '320' },
  { value: 480, label: '480' },
  { value: 640, label: '640' }
];

const PHASES = { loading: 'Preparing', rendering: 'Rendering' };

let rememberedTab = null;

const slug = name =>
  String(name || 'mark')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'mark';

export default function ExportDialog({ doc, light, onClose }) {
  const motion = hasMotion(doc);
  const material = materialFor(doc);
  const tabs = useMemo(
    () => [
      { value: 'image', label: 'PNG', icon: Image01Icon },
      { value: 'vector', label: 'SVG', icon: ShapesIcon },
      { value: 'icons', label: 'Icons', icon: DashboardSquare01Icon },
      ...(motion ? [{ value: 'video', label: 'Video', icon: Video01Icon }] : []),
      { value: 'code', label: 'Code', icon: CodeIcon }
    ],
    [motion]
  );
  const [tab, setTabState] = useState(() =>
    rememberedTab && tabs.some(item => item.value === rememberedTab) ? rememberedTab : 'image'
  );
  const [image, setImage] = useState({ size: 2048, background: true });
  const [vector, setVector] = useState({ background: false });
  const [icons, setIcons] = useState({
    apple: doc.artboard.background.kind === 'color' ? doc.artboard.background.color1 : '#0c0b10'
  });
  const [video, setVideo] = useState(() => ({
    format: 'mp4',
    size: 1080,
    gifSize: 480,
    fps: 30,
    duration: Math.min(12, Math.round(defaultDuration(doc) * 10) / 10),
    fill: doc.artboard.background.kind === 'color' ? doc.artboard.background.color1 : light ? '#ffffff' : '#0c0b10'
  }));
  const [preview, setPreview] = useState(null);
  const [svg, setSvg] = useState(null);
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const jobRef = useRef(null);
  const dialogRef = useRef(null);
  const busy = Boolean(job);
  const ratio = ratioOf(doc.artboard);
  const name = slug(doc.name);
  const snapshot = useMemo(() => doc, [doc]);

  const setTab = value => {
    rememberedTab = value;
    setTabState(value);
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = event => {
      if (event.key === 'Escape' && !jobRef.current) {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      jobRef.current?.abort();
      previous?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    renderPNG(snapshot, { longSide: 900, background: true })
      .then(({ blob }) => alive && setPreview(URL.createObjectURL(blob)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [snapshot]);

  useEffect(() => {
    let alive = true;
    markSVG(snapshot, { background: vector.background })
      .then(next => alive && setSvg(next))
      .catch(problem => alive && setSvg({ error: problem?.message || 'The vector could not be traced.' }));
    return () => {
      alive = false;
    };
  }, [snapshot, vector.background]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => () => result?.url && URL.revokeObjectURL(result.url), [result]);

  const run = useCallback(async (label, task) => {
    const controller = new AbortController();
    jobRef.current = controller;
    setError(null);
    setResult(null);
    setJob({ phase: 'loading', progress: 0, label });
    try {
      const output = await task(controller.signal, progress =>
        setJob(previous => (previous ? { ...previous, ...progress } : previous))
      );
      return output;
    } catch (problem) {
      if (problem?.name !== 'AbortError') setError(problem?.message || 'Export failed.');
      return null;
    } finally {
      jobRef.current = null;
      setJob(null);
    }
  }, []);

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Could not copy');
    }
  };

  const exportImage = async mode => {
    const output = await run('image', signal =>
      renderPNG(snapshot, { longSide: image.size, background: image.background, signal })
    );
    if (!output) return;
    if (mode === 'copy') {
      try {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': output.blob })]);
        toast.success('Image copied');
      } catch {
        toast.error('Could not copy the image');
      }
      return;
    }
    downloadBlob(output.blob, `${name}.png`);
  };

  const exportVideo = async () => {
    const gif = video.format === 'gif';
    const output = await run('video', (signal, onProgress) =>
      gif
        ? renderGif(snapshot, {
            longSide: video.gifSize,
            fps: Math.min(video.fps, 24),
            duration: video.duration,
            fill: video.fill,
            signal,
            onProgress
          })
        : renderVideo(snapshot, {
            format: video.format,
            longSide: video.size,
            fps: video.fps,
            duration: video.duration,
            fill: video.fill,
            signal,
            onProgress
          })
    );
    if (!output) return;
    const url = URL.createObjectURL(output.blob);
    setResult({ url, type: output.blob.type, size: output.blob.size, notes: output.notes });
    downloadBlob(output.blob, `${name}.${gif ? 'gif' : video.format}`);
  };

  const exportIcons = async () => {
    const output = await run('icons', () => renderFavicons(snapshot, { svg: svg?.svg, appleBackground: icons.apple }));
    if (output) downloadBlob(output, `${name}-icons.zip`);
  };

  const code =
    material.kind === 'flat'
      ? svg?.react
        ? { code: svg.react }
        : null
      : materialCode(doc, { assetName: `${name}.svg` });
  const imageSize = outputSize(doc, image.size);
  const videoSize = outputSize(doc, video.format === 'gif' ? video.gifSize : video.size);

  const meta = {
    image: `${imageSize.width} × ${imageSize.height} · PNG${doc.artboard.background.kind === 'none' || !image.background ? ' · transparent' : ''}`,
    vector: svg?.svg
      ? `${svg.animated ? 'Animated morph · ' : ''}${svg.segments} curves · ${formatBytes(new Blob([svg.svg]).size)}`
      : svg?.error
        ? ''
        : 'Tracing…',
    icons: 'ICO, SVG, Apple touch and manifest icons',
    video: `${videoSize.width} × ${videoSize.height} · ${video.format === 'gif' ? Math.min(video.fps, 24) : video.fps} fps · ${video.duration.toFixed(1)}s · ${video.format.toUpperCase()}`,
    code:
      material.kind === 'flat'
        ? 'React component with an inline SVG'
        : material.kind === 'procedural'
          ? 'Self-contained WebGL component for your mark'
          : 'React Bits component masked to your mark'
  }[tab];

  const media =
    tab === 'vector' && svg?.svg ? (
      <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.svg)}`} alt="" />
    ) : result?.type?.startsWith('video') ? (
      <video src={result.url} autoPlay loop muted playsInline />
    ) : result?.type === 'image/gif' ? (
      <img src={result.url} alt="" />
    ) : preview ? (
      <img src={preview} alt="" />
    ) : (
      <span className="bs-spinner bs-xp-spinner" />
    );

  return createPortal(
    <div className="bs-backdrop" onMouseDown={event => event.target === event.currentTarget && !busy && onClose()}>
      <div
        className="bs-dialog lab-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="smg-export-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="bs-dialog-head">
          <h2 id="smg-export-title" className="bs-dialog-title">
            Export
          </h2>
          <Track
            label="Export as"
            value={tab}
            options={tabs.map(item => ({ ...item, disabled: busy && item.value !== tab }))}
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
          <div className="bs-xp">
            <div className="bs-xp-well">
              <div
                className="bs-xp-media smg-xp-media"
                data-transparent={doc.artboard.background.kind === 'none' && tab !== 'video' ? '' : undefined}
                style={{ '--xp-aspect': ratio.w / ratio.h }}
              >
                {media}
                {job && (
                  <div className="bs-progress" role="status">
                    <span className="bs-progress-label">{PHASES[job.phase] || 'Working'}</span>
                    <span className="bs-progress-bar">
                      <i style={{ transform: `scaleX(${Math.max(0.02, job.progress || 0)})` }} />
                    </span>
                    <span className="bs-progress-time">{Math.round((job.progress || 0) * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bs-xp-side">
              <div className="customize-frame bs-xp-card">
                <div className="preview-options bs-options">
                  {tab === 'image' && (
                    <>
                      <Choice
                        title="Size"
                        value={image.size}
                        options={IMAGE_SIZES}
                        onChange={size => setImage(value => ({ ...value, size }))}
                      />
                      {doc.artboard.background.kind !== 'none' && (
                        <PreviewSwitch
                          title="Background"
                          isChecked={image.background}
                          onChange={background => setImage(value => ({ ...value, background }))}
                        />
                      )}
                    </>
                  )}
                  {tab === 'vector' && (
                    <PreviewSwitch
                      title="Background"
                      isChecked={vector.background}
                      isDisabled={doc.artboard.background.kind === 'none'}
                      onChange={background => setVector(value => ({ ...value, background }))}
                    />
                  )}
                  {tab === 'icons' && (
                    <PreviewColorPickerCustom
                      title="Icon background"
                      color={icons.apple}
                      onChange={apple => setIcons(value => ({ ...value, apple }))}
                    />
                  )}
                  {tab === 'video' && (
                    <>
                      <Choice
                        title="Format"
                        value={video.format}
                        options={VIDEO_FORMATS}
                        onChange={format => setVideo(value => ({ ...value, format }))}
                      />
                      {video.format === 'gif' ? (
                        <Choice
                          title="Size"
                          value={video.gifSize}
                          options={GIF_SIZES}
                          onChange={gifSize => setVideo(value => ({ ...value, gifSize }))}
                        />
                      ) : (
                        <>
                          <Choice
                            title="Size"
                            value={video.size}
                            options={VIDEO_SIZES}
                            onChange={size => setVideo(value => ({ ...value, size }))}
                          />
                          <Choice
                            title="Frame rate"
                            value={video.fps}
                            options={FRAME_RATES}
                            onChange={fps => setVideo(value => ({ ...value, fps }))}
                          />
                        </>
                      )}
                      <PreviewSlider
                        title="Length"
                        min={1}
                        max={20}
                        step={0.1}
                        valueUnit="s"
                        value={video.duration}
                        onChange={duration => setVideo(value => ({ ...value, duration }))}
                      />
                      {doc.artboard.background.kind === 'none' && (
                        <PreviewColorPickerCustom
                          title="Background"
                          color={video.fill}
                          onChange={fill => setVideo(value => ({ ...value, fill }))}
                        />
                      )}
                    </>
                  )}
                  {tab === 'code' && code && (
                    <div className="smg-code smg-full">
                      {code.install && (
                        <button
                          type="button"
                          className="smg-code-install"
                          onClick={() => copyText(code.install, 'Command copied')}
                        >
                          <code>{code.install}</code>
                        </button>
                      )}
                      <pre>
                        <code>{code.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="bs-xp-notes">
                {tab === 'vector' && (
                  <p>
                    A clean path you can edit in Figma or Illustrator. Shadow, glow and bevel stay in the PNG
                    {doc.fill.kind === 'logo'
                      ? ', and logo colors export as one color.'
                      : doc.fill.kind === 'conic'
                        ? ', and conic fills export as their first color.'
                        : '.'}
                  </p>
                )}
                {tab === 'vector' && svg?.error && <p className="bs-xp-error">{svg.error}</p>}
                {tab === 'icons' && (
                  <button
                    type="button"
                    className="smg-code-install smg-snippet"
                    onClick={() => copyText(FAVICON_HTML, 'Tags copied')}
                  >
                    <code>{FAVICON_HTML}</code>
                  </button>
                )}
                {tab === 'code' && material.kind !== 'flat' && (
                  <p>
                    Download the mask as <code>{name}.svg</code> next to the component. It is the shape this material
                    fills.
                    {material.kind === 'background' && doc.effects.gloss?.on
                      ? ' The 3D bevel is baked into the image and video exports.'
                      : ''}
                    {material.kind === 'procedural' ? ' Shadow, glow and outline stay in the image exports.' : ''}
                  </p>
                )}
                {result?.notes?.map(note => (
                  <p key={note}>{note}</p>
                ))}
                {error && <p className="bs-xp-error">{error}</p>}
              </div>

              <div className="bs-xp-footer">
                <p className="bs-xp-meta">
                  {meta}
                  {result && ` · ${formatBytes(result.size)}`}
                </p>
                <div className="bs-xp-actions">
                  {job ? (
                    <button type="button" className="docs-tool bs-wide-button" onClick={() => jobRef.current?.abort()}>
                      Cancel
                    </button>
                  ) : tab === 'image' ? (
                    <>
                      <Tip label="Copy image" placement="top">
                        <button
                          type="button"
                          className="docs-tool bs-xp-square"
                          aria-label="Copy image"
                          onClick={() => exportImage('copy')}
                        >
                          <Icon icon={Copy01Icon} />
                        </button>
                      </Tip>
                      <button
                        type="button"
                        className="bs-export bs-wide-button"
                        onClick={() => exportImage('download')}
                      >
                        <Icon icon={Download04Icon} />
                        <span>Download PNG</span>
                      </button>
                    </>
                  ) : tab === 'vector' ? (
                    <>
                      <Tip label="Copy SVG" placement="top">
                        <button
                          type="button"
                          className="docs-tool bs-xp-square"
                          aria-label="Copy SVG"
                          disabled={!svg?.svg}
                          onClick={() => copyText(svg.svg, 'SVG copied')}
                        >
                          <Icon icon={Copy01Icon} />
                        </button>
                      </Tip>
                      <button
                        type="button"
                        className="bs-export bs-wide-button"
                        disabled={!svg?.svg}
                        onClick={() => downloadBlob(new Blob([svg.svg], { type: 'image/svg+xml' }), `${name}.svg`)}
                      >
                        <Icon icon={Download04Icon} />
                        <span>Download SVG</span>
                      </button>
                    </>
                  ) : tab === 'icons' ? (
                    <button type="button" className="bs-export bs-wide-button" onClick={exportIcons}>
                      <Icon icon={Download04Icon} />
                      <span>Download icons</span>
                    </button>
                  ) : tab === 'video' ? (
                    <button type="button" className="bs-export bs-wide-button" onClick={exportVideo}>
                      <Icon icon={Video01Icon} />
                      <span>Render {video.format === 'gif' ? 'GIF' : 'video'}</span>
                    </button>
                  ) : (
                    <>
                      {material.kind !== 'flat' && (
                        <Tip label="Download mask SVG" placement="top">
                          <button
                            type="button"
                            className="docs-tool bs-xp-square"
                            aria-label="Download mask SVG"
                            disabled={!svg?.mask}
                            onClick={() => downloadBlob(new Blob([svg.mask], { type: 'image/svg+xml' }), `${name}.svg`)}
                          >
                            <Icon icon={Download04Icon} />
                          </button>
                        </Tip>
                      )}
                      <button
                        type="button"
                        className="bs-export bs-wide-button"
                        disabled={!code}
                        onClick={() => copyText(code.code, `${componentName(doc.name)} copied`)}
                      >
                        <Icon icon={Copy01Icon} />
                        <span>Copy code</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
