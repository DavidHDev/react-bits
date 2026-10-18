import { useEffect, useRef, useState } from 'react';
import { Cancel01Icon, Copy01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Icon, Tip, Track } from '../../background-studio/components/ui';
import { useScrollEdges } from '../../background-studio/hooks/useScrollEdges';
import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../../components/common/Preview/PreviewSwitch';
import { useOptions } from '../../../components/context/OptionsContext/useOptions';
import { generateCliCommands } from '../../../utils/cli';
import { EFFECTS, PLAYBACK, TUNE, effectDefaults } from '../sounds/controls';

const copy = text =>
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success('Install command copied'))
    .catch(() => toast.error('Could not copy'));

function Heading({ title, children }) {
  return (
    <div className="customize-heading">
      <h2>{title}</h2>
      {children && <div className="customize-heading-actions">{children}</div>}
    </div>
  );
}

const logPosition = (control, value) => Math.log(value / control.min) / Math.log(control.max / control.min);

const logValue = (control, position) =>
  Number((control.min * Math.pow(control.max / control.min, position)).toPrecision(3));

function Sliders({ controls, tune, onTune }) {
  return controls.map(control =>
    control.type === 'choice' ? (
      <div className="scrubber" key={control.key}>
        <div className="scrubber-track bs-choice">
          <span className="bs-choice-label">{control.label}</span>
          <Track
            label={control.label}
            value={tune[control.key] ?? control.fallback}
            options={control.options}
            onChange={value => onTune(control.key, value)}
          />
        </div>
      </div>
    ) : control.scale === 'log' ? (
      <PreviewSlider
        key={control.key}
        title={control.label}
        min={0}
        max={1}
        step={0.001}
        value={logPosition(control, tune[control.key] ?? control.fallback)}
        displayValue={position => control.format(logValue(control, position))}
        onChange={position => onTune(control.key, logValue(control, position))}
      />
    ) : control.type === 'switch' ? (
      <PreviewSwitch
        key={control.key}
        title={control.label}
        isChecked={Boolean(tune[control.key] ?? control.fallback)}
        onChange={value => onTune(control.key, value)}
      />
    ) : (
      <PreviewSlider
        key={control.key}
        title={control.label}
        min={control.min}
        max={control.max}
        step={control.step}
        value={tune[control.key] ?? control.fallback}
        displayValue={control.format}
        onChange={value => onTune(control.key, value)}
      />
    )
  );
}

function AddEffect({ options, onAdd }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="lab-menu-root" ref={rootRef}>
      <button
        type="button"
        className="customize-heading-action lab-add"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <Icon icon={PlusSignIcon} size={14} />
        <span>Add</span>
      </button>
      {open && (
        <div className="lab-menu snd-fx-menu" role="menu">
          {options.map(effect => (
            <button
              key={effect.key}
              type="button"
              role="menuitem"
              className="lab-menu-item"
              onClick={() => {
                setOpen(false);
                onAdd(effect);
              }}
            >
              <span>{effect.label}</span>
              <small className="snd-fx-hint">{effect.hint}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Effects({ tune, onEffect }) {
  const added = EFFECTS.filter(effect => tune[effect.key]);
  const available = EFFECTS.filter(effect => !tune[effect.key]);

  return (
    <section className="customize-frame lab-section snd-effects">
      <Heading title="Effects">
        {available.length > 0 && (
          <AddEffect options={available} onAdd={effect => onEffect(effect.key, effectDefaults(effect))} />
        )}
      </Heading>
      {added.length ? (
        added.map(effect => (
          <div className="snd-fx" key={effect.key}>
            <div className="snd-fx-head">
              <h3>{effect.label}</h3>
              <Tip label={`Remove ${effect.label.toLowerCase()}`}>
                <button
                  type="button"
                  className="customize-heading-action lab-heading-icon"
                  aria-label={`Remove ${effect.label.toLowerCase()}`}
                  onClick={() => onEffect(effect.key, null)}
                >
                  <Icon icon={Cancel01Icon} size={14} />
                </button>
              </Tip>
            </div>
            <div className="preview-options lab-options">
              <Sliders
                controls={effect.controls}
                tune={tune[effect.key]}
                onTune={(key, value) => onEffect(effect.key, { ...tune[effect.key], [key]: value })}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="snd-fx-empty">Add reverb, echo, a filter, chorus or lo-fi grit.</p>
      )}
    </section>
  );
}

export default function Panel({ sound, tune, onTune, onEffect, onReset }) {
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef, '.snd-panel-scroll > section');
  const { languagePreset, stylePreset } = useOptions();
  const command = generateCliCommands(languagePreset, stylePreset, 'sounds', `sound-${sound.id}`).shadcn.npx;
  const changed = Object.entries(tune).some(([key, value]) => {
    const control = [...TUNE, ...PLAYBACK].find(item => item.key === key);
    return control && Math.abs(value - control.fallback) > 1e-6;
  });

  return (
    <aside className="lab-panel snd-panel" aria-label="Sound settings">
      <div
        className="lab-scroll-shell"
        data-top={edges.top ? '' : undefined}
        data-bottom={edges.bottom ? '' : undefined}
      >
        <div className="lab-scroll lab-panel-scroll snd-panel-scroll" ref={scrollRef}>
          <section className="customize-frame lab-section">
            <Heading title="Tune">
              {changed && (
                <Tip label="Reset this sound">
                  <button
                    type="button"
                    className="customize-heading-action lab-heading-icon"
                    aria-label="Reset this sound"
                    onClick={onReset}
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                  </button>
                </Tip>
              )}
            </Heading>
            <div className="preview-options lab-options">
              <Sliders controls={[...TUNE, ...PLAYBACK]} tune={tune} onTune={onTune} />
            </div>
          </section>

          <Effects tune={tune} onEffect={onEffect} />

          <section className="customize-frame lab-section snd-use">
            <Heading title="Install" />
            <div className="snd-install">
              <code>{command}</code>
              <Tip label="Copy install command">
                <button
                  type="button"
                  className="lab-icon-button"
                  aria-label="Copy install command"
                  onClick={() => copy(command)}
                >
                  <Icon icon={Copy01Icon} size={15} />
                </button>
              </Tip>
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}
