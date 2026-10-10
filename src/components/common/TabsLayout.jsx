import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import TabsFooter from './TabsFooter';
import CategoryProFooter from './Pro/CategoryProFooter';
import Customize from './Preview/Customize';

import { Tabs, Tooltip, Menu, Portal } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ComputerIcon,
  FavouriteIcon,
  FullScreenIcon,
  MoreHorizontalIcon,
  PaintBoardIcon,
  Share08Icon,
  SmartPhone01Icon,
  SourceCodeIcon,
  Tablet01Icon,
  ViewIcon
} from '@hugeicons/core-free-icons';
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
import CopyForAIMenu, { AIMenuSections, MenuGroup } from './CopyForAIMenu';
import FluidMenuContent from './FluidMenuContent';
import { useAIExportActions } from '../../hooks/useAIExportActions';
import ComponentPager from './ComponentPager';
import CustomizeActionsContext from './Preview/CustomizeContext';
import PreviewResizer, { PreviewStage } from './Preview/PreviewResizer';
import { usePreviewFrame } from '../../hooks/usePreviewFrame';
import { RelatedComponents } from './DocsOverview';
import { getComponentSEOByPath } from '../../utils/seo';

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

const ToolIcon = ({ icon }) => <HugeiconsIcon icon={icon} size={16} strokeWidth={1.6} aria-hidden="true" />;

const ToolTip = ({ label, children }) => (
  <Tooltip.Root openDelay={300} closeDelay={80} positioning={{ placement: 'top', gutter: 8 }}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Positioner>
      <Tooltip.Content className="docs-tooltip">{label}</Tooltip.Content>
    </Tooltip.Positioner>
  </Tooltip.Root>
);

const TABLET_WIDTH = 768;
const MOBILE_WIDTH = 375;

const WIDTH_PRESETS = [
  { label: 'Desktop', icon: ComputerIcon, width: null },
  { label: `Tablet · ${TABLET_WIDTH}px`, icon: Tablet01Icon, width: TABLET_WIDTH },
  { label: `Mobile · ${MOBILE_WIDTH}px`, icon: SmartPhone01Icon, width: MOBILE_WIDTH }
];

const MenuIcon = ({ icon, saved }) => (
  <span className="docs-menu-icon" data-saved={saved ? '' : undefined}>
    <ToolIcon icon={icon} />
  </span>
);

