import { useEffect, useRef, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Bookmark02Icon, Comment01Icon, FavouriteIcon, RepostIcon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import ClickSpark from '../../content/Animations/ClickSpark/ClickSpark';
import { clickSpark } from '../../constants/code/Animations/clickSparkCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/ClickSpark';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.62)',
    tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    solid: '#f4f4f5',
    solidText: '#121016',
    hover: 'brightness(1.12)',
    press: 'brightness(0.85)'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.62)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    solid: '#18181b',
    solidText: '#ffffff',
    hover: 'brightness(0.97)',
    press: 'brightness(0.92)'
  }
};

const DEFAULT_PROPS = { demo: 'buttons', preset: 'classic', ...LOOK, layer: 'back' };

const LIGHT_SWAP = {
  '#ffffff': '#18181b',
  '#fde68a': '#d97706',
  '#fbbf24': '#f59e0b',
  '#7dd3fc': '#0284c7'
};

const DARK_SWAP = Object.fromEntries(Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]));

const DEMO_OPTIONS = [
  { value: 'buttons', label: 'Buttons' },
  { value: 'basic', label: 'Basic' }
];

const LAYER_OPTIONS = [
  { value: 'back', label: 'Behind' },
  { value: 'front', label: 'In Front' }
];

const SHAPE_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'streak', label: 'Streak' },
  { value: 'dot', label: 'Dot' },
  { value: 'star', label: 'Star' }
];

const EASING_OPTIONS = [
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'linear', label: 'Linear' },
  { value: 'spring', label: 'Spring' }
];

const propData = [
  {
    name: 'sparkColor',
    type: 'string | string[]',
    default: "'#fff'",
    description: 'Color of the sparks. Pass a list to mix colors through each burst.'
  },
  {
    name: 'shape',
    type: "'line' | 'streak' | 'dot' | 'star'",
    default: "'line'",
    description: 'Look of each spark: a short dash, a comet with a fading tail, a round dot, or a twinkling star.'
  },
  { name: 'sparkCount', type: 'number', default: '8', description: 'Number of sparks in each burst.' },
  { name: 'sparkSize', type: 'number', default: '14', description: 'Length of each spark, in px.' },
  { name: 'sparkWidth', type: 'number', default: '2', description: 'Thickness of each spark, in px.' },
  {
    name: 'sparkRadius',
    type: 'number',
    default: '30',
    description: 'How far the sparks travel from the click, in px.'
  },
  { name: 'duration', type: 'number', default: '500', description: 'Length of a burst, in ms.' },
  {
    name: 'easing',
    type: "'ease-out' | 'ease-in-out' | 'ease-in' | 'linear' | 'spring'",
    default: "'ease-out'",
    description: 'How the sparks slow down as they fly out. Spring overshoots a little and settles back.'
  },
  {
    name: 'randomness',
    type: 'number',
    default: '0.2',
    description: 'Varies the angle, length and speed of each spark, from 0 to 1. 0 gives a perfect star.'
  },
  { name: 'gravity', type: 'number', default: '0', description: 'Pulls the sparks down as they fly, from 0 to 2.' },
  {
    name: 'spread',
    type: 'number',
    default: '360',
    description: 'Angle the sparks fan across, in degrees. 360 is a full circle.'
  },
  {
    name: 'direction',
    type: 'number',
    default: '0',
    description: 'Where a partial spread points, in degrees. 0 is up and 90 is right.'
  },
  { name: 'glow', type: 'number', default: '0', description: 'Soft light around each spark, from 0 to 1.' },
  { name: 'ring', type: 'boolean', default: 'false', description: 'Adds a thin ring that expands from the click.' },
  {
    name: 'layer',
    type: "'front' | 'back'",
    default: "'front'",
    description: 'Draws the sparks over your content, or behind it so they burst out around buttons and cards.'
  },
  {
    name: 'extraScale',
    type: 'number',
    default: '1',
    description: 'Multiplies how far the sparks travel.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Stops new bursts.' },
  {
    name: 'ref',
    type: '{ spark: (x?: number, y?: number) => void }',
    default: '-',
    description: 'Call spark() to fire a burst from code. x and y are in px from the top left; it centers without them.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the wrapper.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the wrapper.' },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Content to wrap. Clicks anywhere inside it send sparks, which can spill past its edges.'
  }
];

const Action = ({ ink, icon, count, active, tone, actionRef, onClick, label }) => (
  <Flex align="center" gap="8px">
    <Box
      as="button"
      type="button"
      ref={actionRef}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      display="grid"
      placeItems="center"
      w="40px"
      h="40px"
      borderRadius="12px"
      cursor="pointer"
      transition="filter 200ms ease"
      _hover={{ filter: ink.hover }}
      _active={{ filter: ink.press }}
      style={{ background: ink.tile, boxShadow: ink.rim, color: active ? tone : ink.text }}
    >
      <Box
        as="span"
        display="inline-grid"
        transition="transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)"
        transform={active ? 'scale(1.12)' : 'scale(1)'}
      >
        <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} fill={active ? 'currentColor' : 'none'} />
      </Box>
    </Box>
    {count !== undefined && (
      <Box
        as="span"
        minW="24px"
        fontSize="13px"
        fontWeight={500}
        color={active ? ink.text : ink.muted}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {count}
      </Box>
    )}
  </Flex>
);

const ClickSparkDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, sparkColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = INK[theme];
  const sparkRef = useRef(null);
  const stageRef = useRef(null);
  const likeRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);

  const palette = Array.isArray(sparkColor) && sparkColor.length ? sparkColor : LOOK.sparkColor;
  const swap = theme === 'light' ? LIGHT_SWAP : DARK_SWAP;
  const colors = palette.map(color => swap[color.toLowerCase()] ?? color);
  const studioColor = colors[0];

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
  };

  useEffect(() => {
    setLiked(false);
    setReposted(false);
    setSaved(false);
    const timers = [];
    const fire = (fx, fy, delay) =>
      timers.push(
        window.setTimeout(() => {
          const stage = stageRef.current;
          if (!stage) return;
          sparkRef.current?.spark(stage.clientWidth * fx, stage.clientHeight * fy);
        }, delay)
      );
    if (demo === 'basic') {
      fire(0.34, 0.42, 450);
      fire(0.64, 0.6, 750);
      fire(0.5, 0.3, 1050);
    } else {
      timers.push(
        window.setTimeout(() => {
          const stage = stageRef.current;
          const like = likeRef.current;
          if (!stage || !like) return;
          const a = stage.getBoundingClientRect();
          const b = like.getBoundingClientRect();
          setLiked(true);
          sparkRef.current?.spark(b.left - a.left + b.width / 2, b.top - a.top + b.height / 2);
        }, 600)
      );
    }
    return () => timers.forEach(window.clearTimeout);
  }, [demo, key]);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'preset', 'sparkColor']}
      computedProps={{ sparkColor: colors.length === 1 ? colors[0] : colors }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            ref={stageRef}
            position="relative"
            className="demo-container"
            h={420}
            p={0}
            overflow="hidden"
            style={{ cursor: 'crosshair' }}
          >
            <ClickSpark key={key} ref={sparkRef} sparkColor={colors} {...settings}>
              <Flex
                w="100%"
                h="100%"
                align="center"
                justify="center"
                gap="10px"
                wrap="wrap"
                p={{ base: '16px', md: '24px' }}
              >
                {demo === 'buttons' && (
                  <Flex align="center" gap={{ base: '10px', md: '22px' }} wrap="wrap" justify="center">
                    <Action ink={ink} icon={Comment01Icon} count={12} label="Reply" />
                    <Action
                      ink={ink}
                      icon={RepostIcon}
                      count={reposted ? 5 : 4}
                      active={reposted}
                      tone="#22c55e"
                      label="Repost"
                      onClick={() => setReposted(value => !value)}
                    />
                    <Action
                      ink={ink}
                      icon={FavouriteIcon}
                      count={liked ? 129 : 128}
                      active={liked}
                      tone="#f43f5e"
                      label="Like"
                      actionRef={likeRef}
                      onClick={() => setLiked(value => !value)}
                    />
                    <Action
                      ink={ink}
                      icon={Bookmark02Icon}
                      active={saved}
                      tone={ink.text}
                      label="Save"
                      onClick={() => setSaved(value => !value)}
                    />
                  </Flex>
                )}
              </Flex>
            </ClickSpark>
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="click-spark"
              currentProps={{ ...settings, sparkColor: studioColor }}
              defaultProps={{ ...LOOK, sparkColor: '#ffffff' }}
            />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={colors}
              min={1}
              max={6}
              onChange={value => updateProp('sparkColor', value)}
            />
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSelect
              title="Easing"
              options={EASING_OPTIONS}
              value={settings.easing}
              onChange={value => updateProp('easing', value)}
            />
            <PreviewSelect
              title="Layer"
              options={LAYER_OPTIONS}
              value={settings.layer}
              onChange={value => updateProp('layer', value)}
            />
            <PreviewSlider
              title="Count"
              min={1}
              max={32}
              step={1}
              value={settings.sparkCount}
              onChange={value => updateProp('sparkCount', value)}
            />
            <PreviewSlider
              title="Size"
              min={4}
              max={40}
              step={1}
              value={settings.sparkSize}
              valueUnit="px"
              onChange={value => updateProp('sparkSize', value)}
            />
            <PreviewSlider
              title="Width"
              min={1}
              max={6}
              step={0.5}
              value={settings.sparkWidth}
              valueUnit="px"
              onChange={value => updateProp('sparkWidth', value)}
            />
            <PreviewSlider
              title="Distance"
              min={8}
              max={120}
              step={1}
              value={settings.sparkRadius}
              valueUnit="px"
              onChange={value => updateProp('sparkRadius', value)}
            />
            <PreviewSlider
              title="Duration"
              min={200}
              max={1600}
              step={50}
              value={settings.duration}
              valueUnit="ms"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Randomness"
              min={0}
              max={1}
              step={0.05}
              value={settings.randomness}
              onChange={value => updateProp('randomness', value)}
            />
            <PreviewSlider
              title="Gravity"
              min={0}
              max={2}
              step={0.05}
              value={settings.gravity}
              onChange={value => updateProp('gravity', value)}
            />
            <PreviewSlider
              title="Spread"
              min={20}
              max={360}
              step={5}
              value={settings.spread}
              valueUnit="°"
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Direction"
              min={-180}
              max={180}
              step={5}
              value={settings.direction}
              valueUnit="°"
              isDisabled={settings.spread >= 360}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSwitch title="Ring" isChecked={settings.ring} onChange={value => updateProp('ring', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={clickSpark} componentName="ClickSpark" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ClickSparkDemo;
