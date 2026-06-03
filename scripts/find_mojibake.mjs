import fs from 'fs';
import path from 'path';

const searchDirs = ['src', 'supabase/functions', 'scripts'];
const badPatterns = [
  'Ã', 'Â', 'â€', 'â€”', 'â€“', 'â”', 'â–', ''
];

function searchDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = badPatterns.filter(p => content.includes(p));
      if (matches.length > 0) {
        console.log(`Found in ${fullPath}: ${matches.join(', ')}`);
      }
    }
  }
}

searchDirs.forEach(d => searchDir(d));
