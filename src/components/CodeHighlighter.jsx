import { Box, Button } from '@chakra-ui/react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
      <SyntaxHighlighter language={language} style={dracula} showLineNumbers={showLineNumbers} className="code-highlighter">
        {codeString}
      </SyntaxHighlighter>
      <Button
        size="sm"
        position="absolute"
        top={3}
        right={3}
        rounded="xl"
        backgroundColor={copied ? 'green.500' : '#00F0FF'}
        color="black"
        _hover={{ backgroundColor: '#00F0FF' }}
        _active={{ backgroundColor: '#00F0FF' }}
        transition="background-color 0.3s ease"
        onClick={handleCopy}
      >
        {copied ? 'Copied!' : 'Copy Code'}
      </Button>
    </Box>
  );
};

export default CodeHighlighter;