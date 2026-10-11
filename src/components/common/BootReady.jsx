import { useLayoutEffect } from 'react';

const BootReady = () => {
  useLayoutEffect(() => {
    window.__RB_FINISH_BOOT__?.();
  }, []);

  return null;
};

export default BootReady;
