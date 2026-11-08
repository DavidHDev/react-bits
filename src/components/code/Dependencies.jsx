import { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useInstallation } from '../../hooks/useInstallation';
import { useOptions } from '../context/OptionsContext/useOptions';
import { generateDependencyCommands, getTypeDependencies } from '../../utils/dependencies';

const Dependencies = ({ dependencyList = [] }) => {
  const { packageManager } = useInstallation();
  const { languagePreset } = useOptions() || {};
  const [copied, setCopied] = useState(false);
  const dependencies = useMemo(
    () => [...new Set(dependencyList.map(dependency => dependency.trim()).filter(Boolean))],
    [dependencyList]
  );
  const commands = generateDependencyCommands(dependencies, languagePreset);
  const command = commands?.[packageManager] || commands?.npm || '';
  const packageCount = dependencies.length + (languagePreset === 'TS' ? getTypeDependencies(dependencies).length : 0);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  if (dependencies.length === 0) return null;

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="dependencies-panel" aria-labelledby="dependencies-title">
      <div className="dependencies-summary">
        <h2 id="dependencies-title">Dependencies</h2>
        <p>
          {packageCount} required {packageCount === 1 ? 'package' : 'packages'}
        </p>
      </div>
      <div className="dependencies-command">
        <code title={command}>{command}</code>
        <button
          type="button"
          onClick={copyCommand}
          aria-label={copied ? 'Install command copied' : 'Copy install command'}
        >
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </section>
  );
};

export default Dependencies;
