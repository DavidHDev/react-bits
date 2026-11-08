import { Link04Icon, MusicNote01Icon, SourceCodeIcon } from '@hugeicons/core-free-icons';

export const TABS = [
  { value: 'code', label: 'Code', icon: SourceCodeIcon },
  { value: 'audio', label: 'Audio', icon: MusicNote01Icon },
  { value: 'link', label: 'Link', icon: Link04Icon }
];

export const FORMATS = [
  { value: 'wav', label: 'WAV' },
  { value: 'mp3', label: 'MP3' },
  { value: 'ogg', label: 'OGG' }
];

export const DEPTHS = [
  { value: 16, label: '16-bit' },
  { value: 24, label: '24-bit' },
  { value: 32, label: '32-bit' }
];

export const BITRATES = {
  mp3: [128, 192, 320],
  ogg: [96, 128, 160]
};

export const RATES = [
  { value: 44100, label: '44.1k', long: '44.1 kHz' },
  { value: 48000, label: '48k', long: '48 kHz' },
  { value: 96000, label: '96k', long: '96 kHz' }
];

export const CHANNELS = [
  { value: 2, label: 'Stereo' },
  { value: 1, label: 'Mono' }
];

const DEFAULTS = { tab: 'code', format: 'wav', depth: 24, bitrate: { mp3: 320, ogg: 160 }, rate: 48000, channels: 2 };

export const fitRate = settings => {
  if (settings.format === 'ogg') return { ...settings, rate: 48000 };
  if (settings.format === 'mp3' && settings.rate === 96000) return { ...settings, rate: 48000 };
  return settings;
};

const pick = (value, options, fallback) => (options.some(option => option.value === value) ? value : fallback);

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const sanitizeExport = raw => {
  const source = isObject(raw) ? raw : {};
  const bitrate = isObject(source.bitrate) ? source.bitrate : {};
  return fitRate({
    tab: pick(source.tab, TABS, DEFAULTS.tab),
    format: pick(source.format, FORMATS, DEFAULTS.format),
    depth: pick(source.depth, DEPTHS, DEFAULTS.depth),
    bitrate: Object.fromEntries(
      Object.entries(BITRATES).map(([format, values]) => [
        format,
        values.includes(bitrate[format]) ? bitrate[format] : DEFAULTS.bitrate[format]
      ])
    ),
    rate: pick(source.rate, RATES, DEFAULTS.rate),
    channels: pick(source.channels, CHANNELS, DEFAULTS.channels)
  });
};
