import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import PromptBar from '../../content/Micro/PromptBar/PromptBar';
import { promptBar } from '../../constants/code/Micro/promptBarCode';

const DEFAULT_PROPS = {
  placeholder: 'Ask anything',
  background: '#27272a',
  color: '#f5f5f5',
  menuBackground: '#323236',
  sparkColor: '#b39dff',
  sparkBoost: 1,
  width: 400,
  radius: 16,
  maxRows: 5,
  morphDuration: 240,
  squash: 0.12,
  tilt: 8,
  pressScale: 0.96,
  busy: false,
  models: true,
  efforts: true,
  dictation: true
};

const FILES = ['brief.pdf', 'screenshot.png', 'metrics.csv'];
const TRANSCRIPT = 'Compare the last two quarters of sales';
const RESPONSE_MS = 2400;
const DICTATION_MS = 2200;

const PromptBarDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    placeholder,
    background,
    color,
    menuBackground,
    sparkColor,
    sparkBoost,
    width,
    radius,
    maxRows,
    morphDuration,
    squash,
    tilt,
    pressScale,
    busy,
    models,
    efforts,
    dictation
  } = props;

  const renderedBackground = useColorModeValue(
    background === DEFAULT_PROPS.background ? '#f6f6f6' : background,
    background
  );
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedMenu = useColorModeValue(
    menuBackground === DEFAULT_PROPS.menuBackground ? '#ffffff' : menuBackground,
    menuBackground
  );

  const [flowBusy, setFlowBusy] = useState(false);
  const timer = useRef(undefined);
  const fileIndex = useRef(0);
  const send = useCallback(() => {
    setFlowBusy(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlowBusy(false), RESPONSE_MS);
  }, []);
  const stop = useCallback(() => {
    clearTimeout(timer.current);
    setFlowBusy(false);
    if (busy) updateProp('busy', false);
  }, [busy, updateProp]);
  const attach = useCallback(() => FILES[fileIndex.current++ % FILES.length], []);
  const dictate = useCallback(() => new Promise(resolve => setTimeout(() => resolve(TRANSCRIPT), DICTATION_MS)), []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const propData = useMemo(
    () => [
      {
        name: 'placeholder',
        type: 'string',
        default: '"Ask anything"',
        description: 'Shown while the field is empty.'
      },
      {
        name: 'sources',
        type: 'PromptBarSource[]',
        default: 'DEFAULT_SOURCES',
        description:
          'Rows of the @ menu and the plus button: key, name, description, icon (a Hugeicons icon or any node), and attach: true for the row that adds files.'
      },
      {
        name: 'commands',
        type: 'PromptBarCommand[]',
        default: 'DEFAULT_COMMANDS',
        description: 'Rows of the / menu: key, name (with the slash), description.'
      },
      {
        name: 'models',
        type: 'PromptBarModel[]',
        default: 'DEFAULT_MODELS',
        description: 'Rows of the model picker: key, name, tag. An empty list hides the picker.'
      },
      {
        name: 'efforts',
        type: 'string[]',
        default: 'DEFAULT_EFFORTS',
        description:
          'Steps of the effort slider, low to high. The last step turns the field to the spark colour with drifting sparks. An empty list hides the control.'
      },
      {
        name: 'defaultEffort',
        type: 'string',
        default: '""',
        description: 'The step selected at first. Empty picks the middle.'
      },
      { name: 'onEffortChange', type: '(effort) => void', default: '-', description: 'The slider moved.' },
      {
        name: 'defaultModel',
        type: 'string',
        default: '""',
        description: 'Key of the model selected at first. Empty picks the first.'
      },
      {
        name: 'busy',
        type: 'boolean',
        default: 'false',
        description: 'A response is in flight. The send tile stays ink and its arrow morphs into a stop square.'
      },
      {
        name: 'onSend',
        type: '(text, { attachments, model, effort }) => void',
        default: '-',
        description: 'Enter or the tile, with a non-empty draft or an attachment. The draft and attachments clear.'
      },
      { name: 'onStop', type: '() => void', default: '-', description: 'The tile while busy.' },
      {
        name: 'onAttach',
        type: '() => string | string[] | Promise<string | string[]>',
        default: '-',
        description: 'Picked the attach row. Return file names, or a promise of them, and they appear as chips.'
      },
      {
        name: 'onDictate',
        type: '() => string | Promise<string>',
        default: '-',
        description:
          'The mic. Return the transcript, or a promise of it, and it lands in the draft. Omit to hide the mic.'
      },
      {
        name: 'background',
        type: 'string',
        default: '"#27272a"',
        description: 'The field surface, and the glyph on an armed tile.'
      },
      { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'The ink: text, icons, and the armed tile.' },
      {
        name: 'menuBackground',
        type: 'string',
        default: '"#323236"',
        description: 'The surface of the menus and the effort popover.'
      },
      {
        name: 'sparkColor',
        type: 'string',
        default: '"#b39dff"',
        description: 'The wash, the sparks and the slider at the top effort.'
      },
      {
        name: 'sparkBoost',
        type: 'number',
        default: '1',
        description:
          'How strongly typing drives the sparks at the top effort: they rise faster, grow and glow brighter with typing speed, and flash on each keystroke. No sparks are added. 0 keeps them calm.'
      },
      { name: 'width', type: 'number', default: '400', description: 'Field width in px, capped at the parent.' },
      { name: 'radius', type: 'number', default: '16', description: 'Field corner radius in px.' },
      { name: 'maxRows', type: 'number', default: '5', description: 'Rows the field grows to before it scrolls.' },
      { name: 'morphDuration', type: 'number', default: '240', description: 'Arrow to square and back, in ms.' },
      {
        name: 'squash',
        type: 'number',
        default: '0.12',
        description: 'Mid-morph pinch. The glyph narrows by this and grows taller to keep its area.'
      },
      {
        name: 'tilt',
        type: 'number',
        default: '8',
        description: 'Mid-morph lean in degrees, mirrored on the way back.'
      },
      {
        name: 'pressScale',
        type: 'number',
        default: '0.96',
        description: 'Scale of the send tile while a pointer is down.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={400}
            overflow="hidden"
            alignItems="flex-end"
            pb="32px"
            px="16px"
          >
            <PromptBar
              placeholder={placeholder}
              models={models ? undefined : []}
              efforts={efforts ? undefined : []}
              busy={busy || flowBusy}
              onSend={send}
              onStop={stop}
              onAttach={attach}
              onDictate={dictation ? dictate : undefined}
              background={renderedBackground}
              color={renderedColor}
              menuBackground={renderedMenu}
              sparkColor={sparkColor}
              sparkBoost={sparkBoost}
              width={width}
              radius={radius}
              maxRows={maxRows}
              morphDuration={morphDuration}
              squash={squash}
              tilt={tilt}
              pressScale={pressScale}
            />
          </Box>

          <Customize>
            <PreviewInput
              title="Placeholder"
              value={placeholder}
              maxLength={32}
              onChange={val => updateProp('placeholder', val)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('background', val)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Menu"
              color={renderedMenu}
              onChange={val => updateProp('menuBackground', val)}
            />
            <PreviewColorPickerCustom
              title="Spark"
              color={sparkColor}
              onChange={val => updateProp('sparkColor', val)}
            />
            <PreviewSlider
              title="Spark Boost"
              min={0}
              max={2}
              step={0.1}
              value={sparkBoost}
              onChange={val => updateProp('sparkBoost', val)}
            />
            <PreviewSlider
              title="Width"
              min={300}
              max={520}
              step={4}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
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
              title="Max Rows"
              min={1}
              max={10}
              step={1}
              value={maxRows}
              onChange={val => updateProp('maxRows', val)}
            />
            <PreviewSlider
              title="Morph"
              min={120}
              max={400}
              step={20}
              value={morphDuration}
              valueUnit="ms"
              onChange={val => updateProp('morphDuration', val)}
            />
            <PreviewSlider
              title="Squash"
              min={0}
              max={0.3}
              step={0.01}
              value={squash}
              onChange={val => updateProp('squash', val)}
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
              title="Press Scale"
              min={0.85}
              max={1}
              step={0.01}
              value={pressScale}
              onChange={val => updateProp('pressScale', val)}
            />
            <PreviewSwitch title="Busy" isChecked={busy} onChange={val => updateProp('busy', val)} />
            <PreviewSwitch title="Model Picker" isChecked={models} onChange={val => updateProp('models', val)} />
            <PreviewSwitch title="Effort Picker" isChecked={efforts} onChange={val => updateProp('efforts', val)} />
            <PreviewSwitch title="Dictation" isChecked={dictation} onChange={val => updateProp('dictation', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={promptBar} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PromptBarDemo;
