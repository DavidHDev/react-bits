import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import '../../css/preview-slider.css';

import Lanyard from '../../content/Components/Lanyard/Lanyard';
import { lanyard } from '../../constants/code/Components/lanyardCode';
import cardFront from '../../assets/lanyard/card-front.webp';
import cardBack from '../../assets/lanyard/card-back.webp';
import band from '../../assets/lanyard/lanyard.png';

const ORIENTATION_OPTIONS = [
  { label: 'Portrait', value: 'portrait' },
  { label: 'Landscape', value: 'landscape' }
];

const FIT_OPTIONS = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' }
];

const FINISH_OPTIONS = [
  { label: 'Glossy', value: 'glossy' },
  { label: 'Matte', value: 'matte' },
  { label: 'Holographic', value: 'holographic' },
  { label: 'Metallic', value: 'metallic' }
];

const METAL_OPTIONS = [
  { label: 'Graphite', value: 'graphite' },
  { label: 'Silver', value: 'silver' },
  { label: 'Gold', value: 'gold' }
];

const ANCHOR_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
];

const DEFAULT_PROPS = {
  imageFit: 'cover',
  cardColor: '#ffffff',
  orientation: 'portrait',
  finish: 'glossy',
  cornerRadius: 0.3,
  size: 0.6,
  anchor: 'center',
  strapLength: 0.5,
  strapColor: '#111111',
  strapWidth: 0.65,
  plainStrap: false,
  metal: 'silver',
  gravity: 1,
  damping: 0.5,
  elasticity: 0.5,
  breeze: 0.5,
  interactive: true,
  intro: true
};

const UploadField = ({ title, file, onPick }) => {
  const inputRef = useRef(null);

  const handleChange = event => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (picked) onPick(picked);
  };

  return (
    <div className="scrubber">
      <button type="button" className="scrubber-track scrubber-track--select" onClick={() => inputRef.current?.click()}>
        <span className="scrubber-label">{title}</span>
        <span className="scrubber-select-right">
          <span
            className="scrubber-value"
            style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {file ? file.name : 'Upload'}
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
        hidden
        onChange={handleChange}
      />
    </div>
  );
};

const LanyardDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { plainStrap, ...lanyardProps } = props;
  const [key, forceRerender] = useForceRerender();
  const [uploads, setUploads] = useState({ front: null, back: null, strap: null });
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  useEffect(
    () => () => {
      Object.values(uploadsRef.current).forEach(upload => upload && URL.revokeObjectURL(upload.url));
    },
    []
  );

  const pick = (slot, file) => {
    const previous = uploadsRef.current[slot];
    if (previous) URL.revokeObjectURL(previous.url);
    const url = URL.createObjectURL(file);
    setUploads(current => ({ ...current, [slot]: { url, name: file.name } }));
  };

  const resetAll = () => {
    resetProps();
    Object.values(uploadsRef.current).forEach(upload => upload && URL.revokeObjectURL(upload.url));
    setUploads({ front: null, back: null, strap: null });
  };

  const frontImage = uploads.front?.url ?? cardFront;
  const backImage = uploads.back?.url ?? (uploads.front ? uploads.front.url : cardBack);
  const strapImage = plainStrap ? undefined : (uploads.strap?.url ?? band);

  const propData = useMemo(
    () => [
      {
        name: 'frontImage',
        type: 'string',
        default: 'undefined',
        description: 'Image URL printed on the front of the card. Any size or aspect works.'
      },
      {
        name: 'backImage',
        type: 'string',
        default: 'undefined',
        description: 'Image URL printed on the back. Falls back to frontImage, then to a blank card.'
      },
      {
        name: 'imageFit',
        type: "'cover' | 'contain'",
        default: "'cover'",
        description: 'How the images fit the card. Cover fills and crops, contain fits inside on the card color.'
      },
      {
        name: 'cardColor',
        type: 'string',
        default: "'#ffffff'",
        description: 'Color of the card itself, shown when there is no image and around contained images.'
      },
      {
        name: 'orientation',
        type: "'portrait' | 'landscape'",
        default: "'portrait'",
        description: 'Whether the card hangs tall or wide.'
      },
      {
        name: 'finish',
        type: "'glossy' | 'matte' | 'holographic' | 'metallic'",
        default: "'glossy'",
        description:
          'Surface of the card. Holographic adds a sparkling foil whose colors shift as the card turns, metallic a brushed sheen.'
      },
      {
        name: 'cornerRadius',
        type: 'number',
        default: '0.3',
        description: 'Roundness of the card corners, from 0 for square to 1 for very round.'
      },
      {
        name: 'size',
        type: 'number',
        default: '0.6',
        description: 'Height of the card as a fraction of the container height.'
      },
      {
        name: 'anchor',
        type: "'left' | 'center' | 'right'",
        default: "'center'",
        description: 'Where the band hangs from along the top edge of the container.'
      },
      {
        name: 'strapLength',
        type: 'number',
        default: '0.5',
        description: 'How far below the top edge the card hangs, from 0 for a short band to 1 for a long one.'
      },
      {
        name: 'strapImage',
        type: 'string',
        default: 'undefined',
        description:
          'Image URL printed along the band. A wide image repeats along its length, with its height spanning the band width.'
      },
      {
        name: 'strapColor',
        type: 'string',
        default: "'#111111'",
        description: 'Color of the band when there is no strap image.'
      },
      {
        name: 'strapWidth',
        type: 'number',
        default: '0.65',
        description: 'Width of the band relative to its default, from 0.4 to 2.'
      },
      {
        name: 'metal',
        type: "'graphite' | 'silver' | 'gold'",
        default: "'silver'",
        description: 'Finish of the clamp and the ring that holds the card.'
      },
      {
        name: 'gravity',
        type: 'number',
        default: '1',
        description: 'How strongly the card falls. Lower values float and swing slowly, 0 turns gravity off.'
      },
      {
        name: 'damping',
        type: 'number',
        default: '0.5',
        description: 'How quickly the swinging dies down, from 0 for a long sway to 1 for a quick settle.'
      },
      {
        name: 'elasticity',
        type: 'number',
        default: '0.5',
        description: 'How hard the band snaps the card back after it is stretched and released.'
      },
      {
        name: 'breeze',
        type: 'number',
        default: '0.5',
        description: 'A gentle, ever-changing wind that keeps the card moving when nobody touches it.'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description: 'Lets visitors drag, stretch and throw the card, and click it to flip it over.'
      },
      {
        name: 'intro',
        type: 'boolean',
        default: 'true',
        description: 'On mount the card drops in from the side and swings into place.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root element.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetAll}
      hasChanges={hasChanges || Object.values(uploads).some(Boolean)}
      demoOnlyProps={['plainStrap']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <Text
              position="absolute"
              bottom={5}
              left="50%"
              transform="translateX(-50%)"
              fontSize="sm"
              color="var(--text-dimmed)"
              pointerEvents="none"
              userSelect="none"
            >
              Try dragging
            </Text>
            <Box position="absolute" inset={0}>
              <Lanyard
                key={key}
                {...lanyardProps}
                frontImage={frontImage}
                backImage={backImage}
                strapImage={strapImage}
              />
            </Box>
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <UploadField title="Front Image" file={uploads.front} onPick={file => pick('front', file)} />
            <UploadField title="Back Image" file={uploads.back} onPick={file => pick('back', file)} />
            <UploadField title="Band Image" file={uploads.strap} onPick={file => pick('strap', file)} />
            <PreviewSelect
              title="Image Fit"
              options={FIT_OPTIONS}
              value={props.imageFit}
              onChange={value => updateProp('imageFit', value)}
            />
            <PreviewSelect
              title="Orientation"
              options={ORIENTATION_OPTIONS}
              value={props.orientation}
              onChange={value => updateProp('orientation', value)}
            />

            <PreviewSelect
              title="Finish"
              options={FINISH_OPTIONS}
              value={props.finish}
              onChange={value => updateProp('finish', value)}
            />
            <PreviewSelect
              title="Metal"
              options={METAL_OPTIONS}
              value={props.metal}
              onChange={value => updateProp('metal', value)}
            />
            <PreviewColorPickerCustom
              title="Card Color"
              color={props.cardColor}
              onChange={value => updateProp('cardColor', value)}
            />
            <PreviewSwitch
              title="Plain Band"
              isChecked={plainStrap}
              onChange={value => updateProp('plainStrap', value)}
            />
            <PreviewColorPickerCustom
              title="Band Color"
              color={props.strapColor}
              onChange={value => updateProp('strapColor', value)}
            />
            <PreviewSlider
              title="Corner Radius"
              min={0}
              max={1}
              step={0.05}
              value={props.cornerRadius}
              onChange={value => updateProp('cornerRadius', value)}
            />

            <PreviewSelect
              title="Anchor"
              options={ANCHOR_OPTIONS}
              value={props.anchor}
              onChange={value => updateProp('anchor', value)}
            />
            <PreviewSlider
              title="Size"
              min={0.2}
              max={0.8}
              step={0.01}
              value={props.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Band Length"
              min={0}
              max={1}
              step={0.05}
              value={props.strapLength}
              onChange={value => updateProp('strapLength', value)}
            />
            <PreviewSlider
              title="Band Width"
              min={0.4}
              max={2}
              step={0.05}
              value={props.strapWidth}
              onChange={value => updateProp('strapWidth', value)}
            />

            <PreviewSlider
              title="Gravity"
              min={0}
              max={2}
              step={0.05}
              value={props.gravity}
              onChange={value => updateProp('gravity', value)}
            />
            <PreviewSlider
              title="Damping"
              min={0}
              max={1}
              step={0.05}
              value={props.damping}
              onChange={value => updateProp('damping', value)}
            />
            <PreviewSlider
              title="Elasticity"
              min={0}
              max={1}
              step={0.05}
              value={props.elasticity}
              onChange={value => updateProp('elasticity', value)}
            />
            <PreviewSlider
              title="Breeze"
              min={0}
              max={1}
              step={0.05}
              value={props.breeze}
              onChange={value => updateProp('breeze', value)}
            />

            <PreviewSwitch
              title="Interactive"
              isChecked={props.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSwitch title="Intro" isChecked={props.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['three']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={lanyard} componentName="Lanyard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LanyardDemo;
