export const SIZE_PRESETS = [
  { value: 'stage', label: 'Match preview' },
  { value: 'desktop', label: 'Desktop', width: 1920, height: 1080 },
  { value: 'laptop', label: 'Laptop', width: 1440, height: 900 },
  { value: 'mobile', label: 'Mobile', width: 390, height: 844 },
  { value: 'square', label: 'Square', width: 1080, height: 1080 },
  { value: 'portrait', label: 'Portrait', width: 1080, height: 1350 },
  { value: 'story', label: 'Story', width: 1080, height: 1920 },
  { value: 'og', label: 'Social card', width: 1200, height: 630 },
  { value: 'banner', label: 'X header', width: 1500, height: 500 },
  { value: 'custom', label: 'Custom' }
];

export const SCALES = [1, 2, 3];

export const MAX_IMAGE_SIDE = 8192;
export const MAX_VIDEO_SIDE = 4096;

export function resolveLayout(sizeKey, custom, stage) {
  if (sizeKey === 'stage') {
    return {
      width: Math.max(64, Math.round(stage?.width || 1280)),
      height: Math.max(64, Math.round(stage?.height || 720))
    };
  }
  if (sizeKey === 'custom') {
    return {
      width: Math.min(Math.max(64, Math.round(custom.width) || 1280), 4096),
      height: Math.min(Math.max(64, Math.round(custom.height) || 720), 4096)
    };
  }
  const preset = SIZE_PRESETS.find(item => item.value === sizeKey) || SIZE_PRESETS[1];
  return { width: preset.width, height: preset.height };
}

export function fitOutput(layout, scale, limit, round = Math.round) {
  const wanted = Math.max(layout.width, layout.height) * scale;
  const ratio = wanted > limit ? limit / Math.max(layout.width, layout.height) : scale;
  return { width: round(layout.width * ratio), height: round(layout.height * ratio), ratio };
}

export const sizeLabel = preset =>
  preset.width ? `${preset.label} · ${preset.width} × ${preset.height}` : preset.label;
