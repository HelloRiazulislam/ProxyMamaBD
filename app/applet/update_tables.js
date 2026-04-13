const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/pages');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace overflow-x-auto
  if (content.includes('className="overflow-x-auto')) {
    content = content.replace(/className="overflow-x-auto/g, 'className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)]');
    changed = true;
  }

  // Replace thead
  if (content.includes('<thead className="')) {
    // Only add sticky top-0 z-10 if it's not already there
    content = content.replace(/<thead className="([^"]*)"/g, (match, p1) => {
      if (!p1.includes('sticky')) {
        return `<thead className="sticky top-0 z-10 ${p1}"`;
      }
      return match;
    });
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