const usePill = (trackRef, selection) => {
  const [pill, setPill] = useState(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const measure = () => {
      const active = track.querySelector('[aria-selected="true"], [aria-pressed="true"]');
      setPill(previous => {
        if (!active) return previous ? { ...previous, hidden: true } : null;
        const next = { x: active.offsetLeft, width: active.offsetWidth, hidden: false, ready: Boolean(previous) };
        const same = previous && previous.x === next.x && previous.width === next.width && !previous.hidden;
        return same ? previous : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [trackRef, selection]);

  return pill;
};

const Pill = ({ pill }) => (
  <span
    className="docs-pill"
    aria-hidden="true"
    data-ready={pill?.ready ? '' : undefined}
    style={
      pill ? { width: pill.width, transform: `translateX(${pill.x}px)`, opacity: pill.hidden ? 0 : 1 } : { opacity: 0 }
    }
  />
);

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
  const componentSEO = useMemo(() => getComponentSEOByPath(`/${category}/${subcategory}`), [category, subcategory]);
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
  const tabsTrackRef = useRef(null);
  const sizeTrackRef = useRef(null);
  const tabsPill = usePill(tabsTrackRef, activeTab);
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
  const widthPresets =
    canResize && frame ? WIDTH_PRESETS.filter(preset => preset.width === null || preset.width < frame.fullWidth) : [];
  const showWidthPresets = widthPresets.length > 1;
  const sizePill = usePill(sizeTrackRef, `${previewWidth}-${widthPresets.length}-${showFullscreen}`);
  const favoriteLabel = isSaved ? 'Remove from favorites' : 'Add to favorites';

  return (
    <Tabs.Root
      w="100%"
      variant="plain"
      lazyMount
      value={activeTab}
      onValueChange={({ value }) => setActiveTab(value)}
      className={className}
    >
      <Tabs.List className="docs-toolbar">
        <div className="docs-track docs-tabs" ref={tabsTrackRef} data-pill="">
          <Pill pill={tabsPill} />
          <Tabs.Trigger value="preview" className="docs-segment">
            <ToolIcon icon={ViewIcon} />
            Preview
          </Tabs.Trigger>
          <Tabs.Trigger value="code" className="docs-segment">
            <ToolIcon icon={SourceCodeIcon} />
            Code
          </Tabs.Trigger>
        </div>

        <div className="docs-toolbar-actions">
          {(showWidthPresets || showFullscreen) && (
            <div className="docs-track" role="group" aria-label="Preview size" ref={sizeTrackRef} data-pill="">
              <Pill pill={sizePill} />
              {showWidthPresets &&
                widthPresets.map(preset => (
                  <ToolTip key={preset.label} label={preset.label}>
                    <button
                      type="button"
                      className="docs-segment docs-segment--icon"
                      aria-label={preset.label}
                      aria-pressed={previewWidth === preset.width}
                      onClick={() => setPreviewWidth(preset.width)}
                    >
                      <ToolIcon icon={preset.icon} />
                    </button>
                  </ToolTip>
                ))}
              {showFullscreen && (
                <ToolTip label="Fullscreen">
                  <button
                    type="button"
                    className="docs-segment docs-segment--icon"
                    aria-label="Fullscreen"
                    onClick={openFullscreen}
                  >
                    <ToolIcon icon={FullScreenIcon} />
                  </button>
                </ToolTip>
              )}
            </div>
          )}

          {showFavorite && (
            <div className="docs-track" role="group" aria-label="Page actions">
              <ToolTip label={favoriteLabel}>
                <button
                  type="button"
                  className="docs-segment docs-segment--icon docs-favorite"
                  aria-label={favoriteLabel}
                  aria-pressed={isSaved}
                  data-saved={isSaved ? '' : undefined}
                  onClick={toggleFavorite}
                >
                  <ToolIcon icon={FavouriteIcon} />
                </button>
              </ToolTip>
              <ToolTip label="Copy share link">
                <button
                  type="button"
                  className="docs-segment docs-segment--icon"
                  aria-label="Copy share link"
                  onClick={copyShareLink}
                >
                  <ToolIcon icon={Share08Icon} />
                </button>
              </ToolTip>
            </div>
          )}

          {aiExport && <CopyForAIMenu {...aiActions} />}
        </div>

        {hasOverflowActions && (
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
              <button type="button" className="docs-tool docs-tool--icon docs-toolbar-more" aria-label="More actions">
                <ToolIcon icon={MoreHorizontalIcon} />
                {isSaved && <span className="docs-tool-dot" />}
              </button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <FluidMenuContent minW="220px" zIndex={1500} transformOrigin="top right">
                  {showFavorite && (
                    <MenuGroup label="Page">
                      <Menu.Item value="favorite" onSelect={toggleFavorite} className="docs-menu-item">
                        <MenuIcon icon={FavouriteIcon} saved={isSaved} />
                        {favoriteLabel}
                      </Menu.Item>
                      <Menu.Item value="share" onSelect={copyShareLink} className="docs-menu-item">
                        <MenuIcon icon={Share08Icon} />
                        Copy share link
                      </Menu.Item>
                    </MenuGroup>
                  )}
                  {aiExport && (
                    <AIMenuSections
                      copyItems={aiActions.copyItems}
                      openItems={aiActions.openItems}
                      done={aiActions.done}
                    />
                  )}
                  {(showFullscreen || studioButtonProps) && (
                    <MenuGroup label="View">
                      {showFullscreen && (
                        <Menu.Item value="fullscreen" onSelect={openFullscreen} className="docs-menu-item">
                          <MenuIcon icon={FullScreenIcon} />
                          Fullscreen
                        </Menu.Item>
                      )}
                      {studioButtonProps && (
                        <Menu.Item value="open-studio" onSelect={handleOpenStudio} className="docs-menu-item">
                          <MenuIcon icon={PaintBoardIcon} />
                          Open in BG Studio
                        </Menu.Item>
                      )}
                    </MenuGroup>
                  )}
                </FluidMenuContent>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        )}
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

      {componentSEO && <RelatedComponents seo={componentSEO} />}
      {category !== 'get-started' && <ComponentPager category={category} subcategory={subcategory} />}

      <TabsFooter />
    </Tabs.Root>
  );
};

export const PreviewTab = ({ children }) => <>{children}</>;
export const CodeTab = ({ children }) => <>{children}</>;

export { TabsLayout };
