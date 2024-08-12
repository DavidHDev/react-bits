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
        top={2.5}
        right={2.5}
        rounded="xl"
        fontWeight={500}
        fontSize="xs"
        backgroundColor={copied ? '#3EFF5D' : '#111'}
        color={copied ? 'black' : 'white'}
        _hover={{ backgroundColor: `${copied ? '#3EFF5D' : '#222'}` }}
        _active={{ backgroundColor: '#00F0FF' }}
        transition="background-color 0.3s ease"
        onClick={handleCopy}
      >
        {copied
          ? <Icon as={FiCheckSquare} />
          : <Icon as={FiCopy} />
        }
      </Button>
    </Box>
  );
};

export default CodeHighlighter;