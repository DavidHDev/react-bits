import { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import BlobCursor from '../../content/Animations/BlobCursor/BlobCursor';
import { blobCursor } from '../../constants/code/Animations/blobCursorCode';

const MATERIAL_OPTIONS = [
  { label: 'Chrome', value: 'chrome' },
  { label: 'Jelly', value: 'jelly' },
  { label: 'Pearl', value: 'pearl' },
  { label: 'Ink', value: 'ink' }
];

const BLEND_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Difference', value: 'difference' },
  { label: 'Exclusion', value: 'exclusion' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' }
];

const DEFAULT_PROPS = {
  material: 'chrome',
  color: '#3B82F6',
  blend: 'normal',
  size: 140,
  morph: 0,
  morphSpeed: 0.4,
  depth: 1,
  trail: 16,
  lag: 0.55,
  goo: 1,
  stretch: 0.6,
  wobble: 1,
  drip: 0,
  shine: 1,
  splash: true,
  splashCount: 6,
  splashSpeed: 0.5,
  splashSize: 0.5,
  splashGravity: 0,
  regrow: 0.5,
  shadow: false,
  hideCursor: true
};

const BlobCursorDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const propData = useMemo(
    () => [
      {
        name: 'material',
        type: "'chrome' | 'jelly' | 'pearl' | 'ink'",
        default: "'chrome'",
        description:
          'What the blob is made of. Chrome is liquid metal, jelly a glossy colored gel, pearl an iridescent shell and ink a flat goo.'
      },
      {
        name: 'color',
        type: 'string',
        default: "'#3B82F6'",
        description: 'Color of the blob. Tints the reflections on chrome and pearl, and fills jelly and ink.'
      },
      {
        name: 'blend',
        type: "'normal' | 'difference' | 'exclusion' | 'multiply' | 'screen' | 'overlay'",
        default: "'normal'",
        description:
          'How the blob mixes with the page under it. Difference with a white ink blob inverts whatever it covers.'
      },
      { name: 'size', type: 'number', default: '140', description: 'Diameter of the main blob in pixels.' },
      {
        name: 'morph',
        type: 'number',
        default: '0',
        description:
          'How far the blob drifts from a perfect sphere, from 0 for a round bead to 1 for a restless, shapeshifting puddle.'
      },
      {
        name: 'morphSpeed',
        type: 'number',
        default: '0.4',
        description: 'How fast the shape keeps changing, from 0 for a frozen shape to 1 for a boiling one.'
      },
      {
        name: 'depth',
        type: 'number',
        default: '1',
        description: 'How tall the liquid stands, from 0 for a flat puddle to 1 for a full, round bead.'
      },
      {
        name: 'trail',
        type: 'number',
        default: '16',
        description:
          'How many links the liquid tail has, from 0 for no tail to 16 for a long tail that curves along your path.'
      },
      {
        name: 'lag',
        type: 'number',
        default: '0.55',
        description: 'How lazily the blob follows the pointer, from 0 for tight to 1 for slow and floaty.'
      },
      {
        name: 'goo',
        type: 'number',
        default: '1',
        description:
          'How thick and syrupy the liquid is where the tail and droplets meet the blob, from 0 for crisp to 1 for gooey.'
      },
      {
        name: 'stretch',
        type: 'number',
        default: '0.6',
        description: 'How far the blob pulls out into a teardrop as it moves, from 0 for short to 1 for a long comet.'
      },
      {
        name: 'wobble',
        type: 'number',
        default: '1',
        description: 'How bouncy and jelly-like it is when it stops, turns or gets clicked.'
      },
      {
        name: 'drip',
        type: 'number',
        default: '0',
        description:
          'How many droplets fling off the tail on fast moves. They stay on the page until they dry up or the blob soaks them back up.'
      },
      {
        name: 'shine',
        type: 'number',
        default: '1',
        description: 'Strength of the highlights and reflections.'
      },
      {
        name: 'splash',
        type: 'boolean',
        default: 'true',
        description: 'Clicking bursts droplets out of the blob. They fly off the page and the blob grows back.'
      },
      {
        name: 'splashCount',
        type: 'number',
        default: '6',
        description: 'How many droplets each click throws out, from 1 to 32.'
      },
      {
        name: 'splashSpeed',
        type: 'number',
        default: '0.5',
        description: 'How fast the droplets fly, from 0 for a gentle spill to 1 for a hard burst.'
      },
      {
        name: 'splashSize',
        type: 'number',
        default: '0.5',
        description: 'Size of the droplets relative to the blob. Bigger droplets take more of the blob with them.'
      },
      {
        name: 'splashGravity',
        type: 'number',
        default: '0',
        description: 'Pulls the droplets down as they fly, from 0 for straight lines to 1 for a heavy arc.'
      },
      {
        name: 'regrow',
        type: 'number',
        default: '0.5',
        description: 'How quickly the blob grows back to full size after a splash.'
      },
      {
        name: 'shadow',
        type: 'boolean',
        default: 'false',
        description: 'Casts a soft shadow under the blob so it sits on the page.'
      },
      {
        name: 'hideCursor',
        type: 'boolean',
        default: 'true',
        description: 'Hides the system cursor over the area so the blob becomes the cursor.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root element.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} overflow="hidden">
            <Text
              position="absolute"
              bottom={5}
              left="50%"
              transform="translateX(-50%)"
              fontSize="sm"
              color="var(--text-dimmed)"
              userSelect="none"
            >
              Move and click
            </Text>
            <BlobCursor {...props} />
          </Box>

          <Customize>
            <PreviewSelect
              title="Material"
              options={MATERIAL_OPTIONS}
              value={props.material}
              onChange={value => updateProp('material', value)}
            />
            <PreviewColorPickerCustom
              title="Color"
              color={props.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSelect
              title="Blend"
              options={BLEND_OPTIONS}
              value={props.blend}
              onChange={value => updateProp('blend', value)}
            />

            <PreviewSlider
              title="Size"
              min={24}
              max={240}
              step={2}
              value={props.size}
              onChange={value => updateProp('size', value)}
              displayValue={value => `${value}px`}
            />
            <PreviewSlider
              title="Morph"
              min={0}
              max={1}
              step={0.05}
              value={props.morph}
              onChange={value => updateProp('morph', value)}
            />
            <PreviewSlider
              title="Morph Speed"
              min={0}
              max={1}
              step={0.05}
              value={props.morphSpeed}
              onChange={value => updateProp('morphSpeed', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.05}
              value={props.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0}
              max={16}
              step={1}
              value={props.trail}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Lag"
              min={0}
              max={1}
              step={0.05}
              value={props.lag}
              onChange={value => updateProp('lag', value)}
            />
            <PreviewSlider
              title="Goo"
              min={0}
              max={1}
              step={0.05}
              value={props.goo}
              onChange={value => updateProp('goo', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={1}
              step={0.05}
              value={props.stretch}
              onChange={value => updateProp('stretch', value)}
            />
            <PreviewSlider
              title="Wobble"
              min={0}
              max={1}
              step={0.05}
              value={props.wobble}
              onChange={value => updateProp('wobble', value)}
            />
            <PreviewSlider
              title="Drip"
              min={0}
              max={1}
              step={0.05}
              value={props.drip}
              onChange={value => updateProp('drip', value)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={1}
              step={0.05}
              value={props.shine}
              onChange={value => updateProp('shine', value)}
            />

            <PreviewSwitch title="Splash" isChecked={props.splash} onChange={value => updateProp('splash', value)} />
            <PreviewSlider
              title="Splash Count"
              min={1}
              max={32}
              step={1}
              value={props.splashCount}
              onChange={value => updateProp('splashCount', value)}
            />
            <PreviewSlider
              title="Splash Speed"
              min={0}
              max={1}
              step={0.05}
              value={props.splashSpeed}
              onChange={value => updateProp('splashSpeed', value)}
            />
            <PreviewSlider
              title="Splash Size"
              min={0}
              max={1}
              step={0.05}
              value={props.splashSize}
              onChange={value => updateProp('splashSize', value)}
            />
            <PreviewSlider
              title="Splash Gravity"
              min={0}
              max={1}
              step={0.05}
              value={props.splashGravity}
              onChange={value => updateProp('splashGravity', value)}
            />
            <PreviewSlider
              title="Regrow"
              min={0}
              max={1}
              step={0.05}
              value={props.regrow}
              onChange={value => updateProp('regrow', value)}
            />
            <PreviewSwitch title="Shadow" isChecked={props.shadow} onChange={value => updateProp('shadow', value)} />
            <PreviewSwitch
              title="Hide Cursor"
              isChecked={props.hideCursor}
              onChange={value => updateProp('hideCursor', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['three']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={blobCursor} componentName="BlobCursor" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BlobCursorDemo;
