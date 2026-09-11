/* eslint-env node */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VARIANTS = ['content', 'tailwind', 'ts-default', 'ts-tailwind'];
// These components forward their props to an implementation or merge a config.
const IMPLEMENTATIONS = { Antigravity: 'AntigravityInner', GradualBlur: 'DEFAULT_CONFIG' };

const walk = (node, visit) => {
  visit(node);
  ts.forEachChild(node, child => walk(child, visit));
};

function scalar(node, declarations, seen = new Set()) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const value = scalar(node.operand, declarations, seen);
    return typeof value === 'number' ? -value : undefined;
  }
  if (ts.isIdentifier(node) && !seen.has(node.text)) {
    return scalar(declarations.get(node.text), declarations, new Set([...seen, node.text]));
  }
  return undefined;
}

function parse(file) {
  const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  if (ast.parseDiagnostics.length) throw new Error(`Cannot parse ${file}: ${ast.parseDiagnostics[0].messageText}`);
  const declarations = new Map();
  for (const statement of ast.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) declarations.set(declaration.name.text, declaration.initializer);
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.set(statement.name.text, statement);
    }
  }
  return { ast, declarations };
}

function unwrap(node, declarations, seen = new Set()) {
  if (!node) return undefined;
  if (ts.isIdentifier(node) && !seen.has(node.text)) {
    return unwrap(declarations.get(node.text), declarations, new Set([...seen, node.text]));
  }
  if (ts.isCallExpression(node) && /^(React\.)?(memo|forwardRef)$/.test(node.expression.getText())) {
    return unwrap(node.arguments[0], declarations, seen);
  }
  return node;
}

export function readSourceDefaults(file, name) {
  const { declarations } = parse(file);
  const implementation = unwrap(declarations.get(IMPLEMENTATIONS[name] || name), declarations);
  if (!implementation) throw new Error(`Cannot find component ${name} in ${file}`);
  const defaults = new Map();
  const record = (key, node) => {
    const value = scalar(node, declarations);
    if (value !== undefined) defaults.set(key, value);
  };
  if (ts.isObjectLiteralExpression(implementation)) {
    for (const prop of implementation.properties) {
      if (ts.isPropertyAssignment(prop)) record(prop.name.getText(), prop.initializer);
    }
    return defaults;
  }
  const parameter = implementation.parameters?.[0];
  let binding = parameter?.name;
  if (binding && ts.isIdentifier(binding)) {
    const propsName = binding.text;
    binding = undefined;
    // Only a direct destructure from this component's props is a public default.
    for (const statement of implementation.body?.statements || []) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isObjectBindingPattern(declaration.name) && declaration.initializer?.getText() === propsName) {
          binding = declaration.name;
        }
      }
    }
  }
  if (!binding || !ts.isObjectBindingPattern(binding)) throw new Error(`Cannot read prop defaults in ${file}`);
  for (const prop of binding.elements) record((prop.propertyName || prop.name).getText(), prop.initializer);
  return defaults;
}

export function readPropTable(file) {
  const { ast, declarations } = parse(file);
  let initializer;
  walk(ast, node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'propData') initializer = node.initializer;
  });
  if (!initializer) return null;
  if (ts.isCallExpression(initializer) && initializer.expression.getText(ast) === 'useMemo') {
    initializer = initializer.arguments[0]?.body;
    if (initializer && ts.isBlock(initializer)) {
      initializer = initializer.statements.find(ts.isReturnStatement)?.expression;
    }
  }
  if (initializer && ts.isParenthesizedExpression(initializer)) initializer = initializer.expression;
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) throw new Error(`Cannot read propData in ${file}`);
  return initializer.elements.flatMap(row => {
    if (!ts.isObjectLiteralExpression(row)) return [];
    const fields = new Map(
      row.properties.filter(ts.isPropertyAssignment).map(prop => [prop.name.getText(), prop.initializer])
    );
    const name = scalar(fields.get('name'), declarations);
    const node = fields.get('default');
    const value = scalar(node, declarations);
    return typeof name === 'string' && value !== undefined ? [{ name, value, node, ast }] : [];
  });
}

