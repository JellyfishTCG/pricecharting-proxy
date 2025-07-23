const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/pricecharting', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const prices = {};

    // ✅ 1. Get main prices (static mapping)
    const gradeMap = {
      "used_price": "Ungraded",
      "complete_price": "Grade 7",
      "new_price": "Grade 8",
      "graded_price": "Grade 9",
      "box_only_price": "Grade 9.5",
      "manual_only_price": "Grade 10"
    };

    for (const [id, label] of Object.entries(gradeMap)) {
      const value = $(`#${id} .price.js-price`).text().trim().replace('$', '').replace(',', '');
      if (value) {
        prices[label] = parseFloat(value);
      }
    }

    // ✅ 2. Get PSA/BGS/CGC slabs (optional)
    const slabs = ["PSA_10", "PSA_9", "CGC_10", "CGC_9_5", "BGS_10", "BGS_9_5"];
    slabs.forEach(sl => {
      const raw = $(`#graded_price_${sl} .price.js-price`).text().trim().replace('$', '').replace(',', '');
      if (raw) {
        const label = sl.replace('_', ' ').replace('_', '.');
        prices[label] = parseFloat(raw);
      }
    });

    // ✅ 3. Calculate average from completed auctions (Ungraded)
    const ungradedPrices = [];
    $('.completed-auctions-used table tr').each((_, row) => {
      const priceText = $(row).find('.js-price').text().trim();
      if (priceText.startsWith('$')) {
        const num = parseFloat(priceText.replace('$', '').replace(',', ''));
        if (!isNaN(num)) ungradedPrices.push(num);
      }
    });

    if (ungradedPrices.length > 0) {
      const avg = (ungradedPrices.reduce((a, b) => a + b, 0) / ungradedPrices.length).toFixed(2);
      prices["Ungraded Avg Sold"] = parseFloat(avg);
    }

    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
