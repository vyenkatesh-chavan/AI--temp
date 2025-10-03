require('dotenv').config();
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// -----------------------------
// Scrape live JobYaari jobs
// -----------------------------
async function scrapeJobs() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.jobyaari.com/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Update these selectors if JobYaari changes DOM
    const jobs = await page.evaluate(() => {
      const data = [];
      const jobItems = document.querySelectorAll('.job-item');
      jobItems.forEach(job => {
        data.push({
          title: job.querySelector('.job-title')?.innerText || '',
          organization: job.querySelector('.job-org')?.innerText || '',
          category: job.querySelector('.job-category')?.innerText || '',
          vacancies: job.querySelector('.job-vacancies')?.innerText || '',
          salary: job.querySelector('.job-salary')?.innerText || '',
          experience: job.querySelector('.job-experience')?.innerText || '',
          qualification: job.querySelector('.job-qualification')?.innerText || '',
          link: job.querySelector('a')?.href || ''
        });
      });
      return data;
    });

    return jobs;
  } catch (err) {
    console.error("Scraping error:", err.message);
    return []; // Return empty array instead of crashing
  } finally {
    await browser.close();
  }
}

// -----------------------------
// Endpoint: Get live jobs
// -----------------------------
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await scrapeJobs();
    res.json({ count: jobs.length, jobs, message: jobs.length ? "Jobs fetched" : "No jobs available" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to scrape jobs' });
  }
});

// -----------------------------
// Endpoint: Gemini API proxy
// -----------------------------
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate",
      { prompt, temperature: 0.7, maxOutputTokens: 512 },
      { headers: { Authorization: `Bearer ${GEMINI_API_KEY}` } }
    );

    const text = response.data?.candidates?.[0]?.content?.[0]?.text || "No response";
    res.json({ text });
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
