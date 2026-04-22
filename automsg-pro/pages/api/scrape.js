import puppeteer from 'puppeteer';
import { checkRateLimit, getRateLimitInfo } from '../../lib/rateLimit.js';

const SCRAPE_LIMIT = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  
  if (!checkRateLimit(clientIp)) {
    const info = getRateLimitInfo(clientIp);
    res.setHeader('X-RateLimit-Limit', info.limit);
    res.setHeader('X-RateLimit-Remaining', info.remaining);
    res.setHeader('X-RateLimit-Reset', info.resetIn);
    return res.status(429).json({ error: 'Muitas requisições. Aguarde alguns segundos.' });
  }

  let { query, offset = 0, limit = 15 } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query é obrigatória' });
  }

  query = query.trim();
  offset = Math.max(0, parseInt(offset, 10) || 0);
  limit = Math.min(SCRAPE_LIMIT, Math.max(1, parseInt(limit, 10) || 15));

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const scrollSelector = 'div[role="feed"]';
    try {
      await page.waitForSelector(scrollSelector, { timeout: 10000 });
    } catch (e) {
      await browser.close();
      return res.status(200).json({ results: [], message: 'Nenhum resultado encontrado' });
    }

    let currentCount = 0;
    let attempts = 0;
    while (currentCount < offset + limit && attempts < 15) {
      currentCount = (await page.$$('a.hfpxzc')).length;
      if (currentCount < offset + limit) {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollTop += 2000;
        }, scrollSelector);
        await new Promise(r => setTimeout(r, 1200));
      }
      attempts++;
    }

    const resultLinks = await page.$$('a.hfpxzc');
    const items = [];
    const targets = resultLinks.slice(offset, offset + limit);

    for (let i = 0; i < targets.length; i++) {
        try {
            await targets[i].click();
            await page.waitForSelector('h1.DUwDvf', { timeout: 5000 });
            await new Promise(r => setTimeout(r, 600));

            const details = await page.evaluate(() => {
                const name = document.querySelector('h1.DUwDvf')?.innerText || "";
                
                const phoneBtn = document.querySelector('button[aria-label^="Telefone:"]') || 
                                document.querySelector('button[aria-label^="Phone:"]');
                
                const websiteLink = document.querySelector('a[aria-label^="Website:"]') || 
                                   document.querySelector('a[aria-label^="Website:"]');
                
                let phone = "sem telefone";
                if (phoneBtn) {
                    let rawPhone = phoneBtn.getAttribute('aria-label')
                        .replace('Telefone:', '')
                        .replace('Phone:', '')
                        .replace(/\D/g, '')
                        .trim();
                    
                    if (rawPhone.startsWith('55') && rawPhone.length > 10) {
                        rawPhone = rawPhone.substring(2);
                    }
                    phone = rawPhone;
                }

                let instagram = "não encontrado";
                if (websiteLink) {
                    const href = websiteLink.getAttribute('href') || "";
                    if (href.includes('instagram.com')) {
                        try {
                            const url = new URL(href);
                            const parts = url.pathname.split('/').filter(x => x && x !== 'p' && x !== 'explore');
                            instagram = "@" + parts[0];
                        } catch (e) {
                            instagram = "@encontrado";
                        }
                    }
                }

                return { nome: name, telefone: phone, instagram: instagram };
            });

            items.push(details);
        } catch (err) {
            console.error(`Erro ao processar item ${i}:`, err.message);
        }
    }

    await browser.close();
    return res.status(200).json({ results: items });

  } catch (error) {
    console.error('Scrape Error:', error);
    if (browser) await browser.close();
    return res.status(500).json({ error: 'Erro ao buscar dados. Tente novamente.' });
  }
}
