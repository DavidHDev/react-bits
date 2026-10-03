import { Box, Flex, Text, Spinner, Icon, useBreakpointValue } from '@chakra-ui/react';
import React, { Suspense, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, ChevronUp, ChevronLeft, ChevronRight, Download, Video } from 'lucide-react';
import Controls from './Controls';
import { BACKGROUNDS, getBackgroundById, getDefaultProps } from './backgrounds';
import { hyperspeedPresets } from '../../content/Backgrounds/Hyperspeed/HyperSpeedPresets';
import { useColorMode } from '../../components/setup/color-mode';
import { BACKGROUND_LIGHT_PROPS } from '../../constants/backgroundThemeProps';

const STUDIO_BACKGROUNDS = {
  dark: '#120F17',
  light: '#ffffff'
};

const STUDIO_LIGHT_PROPS = {
  'laser-flow': { backgroundColor: '#ffffff' }
};

const ORDERED_BACKGROUNDS = [...BACKGROUNDS].sort((a, b) => a.label.localeCompare(b.label));

const LoadingFallback = () => (
  <Flex w="100%" h="100%" align="center" justify="center" bg="var(--bg-body)">
    <Flex direction="column" align="center" gap={3}>
      <Spinner size="lg" color="#5227FF" />
      <Text color="var(--text-muted)" fontSize="14px">
        Loading background...
      </Text>
    </Flex>
  </Flex>
);

const ErrorFallback = ({ error }) => (
  <Flex w="100%" h="100%" align="center" justify="center" bg="var(--bg-body)">
    <Flex direction="column" align="center" gap={2}>
      <Text color="#ff6b6b" fontSize="16px" fontWeight={600}>
        Failed to load background
      </Text>
      <Text color="var(--text-muted)" fontSize="13px">
        {error?.message || 'Unknown error'}
      </Text>
    </Flex>
  </Flex>
);

const BackgroundRenderer = React.memo(({ background, props, renderKey }) => {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  const [key, setKey] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef(null);

  const backgroundId = background?.id;
  const loadComponent = background?.component;

  useEffect(() => {
    if (!containerRef.current) return;

    const checkDimensions = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setIsReady(true);
        return true;
      }
      return false;
    };

    if (checkDimensions()) return;

    const ro = new ResizeObserver(() => {
      if (checkDimensions()) {
        ro.disconnect();
      }
    });
    ro.observe(containerRef.current);

    const raf = requestAnimationFrame(() => checkDimensions());

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [backgroundId]);

  useEffect(() => {
    if (!loadComponent) return;

    setError(null);
    loadComponent()
      .then(module => {
        setComponent(() => module.default);
        setKey(k => k + 1);
      })
      .catch(err => {
        console.error('Failed to load background:', err);
        setError(err);
      });
  }, [backgroundId, loadComponent]);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  let componentProps = { ...props };

  if (background.fixedProps) {
    componentProps = { ...componentProps, ...background.fixedProps };
  }

  if (background.id === 'hyperspeed' && props.preset) {
    const { preset, ...restProps } = componentProps;
    componentProps = {
      ...restProps,
      effectOptions: hyperspeedPresets[preset] || hyperspeedPresets.one
    };
  }

  const componentKey = background.forceRemountOnPropChange
    ? `${background.id}-${key}-${renderKey}`
    : `${background.id}-${key}`;

  const wrapperStyle = background.wrapperStyle || {};

  // Backgrounds are standalone components that manage their own z-index, and some of them
  // (e.g. ImageTrail's `.content`, which uses z-index 100) can use values higher than the
  // studio's own overlays (zIndex 99 below). Since this wrapper is a positioned element with
  // z-index auto, it does not create a stacking context, so those values used to escape and
  // paint on top of the preview controls, making them unclickable. Isolating the wrapper keeps
  // every z-index a background declares inside this layer, so the studio UI always stays on top.
  return (
    <Box
      ref={containerRef}
      key={componentKey}
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      style={{ ...wrapperStyle, isolation: 'isolate' }}
    >
      {isReady && Component ? <Component {...componentProps} /> : <LoadingFallback />}
    </Box>
  );
});

