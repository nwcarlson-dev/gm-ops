const cheerio = require('cheerio');
const { loadProspects, saveProspects, canonicalize, similarity } = require('./name-matcher');

function sanitizeScrapedText(text) {
  if (!text) return text;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/var\s+(?:googletag|_taboola|adsbygoogle)\s*=[\s\S]*?(?=\b[A-Z][a-z]|\.\s*[A-Z]|$)/g, '');
  text = text.replace(/googletag\.cmd\.push\([\s\S]*?\);/g, '');
  text = text.replace(/(?:window|document)\.[a-zA-Z_]+\s*(?:=|\()/g, '');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/\bjr\.?\b/gi, '')
    .replace(/\bsr\.?\b/gi, '')
    .replace(/\bii\b/gi, '')
    .replace(/\biii\b/gi, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function scrapeNFLMDDPlayerReport(playerName) {
  const slug = slugify(playerName);
  const url = `https://www.nflmockdraftdatabase.com/players/2026/${slug}`;

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    let report = '';
    const strengths = [];
    const weaknesses = [];

    $('h2, h3, h4').each((i, el) => {
      const heading = $(el).text().trim().toLowerCase();
      if (heading.includes('strength') || heading.includes('pro')) {
        const next = $(el).nextAll('p, ul, ol').first();
        if (next.length) {
          next.find('li').each((j, li) => strengths.push($(li).text().trim()));
          if (strengths.length === 0) strengths.push(next.text().trim());
        }
      }
      if (heading.includes('weakness') || heading.includes('con') || heading.includes('area')) {
        const next = $(el).nextAll('p, ul, ol').first();
        if (next.length) {
          next.find('li').each((j, li) => weaknesses.push($(li).text().trim()));
          if (weaknesses.length === 0) weaknesses.push(next.text().trim());
        }
      }
    });

    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 100 && (
        text.toLowerCase().includes('draft') ||
        text.toLowerCase().includes('prospect') ||
        text.toLowerCase().includes('player') ||
        text.toLowerCase().includes('skill') ||
        text.toLowerCase().includes('technique')
      )) {
        report += text + ' ';
      }
    });

    const comparison = $('*:contains("Comparison")').last().next().text().trim() ||
                       $('*:contains("comparison")').last().next().text().trim();

    return {
      url,
      report: report.trim(),
      strengths,
      weaknesses,
      comparison: comparison || null,
      source: 'nflmdd'
    };
  } catch (err) {
    return { url, error: err.message, source: 'nflmdd' };
  }
}

async function scrapeFantasyProsReports() {
  const url = 'https://www.fantasypros.com/nfl-draft-scouting-reports/';
  console.log('[FantasyPros] Fetching scouting reports index...');

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);
    const reports = [];

    $('a[href*="scouting-report"]').each((i, el) => {
      const href = $(el).attr('href');
      const name = $(el).text().trim();
      if (name && name.length > 3 && href) {
        reports.push({ name, url: href.startsWith('http') ? href : `https://www.fantasypros.com${href}` });
      }
    });

    console.log(`[FantasyPros] Found ${reports.length} scouting report links`);
    return reports;
  } catch (err) {
    console.error('[FantasyPros Reports] Error:', err.message);
    return [];
  }
}

async function scrapeFantasyProsReport(reportUrl) {
  try {
    const html = await fetchWithRetry(reportUrl);
    const $ = cheerio.load(html);

    let report = '';
    const $article = $('article, .entry-content, .post-content, main');
    $article.find('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) report += text + ' ';
    });

    const strengths = [];
    const weaknesses = [];

    $article.find('h2, h3, h4').each((i, el) => {
      const heading = $(el).text().trim().toLowerCase();
      if (heading.includes('strength') || heading.includes('pro')) {
        $(el).nextAll('ul, ol').first().find('li').each((j, li) => {
          strengths.push($(li).text().trim());
        });
      }
      if (heading.includes('weakness') || heading.includes('area') || heading.includes('concern')) {
        $(el).nextAll('ul, ol').first().find('li').each((j, li) => {
          weaknesses.push($(li).text().trim());
        });
      }
    });

    return {
      url: reportUrl,
      report: report.trim().slice(0, 3000),
      strengths,
      weaknesses,
      source: 'fantasypros'
    };
  } catch (err) {
    return { url: reportUrl, error: err.message, source: 'fantasypros' };
  }
}

async function runReportScrape(progressCallback, options = {}) {
  const data = loadProspects();
  const maxProspects = options.limit || 100;
  const results = {
    scraped: 0,
    updated: 0,
    errors: [],
    skipped: 0
  };

  const sortedProspects = [...data.prospects]
    .sort((a, b) => (a.consensus?.rank || 999) - (b.consensus?.rank || 999))
    .slice(0, maxProspects);

  progressCallback?.({ stage: 'reports', status: 'starting', total: sortedProspects.length });

  for (let i = 0; i < sortedProspects.length; i++) {
    const prospect = sortedProspects[i];
    const originalProspect = data.prospects.find(p => p.id === prospect.id);

    if (originalProspect.scouting_report && originalProspect.scouting_report.length > 200 && !options.overwrite) {
      results.skipped++;
      continue;
    }

    progressCallback?.({
      stage: 'reports',
      status: 'scraping',
      current: i + 1,
      total: sortedProspects.length,
      name: prospect.name.display
    });

    try {
      const report = await scrapeNFLMDDPlayerReport(prospect.name.display);

      if (report.report && report.report.length > 50) {
        const cleanReport = sanitizeScrapedText(report.report);
        if (!originalProspect.source_raw) originalProspect.source_raw = {};
        originalProspect.source_raw.nflmdd_report = {
          report: cleanReport.slice(0, 3000),
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          scraped_date: new Date().toISOString().split('T')[0]
        };

        if (!originalProspect.scouting_report || originalProspect.scouting_report.length < cleanReport.length) {
          originalProspect.scouting_report = cleanReport.slice(0, 2000);
        }

        if (report.comparison && !originalProspect.comparison) {
          originalProspect.comparison = report.comparison;
        }

        if (report.strengths.length > 0 && (!originalProspect.traits || originalProspect.traits.length === 0)) {
          originalProspect.traits = report.strengths.slice(0, 5);
        }

        results.updated++;
      }

      results.scraped++;

      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      results.errors.push({ name: prospect.name.display, error: err.message });
    }
  }

  data.meta.last_updated = new Date().toISOString().split('T')[0];
  saveProspects(data);

  progressCallback?.({ stage: 'reports', status: 'complete', results });
  return results;
}

module.exports = { scrapeNFLMDDPlayerReport, scrapeFantasyProsReports, scrapeFantasyProsReport, runReportScrape };
