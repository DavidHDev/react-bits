import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import TabsFooter from './TabsFooter';
import CategoryProFooter from './Pro/CategoryProFooter';
import Customize from './Preview/Customize';

import { Tabs, Icon, Flex, Tooltip, Box, Menu, Portal } from '@chakra-ui/react';
import { FiCode, FiEye } from 'react-icons/fi';
import { FaRegShareFromSquare } from 'react-icons/fa6';
import { RiHeartFill, RiHeartLine } from 'react-icons/ri';
import { Maximize2, Monitor, MoreHorizontal, Palette, Smartphone, Tablet } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toggleSavedComponent, isComponentSaved } from '../../utils/favorites';
import { useComponentPropsContext } from '../../hooks/useComponentPropsContext';
import { useOptions } from '../context/OptionsContext/useOptions';
import { colors } from '../../constants/colors';
import PropTable from './Preview/PropTable';
import CodeExample, { injectPropsIntoCode } from '../code/CodeExample';
import OpenInStudioButton from './Preview/OpenInStudioButton';
import { buildStudioUrl } from './Preview/studio-url';
import CopyForAIMenu, { AIMenuItem } from './CopyForAIMenu';
import { useAIExportActions } from '../../hooks/useAIExportActions';
import ComponentPager from './ComponentPager';
import CustomizeActionsContext from './Preview/CustomizeContext';
import PreviewResizer, { PreviewStage } from './Preview/PreviewResizer';
import { usePreviewFrame } from '../../hooks/usePreviewFrame';

const TAB_STYLE_PROPS = {
  flex: '0 0 auto',
  border: '1px solid var(--action-control-border)',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '500',
  h: 10,
  px: 4,
  color: 'var(--text-muted)',
  bg: 'var(--action-control-bg)',
  justifyContent: 'center',
  transition:
    'transform var(--dur-press) var(--ease-out), background-color var(--dur-menu) var(--ease-out), color var(--dur-menu) var(--ease-out)',
  _hover: { bg: 'var(--action-control-hover)', color: 'var(--text-primary)' },
  _active: { transform: 'scale(0.97)' },
  _selected: {
    bg: 'var(--action-control-selected)',
    borderColor: 'var(--action-control-selected-border)',
    color: colors.accent,
    boxShadow: 'var(--action-control-shadow)'
  }
};

/**
 * Recursively searches React children for a component of the given type
 * and returns its props. Returns null if not found.
 */
function findChildProps(children, targetType) {
  let result = null;
  React.Children.forEach(children, child => {
    if (result || !child || !child.props) return;
    if (child.type === targetType) {
      result = child.props;
      return;
    }
    if (child.props.children) {
      result = findChildProps(child.props.children, targetType);
    }
  });
  return result;
}

function insertCategoryPro(children, category) {
  const target = findChildProps(children, Customize) ? Customize : PropTable;
  let inserted = false;
  const visit = node => {
    if (inserted) return node;
    if (Array.isArray(node)) return node.map(visit);
    if (!React.isValidElement(node)) return node;
    if (node.type === target) {
      inserted = true;
      const strip = <CategoryProFooter key="related-pro" category={category} />;
      return (
        <React.Fragment key={node.key ?? 'related-pro-slot'}>
          {target === Customize ? node : strip}
          {target === Customize ? strip : node}
        </React.Fragment>
      );
    }
    if (node.props.children == null) return node;
    const next = visit(node.props.children);
    if (!inserted) return node;
    return Array.isArray(next)
      ? React.cloneElement(node, undefined, ...next)
      : React.cloneElement(node, undefined, next);
  };
  return visit(children);
}

const TOOLTIP_CONTENT_PROPS = {
  bg: colors.bgBody,
  border: `1px solid ${colors.borderPrimary}`,
  color: colors.accent,
  fontSize: '12px',
  fontWeight: '500',
  lineHeight: '0',
  px: 4,
  whiteSpace: 'nowrap',
  h: 10,
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  pointerEvents: 'none'
};

const PreviewAction = ({ label, icon, onClick }) => (
  <Tooltip.Root openDelay={250} closeDelay={100} positioning={{ placement: 'left', gutter: 8 }}>
    <Tooltip.Trigger asChild>
      <Box
        as="button"
        aria-label={label}
        onClick={onClick}
        display="flex"
        cursor="pointer"
        alignItems="center"
        justifyContent="center"
        {...TAB_STYLE_PROPS}
        w={10}
      >
        <Icon as={icon} boxSize={4} flexShrink={0} color="var(--text-primary)" />
      </Box>
    </Tooltip.Trigger>
    <Tooltip.Positioner>
      <Tooltip.Content {...TOOLTIP_CONTENT_PROPS}>{label}</Tooltip.Content>
    </Tooltip.Positioner>
  </Tooltip.Root>
);

