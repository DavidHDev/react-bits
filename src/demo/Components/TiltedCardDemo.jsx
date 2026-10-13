import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, Ticket01Icon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import TiltedCard, { TiltedCardLayer } from '../../content/Components/TiltedCard/TiltedCard';
import { tiltedCard } from '../../constants/code/Components/tiltedCardCode';
import './TiltedCardDemo.css';

const PHOTOS = {
  dark: {
    sky: '/assets/demo/night-sky.webp',
    field: '/assets/demo/night-landscape.webp',
    pier: '/assets/demo/night-portrait.webp'
  },
  light: {
    sky: '/assets/demo/day-sky.webp',
    field: '/assets/demo/day-landscape.webp',
    pier: '/assets/demo/day-portrait.webp'
  }
};

const TRACKS = [
  ['Open Sky', '3:41'],
  ['Pier Lights', '4:05'],
  ['Canola', '2:58'],
  ['Low Tide', '3:22'],
  ['Last Light', '4:47']
];

const random = seed => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const QR_SIZE = 21;
const QR = (() => {
  const next = random(42);
  const cells = [];
  const finder = (x, y) => {
    const corners = [
      [0, 0],
      [QR_SIZE - 7, 0],
      [0, QR_SIZE - 7]
    ];
    for (const [cx, cy] of corners) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return 0;
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        return ring === 3 || ring <= 1 ? 1 : 0;
      }
    }
    return -1;
  };
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      const fixed = finder(x, y);
      const on = fixed >= 0 ? fixed : y === 6 || x === 6 ? (x + y) % 2 === 0 : next() > 0.52;
      if (on) cells.push([x, y]);
    }
  }
  return cells;
})();

const BARS = (() => {
  const next = random(7);
  const bars = [];
  let y = 0;
  while (y < 96) {
    const height = next() > 0.6 ? 2.4 : 1.2;
    if (next() > 0.25) bars.push([y, height]);
    y += height + (next() > 0.5 ? 1.6 : 1.1);
  }
  return bars;
})();

const Tracklist = ({ cover }) => (
  <div className="tcd-tracks">
    <div className="tcd-tracks__head">
      <img className="tcd-tracks__cover" src={cover} alt="" draggable={false} />
      <div className="tcd-tracks__title">
        <strong>Open Sky</strong>
        <span>Blue Hour · 5 tracks</span>
      </div>
    </div>
    <ol className="tcd-tracks__list">
      {TRACKS.map(([name, length], index) => (
        <li key={name} data-current={index === 0 ? '' : undefined}>
          <span className="tcd-tracks__number">{index + 1}</span>
          <span className="tcd-tracks__name">{name}</span>
          <span className="tcd-tracks__length">{length}</span>
        </li>
      ))}
    </ol>
  </div>
);

const AlbumScene = ({ card, theme }) => {
  const cover = PHOTOS[theme].sky;
  return (
    <div className="tcd-album">
      <TiltedCard
        imageSrc={cover}
        altText="Open Sky album cover"
        captionText="Open Sky — Blue Hour"
        containerWidth="100%"
        containerHeight="100%"
        imageWidth="100%"
        imageHeight="100%"
        backContent={<Tracklist cover={cover} />}
        {...card}
      >
        <span className="tcd-scrim" />
        <TiltedCardLayer depth={28}>
          <div className="tcd-album__meta">
            <strong>Open Sky</strong>
            <span>Blue Hour</span>
          </div>
        </TiltedCardLayer>
        <TiltedCardLayer depth={52}>
          <span className="tcd-album__play">
            <HugeiconsIcon icon={PlayIcon} size={18} strokeWidth={2} />
          </span>
        </TiltedCardLayer>
      </TiltedCard>
    </div>
  );
};

const GALLERY = [
  { key: 'pier', title: 'The Pier', note: { dark: 'Dusk', light: 'Clear sky' } },
  { key: 'field', title: 'Canola Field', note: { dark: 'Moonrise', light: 'Midday' } },
  { key: 'sky', title: 'Open Sky', note: { dark: 'Blue hour', light: 'Golden hour' } }
];

