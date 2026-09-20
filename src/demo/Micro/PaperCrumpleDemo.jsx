import { useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PaperCrumple from '../../content/Micro/PaperCrumple/PaperCrumple';
import { paperCrumple } from '../../constants/code/Micro/paperCrumpleCode';

const IMAGE = '/assets/images/paper-crumple.jpg';
const DEFAULT_PROPS = {
  width: 400,
  height: 400,
  sceneHeight: 360,
  imageFit: 'contain',
  releaseBehavior: 'restore',
  crumpleAmount: 0.85,
  crumpleDuration: 0.55,
  releaseDuration: 0.4,
  foldCount: 6,
  foldSharpness: 0.6,
  wrinkleDepth: 0.65,
  creaseStrength: 0.18,
  paperColor: '#f4f0e8',
  roughness: 0.92,
  paperTexture: 0.08,
  lightIntensity: 1.8,
  lightAngle: -35,
  shadow: true,
  shadowOpacity: 0.16,
  draggable: true,
  dragRotation: 10,
  dragRadius: 180,
  returnToOrigin: true,
  rotation: 0,
  seed: 7,
  detail: 64,
  disabled: false
};
const RELEASE_OPTIONS = [
  { value: 'stay', label: 'Stay crumpled' },
  { value: 'restore', label: 'Restore flat' },
  { value: 'creased', label: 'Leave creases' }
];

const PaperCrumpleDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [resetKey, setResetKey] = useState(0);
  const resetDemo = () => {
    resetProps();
    setResetKey(value => value + 1);
  };
  const propData = useMemo(
    () => [
      {
        name: 'src',
        type: 'string',
        default: '-',
        description: 'Required image URL. PNG transparency is preserved. Remote image servers must allow CORS.'
      },
      {
        name: 'alt',
        type: 'string',
        default: "'Crumplable image'",
        description: 'Image description used by the fallback and the accessible hold control.'
      },
      {
        name: 'backSrc',
        type: 'string',
        default: "''",
        description: 'Optional image printed on the reverse. Otherwise the back uses paperColor.'
      },
      {
        name: 'width',
        type: 'number',
        default: '320',
        description: 'Unfolded paper width in pixels. Scales down to fit the stage with a 24px inset.'
      },
      {
        name: 'height',
        type: 'number',
        default: '400',
        description: 'Unfolded paper height in pixels. Determines the sheet aspect ratio.'
      },
      {
        name: 'sceneHeight',
        type: 'number',
        default: '560',
        description: 'Height of the full-width stage in pixels, including space to drag.'
      },
      {
        name: 'imageFit',
        type: "'cover' | 'contain'",
        default: "'cover'",
        description: 'Cover crops the texture; contain keeps the entire image and leaves unused space transparent.'
      },
      {
        name: 'releaseBehavior',
        type: "'stay' | 'restore' | 'creased'",
        default: "'restore'",
        description: 'Freeze the current crumple, unfold completely, or unfold with lasting crease relief.'
      },
      {
        name: 'crumpleAmount',
        type: 'number',
        default: '0.85',
        description: 'Maximum fold amount while held, from 0 (flat) to 1 (fully crumpled).'
      },
      {
        name: 'crumpleDuration',
        type: 'number',
        default: '0.55',
        description: 'Approximate settling time in seconds while holding. 0 makes the change immediate.'
      },
      {
        name: 'releaseDuration',
        type: 'number',
        default: '0.4',
        description: 'Approximate unfolding time in seconds. Another press can interrupt it.'
      },
      {
        name: 'foldCount',
        type: 'number',
        default: '6',
        description:
          'Number of crease guides in the paper solver, from 3 to 16. Each seed produces a different arrangement.'
      },
      {
        name: 'foldSharpness',
        type: 'number',
        default: '0.6',
        description: 'Blend from rounded wrinkles (0) to angular creases (1).'
      },
      {
        name: 'wrinkleDepth',
        type: 'number',
        default: '0.65',
        description: 'Compression depth, from 0 to 2. Higher values produce a tighter wad and stronger residual folds.'
      },
      {
        name: 'creaseStrength',
        type: 'number',
        default: '0.18',
        description: 'Residual relief from 0 to 1 for the creased release mode. Longer holds leave stronger creases.'
      },
      {
        name: 'paperColor',
        type: 'string',
        default: "'#f4f0e8'",
        description: 'Color of the unprinted back of the sheet.'
      },
      {
        name: 'roughness',
        type: 'number',
        default: '0.92',
        description: 'Material roughness, from smooth (0) to matte (1).'
      },
      {
        name: 'paperTexture',
        type: 'number',
        default: '0.08',
        description: 'Fine paper-grain bump strength, from 0 to 1.'
      },
      {
        name: 'lightIntensity',
        type: 'number',
        default: '1.8',
        description: 'Strength of the directional light that reveals folds.'
      },
      {
        name: 'lightAngle',
        type: 'number',
        default: '-35',
        description: 'Direction of the key light in degrees. 0 shines from above.'
      },
      {
        name: 'shadow',
        type: 'boolean',
        default: 'true',
        description: 'Enable self-shadowing and a soft drop shadow behind the paper.'
      },
      {
        name: 'shadowOpacity',
        type: 'number',
        default: '0.08',
        description: 'Opacity of the cast and drop shadows, from 0 to 1.'
      },
      {
        name: 'draggable',
        type: 'boolean',
        default: 'true',
        description: 'Move the sheet while held. The grabbed material point follows the pointer.'
      },
      {
        name: 'dragRotation',
        type: 'number',
        default: '10',
        description: 'Maximum tilt in degrees while dragging. 0 disables tilt.'
      },
      {
        name: 'dragRadius',
        type: 'number',
        default: '180',
        description: 'Maximum resting offset on each axis, in pixels. The stage also bounds the resting position.'
      },
      {
        name: 'returnToOrigin',
        type: 'boolean',
        default: 'true',
        description: 'Restore and creased modes return to the center. Stay mode leaves the paper where it was dropped.'
      },
      { name: 'rotation', type: 'number', default: '0', description: 'Initial sheet rotation in degrees.' },
      {
        name: 'seed',
        type: 'number',
        default: '7',
        description: 'Seed for a repeatable arrangement of folds and paper grain.'
      },
      {
        name: 'detail',
        type: 'number',
        default: '64',
        description: 'Simulation detail, clamped to 32–96. Higher values add smaller folds and take longer to prepare.'
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Disable pointer and keyboard input and finish any active hold.'
      },
      {
        name: 'resetKey',
        type: 'number | string',
        default: '0',
        description: 'Change this value to reset the position, crumple and accumulated creases immediately.'
      },
      {
        name: 'onStateChange',
        type: '(state: PaperCrumpleState) => void',
        default: '-',
        description: 'Reports holding, then the selected release state: flat, crumpled or creased.'
      },
      {
        name: 'onError',
        type: '(error: Error) => void',
        default: '-',
        description: 'Called if WebGL initialization or image loading fails. The original image remains as a fallback.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Additional classes for the stage.' },
      {
        name: 'style',
        type: 'CSSProperties',
        default: '-',
        description: 'Inline styles for the stage, including a background or custom height.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetDemo} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box
            className="demo-container"
            h={500}
            overflow="hidden"
            p={0}
            style={{ background: 'transparent' }}
          >
            <PaperCrumple {...props} src={IMAGE} alt="A handwritten poem on paper" resetKey={resetKey} />
          </Box>

          <Customize>
            <PreviewSelect
              title="On release"
              options={RELEASE_OPTIONS}
              value={props.releaseBehavior}
              onChange={value => updateProp('releaseBehavior', value)}
            />
            <PreviewSlider
              title="Crumple amount"
              min={0}
              max={1}
              step={0.05}
              value={props.crumpleAmount}
              onChange={value => updateProp('crumpleAmount', value)}
            />
            <PreviewSlider
              title="Hold duration"
              min={0}
              max={2}
              step={0.05}
              valueUnit="s"
              value={props.crumpleDuration}
              onChange={value => updateProp('crumpleDuration', value)}
            />
            <PreviewSlider
              title="Release duration"
              min={0}
              max={2}
              step={0.05}
              valueUnit="s"
              value={props.releaseDuration}
              onChange={value => updateProp('releaseDuration', value)}
              isDisabled={props.releaseBehavior === 'stay'}
            />
            <PreviewSlider
              title="Crease strength"
              min={0}
              max={1}
              step={0.05}
              value={props.creaseStrength}
              onChange={value => updateProp('creaseStrength', value)}
              isDisabled={props.releaseBehavior !== 'creased'}
            />
            <PreviewSlider
              title="Fold density"
              min={3}
              max={16}
              step={1}
              value={props.foldCount}
              onChange={value => updateProp('foldCount', value)}
            />
            <PreviewSlider
              title="Fold sharpness"
              min={0}
              max={1}
              step={0.05}
              value={props.foldSharpness}
              onChange={value => updateProp('foldSharpness', value)}
            />
            <PreviewSlider
              title="Wrinkle depth"
              min={0}
              max={2}
              step={0.05}
              value={props.wrinkleDepth}
              onChange={value => updateProp('wrinkleDepth', value)}
            />
            <PreviewSlider
              title="Paper grain"
              min={0}
              max={1}
              step={0.05}
              value={props.paperTexture}
              onChange={value => updateProp('paperTexture', value)}
            />
            <PreviewSlider
              title="Roughness"
              min={0}
              max={1}
              step={0.05}
              value={props.roughness}
              onChange={value => updateProp('roughness', value)}
            />
            <PreviewColorPickerCustom
              title="Paper back"
              color={props.paperColor}
              onChange={value => updateProp('paperColor', value)}
            />
            <PreviewSlider
              title="Light strength"
              min={0}
              max={6}
              step={0.1}
              value={props.lightIntensity}
              onChange={value => updateProp('lightIntensity', value)}
            />
            <PreviewSlider
              title="Light angle"
              min={-180}
              max={180}
              step={5}
              valueUnit="°"
              value={props.lightAngle}
              onChange={value => updateProp('lightAngle', value)}
            />
            <PreviewSwitch title="Shadows" isChecked={props.shadow} onChange={value => updateProp('shadow', value)} />
            <PreviewSlider
              title="Shadow opacity"
              min={0}
              max={0.7}
              step={0.02}
              value={props.shadowOpacity}
              onChange={value => updateProp('shadowOpacity', value)}
              isDisabled={!props.shadow}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={props.draggable}
              onChange={value => updateProp('draggable', value)}
            />
            <PreviewSlider
              title="Drag tilt"
              min={0}
              max={45}
              step={1}
              valueUnit="°"
              value={props.dragRotation}
              onChange={value => updateProp('dragRotation', value)}
              isDisabled={!props.draggable}
            />
            <PreviewSlider
              title="Drop radius"
              min={0}
              max={300}
              step={10}
              valueUnit="px"
              value={props.dragRadius}
              onChange={value => updateProp('dragRadius', value)}
              isDisabled={!props.draggable}
            />
            <PreviewSwitch
              title="Return to center"
              isChecked={props.returnToOrigin}
              onChange={value => updateProp('returnToOrigin', value)}
              isDisabled={props.releaseBehavior === 'stay'}
            />
            <PreviewSelect
              title="Image fit"
              options={['cover', 'contain']}
              value={props.imageFit}
              onChange={value => updateProp('imageFit', value)}
            />
            <PreviewSlider
              title="Width"
              min={80}
              max={440}
              step={10}
              valueUnit="px"
              value={props.width}
              onChange={value => updateProp('width', value)}
            />
            <PreviewSlider
              title="Height"
              min={80}
              max={440}
              step={10}
              valueUnit="px"
              value={props.height}
              onChange={value => updateProp('height', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-25}
              max={25}
              step={1}
              valueUnit="°"
              value={props.rotation}
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Fold seed"
              min={1}
              max={30}
              step={1}
              value={props.seed}
              onChange={value => updateProp('seed', value)}
            />
            <PreviewSlider
              title="Mesh detail"
              min={32}
              max={96}
              step={8}
              value={props.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSwitch
              title="Disabled"
              isChecked={props.disabled}
              onChange={value => updateProp('disabled', value)}
            />
          </Customize>
          <PropTable data={propData} />
          <Dependencies dependencyList={['three']} />
        </PreviewTab>
        <CodeTab>
          <CodeExample codeObject={paperCrumple} componentName="PaperCrumple" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PaperCrumpleDemo;
