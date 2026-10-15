import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Cancel01Icon,
  Copy01Icon,
  Download04Icon,
  GifIcon,
  Image01Icon,
  Link04Icon,
  Layers01Icon,
  Video01Icon
} from '@hugeicons/core-free-icons';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../../components/common/Preview/PreviewSwitch';
import { Icon, Tip, Track } from '../../background-studio/components/ui';
import { downloadBlob } from '../../background-studio/utils/download';
import { EFFECTS } from '../effects';
import { lookJson, shareUrl } from '../share';
import {
  bitrateFor,
  even,
  fitSize,
  renderGif,
  renderStill,
  renderVideoFromStill,
  renderVideoFromVideo,
  videoSupport
} from '../export/exporters';

const TABS = [
  { value: 'image', label: 'Image', icon: Image01Icon },
  { value: 'video', label: 'Video', icon: Video01Icon },
  { value: 'gif', label: 'GIF', icon: GifIcon },
  { value: 'look', label: 'Style', icon: Layers01Icon }
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

const PHASES = { rendering: 'Rendering', loading: 'Preparing' };

let rememberedTab = null;
const remembered = {
  image: { format: 'png', size: 0, quality: 0.92 },
  video: { size: null, fps: 30, format: 'mp4', quality: 'high', audio: true, duration: 6 },
  gif: { size: 640, fps: 15, duration: 4 }
};

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

const UPSCALE_LIMIT = 1920;
const IMAGE_SIZES = [4096, 2560, 1920, 1280, 800];
const VIDEO_SIZES = [3840, 2560, 1920, 1280, 854];

const sizeOptions = (media, presets, round) => {
  const long = Math.max(media.width, media.height);
  const list = [{ value: 0, label: `Original · ${media.width} × ${media.height}` }];
  presets.forEach(value => {
    if (value === long || (value > long && value > UPSCALE_LIMIT)) return;
    const { width, height } = fitSize(media, value, round);
    const name = value === 1920 ? 'Full HD' : value === 1280 ? 'HD' : `${value}px`;
    list.push({ value, label: `${name} · ${width} × ${height}${value > long ? ' · upscaled' : ''}` });
  });
  return list;
};

const pickSize = (value, options, fallback) => (options.some(option => option.value === value) ? value : fallback);

export default function ExportDialog({ media, layers, strength = 1, serializable, trim, clock, onClose }) {
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
  const isVideo = media.kind === 'video';
  const isCamera = media.kind === 'camera';
  const snapshot = useMemo(() => layers.map(layer => ({ ...layer })), [layers]);

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
    const { width, height } = fitSize(media, 720);
    renderStill({ media, layers: snapshot, strength, time: clock, width, height, mime: 'image/jpeg', quality: 0.9 })
      .then(blob => {
        if (alive) setPreview(URL.createObjectURL(blob));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [media, snapshot, strength, clock]);

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
        setResult({ url: URL.createObjectURL(blob), size: blob.size, name: finalName, blob, type: blob.type });
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

  const base =
    String(media.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'texture-lab';
  const image = options.image;
  const video = options.video;
  const gif = options.gif;
  const imageFormat = IMAGE_FORMATS.find(item => item.value === image.format) || IMAGE_FORMATS[0];
  const imageSizes = sizeOptions(media, IMAGE_SIZES);
  const videoSizes = sizeOptions(media, VIDEO_SIZES, even);
  const imageChoice = pickSize(image.size, imageSizes, 0);
  const videoChoice = pickSize(video.size, videoSizes, Math.max(media.width, media.height) > 1920 ? 1920 : 0);
  const imageSize = fitSize(media, imageChoice);
  const videoSize = fitSize(media, videoChoice, even);
  const gifSize = fitSize(media, gif.size);
  const range = isVideo ? [trim[0], trim[1]] : [clock, clock + video.duration];
  const videoLength = isVideo ? Math.max(0.1, trim[1] - trim[0]) : video.duration;
  const gifLength = isVideo ? Math.min(Math.max(0.1, trim[1] - trim[0]), 12) : gif.duration;
  const fpsForSize = video.fps || 30;
  const estimate =
    (bitrateFor(video.quality, videoSize.width, videoSize.height, fpsForSize, video.format) * videoLength) / 8;
  const unsupported = support && !support.mp4 && !support.webm;

  const exportImage = mode =>
    run(
      async () => {
        const blob = await renderStill({
          media,
          layers: snapshot,
          strength,
          time: clock,
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
        isVideo
          ? renderVideoFromVideo({
              media,
              layers: snapshot,
              strength,
              trim: range,
              width: videoSize.width,
              height: videoSize.height,
              fps: video.fps,
              format: video.format,
              quality: video.quality,
              audio: video.audio,
              signal,
              onProgress
            })
          : renderVideoFromStill({
              media,
              layers: snapshot,
              strength,
              width: videoSize.width,
              height: videoSize.height,
              fps: fpsForSize,
              duration: video.duration,
              start: clock,
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
          media,
          layers: snapshot,
          strength,
          width: gifSize.width,
          height: gifSize.height,
          fps: gif.fps,
          duration: gifLength,
          start: isVideo ? trim[0] : clock,
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
    video: `${videoSize.width} × ${videoSize.height} · ${video.fps || 'source'} fps · ${videoLength.toFixed(1)}s · ${video.format.toUpperCase()} · about ${formatBytes(estimate)}`,
    gif: `${gifSize.width} × ${gifSize.height} · ${gif.fps} fps · ${gifLength.toFixed(1)}s`
  }[tab];

  return createPortal(
    <div className="bs-backdrop" onMouseDown={event => event.target === event.currentTarget && !busy && onClose()}>
      <div
        className="bs-dialog lab-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-export-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="bs-dialog-head">
          <h2 id="lab-export-title" className="bs-dialog-title">
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
              <div className="bs-xp-media" style={{ '--xp-aspect': media.width / media.height }}>
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
                  <span className="bs-progress-label">{PHASES[job.phase] || 'Working'}</span>
                  <span className="bs-progress-bar">
                    <i style={{ transform: `scaleX(${Math.max(0.02, job.progress || 0)})` }} />
                  </span>
                  <span className="bs-progress-time">{Math.round((job.progress || 0) * 100)}%</span>
                </div>
              )}
            </div>

            <div className="bs-xp-side">
              {tab === 'look' ? (
                <div className="customize-frame bs-xp-card">
                  <div className="customize-heading">
                    <h2>This style</h2>
                  </div>
                  <div className="preview-options lab-look-list">
                    {layers.length ? (
                      layers.map(layer => (
                        <span key={layer.id} className="lab-look-row" data-hidden={layer.visible ? undefined : ''}>
                          {EFFECTS[layer.type]?.name}
                          {layer.mix < 1 && <em>{Math.round(layer.mix * 100)}%</em>}
                        </span>
                      ))
                    ) : (
                      <p className="lab-empty">No effects yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="customize-frame bs-xp-card">
                  <div className="preview-options bs-options">
                    {tab === 'image' && (
                      <>
                        <PreviewSelect
                          title="Size"
                          options={imageSizes}
                          value={imageChoice}
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

                    {tab === 'video' && !isCamera && (
                      <>
                        <PreviewSelect
                          title="Size"
                          options={videoSizes}
                          value={videoChoice}
                          onChange={value => set('video', 'size', value)}
                        />
                        {!isVideo && (
                          <PreviewSlider
                            title="Length"
                            min={1}
                            max={30}
                            step={0.5}
                            value={video.duration}
                            valueUnit="s"
                            onChange={value => set('video', 'duration', value)}
                          />
                        )}
                        <Choice
                          title="Frame rate"
                          value={video.fps}
                          options={[
                            ...(isVideo ? [{ value: 0, label: 'Source' }] : []),
                            { value: 24, label: '24' },
                            { value: 30, label: '30' },
                            { value: 60, label: '60' }
                          ]}
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
                        {isVideo && (
                          <PreviewSwitch
                            title="Keep audio"
                            isChecked={video.audio}
                            onChange={value => set('video', 'audio', value)}
                          />
                        )}
                      </>
                    )}

                    {tab === 'video' && isCamera && (
                      <p className="lab-empty">
                        Use the record button in the toolbar to film your camera with the style applied.
                      </p>
                    )}

                    {tab === 'gif' && (
                      <>
                        <PreviewSelect
                          title="Size"
                          options={[
                            { value: 360, label: 'Small · 360px' },
                            { value: 480, label: 'Medium · 480px' },
                            { value: 640, label: 'Large · 640px' },
                            { value: 800, label: 'Extra large · 800px' }
                          ]}
                          value={gif.size}
                          onChange={value => set('gif', 'size', value)}
                        />
                        <Choice
                          title="Frame rate"
                          value={gif.fps}
                          options={[10, 15, 20, 25].map(value => ({ value, label: String(value) }))}
                          onChange={value => set('gif', 'fps', value)}
                        />
                        {!isVideo && (
                          <PreviewSlider
                            title="Length"
                            min={1}
                            max={10}
                            step={0.5}
                            value={gif.duration}
                            valueUnit="s"
                            onChange={value => set('gif', 'duration', value)}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="bs-xp-notes">
                {tab === 'look' && (
                  <p>Share it as a link, or keep it as a file. Paste either anywhere in Texture Lab to load it.</p>
                )}
                {isVideo && (tab === 'video' || tab === 'gif') && (
                  <p>
                    Exports the range set on the timeline
                    {tab === 'gif' && trim[1] - trim[0] > 12 ? ', up to 12 seconds' : ''}.
                  </p>
                )}
                {tab === 'video' && unsupported && (
                  <p className="bs-xp-error">Video export needs a recent version of Chrome, Edge, Safari or Firefox.</p>
                )}
                {error && <p className="bs-xp-error">{error}</p>}
              </div>

              <div className="bs-xp-footer">
                {tab !== 'look' && (
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
                  ) : tab === 'look' ? (
                    <>
                      <Tip label="Copy JSON" placement="top">
                        <button
                          type="button"
                          className="docs-tool bs-xp-square"
                          aria-label="Copy JSON"
                          onClick={() => copyText(lookJson(serializable()), 'Style copied')}
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
                            downloadBlob(
                              new Blob([lookJson(serializable())], { type: 'application/json' }),
                              'style.json'
                            )
                          }
                        >
                          <Icon icon={Download04Icon} />
                        </button>
                      </Tip>
                      <button
                        type="button"
                        className="bs-export bs-wide-button"
                        onClick={() => copyText(shareUrl(serializable()), 'Link copied')}
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
                    !isCamera && (
                      <button
                        type="button"
                        className="bs-export bs-wide-button"
                        onClick={exportVideo}
                        disabled={unsupported}
                      >
                        <Icon icon={Video01Icon} />
                        <span>Render video</span>
                      </button>
                    )
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