const TABLET_WIDTH = 768;
const MOBILE_WIDTH = 375;

const WIDTH_PRESETS = [
  { label: 'Desktop', icon: Monitor, width: null },
  { label: `Tablet · ${TABLET_WIDTH}px`, icon: Tablet, width: TABLET_WIDTH },
  { label: `Mobile · ${MOBILE_WIDTH}px`, icon: Smartphone, width: MOBILE_WIDTH }
];

const PreviewWidthPresets = ({ fullWidth, width, onChange }) => {
  const presets = WIDTH_PRESETS.filter(preset => preset.width === null || preset.width < fullWidth);
  if (presets.length < 2) return null;

  return (
    <div className="preview-width-presets" role="group" aria-label="Preview width">
      {presets.map(preset => (
        <Tooltip.Root key={preset.label} openDelay={250} closeDelay={100} positioning={{ placement: 'top', gutter: 8 }}>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              className="preview-width-preset"
              aria-label={preset.label}
              aria-pressed={width === preset.width}
              onClick={() => onChange(preset.width)}
            >
              <preset.icon aria-hidden="true" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content {...TOOLTIP_CONTENT_PROPS}>{preset.label}</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      ))}
    </div>
  );
};

const canFullscreen = () =>
  typeof document !== 'undefined' && Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);

function getActiveCode(codeObject, lang, style) {
  if (!codeObject) return { source: '', label: '', css: '' };

  if (lang === 'TS' && style === 'TW' && codeObject.tsTailwind)
    return { source: codeObject.tsTailwind, label: 'TypeScript + Tailwind', css: '' };
  if (lang === 'TS' && codeObject.tsCode)
    return { source: codeObject.tsCode, label: 'TypeScript + CSS', css: codeObject.css || '' };
  if (style === 'TW' && codeObject.tailwind)
    return { source: codeObject.tailwind, label: 'JavaScript + Tailwind', css: '' };

  return { source: codeObject.code || '', label: 'JavaScript + CSS', css: codeObject.css || '' };
}

function buildPrompt(componentName, codeObject, propData, lang, style) {
  const { source, label, css } = getActiveCode(codeObject, lang, style);
  const usage = codeObject.usage || '';
  const deps = codeObject.dependencies || '';

  let prompt = `## Integrate the <${componentName} /> component from React Bits

You are helping integrate an open-source React component into an existing application.

### Component: ${componentName}
### Variant: ${label}
${deps ? `### Dependencies: ${deps}` : ''}

---

### Usage Example
\`\`\`jsx
${usage}
\`\`\`
`;

  if (propData && propData.length > 0) {
    prompt += `
### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
${propData.map(p => `| ${p.name} | ${p.type} | ${p.default || '—'} | ${p.description} |`).join('\n')}
`;
  }

  prompt += `
### Full Component Source
\`\`\`${lang === 'TS' ? 'tsx' : 'jsx'}
${source}
\`\`\`
`;

  if (css) {
    prompt += `
### Component CSS
\`\`\`css
${css}
\`\`\`
`;
  }

  prompt += `
### Integration Instructions
1. Install any listed dependencies.
2. Copy the component source into the appropriate directory in the project.
${css ? '3. Import the CSS file alongside the component.\n' : ''}${css ? '4' : '3'}. Import and render the component using the usage example above as a starting point.
${css ? '5' : '4'}. Adjust props as needed for the specific use case — refer to the props table for all available options.

### More from React Bits
The full library index, including everything reactbits.dev offers, is at https://reactbits.dev/llms.txt — fetch it if this component is not the right fit or the project needs more pieces.
`;

  return prompt;
}

