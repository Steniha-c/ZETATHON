import fs from 'node:fs';

const chunks = [
  '310vm2bl3xxpt.js',
  '0jw4jivscv1ye.js',
  '0led3xbfej5hz.js',
  '0kcrukimdjavt.js',
  'turbopack-1_xxmmyya6qmo.js',
  '0036hhv2221vg.js',
  '1pcjz9p9tu6gz.js',
  '03046nyf1m_am.js',
  '03wlpv82s4-hg.js'
];

async function main() {
  for (const chunk of chunks) {
    try {
      const res = await fetch(`https://yodha.aidajecc.in/_next/static/chunks/${chunk}`);
      if (!res.ok) continue;
      const text = await res.text();
      if (text.includes('Early Bird') || text.includes('Selection Process')) {
        console.log(`FOUND IN ${chunk}! Length: ${text.length}`);
        
        // Find phase definitions
        const idx = text.indexOf('Early Bird');
        console.log(text.slice(Math.max(0, idx - 500), Math.min(text.length, idx + 2500)));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

main();
