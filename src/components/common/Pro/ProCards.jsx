import { useEffect, useRef, useState } from 'react';
import { LuArrowUpRight } from 'react-icons/lu';

import {
  proUrl,
  trackProClick,
  proComponentPreview,
  proVariantPreview,
  proAgentKitPreview,
  playPreview,
  dampenPreview
} from '../../../utils/pro';

/** Seconds into a template recording used for the poster frame and playback start. */
const PREVIEW_START_TIME = 0.4;

// Cards here deliberately reuse the `browse-card` chassis from the component
// index so the Pro pages read as the same product, not a bolted-on microsite.

const Overlay = ({ label = 'View live', corner = false }) => (
  <span className={`pro-item-overlay${corner ? ' pro-item-overlay-corner' : ''}`}>
    <span className="pro-item-overlay-pill">
      {label}
      <LuArrowUpRight size={13} />
    </span>
  </span>
);

const Badge = ({ children = 'New', free = false }) => (
  <span className={`pro-item-badge${free ? ' pro-item-badge-free' : ''}`}>{children}</span>
);

/** Mono `<Name />` tile, the same fallback the component index uses for missing clips. */
const EmptyTile = ({ title }) => (
  <span className="browse-card-empty pro-item-empty" aria-hidden="true">
    <span className="pro-item-empty-label">{`<${(title || '').replace(/\s+/g, '')} />`}</span>
  </span>
);

/** Preview image that degrades to the mono tile when the asset isn't there yet. */
const PreviewImage = ({ src, alt, title }) => {
  const [failed, setFailed] = useState(!src);

  if (failed) return <EmptyTile title={title || alt} />;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="pro-item-img"
      onError={() => setFailed(true)}
      onLoad={e => {
        // The SPA fallback serves index.html with a 200, which decodes to a
        // zero-size image rather than firing onError.
        if (!e.currentTarget.naturalWidth) setFailed(true);
      }}
    />
  );
};

const CardMeta = ({ children }) => <span className="pro-item-meta">{children}</span>;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

/** Hover state shared by a card's media, so focus reveals the clip too. */
const useHover = () => {
  const [hovered, setHovered] = useState(false);
  const on = () => setHovered(true);
  const off = () => setHovered(false);
  return [hovered, { onMouseEnter: on, onMouseLeave: off, onFocus: on, onBlur: off }];
};

/**
 * Poster frame that swaps to the animated webp on hover.
 *
 * Component clips are only requested
 * once a card is actually hovered, and unmounted on leave to stop it looping in
 * the background. The browser cache makes every hover after the first instant.
 */
const AnimatedPreview = ({ preview, alt, title, active }) => {
  const [failed, setFailed] = useState(!preview);
  const [clipReady, setClipReady] = useState(false);

  const playing = active && !failed && !prefersReducedMotion();

  useEffect(() => {
    if (!playing) setClipReady(false);
  }, [playing]);

  if (failed || !preview) return <EmptyTile title={title || alt} />;

  return (
    <>
      <img
        src={preview.poster}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="pro-item-img"
        onError={() => setFailed(true)}
      />
      {playing && (
        <img
          src={preview.animated}
          alt=""
          aria-hidden="true"
          decoding="async"
          className={`pro-item-img pro-item-clip${clipReady ? ' is-ready' : ''}`}
          onLoad={() => setClipReady(true)}
        />
      )}
    </>
  );
};

// ─── Components ──────────────────────────────────────────────────────────────

export const ComponentCard = ({ item, placement }) => {
  const [hovered, hoverProps] = useHover();
  const preview = proComponentPreview(item.slug);

  return (
    <a
      className="browse-card pro-item"
      href={proUrl(item.href, placement, { rb_item: item.slug })}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackProClick(placement, { section: 'components', item: item.slug })}
      {...hoverProps}
    >
      <span className="browse-card-well pro-item-media">
        <AnimatedPreview preview={preview} alt={item.name} title={item.name} active={hovered} />
        {item.isNew ? <Badge /> : null}
        <Overlay corner />
      </span>

      <span className="pro-item-body">
        <span className="browse-card-title pro-item-name">{item.name}</span>
        <CardMeta>{item.group}</CardMeta>
      </span>
    </a>
  );
};

// ─── Blocks & App UI (category → variants) ───────────────────────────────────

