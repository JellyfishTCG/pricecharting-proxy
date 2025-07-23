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

    const prices = {
      "Ungraded": parseFloat($('#used_price').text().replace('$', '').replace(',', '')) || null,
      "New": parseFloat($('#new_price').text().replace('$', '').replace(',', '')) || null,
    };

    // Grab PSA grades
    const grades = ["PSA_10", "PSA_9", "PSA_8", "BGS_10", "CGC_10"];
    grades.forEach(grade => {
      const id = `graded_price_${grade}`;
      const priceText = $(`#${id}`).text().trim();
      if (priceText && priceText.startsWith('$')) {
        prices[grade.replace('_', ' ')] = parseFloat(priceText.replace('$', '').replace(',', ''));
      }
    });

    res.json(prices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
