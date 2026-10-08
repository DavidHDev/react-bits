import { useMemo, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Bookmark02Icon, Share03Icon } from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';

import SpotlightCard from '../../content/Components/SpotlightCard/SpotlightCard';
import { spotlightCard } from '../../constants/code/Components/spotlightCardCode';

const DEFAULT_PROPS = {
  spotlightColor: '#ffffff',
  intensity: 0.15,
  spotlightSize: 240,
  softness: 0.7,
  shape: 'circle',
  borderGlow: 0.6,
  proximity: 80,
  smoothing: 0.3,
  grain: 0,
  ambient: false,
  flare: true
};

const SHAPE_OPTIONS = [
  { value: 'circle', label: 'Circle' },
  { value: 'beam', label: 'Beam' }
];

const AVATAR =
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=240&h=240&fit=crop&crop=focalpoint&fp-x=0.64&fp-y=0.355&fp-z=1.45&sat=-100&q=80';

const SKILLS = ['Figma', 'UX Design'];

const STATS = [
  { value: '4.5', label: 'Rating', star: true },
  { value: '$15K+', label: 'Earned' },
  { value: '$80/hr', label: 'Rate' }
];

const Star = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M12 2.8l2.83 5.73 6.33.92-4.58 4.46 1.08 6.3L12 17.24l-5.66 2.97 1.08-6.3-4.58-4.46 6.33-.92z" />
  </svg>
);

const GLASS = {
  dark: {
    bg: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.13)',
    shadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 24px -12px rgba(0, 0, 0, 0.7)'
  },
  light: {
    bg: 'rgba(24, 24, 27, 0.05)',
    hover: 'rgba(24, 24, 27, 0.08)',
    shadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 24px -14px rgba(24, 24, 27, 0.3)'
  }
};

const ProfileContent = ({ saved, onSave, theme }) => {
  const glass = GLASS[theme] ?? GLASS.dark;
  const glassButton = {
    border: 'none',
    bg: glass.bg,
    boxShadow: glass.shadow,
    backdropFilter: 'blur(14px) saturate(1.6)',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    _hover: { bg: glass.hover }
  };

  return (
    <Flex direction="column" userSelect="none">
      <Flex justify="space-between" align="flex-start">
        <Box
          w="60px"
          h="60px"
          borderRadius="50%"
          bg="#9a9a9a"
          backgroundImage={`url(${AVATAR})`}
          backgroundSize="cover"
          backgroundPosition="50% 50%"
          backgroundRepeat="no-repeat"
          role="img"
          aria-label="Ethan Harrison"
        />
        <Box
          as="button"
          type="button"
          aria-label="Share profile"
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="36px"
          h="36px"
          mr="-6px"
          mt="-4px"
          borderRadius="50%"
          color="inherit"
          bg="transparent"
          cursor="pointer"
          _hover={{ bg: 'var(--surface-ghost)' }}
        >
          <HugeiconsIcon icon={Share03Icon} size={20} strokeWidth={1.6} />
        </Box>
      </Flex>

      <Text mt={4} fontSize="1.45rem" fontWeight={500} letterSpacing="-0.4px" lineHeight={1.2}>
        Ethan Harrison
      </Text>
      <Text mt={1} fontSize="15px" color="var(--text-muted)">
        Product designer
      </Text>

      <Flex mt={3.5} gap={2}>
        {SKILLS.map(skill => (
          <Box
            key={skill}
            px="10px"
            py="5px"
            borderRadius="8px"
            bg="var(--surface-ghost)"
            fontSize="12px"
            fontWeight={500}
            lineHeight={1}
          >
            {skill}
          </Box>
        ))}
      </Flex>

      <Flex mt={6} align="stretch">
        {STATS.map(stat => (
          <Flex key={stat.label} flex={1} direction="column" align="center" gap={1}>
            <Flex align="center" gap={1.5} fontSize="15px" fontWeight={500}>
              {stat.star ? <Star /> : null}
              {stat.value}
            </Flex>
            <Text fontSize="12px" color="var(--text-muted)">
              {stat.label}
            </Text>
          </Flex>
        ))}
      </Flex>

      <Flex mt={6} gap={2.5}>
        <Box
          as="button"
          type="button"
          flex={1}
          h="48px"
          borderRadius="999px"
          fontSize="15px"
          fontWeight={500}
          {...glassButton}
        >
          Get in touch
        </Box>
        <Box
          as="button"
          type="button"
          aria-label={saved ? 'Remove bookmark' : 'Bookmark profile'}
          aria-pressed={saved}
          onClick={onSave}
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="48px"
          h="48px"
          borderRadius="50%"
          {...glassButton}
          {...(saved
            ? { bg: 'var(--text-primary)', color: 'var(--bg-body)', _hover: { bg: 'var(--text-primary)' } }
            : {})}
        >
          <HugeiconsIcon icon={Bookmark02Icon} size={20} strokeWidth={1.7} />
        </Box>
      </Flex>
    </Flex>
  );
};

const SpotlightCardDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue('light', 'dark');
  const [saved, setSaved] = useState(false);
  const inkDefault = theme === 'light' && props.spotlightColor === DEFAULT_PROPS.spotlightColor;
  const spotlightColor = inkDefault ? undefined : props.spotlightColor;

  const computedProps = useMemo(
    () => ({
      ...(inkDefault ? { spotlightColor: '#18181b' } : {}),
      ...(theme === 'light' ? { theme: 'light' } : {})
    }),
    [inkDefault, theme]
  );

  const propData = useMemo(
    () => [
      { name: 'children', type: 'ReactNode', default: '-', description: 'Content of the card.' },
      {
        name: 'spotlightColor',
        type: 'string',
        default: 'undefined',
        description:
          'Color of the light. Any CSS color works and its alpha is respected. Defaults to white on dark cards and near black on light ones.'
      },
      {
        name: 'intensity',
        type: 'number',
        default: '0.15',
        description: 'Brightness of the light on the card surface, from 0 to 1.'
      },
      {
        name: 'spotlightSize',
        type: 'number',
        default: '240',
        description: 'Radius of the light in px.'
      },
      {
        name: 'softness',
        type: 'number',
        default: '0.7',
        description:
          'How gradually the light fades out. 0 gives a crisp disc, 1 a soft glow that fades from the center.'
      },
      {
        name: 'shape',
        type: "'circle' | 'beam'",
        default: "'circle'",
        description:
          'Circle is a round spotlight around the pointer. Beam pours light down from the top edge toward it, like a stage light.'
      },
      {
        name: 'borderGlow',
        type: 'number',
        default: '0.6',
        description: 'How much the card edge catches the light near the pointer, from 0 to 1.'
      },
      {
        name: 'proximity',
        type: 'number',
        default: '80',
        description:
          'Distance in px outside the card at which the light starts to reach it. Cards placed together share one light this way. 0 lights a card only while hovered.'
      },
      {
        name: 'smoothing',
        type: 'number',
        default: '0.3',
        description: 'How far the light floats behind the pointer. 0 sticks to it.'
      },
      {
        name: 'ambient',
        type: 'boolean',
        default: 'false',
        description:
          'Lets the light drift slowly across the card while nothing points at it, which keeps cards alive on touch screens.'
      },
      {
        name: 'flare',
        type: 'boolean',
        default: 'true',
        description: 'The light swells and brightens while the card is pressed.'
      },
      {
        name: 'grain',
        type: 'number',
        default: '0',
        description: 'Film grain inside the light, from 0 to 1. A little removes banding from large soft gradients.'
      },
      {
        name: 'theme',
        type: "'dark' | 'light'",
        default: "'dark'",
        description:
          'Surface, border and light treatment for dark or light pages. Override the colors with the --spotlight-card-surface and --spotlight-card-border CSS variables.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the card.' },
      {
        name: '...rest',
        type: 'HTMLAttributes<HTMLDivElement>',
        default: '-',
        description: 'Any other div props, such as onClick, id or aria attributes, are passed to the card.'
      }
    ],
    []
  );

  const cardProps = { ...props, spotlightColor, theme };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" minH={480} py={10}>
            <SpotlightCard {...cardProps} style={{ width: '100%', maxWidth: 330, padding: 24, borderRadius: 28 }}>
              <ProfileContent saved={saved} onSave={() => setSaved(value => !value)} theme={theme} />
            </SpotlightCard>
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Spotlight Color"
              color={inkDefault ? '#18181b' : props.spotlightColor}
              onChange={value => updateProp('spotlightColor', value)}
            />

            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={props.shape}
              onChange={value => updateProp('shape', value)}
            />

            <PreviewSlider
              title="Intensity"
              min={0}
              max={1}
              step={0.05}
              value={props.intensity}
              onChange={value => updateProp('intensity', value)}
            />

            <PreviewSlider
              title="Size"
              min={80}
              max={600}
              step={10}
              value={props.spotlightSize}
              onChange={value => updateProp('spotlightSize', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={props.softness}
              onChange={value => updateProp('softness', value)}
            />

            <PreviewSlider
              title="Border Glow"
              min={0}
              max={1}
              step={0.05}
              value={props.borderGlow}
              onChange={value => updateProp('borderGlow', value)}
            />

            <PreviewSlider
              title="Proximity"
              min={0}
              max={240}
              step={10}
              value={props.proximity}
              onChange={value => updateProp('proximity', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={props.smoothing}
              onChange={value => updateProp('smoothing', value)}
            />

            <PreviewSlider
              title="Grain"
              min={0}
              max={1}
              step={0.05}
              value={props.grain}
              onChange={value => updateProp('grain', value)}
            />

            <PreviewSwitch title="Ambient" isChecked={props.ambient} onChange={value => updateProp('ambient', value)} />

            <PreviewSwitch title="Flare" isChecked={props.flare} onChange={value => updateProp('flare', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={spotlightCard} componentName="SpotlightCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SpotlightCardDemo;
