import { renderCode } from './shiki-render';

self.onmessage = async event => {
  const { id, code, language } = event.data || {};
  try {
    self.postMessage({ id, html: await renderCode(code, language) });
  } catch (error) {
    self.postMessage({ id, error: String(error?.message || error) });
  }
};
