import { useRef } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FavouriteIcon, PlayIcon, Share08Icon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import TargetCursor from '../../content/Animations/TargetCursor/TargetCursor';
import { targetCursor } from '../../constants/code/Animations/targetCursorCode';

const LOOK = {
  spinDuration: 2,
  hoverDuration: 0.2,
  size: 36,
  cornerSize: 12,
  thickness: 3,
  padding: 6,
  dotSize: 4
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  cursorColor: '#ffffff',
  cursorColorOnTarget: '#ffffff',
  blendMode: 'difference',
  parallaxOn: true,
  matchRadius: true,
  showLabel: true,
  clickEffect: true,
  hideDefaultCursor: true
};

const PRESETS = {
  classic: { ...LOOK },
  calm: { ...LOOK, spinDuration: 0, thickness: 1.5, cornerSize: 10, padding: 8, size: 30, hoverDuration: 0.35 },
  bold: { ...LOOK, spinDuration: 3, thickness: 4, cornerSize: 18, padding: 10, size: 46, dotSize: 6 },
  tight: { ...LOOK, spinDuration: 1.2, thickness: 2, cornerSize: 8, padding: 2, size: 24, hoverDuration: 0.12 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'calm', label: 'Calm' },
  { value: 'bold', label: 'Bold' },
  { value: 'tight', label: 'Tight' }
];

const BLEND_OPTIONS = [
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'normal', label: 'Normal' }
];

const propData = [
  {
    name: 'targetSelector',
    type: 'string',
    default: "'.cursor-target'",
    description: 'CSS selector for the elements the brackets lock onto.'
  },
  { name: 'cursorColor', type: 'string', default: "'#ffffff'", description: 'Color of the brackets and dot.' },
  {
    name: 'cursorColorOnTarget',
    type: 'string',
    default: '-',
    description: 'Color the cursor blends to while locked onto a target.'
  },
  {
    name: 'spinDuration',
    type: 'number',
    default: '2',
    description: 'Seconds per turn while the cursor roams. 0 stops the spin.'
  },
  {
    name: 'hoverDuration',
    type: 'number',
    default: '0.2',
    description: 'How long the brackets take to snap onto a target, in seconds.'
  },
  {
    name: 'parallaxOn',
    type: 'boolean',
    default: 'true',
    description: 'Lets the locked brackets lean slightly toward the cursor.'
  },
  {
    name: 'hideDefaultCursor',
    type: 'boolean',
    default: 'true',
    description: 'Hides the system cursor while this cursor is shown.'
  },
  { name: 'size', type: 'number', default: '36', description: 'Size of the reticle while roaming, in px.' },
  { name: 'cornerSize', type: 'number', default: '12', description: 'Length of each bracket arm, in px.' },
  { name: 'thickness', type: 'number', default: '3', description: 'Stroke width of the brackets, in px.' },
  {
    name: 'padding',
    type: 'number',
    default: '6',
    description: 'Gap between a locked target and the brackets, in px.'
  },
  {
    name: 'matchRadius',
    type: 'boolean',
    default: 'true',
    description: "Rounds the brackets to follow the target's corner radius."
  },
  { name: 'dotSize', type: 'number', default: '4', description: 'Size of the center dot, in px. 0 hides it.' },
  {
    name: 'blendMode',
    type: 'string',
    default: "'difference'",
    description: 'CSS blend mode of the cursor. Difference keeps it visible on any background.'
  },
  {
    name: 'showLabel',
    type: 'boolean',
    default: 'true',
    description: 'Shows the data-cursor-label text of a locked target above the brackets.'
  },
  {
    name: 'clickEffect',
    type: 'boolean',
    default: 'true',
    description: 'Squeezes the brackets and dot while the mouse button is held.'
  },
  {
    name: 'container',
    type: 'RefObject | HTMLElement',
    default: '-',
    description: 'Limits the cursor to one element. By default it works across the whole page.'
  }
];

