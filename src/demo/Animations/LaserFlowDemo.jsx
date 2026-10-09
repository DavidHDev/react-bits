import { useRef } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  CircleIcon,
  DashedLineCircleIcon,
  FilterHorizontalIcon,
  Folder01Icon,
  InboxIcon,
  Layers01Icon,
  Loading03Icon,
  Search01Icon,
  Task01Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import Customize from '../../components/common/Preview/Customize';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '@/components/common/Preview/RefreshButton';
import useForceRerender from '@/hooks/useForceRerender';
import { useColorModeValue } from '../../components/setup/color-mode';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import LaserFlow from '@/content/Animations/LaserFlow/LaserFlow';
import { laserFlow } from '@/constants/code/Animations/laserFlowCode';

const DEFAULT_PROPS = {
  preset: 'waterfall',
  color: '#3847ff',
  beamPosition: 0.6,
  intensity: 1.8,
  beamWidth: 1.5,
  flare: 1.5,
  spread: 1.5,
  spill: 1,
  fog: 0.2,
  dust: 1.6,
  streaks: 1.5,
  dots: 1,
  pulse: 1.5,
  speed: 1.5,
  seed: 3,
  mouseInteraction: true,
  revealRadius: 220,
  revealOpacity: 0.6,
  intro: true
};

const REVEAL_IMAGE = '/assets/demo/laser-ui.svg';

const PRESETS = {
  waterfall: {},
  twin: { beamPosition: 0.5 },
  floor: { beamPosition: 0.5 },
  ember: { color: '#ff5a1f', fog: 0.5 },
  glacier: { color: '#1fb6ff', beamPosition: 0.45 },
  quiet: { fog: 0, dust: 0, dots: 0, streaks: 0.6, beamWidth: 1, intensity: 1.2, pulse: 1 }
};

const SURFACES = {
  waterfall: { left: '4%', right: '24%', top: '55%' },
  twin: { left: '27%', right: '27%', top: '55%' },
  floor: null,
  ember: { left: '24%', right: '22%', top: '54%' },
  glacier: { left: '20%', right: '42%', top: '52%' },
  quiet: { left: '4%', right: '24%', top: '55%' }
};

const PRESET_OPTIONS = [
  { value: 'waterfall', label: 'Waterfall' },
  { value: 'twin', label: 'Twin Falls' },
  { value: 'floor', label: 'Floor' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'quiet', label: 'Quiet' }
];

