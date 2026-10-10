import code from '@content/Components/ProfileCard/ProfileCard.jsx?raw';
import css from '@content/Components/ProfileCard/ProfileCard.css?raw';
import tailwind from '@tailwind/Components/ProfileCard/ProfileCard.jsx?raw';
import tsCode from '@ts-default/Components/ProfileCard/ProfileCard.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/ProfileCard/ProfileCard.tsx?raw';

export const profileCard = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import ProfileCard from './ProfileCard';

<ProfileCard
  name="Javi A. Torres"
  title="Software Engineer"
  handle="javicodes"
  status="Online"
  contactText="Contact"
  avatarUrl="/path/to/portrait.png"
  iconUrl="/path/to/pattern.png"
  holo={0.8}
  glare={0.5}
  tiltStrength={12}
  parallax={8}
  radius={16}
  enableTilt={true}
  intro={true}
  showUserInfo={true}
  enableMobileTilt={false}
  theme="dark"
  onContactClick={() => console.log('Contact clicked')}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