const GalleryScene = ({ card, theme }) => (
  <div className="tcd-gallery">
    {GALLERY.map((item, index) => (
      <div key={item.key} className="tcd-gallery__cell">
        <TiltedCard
          imageSrc={PHOTOS[theme][item.key]}
          altText={item.title}
          captionText={item.title}
          containerWidth="100%"
          containerHeight="100%"
          imageWidth="100%"
          imageHeight="100%"
          introDelay={index * 110}
          {...card}
        >
          <span className="tcd-scrim" />
          <TiltedCardLayer depth={30}>
            <div className="tcd-gallery__meta">
              <strong>{item.title}</strong>
              <span>{item.note[theme]}</span>
            </div>
          </TiltedCardLayer>
        </TiltedCard>
      </div>
    ))}
  </div>
);

const QrCode = () => (
  <svg className="tcd-qr" viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} shapeRendering="crispEdges" aria-hidden="true">
    {QR.map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
    ))}
  </svg>
);

const TicketBack = () => (
  <div className="tcd-ticket tcd-ticket--back">
    <QrCode />
    <div className="tcd-ticket__scan">
      <strong>Scan at the gate</strong>
      <span>Ticket 0042 · Seat B 12</span>
    </div>
  </div>
);

const TicketScene = ({ card }) => (
  <div className="tcd-ticket-stage">
    <TiltedCard
      altText="Night Sky Live ticket"
      captionText="Admit one"
      containerWidth="100%"
      containerHeight="100%"
      imageWidth="100%"
      imageHeight="100%"
      backContent={<TicketBack />}
      className="tcd-ticket-card"
      {...card}
    >
      <div className="tcd-ticket">
        <TiltedCardLayer depth={22} className="tcd-ticket__main">
          <span className="tcd-ticket__label">
            <span className="tcd-ticket__icon">
              <HugeiconsIcon icon={Ticket01Icon} size={14} strokeWidth={1.8} />
            </span>
            Admit one
          </span>
          <div className="tcd-ticket__title">
            <strong>Night Sky Live</strong>
            <span>Pier Amphitheater</span>
          </div>
          <dl className="tcd-ticket__info">
            <div>
              <dt>Date</dt>
              <dd>Oct 24</dd>
            </div>
            <div>
              <dt>Doors</dt>
              <dd>20:30</dd>
            </div>
            <div>
              <dt>Seat</dt>
              <dd>B 12</dd>
            </div>
          </dl>
        </TiltedCardLayer>
        <TiltedCardLayer depth={12} className="tcd-ticket__stub">
          <svg className="tcd-barcode" viewBox="0 0 24 96" preserveAspectRatio="none" aria-hidden="true">
            {BARS.map(([y, height]) => (
              <rect key={y} x="0" y={y} width="24" height={height} />
            ))}
          </svg>
          <span className="tcd-ticket__gate">Gate 4</span>
        </TiltedCardLayer>
      </div>
    </TiltedCard>
  </div>
);

const BasicScene = ({ card, theme, overlay }) => (
  <TiltedCard
    imageSrc={PHOTOS[theme].sky}
    altText="Open Sky"
    captionText="Open Sky"
    containerWidth="300px"
    containerHeight="300px"
    imageWidth="300px"
    imageHeight="300px"
    displayOverlayContent={overlay}
    overlayContent={<p className="tcd-overlay">Open Sky</p>}
    {...card}
  />
);

const LOOK = {
  rotateAmplitude: 12,
  scaleOnHover: 1.05,
  perspective: 800,
  smoothness: 0.6,
  glare: 0.5,
  glareColor: '#ffffff',
  shadow: 0.5,
  parallax: 1,
  radius: 15,
  axis: 'both',
  reverse: false,
  trackWindow: false,
  floating: false
};

const DEFAULT_PROPS = {
  demo: 'album',
  preset: 'classic',
  ...LOOK,
  showTooltip: true,
  displayOverlayContent: true,
  flipOnClick: true,
  intro: true
};

const PRESETS = {
  classic: {},
  gentle: { rotateAmplitude: 6, scaleOnHover: 1.02, smoothness: 0.85, glare: 0.3, parallax: 0.6 },
  bold: { rotateAmplitude: 22, scaleOnHover: 1.08, smoothness: 0.4, glare: 0.85, shadow: 0.85, parallax: 1.6 },
  floating: { floating: true, smoothness: 0.75 },
  follow: { trackWindow: true, rotateAmplitude: 16 },
  reverse: { reverse: true },
  swing: { axis: 'horizontal', rotateAmplitude: 22, smoothness: 0.8 }
};

