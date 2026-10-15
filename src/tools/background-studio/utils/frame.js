const FRAME_PATH = '/studio-frame.html';

export const frameUrl = params => `${FRAME_PATH}?${new URLSearchParams(params)}`;

export const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

export const nextTask = () =>
  new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(0);
  });

export function waitForBridge(iframe, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    let timer = 0;
    const cleanup = () => {
      clearInterval(timer);
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', check);
    };
    function check() {
      const api = iframe.contentWindow?.__rbStudio;
      if (api) {
        cleanup();
        resolve(api);
      } else if (performance.now() - started > timeout) {
        cleanup();
        reject(new Error('The preview frame did not start.'));
      }
    }
    function onMessage(event) {
      if (event.source === iframe.contentWindow) check();
    }
    timer = setInterval(check, 50);
    window.addEventListener('message', onMessage);
    iframe.addEventListener('load', check);
  });
}
