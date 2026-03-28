import { TbCopy, TbCopyCheckFilled, TbMoodSad } from 'react-icons/tb';
import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { colors } from '../../constants/colors';
import codeTheme from '../../utils/codeTheme';

const routeExpansionState = {};

const hashSnippet = str => {
  if (!str) return 'empty';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    if (i > 500) break;
  }
  return hash.toString(36);
};

const COPY_BTN_STYLE = {
  borderRadius: '12px',
  fontWeight: 500,
  border: `1px solid ${colors.borderSecondary}`,
  transition: 'background-color 0.3s ease',
  h: 10
};

const CodeHighlighter = ({ language, codeString, showLineNumbers = true, maxLines = 25, snippetId }) => {
  const { pathname } = useLocation();
  const key = snippetId || hashSnippet(codeString + '|' + language);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(() => routeExpansionState[pathname]?.[key] ?? false);

  useEffect(() => {
    if (!routeExpansionState[pathname]) routeExpansionState[pathname] = {};
    routeExpansionState[pathname][key] = expanded;
  }, [expanded, pathname, key]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text: ', error);
    }
  };

  const codeLines = codeString?.split('\n').length;
  const shouldCollapse = codeLines > maxLines;

  return (
    <Box position="relative">
      <Box
        position="relative"
        overflow="hidden"
        maxHeight={shouldCollapse && !expanded ? `calc(1.2em * ${maxLines})` : 'none'}
      >
        {codeString ? (
          <SyntaxHighlighter
            language={language}
            style={codeTheme}
            showLineNumbers={showLineNumbers}
            className="code-highlighter"
          >
            {codeString}
          </SyntaxHighlighter>
        ) : (
          <Flex alignItems="center" gap={2} my={2} color={colors.textMuted}>
            <Text>Sorry, this combination is not supported</Text>
            <Icon as={TbMoodSad} />
          </Flex>
        )}

        {shouldCollapse && !expanded && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            height="60%"
            background={`linear-gradient(to bottom, transparent, ${colors.bgBody})`}
          />
        )}

        {shouldCollapse && (
          <Button
            {...COPY_BTN_STYLE}
            position="absolute"
            bottom="0.9em"
            right="0.8em"
            rounded="10px"
            bg={colors.bgBody}
            color="white"
            _hover={{ bg: colors.bgElevated }}
            _active={{ bg: colors.bgElevated }}
            zIndex={2}
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded ? 'Collapse Snippet' : 'Expand Snippet'}
          </Button>
        )}
      </Box>

      {codeString && (
        <Button
          {...COPY_BTN_STYLE}
          position="absolute"
          top=".65em"
          right=".6em"
          bg={copied ? colors.primary : colors.bgBody}
          color={copied ? 'black' : 'white'}
          _hover={{ bg: copied ? colors.primary : colors.bgElevated }}
          _active={{ bg: colors.primary }}
          onClick={handleCopy}
        >
          <Icon as={copied ? TbCopyCheckFilled : TbCopy} color="#fff" boxSize={4} />
        </Button>
      )}
    </Box>
  );
};

export default CodeHighlighter;
