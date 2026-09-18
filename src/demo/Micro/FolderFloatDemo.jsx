import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import FolderFloat from '../../content/Micro/FolderFloat/FolderFloat';
import { folderFloat } from '../../constants/code/Micro/folderFloatCode';

const DEFAULT_PROPS = {
  label: 'Design feedback',
  sublabel: '',
  trigger: 'hover',
  closeOnSelect: true,
  physics: true,
  drift: 0.5,
  folderColor: '#3f3f46',
  frontColor: '#52525b',
  paperColor: '#f5f5f5',
  itemColor: '#f5f5f5',
  itemTextColor: '#18181b',
  labelColor: '#f5f5f5',
  width: 200,
  height: 148,
  radius: 14,
  spread: 180,
  lift: 26,
  tilt: 8,
  flapAngle: 34,
  restAngle: 16,
  openDuration: 520,
  stagger: 45,
  bounce: 0.3
};

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const FolderFloatDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    label,
    sublabel,
    trigger,
    closeOnSelect,
    physics,
    drift,
    folderColor,
    frontColor,
    paperColor,
    itemColor,
    itemTextColor,
    labelColor,
    width,
    height,
    radius,
    spread,
    lift,
    tilt,
    flapAngle,
    restAngle,
    openDuration,
    stagger,
    bounce
  } = props;

  const light = (key, value) => (props[key] === DEFAULT_PROPS[key] ? value : props[key]);
  const renderedFolder = useColorModeValue(light('folderColor', '#d4d4d8'), folderColor);
  const renderedFront = useColorModeValue(light('frontColor', '#e4e4e7'), frontColor);
  const renderedPaper = useColorModeValue(light('paperColor', '#ffffff'), paperColor);
  const renderedItem = useColorModeValue(light('itemColor', '#ffffff'), itemColor);
  const renderedLabel = useColorModeValue(light('labelColor', '#18181b'), labelColor);

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: 'Array<string | { label, value }>',
        default: 'DEFAULT_ITEMS',
        description: 'The pills that float out. A string is its own value.'
      },
      { name: 'label', type: 'string', default: '"Design feedback"', description: 'The line on the flap.' },
      {
        name: 'sublabel',
        type: 'string',
        default: '""',
        description: 'The dimmer line under it. Empty counts the notes.'
      },
      {
        name: 'trigger',
        type: "'hover' | 'click'",
        default: "'hover'",
        description: 'Open on hover, or toggle on press.'
      },
      { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Start open.' },
      { name: 'closeOnSelect', type: 'boolean', default: 'true', description: 'Picking a pill closes the folder.' },
      {
        name: 'physics',
        type: 'boolean',
        default: 'true',
        description:
          'Once the pills land, a zero-gravity world takes over: they float, collide, and can be dragged and thrown inside the cloud.'
      },
      {
        name: 'drift',
        type: 'number',
        default: '0.5',
        description: 'Strength of the floating currents in the world. 0 holds still.'
      },
      { name: 'onSelect', type: '(value, index) => void', default: '-', description: 'A pill was picked.' },
      { name: 'onOpenChange', type: '(open) => void', default: '-', description: 'The folder opened or closed.' },
      { name: 'folderColor', type: 'string', default: '"#3f3f46"', description: 'The back panel and its tab.' },
      { name: 'frontColor', type: 'string', default: '"#52525b"', description: 'The flap.' },
      {
        name: 'paperColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The paper edge that rises as it opens.'
      },
      { name: 'itemColor', type: 'string', default: '"#f5f5f5"', description: 'The pills.' },
      { name: 'itemTextColor', type: 'string', default: '"#18181b"', description: 'The pill text.' },
      { name: 'labelColor', type: 'string', default: '"#f5f5f5"', description: 'The flap text.' },
      { name: 'width', type: 'number', default: '200', description: 'Folder width in px.' },
      { name: 'height', type: 'number', default: '148', description: 'Folder height in px, below the tab.' },
      { name: 'radius', type: 'number', default: '14', description: 'Corner radius in px.' },
      {
        name: 'spread',
        type: 'number',
        default: '180',
        description: 'Half the widest the cloud may be, in px. Pills pack into rows within it.'
      },
      { name: 'lift', type: 'number', default: '26', description: 'Gap between the folder and the lowest row, in px.' },
      { name: 'tilt', type: 'number', default: '8', description: 'Most a pill leans, in degrees.' },
      {
        name: 'flapAngle',
        type: 'number',
        default: '34',
        description: 'How far the flap tilts toward you when open, in degrees.'
      },
      { name: 'restAngle', type: 'number', default: '16', description: 'The flap tilt when closed, in degrees.' },
      {
        name: 'openDuration',
        type: 'number',
        default: '520',
        description: "A pill's rise, in ms. The close is 60% of it."
      },
      {
        name: 'stagger',
        type: 'number',
        default: '45',
        description: 'Delay between pills, in ms. The close reverses the order.'
      },
      { name: 'bounce', type: 'number', default: '0.3', description: 'Overshoot of the rise. 0 lands dead.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden" alignItems="flex-end" pb="44px">
            <FolderFloat
              label={label}
              sublabel={sublabel}
              trigger={trigger}
              closeOnSelect={closeOnSelect}
              physics={physics}
              drift={drift}
              folderColor={renderedFolder}
              frontColor={renderedFront}
              paperColor={renderedPaper}
              itemColor={renderedItem}
              itemTextColor={itemTextColor}
              labelColor={renderedLabel}
              width={width}
              height={height}
              radius={radius}
              spread={spread}
              lift={lift}
              tilt={tilt}
              flapAngle={flapAngle}
              restAngle={restAngle}
              openDuration={openDuration}
              stagger={stagger}
              bounce={bounce}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={trigger}
              onChange={val => updateProp('trigger', val)}
              width={110}
            />
            <PreviewInput title="Label" value={label} maxLength={24} onChange={val => updateProp('label', val)} />
            <PreviewInput
              title="Sublabel"
              value={sublabel}
              maxLength={24}
              onChange={val => updateProp('sublabel', val)}
            />
            <PreviewColorPickerCustom
              title="Folder"
              color={renderedFolder}
              onChange={val => updateProp('folderColor', val)}
            />
            <PreviewColorPickerCustom
              title="Front"
              color={renderedFront}
              onChange={val => updateProp('frontColor', val)}
            />
            <PreviewColorPickerCustom
              title="Paper"
              color={renderedPaper}
              onChange={val => updateProp('paperColor', val)}
            />
            <PreviewColorPickerCustom
              title="Item"
              color={renderedItem}
              onChange={val => updateProp('itemColor', val)}
            />
            <PreviewColorPickerCustom
              title="Item Text"
              color={itemTextColor}
              onChange={val => updateProp('itemTextColor', val)}
            />
            <PreviewColorPickerCustom
              title="Label"
              color={renderedLabel}
              onChange={val => updateProp('labelColor', val)}
            />
            <PreviewSlider
              title="Width"
              min={140}
              max={320}
              step={4}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Height"
              min={100}
              max={240}
              step={4}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={28}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Spread"
              min={100}
              max={280}
              step={5}
              value={spread}
              valueUnit="px"
              onChange={val => updateProp('spread', val)}
            />
            <PreviewSlider
              title="Lift"
              min={0}
              max={80}
              step={2}
              value={lift}
              valueUnit="px"
              onChange={val => updateProp('lift', val)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={20}
              step={1}
              value={tilt}
              valueUnit="°"
              onChange={val => updateProp('tilt', val)}
            />
            <PreviewSlider
              title="Flap Angle"
              min={0}
              max={50}
              step={1}
              value={flapAngle}
              valueUnit="°"
              onChange={val => updateProp('flapAngle', val)}
            />
            <PreviewSlider
              title="Rest Angle"
              min={0}
              max={30}
              step={1}
              value={restAngle}
              valueUnit="°"
              onChange={val => updateProp('restAngle', val)}
            />
            <PreviewSlider
              title="Open"
              min={200}
              max={1000}
              step={20}
              value={openDuration}
              valueUnit="ms"
              onChange={val => updateProp('openDuration', val)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={120}
              step={5}
              value={stagger}
              valueUnit="ms"
              onChange={val => updateProp('stagger', val)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.6}
              step={0.05}
              value={bounce}
              onChange={val => updateProp('bounce', val)}
            />
            <PreviewSwitch
              title="Close On Select"
              isChecked={closeOnSelect}
              onChange={val => updateProp('closeOnSelect', val)}
            />
            <PreviewSwitch title="Physics" isChecked={physics} onChange={val => updateProp('physics', val)} />
            <PreviewSlider
              title="Drift"
              min={0}
              max={1}
              step={0.05}
              value={drift}
              isDisabled={!physics}
              onChange={val => updateProp('drift', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['matter-js']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={folderFloat} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FolderFloatDemo;
