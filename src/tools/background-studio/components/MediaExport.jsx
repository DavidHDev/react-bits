import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Copy01Icon, Download04Icon, Video01Icon } from '@hugeicons/core-free-icons';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../../components/common/Preview/PreviewSwitch';
import PreviewInput from '../../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../../components/common/Preview/PreviewColorPickerCustom';
import { estimateVideoBytes, even, renderImage, renderVideo, videoSupport } from '../utils/render';
import {
  MAX_IMAGE_SIDE,
  MAX_VIDEO_SIDE,
  SCALES,
  SIZE_PRESETS,
  fitOutput,
  resolveLayout,
  sizeLabel
} from '../utils/sizes';
import { canvasToBlob, downloadBlob } from '../utils/download';
import { recall, remember } from '../utils/remember';
import { Icon, Tip, Track } from './ui';

const PAGE_FILL = { dark: '#120f17', light: '#ffffff' };
const PREVIEW_BOX = { width: 560, height: 360 };
const PREVIEW_LIMIT = 8;

const previews = new Map();

const recallPreview = key => {
  const url = previews.get(key);
  if (!url) return null;
  previews.delete(key);
  previews.set(key, url);
  return url;
};

const storePreview = (key, blob) => {
  const url = URL.createObjectURL(blob);
  previews.set(key, url);
  if (previews.size > PREVIEW_LIMIT) {
    const [oldest, stale] = previews.entries().next().value;
    previews.delete(oldest);
    URL.revokeObjectURL(stale);
  }
  return url;
};

const IMAGE_FORMATS = [
  { value: 'png', label: 'PNG', mime: 'image/png' },
  { value: 'jpeg', label: 'JPEG', mime: 'image/jpeg' },
  { value: 'webp', label: 'WebP', mime: 'image/webp' }
];

const FILLS = [
  { value: 'page', label: 'Page' },
  { value: 'transparent', label: 'None' },
  { value: 'custom', label: 'Color' }
];

const RATES = [24, 30, 60].map(value => ({ value, label: String(value) }));

const QUALITIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'high', label: 'High' },
  { value: 'max', label: 'Max' }
];

const SIZE_OPTIONS = SIZE_PRESETS.map(preset => ({ value: preset.value, label: sizeLabel(preset) }));

const DEFAULTS = {
  image: { size: 'desktop', scale: 2, format: 'png', fill: 'page', color: '#120f17', moment: 2 },
  video: {
    size: 'desktop',
    scale: 1,
    format: 'mp4',
    fill: 'page',
    color: '#120f17',
    duration: 10,
    fps: 30,
    quality: 'standard',
    loop: true,
    start: 2
  },
  custom: { width: 1600, height: 900 }
};

const CHOICES = {
  size: SIZE_PRESETS.map(preset => preset.value),
  scale: SCALES,
  fill: FILLS.map(item => item.value),
  fps: RATES.map(item => item.value),
  quality: QUALITIES.map(item => item.value)
};

const FORMATS = { image: IMAGE_FORMATS.map(item => item.value), video: ['mp4', 'webm'] };

const LIMITS = { duration: { min: 2, max: 60 }, start: { min: 0, max: 20 }, moment: { min: 0, max: 20 } };

const accepts = (kind, name, value, fallback) => {
  if (typeof value !== typeof fallback || (typeof value === 'number' && !Number.isFinite(value))) return false;
  const choices = name === 'format' ? FORMATS[kind] : CHOICES[name];
  if (choices) return choices.includes(value);
  if (LIMITS[name]) return value >= LIMITS[name].min && value <= LIMITS[name].max;
  return typeof value !== 'number' || value >= 0;
};

const restore = kind => {
  const saved = recall(kind) || {};
  return Object.fromEntries(
    Object.entries(DEFAULTS[kind]).map(([name, fallback]) => [
      name,
      accepts(kind, name, saved[name], fallback) ? saved[name] : fallback
    ])
  );
};