function normalize(value) {
  if (typeof value !== 'string') return value;
  if (/^(['"`])[\s\S]*\1$/.test(value)) value = value.slice(1, -1);
  // CSS's short/long hex spellings and numeric text in tables are equivalent.
  if (/^#[a-f\d]{3}$/i.test(value)) value = '#' + [...value.slice(1)].map(char => char + char).join('');
  if (/^#[a-f\d]{6}(?:[a-f\d]{2})?$/i.test(value)) value = value.toLowerCase();
  return value;
}

export function auditPropDocs(root = ROOT) {
  const errors = [];
  let components = 0;
  let comparedDefaults = 0;
  let descriptiveDefaults = 0;
  let tables = 0;
  for (const category of fs.readdirSync(path.join(root, 'src/content')).sort()) {
    for (const name of fs.readdirSync(path.join(root, 'src/content', category)).sort()) {
      const files = VARIANTS.map(variant =>
        path.join(root, 'src', variant, category, name, `${name}.${variant.startsWith('ts-') ? 'tsx' : 'jsx'}`)
      );
      if (!fs.existsSync(files[0])) continue;
      const variants = files.map(file => readSourceDefaults(file, name));
      components++;
      const keys = new Set(variants.flatMap(defaults => [...defaults.keys()]));
      for (const key of keys) {
        const values = variants.map(defaults => defaults.get(key));
        // Required props and dynamic/object defaults cannot be compared as scalars.
        if (values.some(value => value === undefined)) continue;
        if (!values.every(value => normalize(value) === normalize(values[0]))) {
          errors.push({ kind: 'variants', component: name, prop: key, values, files });
        }
      }
      const demo = path.join(root, 'src/demo', category, `${name}Demo.jsx`);
      if (!fs.existsSync(demo)) continue;
      const table = readPropTable(demo);
      if (!table) continue;
      tables++;
      for (const row of table) {
        const actual = variants[0].get(row.name);
        if (actual === undefined) continue;
        let documented = normalize(row.value);
        // These are descriptions/placeholders, not claims about literal defaults.
        if (
          typeof documented === 'string' &&
          (/^(?:-|—|undefined|null|CDN URL|picsum photo)$/.test(documented) ||
            documented.includes('...') ||
            /^URL to\b/.test(documented))
        ) {
          descriptiveDefaults++;
          continue;
        }
        if (typeof actual === 'number' && documented !== '' && Number.isFinite(Number(documented)))
          documented = Number(documented);
        if (typeof actual === 'boolean' && ['true', 'false'].includes(documented)) documented = documented === 'true';
        comparedDefaults++;
        if (documented !== normalize(actual)) {
          errors.push({
            kind: 'docs',
            component: name,
            prop: row.name,
            actual,
            documented: row.value,
            file: demo,
            start: row.node.getStart(row.ast),
            end: row.node.end
          });
        }
      }
    }
  }
  return { components, tables, comparedDefaults, descriptiveDefaults, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditPropDocs();
  for (const error of result.errors) {
    if (error.kind === 'variants') {
      console.error(
        `${error.component}.${error.prop}: variants disagree (${VARIANTS.map((variant, index) => `${variant}=${JSON.stringify(error.values[index])}`).join(', ')})`
      );
    } else {
      console.error(
        `${error.component}.${error.prop}: documented ${JSON.stringify(error.documented)}, source ${JSON.stringify(error.actual)}`
      );
    }
  }
  console.log(
    `Checked ${result.comparedDefaults} scalar prop-table defaults in ${result.tables} tables and variant defaults for ${result.components} components (${result.descriptiveDefaults} descriptive defaults excluded).`
  );
  if (result.errors.length) process.exitCode = 1;
}
