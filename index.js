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
    $('table.price_summary tr').each((i, row) => {
      const label = $(row).find('td').first().text().trim();
      const value = $(row).find('td').eq(1).text().trim().replace('$', '');
      if (label && value) {
        prices[label] = parseFloat(value);
      }
    });

    res.json(prices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