const propData = [
  {
    name: 'surfaceRef',
    type: 'RefObject<HTMLElement>',
    default: '-',
    description: 'Element the beam lands on. The light spreads along its top edge and spills over its corners.'
  },
  {
    name: 'beamPosition',
    type: 'number',
    default: '0.6',
    description: 'Horizontal position of the beam, from 0 at the left edge to 1 at the right edge.'
  },
  {
    name: 'surfaceLevel',
    type: 'number',
    default: '1',
    description: 'Where the beam lands when no surfaceRef is given, from 0 at the top to 1 at the bottom.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'#3847ff'",
    description: 'Color of the light. Every other tone is derived from it.'
  },
  { name: 'intensity', type: 'number', default: '1.8', description: 'Overall brightness of the light.' },
  { name: 'beamWidth', type: 'number', default: '1.5', description: 'Thickness of the beam and its glow.' },
  {
    name: 'flare',
    type: 'number',
    default: '1.5',
    description: 'Size of the splash where the beam meets the surface.'
  },
  { name: 'spread', type: 'number', default: '1.5', description: 'How far the light travels along the surface.' },
  { name: 'spill', type: 'number', default: '1', description: 'How much light pours over the corners of the surface.' },
  { name: 'fog', type: 'number', default: '0.2', description: 'Amount of smoke lit up by the beam. 0 turns it off.' },
  { name: 'dust', type: 'number', default: '1.6', description: 'Amount of glittering dust flowing with the light.' },
  {
    name: 'streaks',
    type: 'number',
    default: '1.5',
    description: 'Brightness of the fine lines flowing along the splash.'
  },
  { name: 'dots', type: 'number', default: '1', description: 'Strength of the fine dot texture in the glow.' },
  { name: 'pulse', type: 'number', default: '1.5', description: 'How much the splash breathes over time.' },
  { name: 'speed', type: 'number', default: '1.5', description: 'Animation speed. 0 holds the light still.' },
  { name: 'seed', type: 'number', default: '3', description: 'Changes the shape of the smoke.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Brightens the light, smoke and dust softly around the cursor.'
  },
  {
    name: 'revealImage',
    type: 'string',
    default: '-',
    description: 'Image revealed through the light around the cursor, such as a screenshot of your UI.'
  },
  {
    name: 'revealRadius',
    type: 'number',
    default: '220',
    description: 'Radius of the reveal around the cursor, in pixels.'
  },
  {
    name: 'revealOpacity',
    type: 'number',
    default: '0.6',
    description: 'Strength of the revealed image. 0 hides it.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Drops the beam in and lets the light run along the surface on mount.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Use light for light page backgrounds.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const NAV = [
  { icon: InboxIcon, label: 'Inbox' },
  { icon: Task01Icon, label: 'My issues', active: true },
  { icon: Folder01Icon, label: 'Projects' },
  { icon: Layers01Icon, label: 'Views' }
];

const ISSUES = [
  { icon: Loading03Icon, title: 'Polish the onboarding flow', id: 'APP-142', who: 'MK' },
  { icon: CircleIcon, title: 'Sync drafts across devices', id: 'APP-139', who: 'JL' },
  { icon: DashedLineCircleIcon, title: 'Audit color tokens', id: 'APP-131', who: 'AR' },
  { icon: CheckmarkCircle02Icon, title: 'Ship keyboard shortcuts', id: 'APP-127', who: 'DS' },
  { icon: CircleIcon, title: 'Faster search on large projects', id: 'APP-120', who: 'MK' }
];

const AppWindow = ({ surfaceRef, surface }) => (
  <Box
    ref={surfaceRef}
    className="laser-window"
    position="absolute"
    left={surface.left}
    right={surface.right}
    top={surface.top}
    bottom="-24px"
    borderRadius="14px"
    bg="var(--bg-card)"
    border="1px solid var(--border-primary)"
    overflow="hidden"
    color="var(--text-primary)"
    pointerEvents="none"
    userSelect="none"
  >
    <Flex
      h="34px"
      align="center"
      px="12px"
      gap="7px"
      borderBottom="1px solid var(--border-primary)"
      position="relative"
    >
      <Box
        w="11px"
        h="11px"
        borderRadius="full"
        bg="var(--surface-ghost-hover)"
        border="1px solid var(--border-primary)"
      />
      <Box
        w="11px"
        h="11px"
        borderRadius="full"
        bg="var(--surface-ghost-hover)"
        border="1px solid var(--border-primary)"
      />
      <Box
        w="11px"
        h="11px"
        borderRadius="full"
        bg="var(--surface-ghost-hover)"
        border="1px solid var(--border-primary)"
      />
      <Text
        className="laser-window-title"
        position="absolute"
        left="0"
        right="0"
        textAlign="center"
        fontSize="12px"
        fontWeight={500}
        color="var(--text-dimmed)"
      >
        Tracker
      </Text>
    </Flex>
    <Flex h="100%">
      <Flex
        className="laser-window-sidebar"
        direction="column"
        gap="2px"
        w="150px"
        flexShrink={0}
        p="10px"
        borderRight="1px solid var(--border-primary)"
      >
        {NAV.map(item => (
          <Flex
            key={item.label}
            align="center"
            gap="8px"
            px="8px"
            h="28px"
            borderRadius="8px"
            bg={item.active ? 'var(--surface-ghost)' : 'transparent'}
            color={item.active ? 'var(--text-primary)' : 'var(--text-dimmed)'}
          >
            <HugeiconsIcon icon={item.icon} size={15} strokeWidth={1.6} />
            <Text fontSize="12px" fontWeight={500} whiteSpace="nowrap">
              {item.label}
            </Text>
          </Flex>
        ))}
      </Flex>
      <Box flex="1" minW={0} px="16px" pt="12px">
        <Flex align="center" justify="space-between" mb="8px">
          <Flex align="baseline" gap="8px" minW={0}>
            <Text fontSize="13px" fontWeight={600} whiteSpace="nowrap">
              My issues
            </Text>
            <Text fontSize="12px" color="var(--text-dimmed)">
              {ISSUES.length}
            </Text>
          </Flex>
          <Flex className="laser-window-tools" gap="6px" color="var(--text-dimmed)">
            <HugeiconsIcon icon={Search01Icon} size={15} strokeWidth={1.6} />
            <HugeiconsIcon icon={FilterHorizontalIcon} size={15} strokeWidth={1.6} />
          </Flex>
        </Flex>
        {ISSUES.map(issue => (
          <Flex key={issue.id} align="center" gap="10px" h="34px" borderTop="1px solid var(--border-primary)" minW={0}>
            <Box color="var(--text-dimmed)" flexShrink={0} display="flex">
              <HugeiconsIcon icon={issue.icon} size={14} strokeWidth={1.8} />
            </Box>
            <Text fontSize="12px" flex="1" minW={0} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              {issue.title}
            </Text>
            <Text className="laser-window-meta" fontSize="11px" color="var(--text-dimmed)" whiteSpace="nowrap">
              {issue.id}
            </Text>
            <Flex
              className="laser-window-meta"
              w="20px"
              h="20px"
              flexShrink={0}
              borderRadius="full"
              bg="var(--surface-ghost)"
              border="1px solid var(--border-primary)"
              align="center"
              justify="center"
              fontSize="9px"
              fontWeight={600}
              color="var(--text-muted)"
            >
              {issue.who}
            </Flex>
          </Flex>
        ))}
      </Box>
    </Flex>
  </Box>
);

const LaserFlowDemo = () => {
  const surfaceRef = useRef(null);
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const surface = preset in SURFACES ? SURFACES[preset] : SURFACES.waterfall;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const { intro, revealRadius, revealOpacity, ...studioProps } = settings;

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <LaserFlow
              key={key}
              {...studioProps}
              intro={intro}
              revealImage={REVEAL_IMAGE}
              revealRadius={revealRadius}
              revealOpacity={revealOpacity}
              theme={theme}
              surfaceRef={surface ? surfaceRef : undefined}
            />

            {surface && <AppWindow surfaceRef={surfaceRef} surface={surface} />}

            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="laser-flow" currentProps={studioProps} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={props.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Beam Position"
              min={0.2}
              max={0.8}
              step={0.01}
              value={props.beamPosition}
              onChange={value => updateProp('beamPosition', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.3}
              max={2}
              step={0.05}
              value={props.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Beam Width"
              min={0.4}
              max={3}
              step={0.05}
              value={props.beamWidth}
              onChange={value => updateProp('beamWidth', value)}
            />
            <PreviewSlider
              title="Flare"
              min={0.5}
              max={2}
              step={0.05}
              value={props.flare}
              onChange={value => updateProp('flare', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0.4}
              max={2}
              step={0.05}
              value={props.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Spill"
              min={0}
              max={2}
              step={0.05}
              value={props.spill}
              onChange={value => updateProp('spill', value)}
            />
            <PreviewSlider
              title="Fog"
              min={0}
              max={2}
              step={0.05}
              value={props.fog}
              onChange={value => updateProp('fog', value)}
            />
            <PreviewSlider
              title="Dust"
              min={0}
              max={2}
              step={0.05}
              value={props.dust}
              onChange={value => updateProp('dust', value)}
            />
            <PreviewSlider
              title="Streaks"
              min={0}
              max={2}
              step={0.05}
              value={props.streaks}
              onChange={value => updateProp('streaks', value)}
            />
            <PreviewSlider
              title="Dots"
              min={0}
              max={2}
              step={0.05}
              value={props.dots}
              onChange={value => updateProp('dots', value)}
            />
            <PreviewSlider
              title="Pulse"
              min={0}
              max={2}
              step={0.05}
              value={props.pulse}
              onChange={value => updateProp('pulse', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Seed"
              min={0}
              max={20}
              step={1}
              value={props.seed}
              onChange={value => updateProp('seed', value)}
            />
            <PreviewSlider
              title="Reveal Radius"
              min={80}
              max={400}
              step={10}
              value={props.revealRadius}
              valueUnit="px"
              onChange={value => updateProp('revealRadius', value)}
            />
            <PreviewSlider
              title="Reveal Opacity"
              min={0}
              max={1}
              step={0.05}
              value={props.revealOpacity}
              onChange={value => updateProp('revealOpacity', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={props.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch title="Intro" isChecked={props.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={laserFlow} componentName="LaserFlow" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LaserFlowDemo;
