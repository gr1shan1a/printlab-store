// Build gate: application SQL must use ORM calls or inline tagged templates.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
let failed = false;
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.tsx?$/.test(file)) continue;
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      const name = ts.isIdentifier(node) ? node.text : ts.isStringLiteral(node) ? node.text : '';
      const unsafe = ['$queryRawUnsafe', '$executeRawUnsafe', '$runCommandRaw'].includes(name);
      const rawFragment = ts.isPropertyAccessExpression(node) && node.expression.getText(source) === 'Prisma' && node.name.text === 'raw';
      const rawCall = ts.isCallExpression(node) && /(?:\$queryRaw|\$executeRaw)$/.test(node.expression.getText(source));
      if (unsafe || rawFragment || rawCall) {
        const pos = source.getLineAndCharacterOfPosition(node.getStart(source));
        console.error(`${file}:${pos.line + 1}: unsafe SQL API is forbidden; use ORM or an inline parameterized tagged template`);
        failed = true;
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
scan(path.join(__dirname, '..', 'src'));
if (failed) process.exit(1);
console.log('SQL safety check passed');
