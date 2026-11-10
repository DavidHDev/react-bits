import { alphaToField } from './edt';

self.onmessage = ({ data }) => {
  const field = alphaToField(data.alpha, data.width, data.height);
  self.postMessage({ id: data.id, ...field }, [field.data.buffer]);
};
