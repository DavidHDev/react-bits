import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Delete02Icon,
  Image01Icon,
  PlusSignIcon,
  Redo02Icon,
  ScissorIcon,
  ScreenShareIcon,
  Undo02Icon,
  Upload04Icon,
  Video01Icon
} from '@hugeicons/core-free-icons';
import { RotateCcw } from 'lucide-react';
import { Icon, Tip, Track } from '../../background-studio/components/ui';
import { useScrollEdges } from '../../background-studio/hooks/useScrollEdges';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import Field from './Field';
import { CONTROLS, TABS, TAB_GROUPS, deviceControls, devicePlacement, visibleControl } from '../controls';
import { SAMPLES } from '../media';
import { surfaceGuide, surfaceNames } from '../guide';
import { autoInk } from '../engine/shot';
import { DEVICE_TYPES } from '../engine/devices';
import { slotFor } from '../engine/scene';

const TAB_KEY = 'center-stage-tab';
const PER_ROW = 5;
const SHOWN_ROWS = 2;
const MORE_KEY = 'center-stage-more';

const readStored = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const store = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
  return true;
};

const withAuto = (control, doc) => (control.auto ? { ...control, autoColor: autoInk(doc) } : control);

const typeName = type => DEVICE_TYPES.find(item => item.value === type)?.label || 'Device';

function Heading({ title, children }) {
  return (
    <div className="customize-heading">
      <h2>{title}</h2>
      {children && <div className="customize-heading-actions">{children}</div>}
    </div>
  );
}

function Group({ title, actions, children, extra, open, onToggle }) {
  const hasExtra = Array.isArray(extra) ? extra.length > 0 : Boolean(extra);
  return (
    <section className="customize-frame lab-section cst-group">
      <Heading title={title}>{actions}</Heading>
      <div className="preview-options lab-options">
        {children}
        {open && extra}
      </div>
      {hasExtra && (
        <button type="button" className="cst-more-toggle" aria-expanded={open} onClick={onToggle}>
          <span>{open ? 'Fewer options' : 'More options'}</span>
          <span className="cst-chevron" data-open={open ? '' : undefined}>
            <Icon icon={ArrowDown01Icon} size={14} />
          </span>
        </button>
      )}
    </section>
  );
}

const hasFiles = event => [...(event.dataTransfer?.types || [])].includes('Files');

const hoverProps = (onHighlight, setOver) => ({
  onPointerEnter: () => onHighlight(true),
  onPointerLeave: () => onHighlight(false),
  onFocus: () => onHighlight(true),
  onBlur: event => {
    if (!event.currentTarget.contains(event.relatedTarget)) onHighlight(false);
  },
  onDragEnter: event => {
    if (!hasFiles(event)) return;
    setOver(true);
    onHighlight(true);
  },
  onDragLeave: event => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setOver(false);
    onHighlight(false);
  }
});

const LiveBadge = () => (
  <span className="cst-slot-badge" data-live="">
    <i className="cst-capture-dot" />
  </span>
);