BackgroundRenderer.displayName = 'BackgroundRenderer';

export default function BackgroundStudio({ toolSelector }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { colorMode } = useColorMode();
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const [localProps, setLocalProps] = useState({});
  const [renderKey, setRenderKey] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const debounceTimer = useRef(null);
  const previewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingAnimationRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const recordingTimeoutRef = useRef(null);

  const backgroundId = searchParams.get('bg') || 'silk';
  const isLightMode = colorMode === 'light';
  const studioBackground = STUDIO_BACKGROUNDS[isLightMode ? 'light' : 'dark'];

  const background = useMemo(() => {
    return getBackgroundById(backgroundId) || BACKGROUNDS[0];
  }, [backgroundId]);

  const customProps = useMemo(() => {
    if (!background?.props) return {};
    const parsed = {};
    for (const propDef of background.props) {
      const value = searchParams.get(propDef.name);
      if (value !== null) {
        if (propDef.type === 'number') {
          parsed[propDef.name] = Number(value);
        } else if (propDef.type === 'boolean') {
          parsed[propDef.name] = value === 'true';
        } else if (propDef.type === 'colorArray') {
          parsed[propDef.name] = value.split(',').map(c => (c.startsWith('#') ? c : `#${c}`));
        } else if (propDef.type === 'color') {
          parsed[propDef.name] = value.startsWith('#') ? value : `#${value}`;
        } else if (propDef.type === 'rgbArray') {
          parsed[propDef.name] = value.split(',').map(Number);
        } else {
          parsed[propDef.name] = value;
        }
      }
    }
    return parsed;
  }, [background, searchParams]);

  const defaultProps = useMemo(() => {
    const registryDefaults = getDefaultProps(background);
    const themeDefaults = isLightMode
      ? {
          ...(BACKGROUND_LIGHT_PROPS[backgroundId] || {}),
          ...(STUDIO_LIGHT_PROPS[backgroundId] || {})
        }
      : {};

    return { ...registryDefaults, ...themeDefaults };
  }, [background, backgroundId, isLightMode]);

  const baseProps = useMemo(() => {
    return { ...defaultProps, ...customProps };
  }, [defaultProps, customProps]);

  const props = useMemo(() => {
    return { ...baseProps, ...localProps };
  }, [baseProps, localProps]);

  useEffect(() => {
    setLocalProps({});
  }, [searchParams, backgroundId]);

  useEffect(() => {
    setRenderKey(key => key + 1);
  }, [isLightMode]);

  const updateProp = useCallback(
    (name, value) => {
      setLocalProps(prev => ({
        ...prev,
        [name]: value
      }));

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        const newCustomProps = { ...customProps, ...localProps, [name]: value };

        const newParams = new URLSearchParams();
        newParams.set('bg', backgroundId);

        const propDefs = background?.props || [];
        const getPropType = key => propDefs.find(p => p.name === key)?.type;

        Object.entries(newCustomProps).forEach(([key, val]) => {
          if (JSON.stringify(val) === JSON.stringify(defaultProps[key])) {
            return;
          }
          const propType = getPropType(key);
          if (propType === 'colorArray' && Array.isArray(val)) {
            newParams.set(key, val.map(c => c.replace(/^#/, '')).join(','));
          } else if (propType === 'color' && typeof val === 'string') {
            newParams.set(key, val.replace(/^#/, ''));
          } else if (Array.isArray(val)) {
            newParams.set(key, val.join(','));
          } else {
            newParams.set(key, String(val));
          }
        });

        setSearchParams(newParams, { replace: true });

        setRenderKey(k => k + 1);
        setLocalProps({});
      }, 300);
    },
    [background, customProps, localProps, backgroundId, defaultProps, setSearchParams]
  );

  const changeBackground = useCallback(
    id => {
      const newParams = new URLSearchParams();
      newParams.set('bg', id);
      setSearchParams(newParams, { replace: true });
      setLocalProps({});
      setRenderKey(k => k + 1);
    },
    [setSearchParams]
  );

  const navigateBackground = useCallback(
    direction => {
      if (isRecording) return;

      const currentIndex = ORDERED_BACKGROUNDS.findIndex(item => item.id === background.id);
      const nextIndex = (currentIndex + direction + ORDERED_BACKGROUNDS.length) % ORDERED_BACKGROUNDS.length;
      changeBackground(ORDERED_BACKGROUNDS[nextIndex].id);
    },
    [background.id, changeBackground, isRecording]
  );

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

      const target = event.target;
      const isEditing =
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="spinbutton"]');

      if (isEditing) return;

      event.preventDefault();
      navigateBackground(event.key === 'ArrowLeft' ? -1 : 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateBackground]);

  const resetProps = useCallback(() => {
    const newParams = new URLSearchParams();
    newParams.set('bg', backgroundId);
    setSearchParams(newParams, { replace: true });
    setLocalProps({});
    setRenderKey(k => k + 1);
  }, [backgroundId, setSearchParams]);

  const downloadImage = useCallback(() => {
    const sourceCanvas = previewRef.current?.querySelector('canvas');
    if (!sourceCanvas) {
      console.warn('No canvas found for screenshot');
      return;
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = 1920;
    offscreen.height = 1080;
    const ctx = offscreen.getContext('2d');

    requestAnimationFrame(() => {
      ctx.fillStyle = studioBackground;
      ctx.fillRect(0, 0, 1920, 1080);

      const sourceAspect = sourceCanvas.width / sourceCanvas.height;
      const targetAspect = 16 / 9;

      let sx = 0,
        sy = 0,
        sw = sourceCanvas.width,
        sh = sourceCanvas.height;

      if (sourceAspect > targetAspect) {
        sw = sourceCanvas.height * targetAspect;
        sx = (sourceCanvas.width - sw) / 2;
      } else {
        sh = sourceCanvas.width / targetAspect;
        sy = (sourceCanvas.height - sh) / 2;
      }

      ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, 1920, 1080);

      try {
        const dataUrl = offscreen.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${backgroundId}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to capture screenshot:', err);
      }
    });
  }, [backgroundId, studioBackground]);

  const recordVideo = useCallback(() => {
    const sourceCanvas = previewRef.current?.querySelector('canvas');
    if (!sourceCanvas || isRecording) return;

    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = 1920;
      offscreen.height = 1080;
      const ctx = offscreen.getContext('2d');

      const sourceAspect = sourceCanvas.width / sourceCanvas.height;
      const targetAspect = 16 / 9;

      let sx = 0,
        sy = 0,
        sw = sourceCanvas.width,
        sh = sourceCanvas.height;

      if (sourceAspect > targetAspect) {
        sw = sourceCanvas.height * targetAspect;
        sx = (sourceCanvas.width - sw) / 2;
      } else {
        sh = sourceCanvas.width / targetAspect;
        sy = (sourceCanvas.height - sh) / 2;
      }

      const copyFrame = () => {
        ctx.fillStyle = studioBackground;
        ctx.fillRect(0, 0, 1920, 1080);
        ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, 1920, 1080);
        recordingAnimationRef.current = requestAnimationFrame(copyFrame);
      };
      copyFrame();

      const stream = offscreen.captureStream(60);

      let mimeType = 'video/webm;codecs=h264';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 20000000
      });
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        cancelAnimationFrame(recordingAnimationRef.current);
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${backgroundId}-${Date.now()}.webm`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
        setIsRecording(false);
        setRecordingProgress(0);
      };

      setIsRecording(true);
      mediaRecorder.start();

      let elapsed = 0;
      recordingIntervalRef.current = setInterval(() => {
        elapsed += 100;
        setRecordingProgress(Math.min((elapsed / 10000) * 100, 100));
        if (elapsed >= 10000) clearInterval(recordingIntervalRef.current);
      }, 100);

      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        clearInterval(recordingIntervalRef.current);
      }, 10000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      if (recordingAnimationRef.current) cancelAnimationFrame(recordingAnimationRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      setIsRecording(false);
    }
  }, [backgroundId, isRecording, studioBackground]);

  const cancelRecording = useCallback(() => {
    if (!isRecording) return;

    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    if (recordingAnimationRef.current) cancelAnimationFrame(recordingAnimationRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        setIsRecording(false);
        setRecordingProgress(0);
      };
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      setRecordingProgress(0);
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (recordingAnimationRef.current) cancelAnimationFrame(recordingAnimationRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <Flex
      h="100%"
      w="100%"
      gap={{ base: 0, lg: 4 }}
      direction={{ base: 'column', lg: 'row' }}
      position="relative"
      overflow="hidden"
    >
      <Box
        w="280px"
        flexShrink={0}
        h="100%"
        overflow="hidden"
        display={{ base: 'none', lg: 'flex' }}
        flexDirection="column"
      >
        <Controls
          background={background}
          backgroundId={backgroundId}
          props={props}
          onPropChange={updateProp}
          onBackgroundChange={changeBackground}
          onReset={resetProps}
          toolSelector={toolSelector}
          disabled={isRecording}
        />
      </Box>

      <Box
        ref={previewRef}
        flex={1}
        position="relative"
        width="100%"
        maxWidth="1920px"
        margin="0 auto"
        borderRadius={{ base: '12px', lg: '16px' }}
        overflow="hidden"
        border="1px solid var(--border-primary)"
        bg={studioBackground}
        minH={{ base: '300px', lg: 'auto' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <BackgroundRenderer background={background} props={props} renderKey={renderKey} />
        </Suspense>

        <Box
          position="absolute"
          top={4}
          left={4}
          bg="var(--tool-overlay-bg)"
          border="1px solid var(--border-primary)"
          borderRadius="8px"
          px={3}
          py={1.5}
        >
          <Text fontSize="12px" color="var(--text-muted)" fontWeight={500}>
            {background.label}
          </Text>
        </Box>

        <Flex position="absolute" zIndex={99} top={4} right={4} gap={2}>
          <Flex
            as="button"
            type="button"
            align="center"
            justify="center"
            w="34px"
            h="34px"
            bg="var(--tool-overlay-bg)"
            border="1px solid var(--border-primary)"
            borderRadius="8px"
            cursor={isRecording ? 'not-allowed' : 'pointer'}
            opacity={isRecording ? 0.5 : 1}
            disabled={isRecording}
            onClick={() => navigateBackground(-1)}
            aria-label="Previous background"
            title="Previous background (Left Arrow)"
            _hover={isRecording ? {} : { bg: 'var(--tool-overlay-hover)' }}
            _active={isRecording ? {} : { transform: 'scale(0.94)' }}
            transition="background 0.2s, transform 0.1s, opacity 0.2s"
          >
            <Icon as={ChevronLeft} boxSize={4} color="var(--text-muted)" />
          </Flex>

          <Flex
            as="button"
            type="button"
            align="center"
            justify="center"
            w="34px"
            h="34px"
            bg="var(--tool-overlay-bg)"
            border="1px solid var(--border-primary)"
            borderRadius="8px"
            cursor={isRecording ? 'not-allowed' : 'pointer'}
            opacity={isRecording ? 0.5 : 1}
            disabled={isRecording}
            onClick={() => navigateBackground(1)}
            aria-label="Next background"
            title="Next background (Right Arrow)"
            _hover={isRecording ? {} : { bg: 'var(--tool-overlay-hover)' }}
            _active={isRecording ? {} : { transform: 'scale(0.94)' }}
            transition="background 0.2s, transform 0.1s, opacity 0.2s"
          >
            <Icon as={ChevronRight} boxSize={4} color="var(--text-muted)" />
          </Flex>
        </Flex>

        <Flex position="absolute" zIndex={99} bottom={4} left={4} gap={2} display={{ base: 'none', lg: 'flex' }}>
          <Flex
            as="button"
            align="center"
            gap={2}
            bg="var(--tool-overlay-bg)"
            border="1px solid var(--border-primary)"
            px={3}
            py={2}
            borderRadius="8px"
            cursor="pointer"
            onClick={downloadImage}
            _hover={{ bg: 'var(--tool-overlay-hover)' }}
            transition="background 0.2s"
          >
            <Icon as={Download} boxSize={3.5} color="var(--text-muted)" />
            <Text fontSize="12px" color="var(--text-muted)" fontWeight={500}>
              Image
            </Text>
          </Flex>

          <Flex
            as="button"
            align="center"
            gap={2}
            bg={isRecording ? 'rgba(255, 59, 48, 0.2)' : 'var(--tool-overlay-bg)'}
            border={isRecording ? '1px solid #ff3b30' : '1px solid var(--border-primary)'}
            px={3}
            py={2}
            borderRadius="8px"
            cursor="pointer"
            onClick={isRecording ? cancelRecording : recordVideo}
            _hover={!isRecording ? { bg: 'var(--tool-overlay-hover)' } : {}}
            transition="all 0.2s"
            position="relative"
            overflow="hidden"
          >
            {isRecording && (
              <Box
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                width={`${recordingProgress}%`}
                bg="rgba(255, 59, 48, 0.3)"
                transition="width 0.1s linear"
              />
            )}
            <Icon as={Video} boxSize={3.5} color={isRecording ? '#ff3b30' : 'var(--text-muted)'} position="relative" />
            <Text
              fontSize="12px"
              color={isRecording ? '#ff3b30' : 'var(--text-muted)'}
              fontWeight={500}
              position="relative"
            >
              {isRecording ? `${Math.ceil((100 - recordingProgress) / 10)}s` : '10s Video'}
            </Text>
          </Flex>
        </Flex>

        <Flex
          as="button"
          display={{ base: 'flex', lg: 'none' }}
          position="absolute"
          bottom={4}
          right={4}
          align="center"
          gap={2}
          bg="#5227FF"
          px={4}
          py={2.5}
          borderRadius="12px"
          cursor="pointer"
          onClick={() => setMobileControlsOpen(true)}
          boxShadow="0 4px 20px rgba(82, 39, 255, 0.4)"
          _active={{ transform: 'scale(0.95)' }}
          transition="transform 0.1s"
        >
          <Icon as={Settings} boxSize={4} color="#fff" />
          <Text fontSize="13px" fontWeight={600} color="#fff">
            Controls
          </Text>
        </Flex>
      </Box>

      {isMobile && (
        <>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.6)"
            opacity={mobileControlsOpen ? 1 : 0}
            visibility={mobileControlsOpen ? 'visible' : 'hidden'}
            transition="all 0.3s"
            zIndex={999}
            onClick={() => setMobileControlsOpen(false)}
          />

          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg="var(--bg-card)"
            borderTop="1px solid var(--border-primary)"
            borderTopRadius="24px"
            transform={mobileControlsOpen ? 'translateY(0)' : 'translateY(100%)'}
            transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            zIndex={1000}
            maxH="85vh"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            <Flex justify="center" pt={3} pb={2} cursor="pointer" onClick={() => setMobileControlsOpen(false)}>
              <Box w="40px" h="4px" bg="var(--border-primary)" borderRadius="2px" />
            </Flex>

            <Flex align="center" justify="space-between" px={4} pb={3} borderBottom="1px solid var(--border-primary)">
              <Text fontSize="16px" fontWeight={700} color="var(--text-primary)">
                Controls
              </Text>
              <Flex
                as="button"
                align="center"
                justify="center"
                w={8}
                h={8}
                borderRadius="8px"
                bg="var(--bg-elevated)"
                cursor="pointer"
                onClick={() => setMobileControlsOpen(false)}
                _hover={{ bg: 'var(--bg-card)' }}
              >
                <Icon as={ChevronUp} boxSize={5} color="var(--text-muted)" />
              </Flex>
            </Flex>

            <Box flex={1} overflow="hidden" px={4} py={4}>
              <Controls
                background={background}
                backgroundId={backgroundId}
                props={props}
                onPropChange={updateProp}
                onBackgroundChange={changeBackground}
                onReset={resetProps}
                toolSelector={toolSelector}
                isMobile={true}
                disabled={isRecording}
              />
            </Box>
          </Box>
        </>
      )}
    </Flex>
  );
}
