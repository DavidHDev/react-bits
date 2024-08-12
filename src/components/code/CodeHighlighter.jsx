import { Box, Button, Icon } from '@chakra-ui/react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { synthwave84 } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { FiCopy, FiCheckSquare } from "react-icons/fi";

const CodeHighlighter = ({ language, codeString, showLineNumbers = true }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset the copied state after 2 seconds
    } catch (error) {
      console.error('Failed to copy text: ', error);
    }
  };

  return (
    <Box position="relative" mb={5}>
      <SyntaxHighlighter language={language} style={synthwave84} showLineNumbers={showLineNumbers} className="code-highlighter">
        {codeString}
      </SyntaxHighlighter>
      <Button
        size="sm"
        position="absolute"
        top={3}
        right={3}
        rounded="xl"
        fontWeight={500}
        fontSize="xs"
        backgroundColor={copied ? '#3EFF5D' : '#00F0FF'}
        color="black"
        _hover={{ backgroundColor: '#00F0FF' }}
        _active={{ backgroundColor: '#00F0FF' }}
        transition="background-color 0.3s ease"
        onClick={handleCopy}
      >
        {copied
          ? <span><Icon position="relative" top={'2px'} as={FiCheckSquare} />&nbsp;Copied</span>
          : <span><Icon position="relative" top={'2px'} as={FiCopy} />&nbsp;Copy</span>
        }
      </Button>
    </Box>
  );
};

export default CodeHighlighter;