import { useCallback, useEffect, useRef, useState } from 'react';
import { collectLayers, drawLayers } from '../utils/compose';
import { frameUrl } from '../utils/frame';

export function useStageFrame({ entry, renderProps, ready, light, onKeyDown }) {
  const iframeRef = useRef(null);
  const [bridge, setBridge] = useState(null);
  const [status, setStatus] = useState('booting');
  const [error, setError] = useState(null);
  const [paused, setPaused] = useState(false);
  const [src] = useState(() => frameUrl({ theme: light ? 'light' : 'dark' }));
  const loaded = useRef(null);
  const token = useRef(0);
  const propsRef = useRef(renderProps);
  const keyRef = useRef(onKeyDown);
  propsRef.current = renderProps;
  keyRef.current = onKeyDown;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;
    let api = null;
    let detach = [];

    const connect = () => {
      const view = iframe.contentWindow;
      const next = view?.__rbStudio;
      if (!next || next === api) return;
      detach.forEach(dispose => dispose());
      api = next;
      const handleKey = event => keyRef.current?.(event);
      view.addEventListener('keydown', handleKey);
      detach = [
        next.clock.subscribe(() => setPaused(next.clock.paused)),
        next.onError(problem => {
          setError(problem);
          setStatus('error');
        }),
        () => view.removeEventListener('keydown', handleKey)
      ];
      loaded.current = null;
      setPaused(next.clock.paused);
      setBridge(next);
    };

    const onMessage = event => {
      if (event.source === iframe.contentWindow && event.data?.type === 'rb-studio-frame') connect();
    };

    window.addEventListener('message', onMessage);
    iframe.addEventListener('load', connect);
    connect();

    return () => {
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', connect);
      detach.forEach(dispose => dispose());
    };
  }, []);

  useEffect(() => {
    bridge?.setTheme(light ? 'light' : 'dark');
  }, [bridge, light]);

  useEffect(() => {
    if (!bridge || !ready) return;

    if (loaded.current === entry.id) {
      bridge.update(renderProps);
      if (entry.forceRemountOnPropChange) bridge.restart();
      return;
    }

    loaded.current = entry.id;
    token.current += 1;
    const current = token.current;
    setStatus('loading');
    setError(null);
    if (bridge.clock.paused) bridge.clock.resume();

    bridge
      .load(entry.id, renderProps)
      .then(ok => {
        if (!ok || current !== token.current) return;
        bridge.update(propsRef.current);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (current === token.current) setStatus(previous => (previous === 'loading' ? 'ready' : previous));
          })
        );
      })
      .catch(problem => {
        if (current !== token.current) return;
        setError(problem);
        setStatus('error');
      });
  }, [bridge, ready, entry, renderProps]);

  const togglePause = useCallback(() => {
    if (!bridge) return;
    if (bridge.clock.paused) bridge.clock.resume();
    else bridge.clock.pause();
  }, [bridge]);

  const restart = useCallback(() => {
    if (!bridge) return;
    if (bridge.clock.paused) bridge.clock.resume();
    setError(null);
    setStatus(previous => (previous === 'error' ? 'ready' : previous));
    bridge.restart();
  }, [bridge]);

  const snapshot = useCallback(
    fill =>
      new Promise((resolve, reject) => {
        if (!bridge) {
          reject(new Error('The preview is not ready yet.'));
          return;
        }
        const capture = () => {
          try {
            const scene = collectLayers(bridge.stage());
            const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(scene.width * ratio));
            canvas.height = Math.max(1, Math.round(scene.height * ratio));
            drawLayers(canvas.getContext('2d'), scene, canvas.width, canvas.height, fill);
            resolve(canvas);
          } catch (problem) {
            reject(problem);
          }
        };
        bridge.clock.afterFrame(capture);
        if (bridge.clock.paused) bridge.clock.refresh();
      }),
    [bridge]
  );

  return { iframeRef, src, bridge, status, error, paused, togglePause, restart, snapshot };
}
