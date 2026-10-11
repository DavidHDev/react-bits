import { Box, Flex, Text, Icon, Input, Code, Button } from '@chakra-ui/react';
import { ChevronDown, RotateCcw, Share2, Code2, Plus, X, ExternalLink } from 'lucide-react';
import { TbCopy, TbCopyCheckFilled } from 'react-icons/tb';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BACKGROUNDS, getDocsPath } from './backgrounds';
import { generateExportCode } from './utils/exportCode';
import { useOptions } from '../../components/context/OptionsContext/useOptions';
import PreviewSliderVertical from '../../components/common/Preview/PreviewSliderVertical';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import CodeHighlighter from '../../components/code/CodeHighlighter';

const BackgroundSelector = ({ selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selected = BACKGROUNDS.find(bg => bg.id === selectedId) || BACKGROUNDS[0];

  const filteredBackgrounds = useMemo(() => {
    const sorted = BACKGROUNDS.filter(bg => !bg.hidden || bg.id === selectedId).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    if (!searchQuery.trim()) return sorted;
    const query = searchQuery.toLowerCase();
    return sorted.filter(bg => bg.label.toLowerCase().includes(query));
  }, [searchQuery, selectedId]);

  return (
    <Box position="relative" ref={dropdownRef} mb={4}>
      <Flex
        as="button"
        onClick={() => setIsOpen(!isOpen)}
        align="center"
        justify="space-between"
        w="100%"
        px={3}
        py={2.5}
        bg="var(--bg-elevated)"
        border="1px solid var(--border-primary)"
        borderRadius="var(--radius-md)"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: 'var(--border-primary)' }}
      >
        <Text fontSize="14px" fontWeight={600} color="var(--text-primary)">
          {selected.label}
        </Text>
        <Icon
          as={ChevronDown}
          boxSize={4}
          color="var(--text-muted)"
          transition="transform 0.2s"
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
        />
      </Flex>

      <Box
        position="absolute"
        top="100%"
        left={0}
        right={0}
        mt={2}
        bg="var(--bg-card)"
        border="1px solid var(--border-primary)"
        borderRadius="var(--radius-md)"
        maxH="350px"
        opacity={isOpen ? 1 : 0}
        visibility={isOpen ? 'visible' : 'hidden'}
        transform={isOpen ? 'translateY(0)' : 'translateY(-8px)'}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={100}
        overflow="hidden"
      >
        <Box p={2} borderBottom="1px solid var(--border-primary)">
          <Input
            ref={searchInputRef}
            placeholder="Search backgrounds..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            size="sm"
            bg="var(--bg-elevated)"
            border="1px solid var(--border-primary)"
            borderRadius="8px"
            color="var(--text-primary)"
            fontSize="13px"
            _placeholder={{ color: 'var(--text-muted)' }}
            _hover={{ borderColor: 'var(--border-primary)' }}
            _focus={{ borderColor: '#5227FF', boxShadow: 'none' }}
          />
        </Box>

        <Box
          maxH="280px"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'var(--bg-elevated)' },
            '&::-webkit-scrollbar-thumb': { background: 'var(--border-primary)', borderRadius: '3px' }
          }}
        >
          {filteredBackgrounds.length === 0 ? (
            <Flex align="center" justify="center" py={4}>
              <Text fontSize="13px" color="var(--text-muted)">
                No backgrounds found
              </Text>
            </Flex>
          ) : (
            filteredBackgrounds.map(bg => (
              <Flex
                key={bg.id}
                as="button"
                onClick={() => {
                  onSelect(bg.id);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                align="center"
                gap={2}
                w="100%"
                px={3}
                py={2.5}
                bg={selectedId === bg.id ? 'var(--bg-elevated)' : 'transparent'}
                _hover={{ bg: 'var(--bg-elevated)' }}
                transition="background 0.15s"
              >
                <Text fontSize="14px" fontWeight={500} color="var(--text-primary)">
                  {bg.label}
                </Text>
              </Flex>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};

const NumberControl = ({ prop, value, onChange }) => {
  const { name, label, min = 0, max = 100, step = 1 } = prop;

  return (
    <PreviewSliderVertical
      title={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={val => onChange(name, val)}
    />
  );
};

const BooleanControl = ({ prop, value, onChange }) => {
  const { name, label } = prop;

  return <PreviewSwitch title={label} isChecked={value} onChange={checked => onChange(name, checked)} />;
};

const ColorControl = ({ prop, value, onChange }) => {
  const { name, label } = prop;

  return <PreviewColorPickerCustom title={label} color={value} onChange={val => onChange(name, val)} />;
};

const ColorArrayControl = ({ prop, value, onChange }) => {
  const { name, label, minItems = 1, maxItems = 5 } = prop;
  const colors = Array.isArray(value) ? value : [value];

  const updateColor = (index, newColor) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    onChange(name, newColors);
  };

  const addColor = () => {
    if (colors.length < maxItems) {
      onChange(name, [...colors, '#ffffff']);
    }
  };

  const removeColor = index => {
    if (colors.length > minItems) {
      onChange(
        name,
        colors.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <Box>
      <Flex direction="column" gap={2}>
        {colors.map((color, index) => (
          <Flex key={index} gap={2} align="center" w="100%">
            <Box flex="1" minW={0}>
              <PreviewColorPickerCustom
                title={`${label} ${index + 1}`}
                color={color}
                onChange={val => updateColor(index, val)}
              />
            </Box>
            {colors.length > minItems && (
              <Flex
                as="button"
                onClick={() => removeColor(index)}
                flexShrink={0}
                w="40px"
                h="40px"
                bg="var(--bg-elevated)"
                border="1px solid var(--border-primary)"
                borderRadius="var(--radius-sm)"
                align="center"
                justify="center"
                cursor="pointer"
                _hover={{ bg: 'var(--bg-hover)', borderColor: '#5227FF' }}
                transition="background 0.15s, border-color 0.15s"
                aria-label={`Remove ${label} ${index + 1}`}
              >
                <Icon as={X} boxSize={3.5} color="var(--text-muted)" />
              </Flex>
            )}
          </Flex>
        ))}
      </Flex>
      {colors.length < maxItems && (
        <Flex
          as="button"
          onClick={addColor}
          w="100%"
          h="40px"
          mt={2}
          borderRadius="var(--radius-sm)"
          border="1px dashed var(--border-primary)"
          align="center"
          justify="center"
          cursor="pointer"
          gap={1.5}
          _hover={{ borderColor: '#5227FF', bg: 'rgba(82, 39, 255, 0.05)' }}
          transition="all 0.2s"
        >
          <Icon as={Plus} boxSize={3.5} color="var(--text-muted)" />
          <Text fontSize="12px" color="var(--text-muted)" fontWeight={500}>
            Add Color
          </Text>
        </Flex>
      )}
    </Box>
  );
};

const SelectControl = ({ prop, value, onChange }) => {
  const { name, label, options = [] } = prop;

  return (
    <PreviewSelect title={label} options={options} value={value} onChange={val => onChange(name, val)} width={120} />
  );
};

const RgbArrayControl = ({ prop, value, onChange }) => {
  const { name, label } = prop;
  const rgb = Array.isArray(value) ? value : [0.5, 0.5, 0.5];

  const rgbToHex = (r, g, b) => {
    const toHex = v =>
      Math.round(Math.max(0, Math.min(1, v)) * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const hexToRgb = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
    }
    return [0.5, 0.5, 0.5];
  };

  const hexValue = rgbToHex(rgb[0], rgb[1], rgb[2]);

  return <PreviewColorPickerCustom title={label} color={hexValue} onChange={hex => onChange(name, hexToRgb(hex))} />;
};

const TextControl = ({ prop, value, onChange }) => {
  const { name, label } = prop;

  return (
    <Box>
      <Text fontSize="sm" mb={2}>
        {label}
      </Text>
      <Input
        type="text"
        value={value || ''}
        onChange={e => onChange(name, e.target.value)}
        bg="var(--bg-elevated)"
        border="1px solid var(--border-primary)"
        borderRadius="var(--radius-sm)"
        color="var(--text-primary)"
        fontSize="13px"
        px={3}
        py={2}
        _hover={{ borderColor: 'var(--border-primary)' }}
        _focus={{ borderColor: '#5227FF', boxShadow: 'none' }}
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
    </Box>
  );
};

const DynamicControl = ({ prop, value, onChange }) => {
  switch (prop.type) {
    case 'number':
      return <NumberControl prop={prop} value={value} onChange={onChange} />;
    case 'boolean':
      return <BooleanControl prop={prop} value={value} onChange={onChange} />;
    case 'color':
      return <ColorControl prop={prop} value={value} onChange={onChange} />;
    case 'colorArray':
      return <ColorArrayControl prop={prop} value={value} onChange={onChange} />;
    case 'select':
      return <SelectControl prop={prop} value={value} onChange={onChange} />;
    case 'rgbArray':
      return <RgbArrayControl prop={prop} value={value} onChange={onChange} />;
    case 'text':
      return <TextControl prop={prop} value={value} onChange={onChange} />;
    default:
      return null;
  }
};

const PKG_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'];

const ExportModal = ({ isOpen, onClose, background, props }) => {
  const { languagePreset, stylePreset } = useOptions() || {};
  const [copied, setCopied] = useState(null);
  const [pkg, setPkg] = useState('pnpm');
  const codeRef = useRef(null);

  const language = languagePreset || 'JS';
  const style = stylePreset === 'TW' ? 'Tailwind' : stylePreset || 'CSS';

  const { commands, jsxCode } = useMemo(
    () => generateExportCode(background, props, { language, style }),
    [background, props, language, style]
  );

  const currentCommand = useMemo(() => {
    if (!commands) return '';
    const key = pkg === 'npm' ? 'npx' : pkg;
    return commands.shadcn?.[key] || '';
  }, [commands, pkg]);

  const copyToClipboard = useCallback((text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.8)"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="var(--bg-card)"
        border="1px solid var(--border-primary)"
        borderRadius="40px"
        p={6}
        maxW="700px"
        w="90%"
        maxH="80vh"
        overflowY="auto"
        onClick={e => e.stopPropagation()}
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="18px" fontWeight={700} color="var(--text-primary)">
            Export Your Background
          </Text>
          <Flex
            as="button"
            onClick={onClose}
            w={8}
            h={8}
            align="center"
            justify="center"
            borderRadius="8px"
            _hover={{ bg: 'var(--bg-elevated)' }}
            cursor="pointer"
          >
            <Icon as={X} boxSize={5} color="var(--text-muted)" />
          </Flex>
        </Flex>

        <Box mb={6}>
          <Text className="demo-title" mb={3}>
            Step 1: Install via CLI
          </Text>
          <Box className="cli-install">
            <Box className="cli-install-section cli-mode">
              <Flex className="cli-row" gap={0} mb={0}>
                <div className="pkg-buttons" data-role="pkg-buttons">
                  {PKG_MANAGERS.map(m => (
                    <button key={m} className="cli-tool-tab" data-active={pkg === m} onClick={() => setPkg(m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </Flex>
              <Box className="code-wrapper" position="relative">
                <Code ref={codeRef} whiteSpace="pre" w="100%" overflow="auto" display="block">
                  {currentCommand}
                </Code>
                <Button
                  position="absolute"
                  h={10}
                  top="50%"
                  transform="translateY(-50%)"
                  right=".6em"
                  borderRadius="12px"
                  fontWeight={500}
                  backgroundColor={copied === 'install' ? '#5227FF' : 'var(--bg-body)'}
                  border="1px solid var(--border-primary)"
                  color={copied === 'install' ? 'black' : 'white'}
                  _hover={{ backgroundColor: copied === 'install' ? '#5227FF' : 'var(--bg-elevated)' }}
                  _active={{ backgroundColor: '#5227FF' }}
                  transition="background-color 0.3s ease"
                  onClick={() => copyToClipboard(currentCommand, 'install')}
                  aria-label="Copy installation command"
                >
                  {copied === 'install' ? (
                    <Icon as={TbCopyCheckFilled} color="#fff" boxSize={4} />
                  ) : (
                    <Icon as={TbCopy} color="#fff" boxSize={4} />
                  )}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box>
          <Text className="demo-title" mb={3}>
            Step 2: Copy Code
          </Text>
          <CodeHighlighter
            language="jsx"
            codeString={jsxCode}
            showLineNumbers={true}
            maxLines={20}
            snippetId="export-jsx"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default function Controls({
  background,
  backgroundId,
  props,
  onPropChange,
  onBackgroundChange,
  onReset,
  toolSelector,
  isMobile = false,
  disabled = false
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setShareStatus('Copied!');
    setTimeout(() => setShareStatus(null), 2000);
  }, []);

  return (
    <Flex
      direction="column"
      h="100%"
      overflow="hidden"
      opacity={disabled ? 0.5 : 1}
      pointerEvents={disabled ? 'none' : 'auto'}
      transition="opacity 0.2s"
    >
      {toolSelector && !isMobile && (
        <Box mb={4} flexShrink={0}>
          {toolSelector}
        </Box>
      )}

      <Box
        flex={1}
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <Text
          fontSize="11px"
          color="var(--text-muted)"
          fontWeight={600}
          mb={3}
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          Background
        </Text>
        <BackgroundSelector selectedId={backgroundId} onSelect={onBackgroundChange} />

        <Box h="1px" bg="var(--border-primary)" mb={4} />

        <Flex direction="column" gap={2}>
          {background?.props?.length > 0 ? (
            background.props.map(prop => (
              <DynamicControl key={prop.name} prop={prop} value={props[prop.name]} onChange={onPropChange} />
            ))
          ) : (
            <Text fontSize="13px" color="var(--text-muted)" textAlign="center" py={4}>
              No customizable props for this background
            </Text>
          )}
        </Flex>
      </Box>

      <Box pt={4} borderTop="1px solid var(--border-primary)" mt={4} flexShrink={0}>
        <Flex gap={2} mb={2}>
          <Flex
            as="button"
            onClick={onReset}
            align="center"
            gap={1.5}
            px={3}
            py={2}
            bg="var(--bg-elevated)"
            border="1px solid var(--border-primary)"
            borderRadius="var(--radius-sm)"
            cursor="pointer"
            flex={1}
            justify="center"
            _hover={{ bg: 'var(--bg-card)' }}
            transition="background 0.2s"
          >
            <Icon as={RotateCcw} boxSize={3.5} color="var(--text-muted)" />
            <Text fontSize="12px" color="var(--text-muted)" fontWeight={500}>
              Reset
            </Text>
          </Flex>
          <Flex
            as="button"
            onClick={handleShare}
            align="center"
            gap={1.5}
            px={3}
            py={2}
            bg="var(--bg-elevated)"
            border="1px solid var(--border-primary)"
            borderRadius="var(--radius-sm)"
            cursor="pointer"
            flex={1}
            justify="center"
            _hover={{ bg: 'var(--bg-card)' }}
            transition="background 0.2s"
          >
            <Icon as={Share2} boxSize={3.5} color="var(--text-muted)" />
            <Text fontSize="12px" color="var(--text-muted)" fontWeight={500}>
              {shareStatus || 'Share'}
            </Text>
          </Flex>
        </Flex>
        <Flex
          as={Link}
          to={getDocsPath(background)}
          target="_blank"
          align="center"
          gap={1.5}
          px={3}
          py={2}
          mb={2}
          bg="var(--bg-elevated)"
          border="1px solid var(--border-primary)"
          borderRadius="var(--radius-sm)"
          cursor="pointer"
          w="100%"
          justify="center"
          _hover={{ bg: 'var(--bg-card)' }}
          transition="background 0.2s"
          textDecoration="none"
        >
          <Icon as={ExternalLink} boxSize={3.5} color="var(--text-muted)" />
          <Text fontSize="12px" color="var(--text-muted)" fontWeight={500}>
            Read Full Docs
          </Text>
        </Flex>
        <Flex
          as="button"
          onClick={() => setExportOpen(true)}
          align="center"
          gap={1.5}
          px={3}
          py={2.5}
          bg="var(--color-primary)"
          borderRadius="var(--radius-sm)"
          cursor="pointer"
          w="100%"
          justify="center"
          _hover={{ bg: '#b96dfa' }}
          transition="background 0.2s"
        >
          <Icon as={Code2} boxSize={4} color="#fff" />
          <Text fontSize="13px" color="#fff" fontWeight={600}>
            Export Code
          </Text>
        </Flex>
      </Box>

      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} background={background} props={props} />
    </Flex>
  );
}
