import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
export function checkSource(file, source) {
  const issues = [];
  const report = (index, rule) =>
    issues.push({ file, line: source.slice(0, index).split('\n').length, rule });
  const masked = source.replace(
    /\/\* design-exception-start:([^*]+)\*\/([\s\S]*?)\/\* design-exception-end \*\//g,
    (all, reason) => (reason.trim().length >= 6 ? all.replace(/[^\n]/g, ' ') : all),
  );
  if (masked.includes('design-exception-start'))
    report(masked.indexOf('design-exception-start'), '例外必须包含至少六个字符的原因和结束标记');
  for (const pattern of [
    /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b/gi,
    /\b(?:oklch|oklab|rgb|rgba|hsl|hsla)\s*\(/g,
    /\b(?:text|p[xytrbl]?|m[xytrbl]?|gap|rounded)-\[[^\]]+\]/g,
    /\b(?:bg|text|border|ring)-(?:slate|gray|zinc|neutral|stone|red|blue|green|indigo)-\d{2,3}\b/g,
    /\btransition(?:\s*:\s*all|-all)\b/g,
  ]) {
    for (const match of masked.matchAll(pattern))
      report(match.index, '使用语义变量或已有组件，禁止硬编码设计值与全属性过渡');
  }
  if (/\.[jt]sx?$/.test(file)) {
    const tree = ts.createSourceFile(file, masked, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const inspect = (node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const name = node.moduleSpecifier.text;
        if (
          name === 'radix-ui' ||
          name.startsWith('@radix-ui/') ||
          name.includes('/components/ui/') ||
          name.startsWith('./components/ui/') ||
          /@cqu-moe\/[^/]+\/src(?:\/|$)/.test(name)
        )
          report(node.getStart(tree), '消费项目必须从 @cqu-moe/ui 公开入口复用组件');
      }
      ts.forEachChild(node, inspect);
    };
    inspect(tree);
  }
  return issues;
}
async function scan(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await scan(file)));
    else if (/\.(?:tsx?|jsx?|css)$/.test(file))
      found.push(...checkSource(file, await readFile(file, 'utf8')));
  }
  return found;
}
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const directories = process.argv.slice(2);
  const issues = (
    await Promise.all(
      (directories.length ? directories : ['apps/preview/src', 'templates/app/src']).map(scan),
    )
  ).flat();
  for (const issue of issues) console.error(`${issue.file}:${issue.line}: ${issue.rule}`);
  if (issues.length) process.exitCode = 1;
  else console.log('Design rules passed. Manual layout and copy review still required.');
}
