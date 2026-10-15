export function getActiveCode(codeObject, lang, style) {
  if (!codeObject) return { source: '', label: '', css: '' };

  if (lang === 'TS' && style === 'TW' && codeObject.tsTailwind)
    return { source: codeObject.tsTailwind, label: 'TypeScript + Tailwind', css: '' };
  if (lang === 'TS' && codeObject.tsCode)
    return { source: codeObject.tsCode, label: 'TypeScript + CSS', css: codeObject.css || '' };
  if (style === 'TW' && codeObject.tailwind)
    return { source: codeObject.tailwind, label: 'JavaScript + Tailwind', css: '' };

  return { source: codeObject.code || '', label: 'JavaScript + CSS', css: codeObject.css || '' };
}

export function buildPrompt(componentName, codeObject, propData, lang, style) {
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
