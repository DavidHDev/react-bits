import { RotateCcw } from 'lucide-react';
import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import { Tip } from '../../background-studio/components/ui';
import { heroControls } from '../effects';
import { Control } from './ParamControls';

export default function LookPanel({ look, layers, strength, onStrength, onParam, onReset }) {
  if (!layers.length) return null;
  const hero = heroControls(look, layers);
  return (
    <section className="customize-frame lab-section lab-look">
      <div className="customize-heading">
        <h2>{look ? look.name : 'Your style'}</h2>
        {look && (
          <div className="customize-heading-actions">
            <Tip label="Reset style">
              <button
                type="button"
                className="customize-heading-action lab-heading-icon"
                aria-label="Reset style"
                onClick={onReset}
              >
                <RotateCcw size={14} aria-hidden="true" />
              </button>
            </Tip>
          </div>
        )}
      </div>
      <div className="preview-options lab-options">
        <PreviewSlider
          title="Strength"
          min={0}
          max={100}
          step={1}
          value={Math.round(strength * 100)}
          valueUnit="%"
          onChange={value => onStrength(value / 100)}
        />
        {hero?.params.map(param => (
          <Control
            key={`${hero.layer.id}:${param.key}`}
            param={param}
            value={hero.layer.params[param.key]}
            onChange={(key, value) => onParam(hero.layer.id, key, value)}
          />
        ))}
      </div>
    </section>
  );
}