const TargetCursorDemo = () => {
  const stageRef = useRef(null);
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const photo = `/assets/demo/${theme === 'light' ? 'day' : 'night'}-sky.webp`;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({
      ...base,
      ...PRESETS[value],
      cursorColor: settings.cursorColor,
      cursorColorOnTarget: settings.cursorColorOnTarget,
      blendMode: settings.blendMode,
      preset: value
    });
  };

  const round = {
    className: 'cursor-target',
    as: 'button',
    type: 'button',
    w: '48px',
    h: '48px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    bg: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)'
  };

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
          <Box ref={stageRef} position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <Flex direction="column" align="center" gap="20px">
              <Box
                className="cursor-target"
                data-cursor-label="View"
                w={{ base: '260px', md: '320px' }}
                h={{ base: '170px', md: '200px' }}
                borderRadius="20px"
                overflow="hidden"
                bg="var(--bg-elevated)"
              >
                <img
                  src={photo}
                  alt=""
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
              <Flex gap="12px" align="center">
                <Box
                  className="cursor-target"
                  data-cursor-label="Play"
                  as="button"
                  type="button"
                  h="48px"
                  px="22px"
                  borderRadius="12px"
                  display="flex"
                  alignItems="center"
                  gap="8px"
                  bg="var(--text-primary)"
                  color="var(--bg-body)"
                  fontWeight={600}
                  fontSize="15px"
                >
                  <HugeiconsIcon icon={PlayIcon} size={18} strokeWidth={2} />
                  Play
                </Box>
                <Box {...round} data-cursor-label="Like">
                  <HugeiconsIcon icon={FavouriteIcon} size={20} strokeWidth={1.8} />
                </Box>
                <Box {...round} data-cursor-label="Share">
                  <HugeiconsIcon icon={Share08Icon} size={20} strokeWidth={1.8} />
                </Box>
              </Flex>
            </Flex>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Cursor Color"
              color={settings.cursorColor}
              onChange={value => updateProp('cursorColor', value)}
            />
            <PreviewColorPickerCustom
              title="Color On Target"
              color={settings.cursorColorOnTarget}
              onChange={value => updateProp('cursorColorOnTarget', value)}
            />
            <PreviewSelect
              title="Blend Mode"
              options={BLEND_OPTIONS}
              value={settings.blendMode}
              onChange={value => updateProp('blendMode', value)}
            />
            <PreviewSlider
              title="Spin Duration"
              min={0}
              max={5}
              step={0.1}
              value={settings.spinDuration}
              valueUnit="s"
              onChange={value => updateProp('spinDuration', value)}
            />
            <PreviewSlider
              title="Hover Duration"
              min={0.05}
              max={1}
              step={0.05}
              value={settings.hoverDuration}
              valueUnit="s"
              onChange={value => updateProp('hoverDuration', value)}
            />
            <PreviewSlider
              title="Size"
              min={16}
              max={80}
              step={1}
              value={settings.size}
              valueUnit="px"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Corner Size"
              min={4}
              max={30}
              step={1}
              value={settings.cornerSize}
              valueUnit="px"
              onChange={value => updateProp('cornerSize', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={1}
              max={6}
              step={0.5}
              value={settings.thickness}
              valueUnit="px"
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Padding"
              min={0}
              max={24}
              step={1}
              value={settings.padding}
              valueUnit="px"
              onChange={value => updateProp('padding', value)}
            />
            <PreviewSlider
              title="Dot Size"
              min={0}
              max={12}
              step={1}
              value={settings.dotSize}
              valueUnit="px"
              onChange={value => updateProp('dotSize', value)}
            />
            <PreviewSwitch
              title="Match Radius"
              isChecked={settings.matchRadius}
              onChange={value => updateProp('matchRadius', value)}
            />
            <PreviewSwitch
              title="Parallax"
              isChecked={settings.parallaxOn}
              onChange={value => updateProp('parallaxOn', value)}
            />
            <PreviewSwitch
              title="Show Label"
              isChecked={settings.showLabel}
              onChange={value => updateProp('showLabel', value)}
            />
            <PreviewSwitch
              title="Click Effect"
              isChecked={settings.clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSwitch
              title="Hide Default Cursor"
              isChecked={settings.hideDefaultCursor}
              onChange={value => updateProp('hideDefaultCursor', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={targetCursor} componentName="TargetCursor" />
        </CodeTab>
      </TabsLayout>

      <TargetCursor {...settings} container={stageRef} />
    </ComponentPropsProvider>
  );
};

export default TargetCursorDemo;
