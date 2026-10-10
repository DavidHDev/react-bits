import code from '@content/Components/Stepper/Stepper.jsx?raw';
import css from '@content/Components/Stepper/Stepper.css?raw';
import tailwind from '@tailwind/Components/Stepper/Stepper.jsx?raw';
import tsCode from '@ts-default/Components/Stepper/Stepper.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/Stepper/Stepper.tsx?raw';

export const stepper = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import Stepper, { Step } from './Stepper';

<Stepper
  initialStep={1}
  onStepChange={step => console.log(step)}
  onFinalStepCompleted={() => console.log('All steps completed!')}
  backButtonText="Back"
  nextButtonText="Continue"
>
  <Step title="Welcome">
    <h3>Welcome aboard</h3>
    <p>Set up your workspace in a few quick steps.</p>
  </Step>
  <Step title="Plan">
    <h3>Choose a plan</h3>
    <p>You can change this at any time.</p>
  </Step>
  <Step title="Profile">
    <h3>What should we call you?</h3>
    <input placeholder="Your name" />
  </Step>
  <Step title="Review">
    <h3>Looking good</h3>
    <p>Complete setup to open your workspace.</p>
  </Step>
</Stepper>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
