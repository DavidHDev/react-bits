import { useEffect, useRef, useState } from 'react';
import { frameUrl } from '../frame/path';

export function useMaterialFrame({ id, props, active, capture = false, playing = true }) {
  const [iframe, setIframe] = useState(null);
  const [bridge, setBridge] = useState(null);
  const [status, setStatus] = useState('idle');
  const [src] = useState(() => frameUrl({ theme: 'dark' }));
  const loaded = useRef(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    loaded.current = null;
    setBridge(null);
    setStatus('idle');
    if (!iframe) return undefined;
    let api = null;
    const connect = () => {
      const next = iframe.contentWindow?.__rbStudio;
      if (!next || next === api) return;
      api = next;
      loaded.current = null;
      setBridge(next);
    };
    const onMessage = event => {
      if (event.source === iframe.contentWindow && event.data?.type === 'rb-shape-frame') connect();
    };
    window.addEventListener('message', onMessage);
    iframe.addEventListener('load', connect);
    connect();
    return () => {
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', connect);
    };
  }, [iframe]);

  useEffect(() => {
    if (!bridge) return;
    bridge.setCapture?.(Boolean(active && id && capture));
  }, [bridge, active, id, capture]);

  useEffect(() => {
    if (!bridge) return;
    if (!active || !playing) bridge.clock.pause();
    else bridge.clock.resume();
  }, [bridge, active, playing]);

  useEffect(() => {
    if (!bridge) return;
    if (!active || !id) {
      if (loaded.current) {
        bridge.clear?.();
        loaded.current = null;
        setStatus('idle');
      }
      return;
    }
    if (loaded.current === id) {
      bridge.update(props);
      return;
    }
    loaded.current = id;
    setStatus('loading');
    bridge
      .load(id, props)
      .then(ok => {
        if (!ok || loaded.current !== id) return;
        bridge.update(propsRef.current);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [bridge, active, id, props]);

  return { iframeRef: setIframe, src, bridge, status };
}
