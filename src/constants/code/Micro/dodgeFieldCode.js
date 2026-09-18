import code from '@content/Micro/DodgeField/DodgeField.jsx?raw';
import css from '@content/Micro/DodgeField/DodgeField.css?raw';
import tailwind from '@tailwind/Micro/DodgeField/DodgeField.jsx?raw';
import tsCode from '@ts-default/Micro/DodgeField/DodgeField.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/DodgeField/DodgeField.tsx?raw';

export const dodgeField = {
  dependencies: `motion`,
  usage: `import DodgeField from './DodgeField';

<DodgeField />

<DodgeField
  inkColor="#f5f5f5"
  contrastColor="#18181b"
  fieldHeight={240}
  reach={72}
  radius={120}
  falloff={2}
  fleeDuration={130}
  returnDuration={620}
  returnBounce={0.1}
  axis="both"
  wall="clamp"
  patience={4}
  onCatch={() => console.log('caught')}
>
  <img className="avatar" src="/me.png" alt="" />
</DodgeField>

<DodgeField patience={3}>
  {({ dodges, gave }) => (
    <button type="button">{gave ? 'Okay, okay' : dodges ? \`Nope x\${dodges}\` : 'Catch me'}</button>
  )}
</DodgeField>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
