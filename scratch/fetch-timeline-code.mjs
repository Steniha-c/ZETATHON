import fs from 'node:fs';

async function main() {
  const res = await fetch('https://yodha.aidajecc.in/_next/static/chunks/03wlpv82s4-hg.js');
  const text = await res.text();
  const idx = text.indexOf('id:"timeline"');
  console.log(text.slice(idx - 100, idx + 4500));
}

main();
