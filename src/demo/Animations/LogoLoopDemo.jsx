import { useState } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import useForceRerender from '../../hooks/useForceRerender';

import { logoLoop } from '../../constants/code/Animations/logoLoopCode';
import LogoLoop from '../../content/Animations/LogoLoop/LogoLoop';

import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiVercel,
  SiGithub,
  SiDocker,
  SiPrisma,
  SiSupabase,
  SiStripe
} from 'react-icons/si';

const items = [
  { node: <SiReact />, title: 'React', href: 'https://react.dev' },
  { node: <SiNextdotjs />, title: 'Next.js', href: 'https://nextjs.org' },
  { node: <SiTypescript />, title: 'TypeScript', href: 'https://www.typescriptlang.org' },
  { node: <SiTailwindcss />, title: 'Tailwind CSS', href: 'https://tailwindcss.com' },
  { node: <SiVercel />, title: 'Vercel', href: 'https://vercel.com' },
  { node: <SiGithub />, title: 'GitHub', href: 'https://github.com' },
  { node: <SiDocker />, title: 'Docker', href: 'https://www.docker.com' },
  { node: <SiPrisma />, title: 'Prisma', href: 'https://www.prisma.io' },
  { node: <SiSupabase />, title: 'Supabase', href: 'https://supabase.com' },
  { node: <SiStripe />, title: 'Stripe', href: 'https://stripe.com' }
];

const LogoLoopDemo = () => {
  const [key, forceRerender] = useForceRerender();

  const [speed, setSpeed] = useState(100);
  const [logoHeight, setLogoHeight] = useState(60);
  const [gap, setGap] = useState(60);
  const [hoverSpeed, setHoverSpeed] = useState(0);
  const [fadeOut, setFadeOut] = useState(true);
  const [scaleOnHover, setScaleOnHover] = useState(true);
  const [direction, setDirection] = useState('left');
  const [useCustomRender, setUseCustomRender] = useState(false);

  const directionOptions = [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'up', label: 'Up' },
    { value: 'down', label: 'Down' }
  ];

  const propData = [
    {
      name: 'logos',
      type: 'LogoItem[]',
      default: 'required',
      description: 'Array of logo items to display. Each item can be either a React node or an image src.'
    },
    {
      name: 'speed',
      type: 'number',
      default: '120',
      description:
        'Animation speed in pixels per second. Positive values move based on direction, negative values reverse direction.'
    },
    {
      name: 'direction',
      type: "'left' | 'right' | 'up' | 'down'",
      default: "'left'",
      description:
        'Direction of the logo animation loop. Supports horizontal (left/right) and vertical (up/down) scrolling.'
    },
    {
      name: 'width',
      type: 'number | string',
      default: "'100%'",
      description: 'Width of the logo loop container.'
    },
    {
      name: 'logoHeight',
      type: 'number',
      default: '28',
      description: 'Height of the logos in pixels.'
    },
    {
      name: 'gap',
      type: 'number',
      default: '32',
      description: 'Gap between logos in pixels.'
    },
    {
      name: 'hoverSpeed',
      type: 'number | undefined',
      default: '0',
      description:
        'Speed when hovering over the component. Set to 0 to pause, or a lower value for deceleration effect.'
    },
    {
      name: 'fadeOut',
      type: 'boolean',
      default: 'false',
      description: 'Whether to apply fade-out effect at the edges of the container.'
    },
    {
      name: 'fadeOutColor',
      type: 'string',
      default: 'undefined',
      description: 'Color used for the fade-out effect. Only applies when fadeOut is true.'
    },
    {
      name: 'scaleOnHover',
      type: 'boolean',
      default: 'false',
      description: 'Whether to scale logos on hover.'
    },
    {
      name: 'renderItem',
      type: '(item: LogoItem, key: React.Key) => React.ReactNode',
      default: 'undefined',
      description:
        'Custom render function for each logo item. Allows full control over item rendering for animations, tooltips, etc.'
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "'Partner logos'",
      description: 'Accessibility label for the logo loop component.'
    },
    {
      name: 'className',
      type: 'string',
      default: 'undefined',
      description: 'Additional CSS class names to apply to the root element.'
    },
    {
      name: 'style',
      type: 'React.CSSProperties',
      default: 'undefined',
      description: 'Inline styles to apply to the root element.'
    }
  ];

  return (
    <TabsLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container" h={400} p={0} overflow="hidden">
          <LogoLoop
            key={key}
            logos={items}
            width="100%"
            logoHeight={logoHeight}
            gap={gap}
            speed={speed}
            direction={direction}
            scaleOnHover={scaleOnHover}
            hoverSpeed={hoverSpeed}
            fadeOut={fadeOut}
            fadeOutColor="#060010"
            ariaLabel="Our tech stack"
            renderItem={
              useCustomRender
                ? item => (
                    <div
                      style={{
                        padding: '8px',
                        border: '2px solid #8b5cf6',
                        borderRadius: '8px',
                        background: 'rgba(139, 92, 246, 0.1)'
                      }}
                    >
                      {'node' in item ? (
                        item.node
                      ) : (
                        <img src={item.src} alt={item.alt} style={{ height: `${logoHeight}px` }} />
                      )}
                    </div>
                  )
                : undefined
            }
          />
        </Box>

        <Customize>
          <PreviewSelect
            title="Direction"
            options={directionOptions}
            value={direction}
            onChange={value => {
              setDirection(value);
              forceRerender();
            }}
          />

          <PreviewSlider
            title="Speed"
            min={0}
            max={300}
            step={10}
            value={speed}
            valueUnit="px/s"
            onChange={value => {
              setSpeed(value);
              forceRerender();
            }}
          />

          <PreviewSlider
            title="Hover Speed"
            min={0}
            max={200}
            step={10}
            value={hoverSpeed}
            valueUnit="px/s"
            onChange={value => {
              setHoverSpeed(value);
              forceRerender();
            }}
          />

          <PreviewSlider
            title="Logo Height"
            min={20}
            max={120}
            step={5}
            value={logoHeight}
            valueUnit="px"
            onChange={value => {
              setLogoHeight(value);
              forceRerender();
            }}
          />

          <PreviewSlider
            title="Gap"
            min={10}
            max={120}
            step={5}
            value={gap}
            valueUnit="px"
            onChange={value => {
              setGap(value);
              forceRerender();
            }}
          />

          <PreviewSwitch
            title="Fade Out"
            isChecked={fadeOut}
            onChange={checked => {
              setFadeOut(checked);
              forceRerender();
            }}
          />

          <PreviewSwitch
            title="Scale on Hover"
            isChecked={scaleOnHover}
            onChange={checked => {
              setScaleOnHover(checked);
              forceRerender();
            }}
          />

          <PreviewSwitch
            title="Use Custom Render"
            isChecked={useCustomRender}
            onChange={checked => {
              setUseCustomRender(checked);
              forceRerender();
            }}
          />
        </Customize>

        <PropTable data={propData} />
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={logoLoop} />
      </CodeTab>
    </TabsLayout>
  );
};

export default LogoLoopDemo;