const DEMO_OPTIONS = [
  { value: 'album', label: 'Album' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'gentle', label: 'Gentle' },
  { value: 'bold', label: 'Bold' },
  { value: 'floating', label: 'Floating' },
  { value: 'follow', label: 'Follow' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'swing', label: 'Swing' }
];

const AXIS_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];

const propData = [
  { name: 'imageSrc', type: 'string', default: '-', description: 'Photo that fills the card.' },
  { name: 'altText', type: 'string', default: "'Tilted card image'", description: 'Alternative text for the photo.' },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Content on the face of the card, over the photo or instead of it.'
  },
  {
    name: 'captionText',
    type: 'string',
    default: "''",
    description: 'Text in the small tag that follows the cursor and swings as it moves.'
  },
  { name: 'showTooltip', type: 'boolean', default: 'true', description: 'Shows the caption tag on hover.' },
  {
    name: 'overlayContent',
    type: 'ReactNode',
    default: 'null',
    description: 'Content that floats in front of the card, lifted off its surface.'
  },
  {
    name: 'displayOverlayContent',
    type: 'boolean',
    default: 'false',
    description: 'Shows the overlay content.'
  },
  { name: 'overlayDepth', type: 'number', default: '30', description: 'How far the overlay floats in front, in px.' },
  {
    name: 'backContent',
    type: 'ReactNode',
    default: 'null',
    description: 'Content for the back of the card. Clicking, tapping or pressing Enter flips the card over.'
  },
  {
    name: 'flipOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Flips the card when it is clicked. Needs backContent.'
  },
  {
    name: 'flipped',
    type: 'boolean',
    default: '-',
    description: 'Controls which side shows. Leave it unset to let clicks flip the card.'
  },
  {
    name: 'onFlip',
    type: '(flipped: boolean) => void',
    default: '-',
    description: 'Called with the new side whenever the card is flipped.'
  },
  {
    name: 'onClick',
    type: '(event) => void',
    default: '-',
    description: 'Called when the card is clicked or activated with the keyboard.'
  },
  {
    name: 'containerWidth',
    type: 'number | string',
    default: "'100%'",
    description: 'Width of the area that reacts to the cursor.'
  },
  {
    name: 'containerHeight',
    type: 'number | string',
    default: "'300px'",
    description: 'Height of the area that reacts to the cursor.'
  },
  { name: 'imageWidth', type: 'number | string', default: "'300px'", description: 'Width of the card.' },
  { name: 'imageHeight', type: 'number | string', default: "'300px'", description: 'Height of the card.' },
  {
    name: 'rotateAmplitude',
    type: 'number',
    default: '12',
    description: 'How far the card tilts toward the cursor, in degrees.'
  },
  { name: 'scaleOnHover', type: 'number', default: '1.05', description: 'How much the card grows when hovered.' },
  {
    name: 'perspective',
    type: 'number | string',
    default: '800',
    description: 'Viewing distance in px. Lower values give a stronger 3D effect.'
  },
  { name: 'radius', type: 'number | string', default: '15', description: 'Corner radius of the card.' },
  {
    name: 'smoothness',
    type: 'number',
    default: '0.6',
    description: 'From 0 to 1. Low values snap to the cursor, high values glide and settle with a soft bounce.'
  },
  {
    name: 'glare',
    type: 'number',
    default: '0.5',
    description: 'Strength of the light that catches the surface and edges as the card tilts, from 0 to 1.'
  },
  { name: 'glareColor', type: 'string', default: "'#ffffff'", description: 'Color of the glare.' },
  {
    name: 'shadow',
    type: 'number',
    default: '0.5',
    description: 'Strength of the soft shadow under the card, which shifts and grows as the card lifts, from 0 to 1.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '1',
    description: 'How far layers and the photo shift with the tilt. 0 keeps everything flat.'
  },
  {
    name: 'axis',
    type: "'both' | 'horizontal' | 'vertical'",
    default: "'both'",
    description: 'Limits the tilt to following the cursor left and right, or up and down.'
  },
  {
    name: 'reverse',
    type: 'boolean',
    default: 'false',
    description: 'Tilts away from the cursor instead of toward it.'
  },
  {
    name: 'trackWindow',
    type: 'boolean',
    default: 'false',
    description: 'The card follows the cursor anywhere on the page, not only while hovered.'
  },
  { name: 'floating', type: 'boolean', default: 'false', description: 'The card drifts and sways gently while idle.' },
  {
    name: 'gyroscope',
    type: 'boolean',
    default: 'true',
    description: 'Tilts the card as a phone or tablet is moved. Asks for permission on iOS on the first tap.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The card rises and settles into place when it first scrolls into view.'
  },
  {
    name: 'introDelay',
    type: 'number',
    default: '0',
    description: 'Wait before the intro, in ms. Stagger it across a row of cards.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the card.' },
  {
    name: 'TiltedCardLayer',
    type: 'component',
    default: '-',
    description:
      'Wrap content in <TiltedCardLayer depth={30}> to float it above the card face. Higher depth floats further, negative depth sinks behind.'
  }
];

const TiltedCardDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, displayOverlayContent, ...card } = props;
  const theme = useColorModeValue('light', 'dark');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const flips = demo === 'album' || demo === 'ticket';

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <RefreshButton onClick={forceRerender} />
            <div className="tcd-scene" data-theme={theme} key={`${key}-${demo}`}>
              {demo === 'album' && <AlbumScene card={card} theme={theme} />}
              {demo === 'gallery' && <GalleryScene card={card} theme={theme} />}
              {demo === 'ticket' && <TicketScene card={card} theme={theme} />}
              {demo === 'basic' && <BasicScene card={card} theme={theme} overlay={displayOverlayContent} />}
            </div>
          </Box>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={card.axis}
              onChange={value => updateProp('axis', value)}
            />
            <PreviewColorPickerCustom
              title="Glare Color"
              color={card.glareColor}
              onChange={value => updateProp('glareColor', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={30}
              step={1}
              value={card.rotateAmplitude}
              valueUnit="°"
              onChange={value => updateProp('rotateAmplitude', value)}
            />
            <PreviewSlider
              title="Scale on Hover"
              min={1}
              max={1.3}
              step={0.01}
              value={card.scaleOnHover}
              onChange={value => updateProp('scaleOnHover', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={300}
              max={2000}
              step={50}
              value={card.perspective}
              valueUnit="px"
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSlider
              title="Smoothness"
              min={0}
              max={1}
              step={0.05}
              value={card.smoothness}
              onChange={value => updateProp('smoothness', value)}
            />
            <PreviewSlider
              title="Glare"
              min={0}
              max={1}
              step={0.05}
              value={card.glare}
              onChange={value => updateProp('glare', value)}
            />
            <PreviewSlider
              title="Shadow"
              min={0}
              max={1}
              step={0.05}
              value={card.shadow}
              onChange={value => updateProp('shadow', value)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={2.5}
              step={0.1}
              value={card.parallax}
              onChange={value => updateProp('parallax', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={card.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSwitch
              title="Tooltip"
              isChecked={card.showTooltip}
              onChange={value => updateProp('showTooltip', value)}
            />
            <PreviewSwitch
              title="Overlay"
              isChecked={displayOverlayContent}
              isDisabled={demo !== 'basic'}
              onChange={value => updateProp('displayOverlayContent', value)}
            />
            <PreviewSwitch
              title="Flip on Click"
              isChecked={card.flipOnClick}
              isDisabled={!flips}
              onChange={value => updateProp('flipOnClick', value)}
            />
            <PreviewSwitch title="Reverse" isChecked={card.reverse} onChange={value => updateProp('reverse', value)} />
            <PreviewSwitch
              title="Track Window"
              isChecked={card.trackWindow}
              onChange={value => updateProp('trackWindow', value)}
            />
            <PreviewSwitch
              title="Floating"
              isChecked={card.floating}
              onChange={value => updateProp('floating', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={card.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={tiltedCard} componentName="TiltedCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TiltedCardDemo;
