import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, 'from \'$1.js\'');
      content = content.replace(/import\s+['"](\.[^'"]+)['"]/g, 'import \'$1.js\'');
      fs.writeFileSync(fullPath, content);
    }
  });
}

walk(path.join(__dirname, 'src'));
console.log('Imports fixed.');