import fs from 'node:fs';

const filePath = 'C:/Users/steni/.gemini/antigravity-ide/brain/b65d695f-9416-4e98-9e10-14ede90177db/.system_generated/steps/2125/content.md';
const content = fs.readFileSync(filePath, 'utf8');

// Search for chunks containing Phase details
const scriptMatches = content.match(/"Early Bird[^"]*"/gi) || [];
console.log('Early Bird matches:', scriptMatches);

const jsMatches = content.match(/\{[^}]*Early Bird[^}]*\}/gi) || [];
console.log('Object matches:', jsMatches);

// Look around "Early bird registration" in raw HTML
let pos = 0;
while ((pos = content.indexOf('Early bird registration', pos)) !== -1) {
  console.log('FOUND AT POS', pos);
  console.log(content.slice(Math.max(0, pos - 200), Math.min(content.length, pos + 500)));
  pos += 24;
}
