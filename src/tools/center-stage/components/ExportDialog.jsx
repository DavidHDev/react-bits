import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Cancel01Icon,
  Copy01Icon,
  Download04Icon,
  GifIcon,
  Image01Icon,
  Link04Icon,
  Video01Icon
} from '@hugeicons/core-free-icons';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import { Icon, Tip, Track } from '../../background-studio/components/ui';
import { downloadBlob } from '../../background-studio/utils/download';
import { aspectRatio, isLooping } from '../engine/scene';
import { shotJson, shotUrl } from '../share';
import { bitrateFor, even, renderGif, renderStill, renderVideo, shotSize, videoSupport } from '../export/exporters';
import { clipRange } from '../media';
import { Choice } from './Field';

const TABS = [
  { value: 'image', label: 'Image', icon: Image01Icon },
  { value: 'video', label: 'Video', icon: Video01Icon },
  { value: 'gif', label: 'GIF', icon: GifIcon },
  { value: 'link', label: 'Link', icon: Link04Icon }
];

const IMAGE_FORMATS = [
  { value: 'png', label: 'PNG', mime: 'image/png' },
  { value: 'jpeg', label: 'JPEG', mime: 'image/jpeg' },
  { value: 'webp', label: 'WebP', mime: 'image/webp' }
];

const QUALITIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'high', label: 'High' },
  { value: 'max', label: 'Max' }
];

const SIZES = [
  { value: 1280, name: 'HD' },
  { value: 1920, name: 'Full HD' },
  { value: 2560, name: '2.5K' },
  { value: 3840, name: '4K' }
];

const GIF_SIZES = [480, 640, 800, 1080];

let rememberedTab = null;
const remembered = {
  image: { format: 'png', size: 3840, quality: 0.92 },
  video: { size: 3840, fps: 60, format: 'mp4', quality: 'high', duration: null },
  gif: { size: 800, fps: 20, duration: null }
};

const formatBytes = bytes =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const slug = doc =>
  (doc.caption?.title || doc.type?.text || 'center-stage')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'center-stage';