const TabsLayout = ({ children, className }) => {
  const { category, subcategory } = useParams();
  const {
    hasChanges,
    resetProps,
    props: currentProps,
    defaultProps,
    demoOnlyProps,
    computedProps
  } = useComponentPropsContext();

  const { favoriteKey, componentName } = useMemo(() => {
    if (!category || !subcategory) return null;

    const toPascal = str =>
      str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    const categoryName = toPascal(category);
    const componentName = toPascal(subcategory);
    return { favoriteKey: `${categoryName}/${componentName}`, componentName };
  }, [category, subcategory]) || { favoriteKey: null, componentName: null };

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!favoriteKey) return;
    setIsSaved(isComponentSaved(favoriteKey));
  }, [favoriteKey]);

  const toggleFavorite = () => {
    if (!favoriteKey) return;
    const { saved } = toggleSavedComponent(favoriteKey);
    setIsSaved(saved);

    const nameEl = (
      <span>
        {' '}
        <span style={{ color: colors.accent, fontWeight: 700 }}>&lt;{componentName} /&gt;</span>
      </span>
    );

    if (saved) toast.success?.(<>Added {nameEl} to favorites</>) ?? toast(<>Added {nameEl} to favorites</>);
    else toast.error?.(<>Removed {nameEl} from favorites</>) ?? toast(<>Removed {nameEl} from favorites</>);
  };
  const contentMap = {
    PreviewTab: null,
    CodeTab: null
  };

  React.Children.forEach(children, child => {
    if (!child) return;
    if (child.type === PreviewTab) contentMap.PreviewTab = child;
    if (child.type === CodeTab) contentMap.CodeTab = child;
  });

  // Extract codeObject/componentName from CodeExample child and propData from PropTable child
  const codeExampleProps = contentMap.CodeTab ? findChildProps(contentMap.CodeTab.props.children, CodeExample) : null;
  const propTableProps = contentMap.PreviewTab ? findChildProps(contentMap.PreviewTab.props.children, PropTable) : null;
  const studioButtonProps = contentMap.PreviewTab
    ? findChildProps(contentMap.PreviewTab.props.children, OpenInStudioButton)
    : null;

  const navigate = useNavigate();
  const handleOpenStudio = useCallback(() => {
    if (!studioButtonProps) return;
    const { backgroundId, currentProps: sbCurrent = {}, defaultProps: sbDefault = {} } = studioButtonProps;
    navigate(buildStudioUrl(backgroundId, sbCurrent, sbDefault));
  }, [studioButtonProps, navigate]);

  const { languagePreset, stylePreset } = useOptions();

  const aiExport = useMemo(() => {
    if (!codeExampleProps) return null;
    const { codeObject, componentName: compName } = codeExampleProps;
    const mergedProps = { ...currentProps, ...computedProps };
    const dynamicUsage =
      codeObject.usage && compName
        ? injectPropsIntoCode(codeObject.usage, mergedProps, defaultProps || {}, compName, demoOnlyProps)
        : codeObject.usage;
    const { source, css } = getActiveCode(codeObject, languagePreset, stylePreset);

    return {
      componentName: compName,
      fullPrompt: buildPrompt(
        compName,
        { ...codeObject, usage: dynamicUsage },
        propTableProps?.data || [],
        languagePreset,
        stylePreset
      ),
      configuredUsage: dynamicUsage,
      componentSource: source,
      componentCss: css,
      dependencies: codeObject.dependencies || ''
    };
  }, [
    codeExampleProps,
    propTableProps,
    languagePreset,
    stylePreset,
    currentProps,
    defaultProps,
    demoOnlyProps,
    computedProps
  ]);

  const aiActions = useAIExportActions({ category, subcategory, ...(aiExport || {}) });

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Share link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  }, []);

  const [activeTab, setActiveTab] = useState('preview');
  const [previewWidth, setPreviewWidth] = useState(null);
  const [resizing, setResizing] = useState(false);
  const previewRef = useRef(null);
  const isPreview = activeTab === 'preview';
  const canResize = category !== 'get-started' && isPreview;
  const frame = usePreviewFrame(previewRef, canResize);

  useEffect(() => {
    if (frame && previewWidth !== null && previewWidth >= frame.fullWidth) setPreviewWidth(null);
  }, [frame, previewWidth]);

  const openFullscreen = useCallback(() => {
    const demo = previewRef.current?.querySelector('.demo-container');
    const request = demo?.requestFullscreen || demo?.webkitRequestFullscreen;
    if (!request) return;
    Promise.resolve(request.call(demo)).catch(() => toast.error('Fullscreen is not available here'));
  }, []);

  const showFavorite = favoriteKey && category !== 'get-started';
  const showFullscreen = category === 'backgrounds' && isPreview && canFullscreen();
  const hasOverflowActions = showFavorite || Boolean(codeExampleProps) || Boolean(studioButtonProps) || showFullscreen;

  return (
    <Tabs.Root
      w="100%"
      variant="plain"
      lazyMount
      value={activeTab}
      onValueChange={({ value }) => setActiveTab(value)}
      className={className}
    >
      <Tabs.List w="100%">
        <Flex gap={2} justifyContent="space-between" alignItems="center" w="100%" wrap="nowrap">
          {/* Primary tabs */}
          <Flex gap={2} wrap="nowrap" flex={{ base: '1 1 0', md: '0 0 auto' }} minW="0">
            <Tabs.Trigger value="preview" {...TAB_STYLE_PROPS} flex={{ base: '1 1 0', md: '0 0 auto' }}>
              <Icon as={FiEye} /> Preview
            </Tabs.Trigger>

            <Tabs.Trigger value="code" {...TAB_STYLE_PROPS} flex={{ base: '1 1 0', md: '0 0 auto' }}>
              <Icon as={FiCode} /> Code
            </Tabs.Trigger>
          </Flex>

          {/* Desktop: full action buttons */}
          <Flex alignItems="center" gap={2} flexShrink={0} display={{ base: 'none', md: 'flex' }}>
            {canResize && frame && (
              <PreviewWidthPresets fullWidth={frame.fullWidth} width={previewWidth} onChange={setPreviewWidth} />
            )}

            {showFullscreen && <PreviewAction label="Fullscreen" icon={Maximize2} onClick={openFullscreen} />}

            {showFavorite && (
              <Tooltip.Root openDelay={250} closeDelay={100} positioning={{ placement: 'left', gutter: 8 }}>
                <Tooltip.Trigger asChild>
                  <Box
                    as="button"
                    aria-label={isSaved ? 'Remove from Favorites' : 'Add to Favorites'}
                    onClick={toggleFavorite}
                    aria-pressed={isSaved}
                    display="flex"
                    cursor="pointer"
                    alignItems="center"
                    gap={2}
                    {...TAB_STYLE_PROPS}
                    w={10}
                    borderColor={isSaved ? 'rgba(168, 85, 247, 0.3)' : 'var(--action-control-border)'}
                    boxShadow={isSaved ? 'inset 0 0 0 1px rgba(168, 85, 247, 0.04)' : undefined}
                    _hover={
                      isSaved
                        ? {
                            bg: 'var(--action-control-hover)',
                            borderColor: 'rgba(168, 85, 247, 0.48)'
                          }
                        : TAB_STYLE_PROPS._hover
                    }
                  >
                    <Icon
                      as={isSaved ? RiHeartFill : RiHeartLine}
                      color={isSaved ? '#a855f7' : 'var(--text-primary)'}
                      boxSize={4}
                      filter={isSaved ? 'drop-shadow(0 1px 3px rgba(168, 85, 247, 0.2))' : undefined}
                    />
                  </Box>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content
                    bg={colors.bgBody}
                    border={`1px solid ${colors.borderPrimary}`}
                    color={colors.accent}
                    fontSize="12px"
                    fontWeight="500"
                    lineHeight="0"
                    px={4}
                    whiteSpace="nowrap"
                    h={10}
                    borderRadius="10px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    pointerEvents="none"
                  >
                    {isSaved ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            )}

            {showFavorite && (
              <Tooltip.Root openDelay={250} closeDelay={100} positioning={{ placement: 'left', gutter: 8 }}>
                <Tooltip.Trigger asChild>
                  <Box
                    as="button"
                    aria-label="Copy share link"
                    onClick={copyShareLink}
                    display="flex"
                    cursor="pointer"
                    alignItems="center"
                    justifyContent="center"
                    {...TAB_STYLE_PROPS}
                    w={10}
                  >
                    <Icon as={FaRegShareFromSquare} boxSize={4} flexShrink={0} color="var(--text-primary)" />
                  </Box>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content
                    bg={colors.bgBody}
                    border={`1px solid ${colors.borderPrimary}`}
                    color={colors.accent}
                    fontSize="12px"
                    fontWeight="500"
                    lineHeight="0"
                    px={4}
                    whiteSpace="nowrap"
                    h={10}
                    borderRadius="10px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    pointerEvents="none"
                  >
                    Copy share link
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            )}

            {aiExport && <CopyForAIMenu {...aiActions} triggerProps={TAB_STYLE_PROPS} />}
          </Flex>

          {/* Mobile: overflow menu */}
          {hasOverflowActions && (
            <Box display={{ base: 'flex', md: 'none' }} flexShrink={0}>
              <Menu.Root
                positioning={{
                  placement: 'bottom-end',
                  gutter: 12,
                  offset: { mainAxis: 6, crossAxis: 0 },
                  flip: false,
                  overflowPadding: 0
                }}
              >
                <Menu.Trigger asChild>
                  <Box
                    as="button"
                    aria-label="More actions"
                    display="flex"
                    cursor="pointer"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                    {...TAB_STYLE_PROPS}
                    w={10}
                    px={0}
                    position="relative"
                  >
                    <MoreHorizontal size={18} />
                    {isSaved && (
                      <Box
                        position="absolute"
                        top="6px"
                        right="6px"
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        bg={colors.accent}
                      />
                    )}
                  </Box>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content
                      bg={colors.bgBody}
                      border={`1px solid ${colors.borderPrimary}`}
                      borderRadius="10px"
                      p={1}
                      minW="180px"
                      boxShadow="var(--shadow-menu)"
                      zIndex={1500}
                      transformOrigin="top right"
                    >
                      {showFavorite && (
                        <Menu.Item
                          value="favorite"
                          onSelect={toggleFavorite}
                          display="flex"
                          alignItems="center"
                          gap={3}
                          px={3}
                          py={2}
                          fontSize="14px"
                          color="var(--text-primary)"
                          borderRadius="8px"
                          cursor="pointer"
                          _hover={{ bg: colors.bgHover }}
                        >
                          <Icon
                            as={isSaved ? RiHeartFill : RiHeartLine}
                            color={isSaved ? '#a855f7' : 'var(--text-primary)'}
                            boxSize={4}
                          />
                          {isSaved ? 'Remove from favorites' : 'Add to favorites'}
                        </Menu.Item>
                      )}
                      {showFavorite && (
                        <Menu.Item
                          value="share"
                          onSelect={copyShareLink}
                          display="flex"
                          alignItems="center"
                          gap={3}
                          px={3}
                          py={2}
                          fontSize="14px"
                          color="var(--text-primary)"
                          borderRadius="8px"
                          cursor="pointer"
                          _hover={{ bg: colors.bgHover }}
                        >
                          <Icon as={FaRegShareFromSquare} boxSize={4} flexShrink={0} color="var(--text-primary)" /> Copy
                          share link
                        </Menu.Item>
                      )}
                      {aiExport && (
                        <>
                          <Menu.Separator borderColor={colors.borderPrimary} my={1} />
                          {aiActions.copyItems.map(item => (
                            <AIMenuItem key={item.key} item={item} done={aiActions.done} />
                          ))}
                          <Menu.Separator borderColor={colors.borderPrimary} my={1} />
                          {aiActions.openItems.map(item => (
                            <AIMenuItem key={item.key} item={item} done={aiActions.done} />
                          ))}
                        </>
                      )}
                      {showFullscreen && (
                        <Menu.Item
                          value="fullscreen"
                          onSelect={openFullscreen}
                          display="flex"
                          alignItems="center"
                          gap={3}
                          px={3}
                          py={2}
                          fontSize="14px"
                          color="var(--text-primary)"
                          borderRadius="8px"
                          cursor="pointer"
                          _hover={{ bg: colors.bgHover }}
                        >
                          <Maximize2 size={16} /> Fullscreen
                        </Menu.Item>
                      )}
                      {studioButtonProps && (
                        <Menu.Item
                          value="open-studio"
                          onSelect={handleOpenStudio}
                          display="flex"
                          alignItems="center"
                          gap={3}
                          px={3}
                          py={2}
                          fontSize="14px"
                          color="var(--text-primary)"
                          borderRadius="8px"
                          cursor="pointer"
                          _hover={{ bg: colors.bgHover }}
                        >
                          <Palette size={16} /> Open in BG Studio
                        </Menu.Item>
                      )}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Box>
          )}
        </Flex>
      </Tabs.List>

      <Tabs.Content
        pt={0}
        value="preview"
        ref={previewRef}
        className="preview-panel"
        data-resizing={resizing ? '' : undefined}
        style={previewWidth === null ? undefined : { '--preview-width': `${previewWidth}px` }}
      >
        {canResize && <PreviewStage frame={frame} visible={previewWidth !== null || resizing} />}
        <CustomizeActionsContext.Provider
          value={{
            openStudio: studioButtonProps ? handleOpenStudio : null,
            reset: resetProps,
            canReset: hasChanges
          }}
        >
          {insertCategoryPro(contentMap.PreviewTab, category)}
        </CustomizeActionsContext.Provider>
        {canResize && (
          <PreviewResizer
            frame={frame}
            width={previewWidth}
            onWidthChange={setPreviewWidth}
            onResizingChange={setResizing}
          />
        )}
      </Tabs.Content>
      <Tabs.Content pt={0} value="code">
        {contentMap.CodeTab}
      </Tabs.Content>

      {category !== 'get-started' && <ComponentPager category={category} subcategory={subcategory} />}

      <TabsFooter />
    </Tabs.Root>
  );
};

export const PreviewTab = ({ children }) => <>{children}</>;
export const CodeTab = ({ children }) => <>{children}</>;

export { TabsLayout };