export const CategoryCard = ({ item, placement, section, previewDir }) => {
  const variants = item.variants || [];
  const preview = proVariantPreview(previewDir, variants[0]?.slug);

  return (
    <a
      className="browse-card pro-item"
      href={proUrl(item.href, placement, { rb_item: item.slug })}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackProClick(placement, { section, item: item.slug })}
    >
      <span className="browse-card-well pro-item-media pro-item-zoom">
        <PreviewImage src={preview} alt={item.name} title={item.name} />
        {item.newCount > 0 ? <Badge>{item.newCount} new</Badge> : null}
        <Overlay label={`View ${item.count} variants`} />
      </span>

      <span className="pro-item-body">
        <span className="browse-card-title pro-item-name">{item.name}</span>
        <CardMeta>
          {item.count} {item.count === 1 ? 'variant' : 'variants'}
        </CardMeta>
      </span>
    </a>
  );
};

/**
 * One card per block / app UI variant.
 *
 * Previews resolve by convention from the variant slug, which is unique across
 * the whole section: `<previewDir>/<variant-slug>.webp`.
 */
export const VariantCard = ({ item, placement, section, previewDir }) => {
  const preview = proVariantPreview(previewDir, item.slug);

  return (
    <a
      className="browse-card pro-item"
      href={proUrl(item.href, placement, { rb_item: item.slug })}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackProClick(placement, { section, item: item.slug, category: item.categorySlug })}
    >
      <span className="browse-card-well pro-item-media pro-item-zoom">
        <PreviewImage src={preview} alt={item.description || item.name} title={item.name} />
        {item.isNew ? <Badge /> : null}
        <Overlay label="View in Pro" />
      </span>

      <span className="pro-item-body">
        <span className="browse-card-title pro-item-name">{item.name}</span>
        <CardMeta>{item.category}</CardMeta>
      </span>
    </a>
  );
};

// ─── Templates ───────────────────────────────────────────────────────────────

export const TemplateCard = ({ item, placement }) => {
  const videoRef = useRef(null);

  // Several template recordings open on a black or half-painted frame, so both
  // the idle poster and hover playback start slightly in.
  const seekToStart = video => {
    if (!video) return;
    if (!video.duration || video.duration > PREVIEW_START_TIME) video.currentTime = PREVIEW_START_TIME;
  };

  const play = () => playPreview(videoRef.current);
  const stop = () => dampenPreview(videoRef.current, () => seekToStart(videoRef.current));

  const detailsHref = proUrl(item.href, `${placement}-details`, { rb_item: item.slug });
  const liveHref = item.livePreviewUrl
    ? proUrl(item.livePreviewUrl, `${placement}-live`, { rb_item: item.slug })
    : null;

  const track = action => trackProClick(`${placement}-${action}`, { section: 'templates', item: item.slug });

  return (
    <div className="browse-card pro-item" onMouseEnter={play} onMouseLeave={stop}>
      <span className="browse-card-well pro-item-media">
        {item.videoUrl ? (
          <video
            ref={videoRef}
            src={item.videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="pro-item-video"
            aria-label={item.name}
            onLoadedMetadata={event => seekToStart(event.currentTarget)}
          />
        ) : (
          <EmptyTile title={item.name} />
        )}
        {item.isFree ? <Badge free>Free</Badge> : item.isNew ? <Badge /> : null}

        <span className="pro-item-overlay pro-item-overlay-actions">
          {liveHref && (
            <a
              className="pro-item-overlay-pill"
              href={liveHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('live')}
            >
              Open Live Site
              <LuArrowUpRight size={13} />
            </a>
          )}
          <a
            className="pro-item-overlay-pill pro-item-overlay-pill-ghost"
            href={detailsHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('details')}
          >
            View Details
            <LuArrowUpRight size={13} />
          </a>
        </span>
      </span>

      <span className="pro-item-body">
        <a
          className="browse-card-title pro-item-name pro-item-name-link"
          href={detailsHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('details')}
        >
          {item.name}
        </a>
        <CardMeta>{item.isFree ? 'Free template' : 'Template'}</CardMeta>
      </span>
    </div>
  );
};

// ─── Agent Kit ───────────────────────────────────────────────────────────────

const KIND_LABELS = { skill: 'Skill', prompt: 'Prompt', recipe: 'Recipe' };

export const AgentKitCard = ({ item, placement }) => {
  const preview = proAgentKitPreview(item);
  const isFree = item.tier === 'free';

  return (
    <a
      className="browse-card pro-item"
      href={proUrl(item.href, placement, { rb_item: item.slug })}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackProClick(placement, { section: 'agent-kit', item: item.slug })}
    >
      <span className="browse-card-well pro-item-media">
        <PreviewImage src={preview} alt={item.name} title={item.name} />
        {isFree ? <Badge free>Free</Badge> : null}
        <Overlay label="View skill" />
      </span>

      <span className="pro-item-body">
        <span className="browse-card-title pro-item-name">{item.name}</span>
        <CardMeta>{KIND_LABELS[item.kind] || item.kind}</CardMeta>
      </span>
    </a>
  );
};