function SurfaceTile({ label, number, thumb, scroll, video, live, blank, peek, onUpload, onDropFile, onHighlight }) {
  const [over, setOver] = useState(false);
  if (peek)
    return (
      <span className="cst-surface" data-peek="" aria-hidden="true">
        {thumb && !blank && <img src={thumb} alt="" draggable={false} />}
      </span>
    );
  return (
    <Tip label={`Upload to ${label}`}>
      <button
        type="button"
        className="cst-surface"
        aria-label={`Upload to ${label}`}
        data-over={over ? '' : undefined}
        data-blank={blank ? '' : undefined}
        onClick={onUpload}
        {...hoverProps(onHighlight, setOver)}
        onDragOver={event => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={event => {
          const file = event.dataTransfer?.files?.[0];
          setOver(false);
          onHighlight(false);
          if (!file) return;
          event.preventDefault();
          event.stopPropagation();
          onDropFile(file);
        }}
      >
        {thumb && !blank ? (
          <img
            src={thumb}
            alt=""
            draggable={false}
            style={{ objectPosition: `50% ${Math.round((scroll || 0) * 100)}%` }}
          />
        ) : (
          <Icon icon={Upload04Icon} size={14} />
        )}
        {video && (
          <span className="cst-slot-badge">
            <Icon icon={Video01Icon} size={11} />
          </span>
        )}
        {live && <LiveBadge />}
        <span className="cst-surface-number">{number}</span>
      </button>
    </Tip>
  );
}

function SlotRow({
  label,
  media,
  thumb,
  guide,
  onUpload,
  onCapture,
  onTrim,
  onSample,
  onClear,
  onRemove,
  onDropFile,
  onHighlight
}) {
  const [menu, setMenu] = useState(false);
  const [over, setOver] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;
    const onPointer = event => {
      if (!rootRef.current?.contains(event.target)) setMenu(false);
    };
    const onKey = event => event.key === 'Escape' && setMenu(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const close = action => () => {
    setMenu(false);
    action();
  };

  return (
    <div
      className="cst-slot"
      ref={rootRef}
      data-active={guide.idle ? undefined : ''}
      data-over={over ? '' : undefined}
      {...hoverProps(onHighlight, setOver)}
      onDragOver={event => {
        if (hasFiles(event)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onDrop={event => {
        const file = event.dataTransfer?.files?.[0];
        setOver(false);
        onHighlight(false);
        if (!file) return;
        event.preventDefault();
        event.stopPropagation();
        onDropFile(file);
      }}
    >
      <button type="button" className="cst-slot-thumb" onClick={onUpload} aria-label={`Replace ${label} screen`}>
        {thumb ? <img src={thumb} alt="" draggable={false} /> : <Icon icon={Upload04Icon} size={15} />}
        {media?.kind === 'video' && (
          <span className="cst-slot-badge">
            <Icon icon={Video01Icon} size={11} />
          </span>
        )}
        {media?.kind === 'live' && <LiveBadge />}
      </button>
      <button
        type="button"
        className="cst-slot-text"
        onClick={() => setMenu(value => !value)}
        aria-haspopup="menu"
        aria-expanded={menu}
      >
        <span className="cst-slot-line">
          <span className="cst-slot-label">{guide.title || label}</span>
          {guide.size && (
            <Tip label={guide.hint}>
              <span className="cst-slot-size">
                {guide.flexible ? 'Any size' : `${guide.size[0]} × ${guide.size[1]}`}
              </span>
            </Tip>
          )}
        </span>
        <span className="cst-slot-name" data-note={guide.note ? '' : undefined}>
          {guide.idle ? guide.note : guide.note || (media ? media.name : 'Empty, upload a screen')}
        </span>
      </button>
      <Tip label="Upload">
        <button type="button" className="lab-icon-button" aria-label={`Upload ${label} screen`} onClick={onUpload}>
          <Icon icon={Upload04Icon} size={15} />
        </button>
      </Tip>
      {menu && (
        <div className="lab-menu cst-slot-menu" role="menu">
          <button type="button" role="menuitem" className="lab-menu-item" onClick={close(onUpload)}>
            <Icon icon={Upload04Icon} />
            <span>Upload image or video</span>
          </button>
          {onCapture && (
            <button type="button" role="menuitem" className="lab-menu-item" onClick={close(onCapture)}>
              <Icon icon={ScreenShareIcon} />
              <span>Capture a page</span>
            </button>
          )}
          {onTrim && media?.kind === 'video' && (
            <button type="button" role="menuitem" className="lab-menu-item" onClick={close(onTrim)}>
              <Icon icon={ScissorIcon} />
              <span>Trim video</span>
            </button>
          )}
          <span className="lab-menu-label">Samples</span>
          {SAMPLES.map(sample => (
            <button
              key={sample.id}
              type="button"
              role="menuitem"
              className="lab-menu-item"
              onClick={close(() => onSample(sample))}
            >
              <Icon icon={Image01Icon} />
              <span>{sample.label}</span>
            </button>
          ))}
          {onClear && <span className="lab-menu-label">Screen</span>}
          {onClear && (
            <button type="button" role="menuitem" className="lab-menu-item" onClick={close(onClear)}>
              <Icon icon={Cancel01Icon} />
              <span>Turn screen off</span>
            </button>
          )}
          {onRemove && (
            <button type="button" role="menuitem" className="lab-menu-item" onClick={close(onRemove)}>
              <Icon icon={Delete02Icon} />
              <span>Remove screen</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Panel({
  shot,
  preset,
  heroKeys,
  slots,
  slotThumbs,
  sizes,
  selectedDevice,
  onSelectDevice,
  onUploadScreen,
  onUploadAll,
  onTrimScreen,
  onCaptureScreen,
  onSampleScreen,
  onBlankScreen,
  onFileScreen,
  onHighlight,
  onResetPreset,
  onAddDevice,
  onRemoveDevice
}) {
  const { doc } = shot;
  const [tab, setTab] = useState(() => {
    const stored = readStored(TAB_KEY, 'scene');
    return TABS.some(item => item.value === stored) ? stored : 'scene';
  });
  const [open, setOpen] = useState(() => new Set(readStored(MORE_KEY, [])));
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef, '.cst-panel-scroll > section');
  const devices = doc.devices;
  const sameType = devices.length > 2 && devices.every(device => device.type === devices[0].type);
  const all = selectedDevice === 'all' && sameType;
  const deviceIndex = all ? 0 : devices[selectedDevice] ? selectedDevice : 0;
  const device = devices[deviceIndex];
  const names = useMemo(() => surfaceNames(devices), [devices]);

  const onSet = (path, value, key) => {
    if (path && typeof path === 'object') shot.patch(path, key);
    else shot.set(path, value, key);
  };

  const onSetAll = (path, value, key) => {
    const entries = path && typeof path === 'object' ? Object.entries(path) : [[path, value]];
    const patch = {};
    entries.forEach(([target, next]) => {
      devices.forEach((item, index) => {
        patch[target.replace(/^devices\.0\./, `devices.${index}.`)] = next;
      });
    });
    shot.patch(patch, key || (typeof path === 'string' ? `all:${path}` : undefined));
  };

  const pickTab = value => {
    setTab(value);
    store(TAB_KEY, value);
    scrollRef.current?.scrollTo({ top: scrollRef.current.querySelector('.cst-tabs')?.offsetTop - 8 || 0 });
  };

  const toggle = id =>
    setOpen(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      store(MORE_KEY, [...next]);
      return next;
    });

  const hero = (heroKeys || [])
    .map(key => CONTROLS[key] && { ...withAuto(CONTROLS[key], doc), key })
    .filter(Boolean)
    .filter(control => visibleControl(control.key, doc));

  const sources = [];
  devices.forEach((item, index) => {
    const slot = slotFor(item, sizes);
    if (slot !== null && !sources.some(source => source.value === slot))
      sources.push({ value: slot, label: names[index] });
  });

  const resolve = key => {
    const control = { ...withAuto(CONTROLS[key], doc), key };
    if (key !== 'bgSlot') return control;
    return {
      ...control,
      type: sources.length > 3 ? 'select' : 'choice',
      options: sources,
      fallback: sources[0]?.value
    };
  };

  const fields = keys =>
    (keys || [])
      .filter(key => CONTROLS[key] && visibleControl(key, doc))
      .map(key => <Field key={key} control={resolve(key)} doc={doc} onSet={onSet} />);

  const screens = devices.map((item, index) => {
    const slot = slotFor(item, sizes);
    return { index, device: item, label: names[index], slot, media: slot === null ? null : slots[slot] };
  });
  const lit = indices => on => onHighlight(on ? indices : null);
  const [allScreens, setAllScreens] = useState(false);
  const collapsible = screens.length > PER_ROW * SHOWN_ROWS;
  const collapsed = collapsible && !allScreens;
  const tiles = collapsed ? screens.slice(0, PER_ROW * (SHOWN_ROWS + 1)) : screens;
  const deviceOptions = useMemo(() => {
    const options = devices.map((item, index) => ({ value: index, label: `${typeName(item.type)} ${index + 1}` }));
    if (sameType)
      options.unshift({ value: 'all', label: `All ${devices.length} ${typeName(devices[0].type).toLowerCase()}s` });
    return options;
  }, [devices, sameType]);

  const controls = deviceControls(deviceIndex, device);
  const setter = all ? onSetAll : onSet;
  const deviceField = control => <Field key={control.key} control={control} doc={doc} onSet={setter} />;

  const renderTab = () => {
    if (tab === 'device') {
      return (
        <>
          <Group
            title={devices.length > 1 ? 'Devices' : 'Device'}
            actions={
              <>
                {devices.length > 1 && !all && (
                  <Tip label="Remove this device">
                    <button
                      type="button"
                      className="customize-heading-action lab-heading-icon"
                      aria-label="Remove device"
                      onClick={() => onRemoveDevice(deviceIndex)}
                    >
                      <Icon icon={Delete02Icon} size={15} />
                    </button>
                  </Tip>
                )}
                {devices.length < 6 && (
                  <button type="button" className="customize-heading-action lab-add" onClick={onAddDevice}>
                    <Icon icon={PlusSignIcon} size={14} />
                    <span>Add</span>
                  </button>
                )}
              </>
            }
            extra={controls.filter(control => control.more).map(deviceField)}
            open={open.has('device')}
            onToggle={() => toggle('device')}
          >
            {devices.length > 1 && (
              <PreviewSelect
                title="Editing"
                options={deviceOptions}
                value={all ? 'all' : deviceIndex}
                onChange={onSelectDevice}
              />
            )}
            {controls.filter(control => !control.more).map(deviceField)}
          </Group>
          {!all && (
            <Group
              title="Position"
              extra={devicePlacement(deviceIndex)
                .slice(3)
                .map(control => (
                  <Field key={control.key} control={control} doc={doc} onSet={onSet} />
                ))}
              open={open.has('position')}
              onToggle={() => toggle('position')}
            >
              {devicePlacement(deviceIndex)
                .slice(0, 3)
                .map(control => (
                  <Field key={control.key} control={control} doc={doc} onSet={onSet} />
                ))}
            </Group>
          )}
        </>
      );
    }
    return (TAB_GROUPS[tab] || []).map(group => {
      const main = fields(group.controls);
      const extra = fields(group.more);
      if (!main.length && !extra.length) return null;
      return (
        <Group
          key={group.id}
          title={group.title}
          extra={extra}
          open={open.has(group.id)}
          onToggle={() => toggle(group.id)}
        >
          {main}
        </Group>
      );
    });
  };

  return (
    <aside className="lab-panel cst-panel" aria-label="Shot settings">
      <div
        className="lab-scroll-shell"
        data-top={edges.top ? '' : undefined}
        data-bottom={edges.bottom ? '' : undefined}
      >
        <div className="lab-scroll lab-panel-scroll cst-panel-scroll" ref={scrollRef}>
          <section className="customize-frame lab-section">
            <Heading title={preset ? preset.name : 'Your shot'}>
              <Tip label="Undo" hint="⌘Z">
                <button
                  type="button"
                  className="customize-heading-action lab-heading-icon"
                  aria-label="Undo"
                  onClick={shot.undo}
                  disabled={!shot.canUndo}
                >
                  <Icon icon={Undo02Icon} size={15} />
                </button>
              </Tip>
              <Tip label="Redo" hint="⇧⌘Z">
                <button
                  type="button"
                  className="customize-heading-action lab-heading-icon"
                  aria-label="Redo"
                  onClick={shot.redo}
                  disabled={!shot.canRedo}
                >
                  <Icon icon={Redo02Icon} size={15} />
                </button>
              </Tip>
              {preset && (
                <Tip label="Reset preset">
                  <button
                    type="button"
                    className="customize-heading-action lab-heading-icon"
                    aria-label="Reset preset"
                    onClick={onResetPreset}
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                  </button>
                </Tip>
              )}
            </Heading>
            <div className="preview-options lab-options">
              {hero.map(control => (
                <Field key={control.key} control={control} doc={doc} onSet={onSet} />
              ))}
            </div>
          </section>

          <section className="customize-frame lab-section">
            <Heading
              title={
                screens.length > 1 ? (
                  <>
                    Screens <span className="cst-count">({screens.length})</span>
                  </>
                ) : (
                  'Screen'
                )
              }
            >
              {screens.length > 1 && (
                <button
                  type="button"
                  className="customize-heading-action lab-add"
                  onClick={onUploadAll}
                  onPointerEnter={() => onHighlight(screens.map(item => item.index))}
                  onPointerLeave={() => onHighlight(null)}
                  onFocus={() => onHighlight(screens.map(item => item.index))}
                  onBlur={() => onHighlight(null)}
                >
                  <Icon icon={Upload04Icon} size={14} />
                  <span>Upload all</span>
                </button>
              )}
            </Heading>
            {screens.length > 4 ? (
              <>
                <div className="preview-options cst-surfaces">
                  {tiles.map((item, position) => (
                    <SurfaceTile
                      key={item.index}
                      label={item.label}
                      number={item.index + 1}
                      thumb={item.slot === null ? null : slotThumbs[item.slot]}
                      scroll={item.device.scroll}
                      video={item.media?.kind === 'video'}
                      live={item.media?.kind === 'live'}
                      blank={item.device.blank}
                      peek={collapsed && position >= PER_ROW * SHOWN_ROWS}
                      onUpload={() => onUploadScreen(item.index)}
                      onDropFile={file => onFileScreen(item.index, file)}
                      onHighlight={lit([item.index])}
                    />
                  ))}
                </div>
                {collapsible && (
                  <button
                    type="button"
                    className="cst-more-toggle"
                    aria-expanded={!collapsed}
                    onClick={() => setAllScreens(value => !value)}
                  >
                    <span>{collapsed ? `Show all ${screens.length}` : 'Show fewer'}</span>
                    <span className="cst-chevron" data-open={collapsed ? undefined : ''}>
                      <Icon icon={ArrowDown01Icon} size={14} />
                    </span>
                  </button>
                )}
                <p className="cst-slots-hint">Click a screen to replace just that one, or use Upload all.</p>
              </>
            ) : (
              <div className="preview-options cst-slots">
                {screens.map(item => {
                  const guide = surfaceGuide(doc, item.device, item.media);
                  return (
                    <SlotRow
                      key={item.index}
                      label={item.label}
                      media={item.media}
                      thumb={item.slot === null || item.device.blank ? null : slotThumbs[item.slot]}
                      guide={{ ...guide, title: item.label }}
                      onUpload={() => onUploadScreen(item.index)}
                      onCapture={onCaptureScreen ? () => onCaptureScreen(item.index) : null}
                      onTrim={onTrimScreen ? () => onTrimScreen(item.index) : null}
                      onSample={sample => onSampleScreen(item.index, sample)}
                      onClear={item.device.blank ? null : () => onBlankScreen(item.index)}
                      onRemove={null}
                      onDropFile={file => onFileScreen(item.index, file)}
                      onHighlight={lit([item.index])}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <div className="cst-tabs">
            <Track label="Settings" value={tab} options={TABS} onChange={pickTab} className="cst-tab-track" />
          </div>

          {renderTab()}
        </div>
        <button
          type="button"
          className="lab-more"
          data-hidden={edges.bottom || !edges.below ? '' : undefined}
          tabIndex={edges.bottom || !edges.below ? -1 : 0}
          onClick={() => scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.7, behavior: 'smooth' })}
        >
          {edges.below} more
        </button>
      </div>
    </aside>
  );
}
