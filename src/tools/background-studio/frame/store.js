let state = { id: null, Component: null, props: {}, key: 0, wrapperStyle: null };
const subscribers = new Set();

export const errorListeners = new Set();

export const getState = () => state;

export const setState = next => {
  state = { ...state, ...next };
  subscribers.forEach(subscriber => subscriber());
};

export const subscribe = subscriber => {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
};