const formatBytes = bytes =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const formatSeconds = seconds => {
  if (seconds == null || !Number.isFinite(seconds)) return '';
  if (seconds < 60) return `about ${Math.max(1, Math.round(seconds))}s left`;
  return `about ${Math.round(seconds / 60)} min left`;
};

const Choice = ({ title, value, options, onChange }) => (
  <div className="scrubber">
    <div className="scrubber-track bs-choice">
      <span className="bs-choice-label">{title}</span>
      <Track label={title} value={value} options={options} onChange={onChange} />
    </div>
  </div>
);

const PHASES = {
  loading: 'Starting the background',
  warming: 'Skipping ahead',
  rendering: 'Rendering',
  finishing: 'Finishing the file'
};

export default function MediaExport({ kind, state, stageSize, onBusyChange }) {
  const { entry, renderProps, light } = state;
  const video = kind === 'video';
  const [options, setOptions] = useState(() => restore(kind));
  const [custom, setCustom] = useState(() => restore('custom'));
  const [support, setSupport] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const jobRef = useRef(null);
  const previewRef = useRef(null);
  const theme = light ? 'light' : 'dark';

  const set = (name, value) => setOptions(previous => ({ ...previous, [name]: value }));

  const setCustomSide = (name, raw) => {
    const value = Number(String(raw).replace(/[^0-9]/g, ''));
    setCustom(previous => ({ ...previous, [name]: value }));
  };

  useEffect(() => remember(kind, options), [kind, options]);

  useEffect(() => remember('custom', custom), [custom]);

  const layout = useMemo(() => resolveLayout(options.size, custom, stageSize), [options.size, custom, stageSize]);
  const output = useMemo(
    () => fitOutput(layout, options.scale, video ? MAX_VIDEO_SIDE : MAX_IMAGE_SIDE, video ? even : Math.round),
    [layout, options.scale, video]
  );

  const format = options.format;
  const imageFormat = IMAGE_FORMATS.find(item => item.value === options.format) || IMAGE_FORMATS[0];
  const transparent = !video && options.fill === 'transparent' && imageFormat.value !== 'jpeg';
  const fill = transparent ? null : options.fill === 'custom' ? options.color : PAGE_FILL[theme];

  useEffect(() => {
    if (!video) return undefined;
    let alive = true;
    videoSupport().then(result => {
      if (!alive) return;
      setSupport(result);
      setOptions(previous => {
        if (result[previous.format] || !(result.mp4 || result.webm)) return previous;
        return { ...previous, format: result.mp4 ? 'mp4' : 'webm' };
      });
    });
    return () => {
      alive = false;
    };
  }, [video]);

  useEffect(() => {
    onBusyChange?.(Boolean(job));
  }, [job, onBusyChange]);

  useEffect(
    () => () => {
      jobRef.current?.abort();
      previewRef.current?.abort();
    },
    []
  );

  useEffect(() => () => result?.url && URL.revokeObjectURL(result.url), [result]);

  const moment = video ? options.start : options.moment;

  useEffect(() => {
    if (job) return undefined;
    const key = JSON.stringify([entry.id, renderProps, theme, layout.width, layout.height, moment, fill]);
    const known = recallPreview(key);
    if (known) {
      previewRef.current?.abort();
      previewRef.current = null;
      setPreview(known);
      setPreviewing(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      previewRef.current?.abort();
      previewRef.current = controller;
      setPreviewing(true);
      try {
        const ratio = Math.min(PREVIEW_BOX.width / layout.width, PREVIEW_BOX.height / layout.height) * 2;
        const canvas = await renderImage({
          entry,
          props: renderProps,
          theme,
          layout,
          output: { width: Math.round(layout.width * ratio), height: Math.round(layout.height * ratio) },
          ratio,
          moment,
          fill,
          signal: controller.signal
        });
        const blob = controller.signal.aborted ? null : await canvasToBlob(canvas, 'image/png');
        if (blob && !controller.signal.aborted) setPreview(storePreview(key, blob));
      } catch {
        if (!controller.signal.aborted) setPreview(null);
      } finally {
        if (previewRef.current === controller) setPreviewing(false);
      }
    }, 420);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [entry, renderProps, theme, layout, moment, fill, job]);

  const exportImage = useCallback(
    async mode => {
      const controller = new AbortController();
      jobRef.current = controller;
      setError(null);
      setJob({ phase: 'loading', progress: 0 });
      try {
        const canvas = await renderImage({
          entry,
          props: renderProps,
          theme,
          layout,
          output,
          ratio: output.ratio,
          moment: options.moment,
          fill,
          signal: controller.signal
        });
        if (mode === 'copy') {
          const blob = await canvasToBlob(canvas, 'image/png');
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          toast.success('Image copied');
        } else {
          const blob = await canvasToBlob(canvas, imageFormat.mime, 0.92);
          downloadBlob(
            blob,
            `${entry.id}-${output.width}x${output.height}.${imageFormat.value === 'jpeg' ? 'jpg' : imageFormat.value}`
          );
          toast.success('Image saved');
        }
      } catch (problem) {
        if (problem?.name !== 'AbortError') {
          setError(mode === 'copy' ? 'Copying images is blocked here. Download it instead.' : problem.message);
        }
      } finally {
        jobRef.current = null;
        setJob(null);
      }
    },
    [entry, renderProps, theme, layout, output, options.moment, fill, imageFormat]
  );

  const exportVideo = useCallback(async () => {
    const controller = new AbortController();
    jobRef.current = controller;
    setError(null);
    setResult(null);
    setJob({ phase: 'loading', progress: 0 });
    try {
      const blob = await renderVideo({
        entry,
        props: renderProps,
        theme,
        layout,
        output,
        ratio: output.ratio,
        fps: options.fps,
        duration: options.duration,
        start: options.start,
        loop: options.loop,
        format: options.format,
        quality: options.quality,
        fill,
        signal: controller.signal,
        onProgress: update => setJob(update)
      });
      const name = `${entry.id}-${output.width}x${output.height}-${options.duration}s.${options.format}`;
      downloadBlob(blob, name);
      setResult({ url: URL.createObjectURL(blob), size: blob.size, name, blob });
      toast.success('Video saved');
    } catch (problem) {
      if (problem?.name !== 'AbortError') setError(problem.message || 'The video could not be rendered.');
    } finally {
      jobRef.current = null;
      setJob(null);
    }
  }, [entry, renderProps, theme, layout, output, options, fill]);

  const cancel = () => jobRef.current?.abort();

  const unsupported = video && support && !support.mp4 && !support.webm;
  const formats = video
    ? [
        { value: 'mp4', label: 'MP4', disabled: support ? !support.mp4 : false },
        { value: 'webm', label: 'WebM', disabled: support ? !support.webm : false }
      ]
    : IMAGE_FORMATS;

  const estimate = video
    ? estimateVideoBytes({ quality: options.quality, output, fps: options.fps, duration: options.duration, format })
    : 0;
  const meta = video
    ? `${output.width} × ${output.height} · ${options.fps} fps · ${options.duration}s · ${options.format.toUpperCase()}`
    : `${output.width} × ${output.height} · ${imageFormat.label}`;

  return (
    <div className="bs-xp">
      <div className="bs-xp-well">
        <div
          className="bs-xp-media"
          style={{ '--xp-aspect': layout.width / layout.height }}
          data-transparent={transparent ? '' : undefined}
        >
          {result?.url ? (
            <video src={result.url} autoPlay loop muted playsInline />
          ) : (
            preview && <img src={preview} alt="" draggable={false} />
          )}
          {(previewing || !preview) && !job && !result && <span className="bs-spinner bs-xp-spinner" />}
        </div>
        {job && (
          <div className="bs-progress" role="status">
            <span className="bs-progress-label">
              {PHASES[job.phase] || 'Working'}
              {job.phase === 'rendering' && job.frames ? ` ${job.frame} of ${job.frames}` : ''}
            </span>
            <span className="bs-progress-bar">
              <i
                style={{
                  transform: `scaleX(${job.phase === 'rendering' ? job.progress : job.phase === 'finishing' ? 1 : 0.02})`
                }}
              />
            </span>
            <span className="bs-progress-time">{job.phase === 'rendering' ? formatSeconds(job.remaining) : ''}</span>
          </div>
        )}
      </div>

      <div className="bs-xp-side">
        <div className="customize-frame bs-xp-card">
          <div className="preview-options bs-options">
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={options.size}
              onChange={value => set('size', value)}
            />
            {options.size === 'custom' && (
              <>
                <PreviewInput
                  title="Width"
                  value={String(custom.width || '')}
                  onChange={value => setCustomSide('width', value)}
                />
                <PreviewInput
                  title="Height"
                  value={String(custom.height || '')}
                  onChange={value => setCustomSide('height', value)}
                />
              </>
            )}
            <Choice
              title="Scale"
              value={options.scale}
              options={SCALES.map(value => ({ value, label: `${value}x` }))}
              onChange={value => set('scale', value)}
            />
            <Choice title="Format" value={format} options={formats} onChange={value => set('format', value)} />

            {video ? (
              <>
                <PreviewSlider
                  title="Length"
                  {...LIMITS.duration}
                  step={1}
                  value={options.duration}
                  valueUnit="s"
                  onChange={value => set('duration', value)}
                />
                <Choice title="Frame rate" value={options.fps} options={RATES} onChange={value => set('fps', value)} />
                <Choice
                  title="Quality"
                  value={options.quality}
                  options={QUALITIES}
                  onChange={value => set('quality', value)}
                />
                <PreviewSlider
                  title="Start at"
                  {...LIMITS.start}
                  step={0.5}
                  value={options.start}
                  valueUnit="s"
                  onChange={value => set('start', value)}
                />
                <PreviewSwitch title="Seamless loop" isChecked={options.loop} onChange={value => set('loop', value)} />
              </>
            ) : (
              <>
                <Choice
                  title="Background"
                  value={imageFormat.value === 'jpeg' && options.fill === 'transparent' ? 'page' : options.fill}
                  options={FILLS.map(item => ({
                    ...item,
                    disabled: item.value === 'transparent' && imageFormat.value === 'jpeg'
                  }))}
                  onChange={value => set('fill', value)}
                />
                {options.fill === 'custom' && (
                  <PreviewColorPickerCustom
                    title="Color"
                    color={options.color}
                    onChange={value => set('color', value)}
                  />
                )}
                <PreviewSlider
                  title="Capture at"
                  {...LIMITS.moment}
                  step={0.1}
                  value={options.moment}
                  valueUnit="s"
                  onChange={value => set('moment', value)}
                />
              </>
            )}
          </div>
        </div>

        <div className="bs-xp-notes">
          {error && <p className="bs-xp-error">{error}</p>}
          {unsupported && (
            <p className="bs-xp-error">Video export needs a recent version of Chrome, Edge, Safari or Firefox.</p>
          )}
        </div>

        <div className="bs-xp-footer">
          <p className="bs-xp-meta">
            {meta}
            {result ? ` · ${formatBytes(result.size)}` : video ? ` · about ${formatBytes(estimate)}` : ''}
          </p>
          <div className="bs-xp-actions">
            {job ? (
              <button type="button" className="docs-tool bs-wide-button" onClick={cancel}>
                Cancel
              </button>
            ) : video ? (
              <>
                {result && (
                  <Tip label="Save again" placement="top">
                    <button
                      type="button"
                      className="docs-tool bs-xp-square"
                      aria-label="Save again"
                      onClick={() => downloadBlob(result.blob, result.name)}
                    >
                      <Icon icon={Download04Icon} />
                    </button>
                  </Tip>
                )}
                <button type="button" className="bs-export bs-wide-button" onClick={exportVideo} disabled={unsupported}>
                  <Icon icon={Video01Icon} />
                  Render video
                </button>
              </>
            ) : (
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
                <button type="button" className="bs-export bs-wide-button" onClick={() => exportImage('download')}>
                  <Icon icon={Download04Icon} />
                  Download
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
