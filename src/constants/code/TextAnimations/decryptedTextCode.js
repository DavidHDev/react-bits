import code from '@content/TextAnimations/DecryptedText/DecryptedText.jsx?raw';
import tailwind from '@tailwind/TextAnimations/DecryptedText/DecryptedText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/DecryptedText/DecryptedText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/DecryptedText/DecryptedText.tsx?raw';

export const decryptedText = {
  dependencies: `motion`,
  usage: `import DecryptedText from './DecryptedText';

<DecryptedText
  text="Hacking into the mainframe..."
  animateOn="inViewHover"
  effect="scramble"
  sequential={true}
  revealDirection="start"
  speed={60}
  maxIterations={10}
  hoverRadius={100}
  scrambleColor="#2bb673"
  loop={false}
  loopDelay={2000}
  useOriginalCharsOnly={false}
  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+"
  className="revealed"
  encryptedClassName="encrypted"
/>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