export default function ExportDialog({ doc, slots, background, time: openedAt, onClose }) {
  const [time] = useState(openedAt);
  const [tab, setTabState] = useState(rememberedTab || 'image');
  const [options, setOptions] = useState(() => ({
    image: { ...remembered.image },
    video: { ...remembered.video },
    gif: { ...remembered.gif }
  }));
  const [preview, setPreview] = useState(null);
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [support, setSupport] = useState(null);
  const jobRef = useRef(null);
  const dialogRef = useRef(null);
  const busy = Boolean(job);
  const ratio = aspectRatio(doc.aspect);
  const moving = (doc.motion?.kind || 'none') !== 'none';
  const hasVideo = slots.some(media => media?.kind === 'video');
  const hasLive = slots.some(media => media?.kind === 'live');
  const loopLength = moving
    ? doc.motion.duration || 6
    : hasVideo
      ? Math.min(30, Math.max(...slots.filter(media => media?.kind === 'video').map(media => clipRange(media).length)))
      : 6;
  const transparent = doc.background?.kind === 'transparent';

  const setTab = value => {
    rememberedTab = value;
    setTabState(value);
    setResult(null);
    setError(null);
  };

  const set = (group, name, value) =>
    setOptions(previous => {
      const next = { ...previous, [group]: { ...previous[group], [name]: value } };
      remembered[group] = next[group];
      return next;
    });

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
    const { width, height } = shotSize(ratio, 960);
    renderStill({ doc, slots, background, time, width, height, mime: 'image/png' })
      .then(blob => alive && setPreview(URL.createObjectURL(blob)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [doc, slots, background, time, ratio]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => () => result?.url && URL.revokeObjectURL(result.url), [result]);

  useEffect(() => {
    let alive = true;
    videoSupport().then(value => {
      if (!alive) return;
      setSupport(value);
      setOptions(previous => {
        if (value[previous.video.format] || !(value.mp4 || value.webm)) return previous;
        return { ...previous, video: { ...previous.video, format: value.mp4 ? 'mp4' : 'webm' } };
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  const run = useCallback(async (task, name) => {
    const controller = new AbortController();
    jobRef.current = controller;
    setError(null);
    setResult(null);
    setJob({ phase: 'loading', progress: 0 });
    try {
      const output = await task(controller.signal, update => setJob(update));
      const blob = output instanceof Blob ? output : output?.blob;
      if (blob) {
        const finalName = output?.width ? name.replace(/\d+x\d+/, `${output.width}x${output.height}`) : name;
        downloadBlob(blob, finalName);
        setResult({ url: URL.createObjectURL(blob), size: blob.size, name: finalName, type: blob.type });
        const notes = output?.notes || [];
        toast.success('Export saved', notes.length ? { description: notes.join(' ') } : undefined);
      }
    } catch (problem) {
      if (problem?.name !== 'AbortError') setError(problem?.message || 'The export failed.');
    } finally {
      jobRef.current = null;
      setJob(null);
    }
  }, []);

  const base = slug(doc);
  const image = options.image;
  const video = options.video;
  const gif = options.gif;
  const imageFormat = IMAGE_FORMATS.find(item => item.value === image.format) || IMAGE_FORMATS[0];
  const imageSize = shotSize(ratio, image.size);
  const videoSize = shotSize(ratio, video.size, even);
  const gifSize = shotSize(ratio, gif.size, even);
  const videoLength = video.duration ?? loopLength;
  const gifLength = gif.duration ?? Math.min(loopLength, 10);
  const estimate =
    (bitrateFor(video.quality, videoSize.width, videoSize.height, video.fps, video.format) * videoLength) / 8;
  const unsupported = support && !support.mp4 && !support.webm;
  const start = moving ? 0 : time;

  const sizeOptions = SIZES.map(item => {
    const { width, height } = shotSize(ratio, item.value);
    return { value: item.value, label: `${item.name} · ${width} × ${height}` };
  });

  const exportImage = mode =>
    run(
      async () => {
        const blob = await renderStill({
          doc,
          slots,
          background,
          time,
          width: imageSize.width,
          height: imageSize.height,
          mime: mode === 'copy' ? 'image/png' : imageFormat.mime,
          quality: image.quality
        });
        if (mode === 'copy') {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          toast.success('Image copied');
          return null;
        }
        return blob;
      },
      `${base}-${imageSize.width}x${imageSize.height}.${image.format === 'jpeg' ? 'jpg' : image.format}`
    );

  const exportVideo = () =>
    run(
      (signal, onProgress) =>
        renderVideo({
          doc,
          slots,
          background,
          width: videoSize.width,
          height: videoSize.height,
          fps: video.fps,
          duration: videoLength,
          start,
          format: video.format,
          quality: video.quality,
          signal,
          onProgress
        }),
      `${base}-${videoSize.width}x${videoSize.height}.${video.format}`
    );

  const exportGif = () =>
    run(
      (signal, onProgress) =>
        renderGif({
          doc,
          slots,
          background,
          width: gifSize.width,
          height: gifSize.height,
          fps: gif.fps,
          duration: gifLength,
          start,
          signal,
          onProgress
        }),
      `${base}-${gifSize.width}x${gifSize.height}.gif`
    );

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Could not copy');
    }
  };

  const meta = {
    image: `${imageSize.width} × ${imageSize.height} · ${imageFormat.label}`,
    video: `${videoSize.width} × ${videoSize.height} · ${video.fps} fps · ${videoLength.toFixed(1)}s · ${video.format.toUpperCase()} · about ${formatBytes(estimate)}`,
    gif: `${gifSize.width} × ${gifSize.height} · ${gif.fps} fps · ${gifLength.toFixed(1)}s`
  }[tab];

  return createPortal(
    <div className="bs-backdrop" onMouseDown={event => event.target === event.currentTarget && !busy && onClose()}>
      <div
        className="bs-dialog lab-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cst-export-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="bs-dialog-head">
          <h2 id="cst-export-title" className="bs-dialog-title">
            Export
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
          <div className="bs-xp">
            <div className="bs-xp-well">
              <div
                className="bs-xp-media cst-xp-media"
                data-transparent={transparent ? '' : undefined}
                style={{ '--xp-aspect': ratio }}
              >
                {result?.type?.startsWith('video') ? (
                  <video src={result.url} autoPlay loop muted playsInline />
                ) : result?.type === 'image/gif' ? (
                  <img src={result.url} alt="" />
                ) : (
                  preview && <img src={preview} alt="" draggable={false} />
                )}
                {!preview && !result && <span className="bs-spinner bs-xp-spinner" />}
              </div>
              {job && (
                <div className="bs-progress" role="status">
                  <span className="bs-progress-label">{job.phase === 'rendering' ? 'Rendering' : 'Preparing'}</span>
                  <span className="bs-progress-bar">
                    <i style={{ transform: `scaleX(${Math.max(0.02, job.progress || 0)})` }} />
                  </span>
                  <span className="bs-progress-time">{Math.round((job.progress || 0) * 100)}%</span>
                </div>
              )}
            </div>

            <div className="bs-xp-side">
              {tab !== 'link' && (
                <div className="customize-frame bs-xp-card">
                  <div className="preview-options bs-options">
                    {tab === 'image' && (
                      <>
                        <PreviewSelect
                          title="Size"
                          options={sizeOptions}
                          value={image.size}
                          onChange={value => set('image', 'size', value)}
                        />
                        <Choice
                          title="Format"
                          value={image.format}
                          options={IMAGE_FORMATS}
                          onChange={value => set('image', 'format', value)}
                        />
                        {image.format !== 'png' && (
                          <PreviewSlider
                            title="Quality"
                            min={0.5}
                            max={1}
                            step={0.01}
                            value={image.quality}
                            onChange={value => set('image', 'quality', value)}
                          />
                        )}
                      </>
                    )}
                    {tab === 'video' && (
                      <>
                        <PreviewSelect
                          title="Size"
                          options={sizeOptions}
                          value={video.size}
                          onChange={value => set('video', 'size', value)}
                        />
                        <PreviewSlider
                          title="Length"
                          min={1}
                          max={30}
                          step={0.5}
                          value={videoLength}
                          valueUnit="s"
                          onChange={value => set('video', 'duration', value)}
                        />
                        <Choice
                          title="Frame rate"
                          value={video.fps}
                          options={[24, 30, 60].map(value => ({ value, label: String(value) }))}
                          onChange={value => set('video', 'fps', value)}
                        />
                        <Choice
                          title="Format"
                          value={video.format}
                          options={[
                            { value: 'mp4', label: 'MP4', disabled: support ? !support.mp4 : false },
                            { value: 'webm', label: 'WebM', disabled: support ? !support.webm : false }
                          ]}
                          onChange={value => set('video', 'format', value)}
                        />
                        <Choice
                          title="Quality"
                          value={video.quality}
                          options={QUALITIES}
                          onChange={value => set('video', 'quality', value)}
                        />
                      </>
                    )}
                    {tab === 'gif' && (
                      <>
                        <PreviewSelect
                          title="Size"
                          options={GIF_SIZES.map(value => {
                            const size = shotSize(ratio, value, even);
                            return { value, label: `${value}px · ${size.width} × ${size.height}` };
                          })}
                          value={gif.size}
                          onChange={value => set('gif', 'size', value)}
                        />
                        <Choice
                          title="Frame rate"
                          value={gif.fps}
                          options={[12, 15, 20, 25].map(value => ({ value, label: String(value) }))}
                          onChange={value => set('gif', 'fps', value)}
                        />
                        <PreviewSlider
                          title="Length"
                          min={1}
                          max={12}
                          step={0.5}
                          value={gifLength}
                          valueUnit="s"
                          onChange={value => set('gif', 'duration', value)}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="bs-xp-notes">
                {tab === 'link' && (
                  <p>
                    The link keeps every setting of this shot. Screens stay on your computer, so add them again after
                    opening it.
                  </p>
                )}
                {tab === 'image' && transparent && image.format === 'jpeg' && (
                  <p>JPEG has no transparency. Use PNG or WebP to keep it.</p>
                )}
                {(tab === 'video' || tab === 'gif') && hasLive && (
                  <p>A live capture exports as a still. Record a clip to keep its motion.</p>
                )}
                {(tab === 'video' || tab === 'gif') && !moving && !hasVideo && (
                  <p>Pick a motion in the Motion section to animate the shot.</p>
                )}
                {(tab === 'video' || tab === 'gif') &&
                  moving &&
                  isLooping(doc.motion.kind) &&
                  videoLength === loopLength && <p>One full loop, so the clip repeats seamlessly.</p>}
                {tab === 'video' && unsupported && (
                  <p className="bs-xp-error">Video export needs a recent version of Chrome, Edge, Safari or Firefox.</p>
                )}
                {error && <p className="bs-xp-error">{error}</p>}
              </div>

              <div className="bs-xp-footer">
                {tab !== 'link' && (
                  <p className="bs-xp-meta">
                    {meta}
                    {result && ` · ${formatBytes(result.size)}`}
                  </p>
                )}
                <div className="bs-xp-actions">
                  {job ? (
                    <button type="button" className="docs-tool bs-wide-button" onClick={() => jobRef.current?.abort()}>
                      Cancel
                    </button>
                  ) : tab === 'link' ? (
                    <>
                      <Tip label="Copy settings as JSON" placement="top">
                        <button
                          type="button"
                          className="docs-tool bs-xp-square"
                          aria-label="Copy settings as JSON"
                          onClick={() => copyText(shotJson(doc), 'Settings copied')}
                        >
                          <Icon icon={Copy01Icon} />
                        </button>
                      </Tip>
                      <Tip label="Download JSON" placement="top">
                        <button
                          type="button"
                          className="docs-tool bs-xp-square"
                          aria-label="Download JSON"
                          onClick={() =>
                            downloadBlob(new Blob([shotJson(doc)], { type: 'application/json' }), `${base}.json`)
                          }
                        >
                          <Icon icon={Download04Icon} />
                        </button>
                      </Tip>
                      <button
                        type="button"
                        className="bs-export bs-wide-button"
                        onClick={() => copyText(shotUrl(doc), 'Link copied')}
                      >
                        <Icon icon={Link04Icon} />
                        <span>Copy link</span>
                      </button>
                    </>
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
                        <span>Download</span>
                      </button>
                    </>
                  ) : tab === 'video' ? (
                    <button
                      type="button"
                      className="bs-export bs-wide-button"
                      onClick={exportVideo}
                      disabled={unsupported}
                    >
                      <Icon icon={Video01Icon} />
                      <span>Render video</span>
                    </button>
                  ) : (
                    <button type="button" className="bs-export bs-wide-button" onClick={exportGif}>
                      <Icon icon={GifIcon} />
                      <span>Render GIF</span>
                    </button>
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
