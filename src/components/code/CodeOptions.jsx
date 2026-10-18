import { Children } from 'react';
import { Flex, Text, Icon, Box } from '@chakra-ui/react';
import { useOptions } from '../context/OptionsContext/useOptions';
import { TbMoodSad } from 'react-icons/tb';
import IconSelect from './IconSelect';
import CodeHighlighter, { CodeCopyButton } from './CodeHighlighter';
import CodeSection from './CodeSection';
import { colors } from '../../constants/colors';

import jsIcon from '../../assets/icons/js.svg';
import tsIcon from '../../assets/icons/ts.svg';
import cssIcon from '../../assets/icons/css.svg';
import twIcon from '../../assets/icons/tw.svg';

export const CSS = ({ children }) => <>{children}</>;
export const Tailwind = ({ children }) => <>{children}</>;
export const TSCSS = ({ children }) => <>{children}</>;
export const TSTailwind = ({ children }) => <>{children}</>;

const LANG_ITEMS = ['JS', 'TS'];
const STYLE_ITEMS = ['CSS', 'TW'];
const ICON_MAP = { JS: jsIcon, TS: tsIcon, CSS: cssIcon, TW: twIcon };
const COLOR_MAP = { JS: '#F7DF1E', TS: '#3178C6', CSS: '#B497CF', TW: '#38BDF8' };
const LABEL_MAP = { JS: 'JavaScript', TS: 'TypeScript', CSS: 'CSS', TW: 'Tailwind' };

const UNSUPPORTED = (
  <Flex className="code-unsupported" alignItems="center" gap={1} color={colors.textMuted}>
    <Text>Sorry, this combination is not supported</Text>
    <Icon as={TbMoodSad} />
  </Flex>
);

const findCodeHighlighter = node => {
  if (!node || typeof node !== 'object') return null;
  if (node.type === CodeHighlighter) return node;

  const nested = Children.toArray(node.props?.children);
  for (const child of nested) {
    const match = findCodeHighlighter(child);
    if (match) return match;
  }

  return null;
};

const CodeOptions = ({ children }) => {
  const { languagePreset, setLanguagePreset, stylePreset, setStylePreset } = useOptions();
  const currentLang = languagePreset || 'JS';

  const buckets = { JS: { css: null, tailwind: null }, TS: { css: null, tailwind: null } };
  Children.forEach(children, child => {
    if (!child) return;
    if (child.type === CSS) buckets.JS.css = child;
    if (child.type === Tailwind) buckets.JS.tailwind = child;
    if (child.type === TSCSS) buckets.TS.css = child;
    if (child.type === TSTailwind) buckets.TS.tailwind = child;
  });

  const renderContent = variant => {
    const node = currentLang === 'JS' ? buckets.JS[variant] : buckets.TS[variant];
    return node?.props?.children ? node : UNSUPPORTED;
  };

  const styles = STYLE_ITEMS.filter(item =>
    item === 'TW' ? buckets.JS.tailwind || buckets.TS.tailwind : buckets.JS.css || buckets.TS.css
  );
  const activeStyle = styles.includes(stylePreset) ? stylePreset : styles[0] || stylePreset;
  const styleVariant = activeStyle === 'TW' ? 'tailwind' : 'css';
  const activeNode = renderContent(styleVariant);
  const activeParts = activeNode === UNSUPPORTED ? [activeNode] : Children.toArray(activeNode?.props?.children);
  const primaryContent = activeParts[0] || activeNode;
  const additionalContent = activeParts.slice(1);
  const activeCode = findCodeHighlighter(primaryContent)?.props?.codeString;

  return (
    <>
      <CodeSection
        title="Code"
        actions={
          <>
            <IconSelect
              collection={LANG_ITEMS}
              value={currentLang}
              onChange={setLanguagePreset}
              iconMap={ICON_MAP}
              labelMap={LABEL_MAP}
              colorMap={COLOR_MAP}
              width="140px"
              contentWidth="172px"
              triggerHeight={8}
              triggerRadius="7px"
              triggerClassName="section-header-select"
              placement="bottom-start"
            />
            {styles.length > 1 && (
              <IconSelect
                collection={STYLE_ITEMS}
                value={stylePreset}
                onChange={setStylePreset}
                iconMap={ICON_MAP}
                labelMap={LABEL_MAP}
                colorMap={COLOR_MAP}
                width="125px"
                contentWidth="154px"
                triggerHeight={8}
                triggerRadius="7px"
                triggerClassName="section-header-select"
                placement="bottom-start"
              />
            )}
            <CodeCopyButton codeString={activeCode} />
          </>
        }
      >
        <Box>{primaryContent}</Box>
      </CodeSection>
      {additionalContent}
    </>
  );
};

export default CodeOptions;
