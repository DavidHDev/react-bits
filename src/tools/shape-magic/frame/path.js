export const FRAME_PATH = '/shape-frame.html';

export const frameUrl = params => `${FRAME_PATH}?${new URLSearchParams(params)}`;
