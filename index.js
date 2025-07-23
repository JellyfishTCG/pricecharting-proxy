const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/pricecharting', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const prices = {};
    $('table.price_summary tr').each((_, row) => {
      const label = $(row).find('td').eq(0).text().trim();
      const priceText = $(row).find('td').eq(1).text().trim();
      if (label && priceText && priceText.startsWith('$')) {
        prices[label] = parseFloat(priceText.replace('$', '').replace(',', ''));
      }
    });

    res.json(prices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
