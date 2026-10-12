const fetchPrizes = async () => {
  const res = await fetch('https://yodha.aidajecc.in/');
  const html = await res.text();
  const start = html.indexOf('id="prizes"');
  const end = html.indexOf('</section>', start);
  console.log(html.substring(start - 20, end + 10));
};
fetchPrizes();
