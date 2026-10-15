import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import Dependencies from '../../components/code/Dependencies';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import FoldText from '../../content/TextAnimations/FoldText/FoldText';
import { foldText } from '../../constants/code/TextAnimations/foldTextCode';

const LOOK = {
  foldStyle: 'paper',
  trigger: 'mount',
  splitBy: 'char',
  hinge: 'top',
  staggerFrom: 'start',
  ease: 'power3.out',
  foldAngle: 92,
  duration: 0.65,
  stagger: 0.045,
  loopDelay: 1.4,
  hoverRefold: true,
  refoldRadius: 140,
  refoldAngle: 45,
  perspective: 700,
  creaseShading: 0.55
};

const PRESETS = {
  paper: { ...LOOK },
  blinds: {
    ...LOOK,
    foldStyle: 'blinds',
    trigger: 'loop',
    staggerFrom: 'center',
    ease: 'expo.out',
    foldAngle: 90,
    duration: 1.1,
    stagger: 0.05,
    loopDelay: 1.6,
    refoldRadius: 150,
    refoldAngle: 60,
    perspective: 500,
    creaseShading: 0.8
  },
  flip: {
    ...LOOK,
    foldStyle: 'flip',
    hinge: 'left',
    ease: 'back.out(1.2)',
    duration: 1.15,
    stagger: 0.06,
    refoldRadius: 120,
    refoldAngle: 40,
    perspective: 900,
    creaseShading: 0.45
  },
  swing: {
    ...LOOK,
    trigger: 'loop',
    splitBy: 'word',
    hinge: 'right',
    staggerFrom: 'end',
    ease: 'circ.out',
    foldAngle: 112,
    duration: 0.95,
    stagger: 0.14,
    loopDelay: 0.9,
    hoverRefold: false,
    perspective: 420,
    creaseShading: 0.7
  }
};

const DEFAULT_PROPS = {
  preset: 'paper',
  text: 'Design unfolds',
  textColor: '',
  ...LOOK,
  fontSize: 80,
  fontWeight: 800
};

const PRESET_OPTIONS = [
  { value: 'paper', label: 'Paper' },
  { value: 'blinds', label: 'Blinds' },
  { value: 'flip', label: 'Flip' },
  { value: 'swing', label: 'Swing' }
];

const FOLD_STYLE_OPTIONS = [
  { value: 'paper', label: 'Paper' },
  { value: 'blinds', label: 'Blinds' },
  { value: 'flip', label: 'Flip' }
];

const SPLIT_OPTIONS = [
  { value: 'char', label: 'Character' },
  { value: 'word', label: 'Word' },
  { value: 'line', label: 'Line' }
];

const HINGE_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const STAGGER_FROM_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
  { value: 'edges', label: 'Edges' },
  { value: 'random', label: 'Random' }
];

const TRIGGER_OPTIONS = [
  { value: 'mount', label: 'Mount' },
  { value: 'hover', label: 'Hover' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'loop', label: 'Loop' }
];

const EASE_OPTIONS = [
  { value: 'power3.out', label: 'Power out' },
  { value: 'expo.out', label: 'Expo out' },
  { value: 'back.out(1.2)', label: 'Soft back' },
  { value: 'circ.out', label: 'Circular' }
];

const propData = [
  {
    name: 'text',
    type: 'string',
    default: '"Design unfolds"',
    description: 'The text to split and fold into place. Line breaks are kept.'
  },
  {
    name: 'foldStyle',
    type: '"paper" | "blinds" | "flip"',
    default: '"paper"',
    description:
      'How each piece folds. Paper swings open from its hinge edge, blinds splits it into two slats that turn open one after the other, and flip turns it over like a card, lifting toward you mid-turn.'
  },
  {
    name: 'splitBy',
    type: '"char" | "word" | "line"',
    default: '"char"',
    description: 'Whether each character, word or line folds as its own panel.'
  },
  {
    name: 'hinge',
    type: '"top" | "bottom" | "left" | "right"',
    default: '"top"',
    description: 'The edge each panel folds around. For blinds and flip it picks the axis and the turning direction.'
  },
  {
    name: 'foldAngle',
    type: 'number',
    default: '92',
    description:
      'How far the panels start folded away, in degrees. Past 90 they flip over from behind. Flip always turns a full half turn.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '0.65',
    description: 'How long each panel takes to unfold, in seconds.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.045',
    description: 'Delay between panels, in seconds.'
  },
  {
    name: 'staggerFrom',
    type: '"start" | "center" | "end" | "edges" | "random"',
    default: '"start"',
    description: 'Where the cascade starts.'
  },
  {
    name: 'ease',
    type: 'string',
    default: '"power3.out"',
    description: 'GSAP ease used for the unfold.'
  },
  {
    name: 'perspective',
    type: 'number',
    default: '700',
    description: 'Camera distance for the fold, in px. Lower values look deeper.'
  },
  {
    name: 'creaseShading',
    type: 'number',
    default: '0.55',
    description: 'How dark the crease shading gets while a panel is folded, from 0 to 1.'
  },
  {
    name: 'trigger',
    type: '"mount" | "hover" | "scroll" | "loop"',
    default: '"mount"',
    description: 'When the text unfolds. Loop holds the text, folds it back up and plays again.'
  },
  {
    name: 'loopDelay',
    type: 'number',
    default: '1.4',
    description:
      "How long the unfolded text holds before folding back up, in seconds. Only applies when trigger is 'loop'."
  },
  {
    name: 'hoverRefold',
    type: 'boolean',
    default: 'false',
    description: 'Panels near the cursor fold partly away and ease back open once it passes.'
  },
  {
    name: 'refoldRadius',
    type: 'number',
    default: '140',
    description: 'How far from the cursor panels react with hoverRefold, in px. The fold fades out toward the edge.'
  },
  {
    name: 'refoldAngle',
    type: 'number',
    default: '45',
    description: 'How far a panel right under the cursor folds away with hoverRefold, in degrees.'
  },
  {
    name: 'fontSize',
    type: 'string | number',
    default: '80',
    description: 'Font size of the text. Numbers are in px.'
  },
  {
    name: 'fontWeight',
    type: 'string | number',
    default: '800',
    description: 'Font weight of the text.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"currentColor"',
    description: 'Color of the text. Follows the surrounding text color by default.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Extra class names for the root element.'
  },
  {
    name: 'style',
    type: 'CSSProperties',
    default: '{}',
    description: 'Inline styles for the root element.'
  }
];

const FoldTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, textColor, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const updateAndReplay = (name, value) => {
    updateProp(name, value);
    forceRerender();
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = useMemo(() => (textColor ? { color: textColor } : {}), [textColor]);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'textColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" minH={430} overflow="hidden">
            <RefreshButton onClick={forceRerender} />
            <Box
              position="relative"
              minH={430}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
              textAlign="center"
              px={8}
            >
              <FoldText key={key} {...settings} color={textColor || 'currentColor'} />
            </Box>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor || ink}
              onChange={value => updateProp('textColor', value)}
            />
            <PreviewSelect
              title="Fold Style"
              options={FOLD_STYLE_OPTIONS}
              value={settings.foldStyle}
              onChange={value => updateAndReplay('foldStyle', value)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={value => updateAndReplay('trigger', value)}
            />
            <PreviewSelect
              title="Split By"
              options={SPLIT_OPTIONS}
              value={settings.splitBy}
              onChange={value => updateAndReplay('splitBy', value)}
            />
            <PreviewSelect
              title="Hinge"
              options={HINGE_OPTIONS}
              value={settings.hinge}
              onChange={value => updateAndReplay('hinge', value)}
            />
            <PreviewSelect
              title="Stagger From"
              options={STAGGER_FROM_OPTIONS}
              value={settings.staggerFrom}
              onChange={value => updateAndReplay('staggerFrom', value)}
            />
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings.ease}
              onChange={value => updateAndReplay('ease', value)}
            />
            <PreviewSlider
              title="Fold Angle"
              min={30}
              max={180}
              step={1}
              value={settings.foldAngle}
              valueUnit="°"
              isDisabled={settings.foldStyle === 'flip'}
              onChange={value => updateAndReplay('foldAngle', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.3}
              max={1.6}
              step={0.05}
              value={settings.duration}
              valueUnit="s"
              onChange={value => updateAndReplay('duration', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0.01}
              max={0.2}
              step={0.005}
              value={settings.stagger}
              valueUnit="s"
              onChange={value => updateAndReplay('stagger', value)}
            />
            <PreviewSlider
              title="Loop Delay"
              min={0}
              max={4}
              step={0.1}
              value={settings.loopDelay}
              valueUnit="s"
              isDisabled={settings.trigger !== 'loop'}
              onChange={value => updateAndReplay('loopDelay', value)}
            />
            <PreviewSwitch
              title="Hover Refold"
              isChecked={settings.hoverRefold}
              onChange={value => updateAndReplay('hoverRefold', value)}
            />
            <PreviewSlider
              title="Refold Radius"
              min={40}
              max={320}
              step={10}
              value={settings.refoldRadius}
              valueUnit="px"
              isDisabled={!settings.hoverRefold}
              onChange={value => updateAndReplay('refoldRadius', value)}
            />
            <PreviewSlider
              title="Refold Angle"
              min={10}
              max={120}
              step={5}
              value={settings.refoldAngle}
              valueUnit="°"
              isDisabled={!settings.hoverRefold}
              onChange={value => updateAndReplay('refoldAngle', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={300}
              max={1200}
              step={25}
              value={settings.perspective}
              valueUnit="px"
              onChange={value => updateAndReplay('perspective', value)}
            />
            <PreviewSlider
              title="Crease Shading"
              min={0}
              max={1}
              step={0.05}
              value={settings.creaseShading}
              onChange={value => updateAndReplay('creaseShading', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={44}
              max={112}
              step={2}
              value={settings.fontSize}
              valueUnit="px"
              onChange={value => updateAndReplay('fontSize', value)}
            />
            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={50}
              value={settings.fontWeight}
              onChange={value => updateAndReplay('fontWeight', value)}
            />
            <PreviewInput
              title="Text"
              value={settings.text}
              placeholder="Enter heading text"
              maxLength={34}
              onChange={value => updateAndReplay('text', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={foldText} componentName="FoldText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FoldTextDemo;
