const cheerio = require('cheerio');
const { matchScrapedToProspects, loadProspects, saveProspects, normalizePosition } = require('./name-matcher');

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
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.text();
    } catch (err) {
      console.error(`  Attempt ${i+1} failed: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function scrapeNFLMDD() {
  const url = 'https://www.nflmockdraftdatabase.com/big-boards/2026/consensus-big-board-2026';
  console.log('[NFLMDD] Fetching consensus big board...');
  const html = await fetchWithRetry(url);
  const prospects = [];

  const match = html.match(/data-react-props="(.*?)"/s);
  if (!match) {
    console.log('[NFLMDD] Could not find React props JSON');
    return prospects;
  }

  try {
    const decoded = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
    const data = JSON.parse(decoded);

    if (data.mock?.selections) {
      const seen = new Set();
      for (const sel of data.mock.selections) {
        const player = sel.player;
        if (!player?.name || seen.has(player.name)) continue;
        seen.add(player.name);
        prospects.push({
          rank: sel.pick,
          name: player.name,
          position: normalizePosition(player.position) || player.position,
          school: player.college?.name || null,
          source: 'nflmdd'
        });
      }
    }
  } catch (err) {
    console.error('[NFLMDD] JSON parse error:', err.message);
  }

  console.log(`[NFLMDD] Parsed ${prospects.length} prospects from React JSON`);
  return prospects;
}

async function scrapeCBSSports() {
  const url = 'https://www.cbssports.com/nfl/draft/prospect-rankings/';
  console.log('[CBS] Fetching prospect rankings...');
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);
  const prospects = [];

  $('table tr').each((i, row) => {
    const cells = [];
    $(row).find('td').each((j, td) => cells.push($(td).text().trim()));
    if (cells.length < 5) return;

    const rank = parseInt(cells[0]);
    if (isNaN(rank) || rank < 1) return;

    const nameEl = $(row).find('a[href*="/college-football/players/"]');
    const name = nameEl.length ? nameEl.first().text().trim() : cells[1].split('\n')[0].trim();
    if (!name || name.length < 3) return;

    const schoolEl = $(row).find('a[href*="/college-football/teams/"]');
    const school = schoolEl.length ? schoolEl.first().text().trim() : (cells[2] || '').trim();

    const posCell = cells[4] || cells[3] || '';
    const posMatch = posCell.match(/^(QB|RB|WR|TE|OT|IOL|OG|EDGE|DL|DT|LB|CB|S|K|P|LS|DE|IDL|NT|ILB|OLB)/i);
    const position = posMatch ? posMatch[1].toUpperCase() : null;

    if (name && position) {
      prospects.push({
        rank,
        name,
        position: normalizePosition(position),
        school: school || null,
        source: 'cbs'
      });
    }
  });

  console.log(`[CBS] Parsed ${prospects.length} prospects`);
  return prospects;
}

async function scrapeDraftTek() {
  const prospects = [];
  console.log('[DraftTek] Fetching big board (up to 500 prospects) with bio data...');

  for (let page = 1; page <= 5; page++) {
    try {
      const url = `https://www.drafttek.com/2026-NFL-Draft-Big-Board/Top-NFL-Draft-Prospects-2026-Page-${page}.asp`;
      const html = await fetchWithRetry(url);
      const $ = cheerio.load(html);

      $('table tr').each((i, row) => {
        const cells = [];
        $(row).find('td').each((j, td) => cells.push($(td).text().trim()));
        if (cells.length < 5) return;

        const rank = parseInt(cells[0]);
        if (isNaN(rank) || rank < 1) return;

        const name = (cells[2] || '').trim();
        if (!name || name.length < 3) return;

        const school = (cells[3] || '').trim();
        const posRaw = (cells[4] || '').trim();
        const posMatch = posRaw.match(/^(QB|RB|WR|TE|OT|OG|OC|IOL|EDGE|DL[135]T|DL|DT|LB|ILB|OLB|CB|CBN|S|K|P|LS|DE|IDL|NT|EDGE|FS|SS)/i);
        let position = posMatch ? posMatch[1].toUpperCase() : null;

        if (position) {
          position = position.replace(/DL[135]T/i, 'DT').replace('CBN', 'CB').replace('OC', 'IOL');
          position = normalizePosition(position);
        }

        let height_in = null;
        let weight_lbs = null;
        let class_year = null;

        const htRaw = (cells[5] || '').trim();
        const htMatch = htRaw.match(/(\d+)[''′](\d+)/);
        if (htMatch) {
          height_in = parseInt(htMatch[1]) * 12 + parseInt(htMatch[2]);
        }

        const wtRaw = (cells[6] || '').trim();
        const wtParsed = parseInt(wtRaw);
        if (!isNaN(wtParsed) && wtParsed > 100 && wtParsed < 400) {
          weight_lbs = wtParsed;
        }

        const clsRaw = (cells[7] || '').trim();
        if (clsRaw) class_year = clsRaw;

        if (name && position) {
          const entry = {
            rank,
            name,
            position,
            school: school || null,
            source: 'drafttek'
          };
          if (height_in) entry.height_in = height_in;
          if (weight_lbs) entry.weight_lbs = weight_lbs;
          if (class_year) entry.class_year = class_year;
          prospects.push(entry);
        }
      });

      if (page < 5) await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[DraftTek] Page ${page} error:`, err.message);
    }
  }

  console.log(`[DraftTek] Parsed ${prospects.length} prospects (with bio data)`);
  return prospects;
}

async function scrapeJeremiah() {
  const url = 'https://www.nfl.com/news/daniel-jeremiah-s-top-50-2026-nfl-draft-prospect-rankings-1-0';
  console.log('[Jeremiah] Fetching Daniel Jeremiah Top 50...');
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);
  const prospects = [];

  const prospectLinks = [];
  $('a[href*="/prospects/"]').each((i, el) => {
    const n = $(el).text().trim();
    if (n.length > 2 && !prospectLinks.includes(n)) prospectLinks.push(n);
  });

  const bodyText = ($('body').text()).replace(/\s+/g, ' ');
  const seenRanks = new Set();

  for (const linkName of prospectLinks) {
    const escapedName = linkName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const entryPattern = new RegExp(
      'Rank\\s+(\\d+)\\s+' + escapedName + '\\s+([\\w .()&-]+?)\\s*·\\s*(QB|RB|WR|TE|OT|OG|IOL|Edge|EDGE|DL|DT|LB|CB|S|K|P|LS|DE|IDL|NT|ILB|OLB)\\s*·\\s*(?:Senior|Junior|Sophomore)(?:\\s*\\(RS\\))?\\s+(.*?)(?=\\s*Rank\\s+\\d+|Related Links|$)',
      'i'
    );

    const entryMatch = bodyText.match(entryPattern);
    if (!entryMatch) continue;

    const rank = parseInt(entryMatch[1]);
    if (isNaN(rank) || rank < 1 || seenRanks.has(rank)) continue;
    seenRanks.add(rank);

    const name = linkName;
    const school = entryMatch[2].trim();
    let position = entryMatch[3].trim().toUpperCase();
    position = normalizePosition(position);
    let report = (entryMatch[4] || '').replace(/\s+/g, ' ').trim();

    let comparison = null;
    const compMatch = report.match(/remind[s]? me (?:a lot )?of\s+(.+?)(?:\.|$)/i) ||
                      report.match(/similar to\s+(.+?)(?:\.|$)/i) ||
                      report.match(/comparisons? to\s+(.+?)(?:\.|,|$)/i) ||
                      report.match(/draw.+comparisons? to\s+(.+?)(?:\.|,|$)/i);
    if (compMatch) comparison = compMatch[1].trim();

    if (name && position) {
      prospects.push({
        rank,
        name,
        position,
        school,
        report: report.length > 50 ? report : null,
        comparison,
        source: 'jeremiah'
      });
    }
  }

  console.log(`[Jeremiah] Parsed ${prospects.length} prospects with scouting reports`);
  return prospects;
}

async function scrapeNFLDraftBuzz() {
  const prospects = [];
  console.log('[DraftBuzz] Fetching rankings with scouting summaries...');

  for (let page = 1; page <= 8; page++) {
    try {
      const url = `https://www.nfldraftbuzz.com/positions/ALL/${page}/2026`;
      const html = await fetchWithRetry(url);
      const $ = cheerio.load(html);

      $('table tr').each((i, row) => {
        const cells = [];
        $(row).find('td').each((j, td) => cells.push($(td)));
        if (cells.length < 5) return;

        const rankText = cells[0].text().trim();
        const rank = parseInt(rankText);
        if (isNaN(rank) || rank < 1) return;

        const nameCell = cells[1];
        const h4 = nameCell.find('h4');
        let name = '';
        if (h4.length) {
          name = h4.text().trim().replace(/\s+/g, ' ');
          const posPrefix = name.match(/^(?:QB|RB|WR|TE|OT|OG|IOL|EDGE|DE|ED|DL|DT|LB|CB|S|K|P|LS|ILB|OLB|NT|IDL|LB\/ED|DE\/ED)\s+/i);
          if (posPrefix) name = name.slice(posPrefix[0].length).trim();
        }

        const posText = cells[2] ? cells[2].text().trim().split(/\s/)[0] : '';
        let position = posText.replace('/ED', '').replace('ED', 'EDGE').toUpperCase();
        position = normalizePosition(position);

        let rating = null;
        for (const c of cells) {
          const t = c.text().trim();
          if (/^\d{2}\.\d$/.test(t)) { rating = parseFloat(t); break; }
        }

        const summary = cells[cells.length - 1] ? cells[cells.length - 1].text().trim() : '';

        if (name && name.length > 2 && position) {
          prospects.push({
            rank,
            name,
            position,
            school: null,
            rating,
            summary: summary.length > 30 ? summary : null,
            source: 'nfldraftbuzz'
          });
        }
      });

      if (page < 8) await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[DraftBuzz] Page ${page} error:`, err.message);
    }
  }

  console.log(`[DraftBuzz] Parsed ${prospects.length} prospects`);
  return prospects;
}

async function scrapeTankathon() {
  const url = 'https://www.tankathon.com/nfl/big_board';
  console.log('[Tankathon] Fetching big board...');
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);
  const prospects = [];

  $('a[href*="/nfl/players/"]').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let name = null, position = null, school = null;

    for (const line of lines) {
      const posSchoolMatch = line.match(/^(QB|RB|WR|TE|OT|IOL|OG|EDGE|DL|DT|LB|CB|S|K|P|LS|DE|IDL|NT|ILB|OLB)\s*\|\s*(.+)/i);
      if (posSchoolMatch) {
        position = posSchoolMatch[1].toUpperCase();
        school = posSchoolMatch[2].trim();
      } else if (!name && line.length > 2 && !/^\d/.test(line) && !/TACKLES|SACKS|PASS DEF|INT|FF|GAMES|Pass Yds|Rush Yds|REC|TD|AVG|PCT|Rating/.test(line)) {
        name = line;
      }
    }

    if (!name || !position) return;
    if (prospects.some(p => p.name === name)) return;

    prospects.push({
      rank: prospects.length + 1,
      name,
      position: normalizePosition(position),
      school,
      source: 'tankathon'
    });
  });

  console.log(`[Tankathon] Parsed ${prospects.length} prospects`);
  return prospects;
}

async function scrapeFantasyPros() {
  const url = 'https://www.fantasypros.com/2026/02/2026-nfl-draft-big-board-prospect-rankings/';
  console.log('[FantasyPros] Fetching expert consensus board...');
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);
  const prospects = [];

  $('table').each((tableIdx, table) => {
    const $table = $(table);
    const $rows = $table.find('tr');
    if ($rows.length < 5) return;

    const headerText = $rows.first().text().toUpperCase();
    if (!headerText.includes('RK') && !headerText.includes('RANK') && !headerText.includes('PLAYER')) return;

    $rows.each((rowIdx, row) => {
      if (rowIdx === 0) return;
      const cells = [];
      $(row).find('td, th').each((i, td) => cells.push($(td).text().trim()));
      if (cells.length < 5) return;

      const rank = parseInt(cells[0]);
      if (isNaN(rank) || rank < 1) return;

      const playerCell = cells[1] || '';
      const nameMatch = playerCell.match(/^(.+?)\s*\((.+?)\)\s*$/);
      let name = nameMatch ? nameMatch[1].trim() : playerCell.trim();
      let school = nameMatch ? nameMatch[2].trim() : null;

      const posCell = cells[2] || '';
      const posMatch = posCell.match(/^([A-Z]+)/i);
      const position = posMatch ? normalizePosition(posMatch[1].toUpperCase()) : null;

      const best = parseInt(cells[3]) || null;
      const worst = parseInt(cells[4]) || null;
      const avg = parseFloat(cells[5]) || null;
      const stddev = parseFloat(cells[6]) || null;

      if (name && name.length > 2 && position) {
        prospects.push({ rank, name, position, school, best, worst, avg, stddev, source: 'fantasypros' });
      }
    });
  });

  console.log(`[FantasyPros] Parsed ${prospects.length} prospects`);
  return prospects;
}

function recalcConsensus(rankings) {
  let values = Object.values(rankings).filter(v => v != null && typeof v === 'number');
  if (values.length === 0) return null;

  values.sort((a, b) => a - b);

  if (values.length >= 3) {
    const mid = Math.floor(values.length / 2);
    const rawMedian = values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid];

    const maxAllowed = Math.max(rawMedian * 4, rawMedian + 150);
    const filtered = values.filter(v => v <= maxAllowed);
    if (filtered.length >= 2) values = filtered;
  }

  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 === 0
    ? Math.round((values[mid - 1] + values[mid]) / 2)
    : values[mid];

  return {
    rank: median,
    range_low: Math.min(...values),
    range_high: Math.max(...values),
    sources_count: values.length
  };
}

function getProjectionLabel(rank) {
  if (rank <= 5) return 'Top 5';
  if (rank <= 10) return 'Top 10';
  if (rank <= 20) return 'Mid 1st';
  if (rank <= 32) return 'Late 1st';
  if (rank <= 64) return '2nd Round';
  if (rank <= 100) return '3rd Round';
  if (rank <= 135) return 'Day 2';
  if (rank <= 180) return 'Mid Round';
  if (rank <= 257) return 'Late Round';
  return 'UDFA';
}

function getRound(rank) {
  if (rank <= 32) return 1;
  if (rank <= 64) return 2;
  if (rank <= 100) return 3;
  if (rank <= 135) return 4;
  if (rank <= 180) return 5;
  if (rank <= 220) return 6;
  if (rank <= 257) return 7;
  return 8;
}

async function runRankingScrape(progressCallback) {
  const data = loadProspects();
  const results = {
    sources: {},
    updatedProspects: 0,
    newProspectsAdded: 0,
    errors: [],
    unmatchedNames: [],
    scoutingReportsAdded: 0
  };

  const scrapers = [
    { name: 'nflmdd',       fn: scrapeNFLMDD,       label: 'NFLMDD Consensus' },
    { name: 'cbs',          fn: scrapeCBSSports,     label: 'CBS Sports' },
    { name: 'drafttek',     fn: scrapeDraftTek,      label: 'DraftTek' },
    { name: 'jeremiah',     fn: scrapeJeremiah,      label: 'Daniel Jeremiah (NFL.com)' },
    { name: 'nfldraftbuzz', fn: scrapeNFLDraftBuzz,  label: 'NFL Draft Buzz' },
    { name: 'tankathon',    fn: scrapeTankathon,     label: 'Tankathon' },
    { name: 'fantasypros',  fn: scrapeFantasyPros,   label: 'FantasyPros' },
  ];

  for (const scraper of scrapers) {
    results.sources[scraper.name] = { scraped: 0, matched: 0, unmatched: 0 };
    try {
      progressCallback?.({ stage: scraper.name, status: 'scraping', label: scraper.label });
      const scrapedProspects = await scraper.fn();
      results.sources[scraper.name].scraped = scrapedProspects.length;

      if (scrapedProspects.length === 0) {
        console.log(`[${scraper.name}] No prospects parsed - skipping match`);
        continue;
      }

      const matchResult = matchScrapedToProspects(scrapedProspects, data.prospects);
      results.sources[scraper.name].matched = matchResult.matched.length;
      results.sources[scraper.name].unmatched = matchResult.unmatched.length;

      for (const { scraped, prospect } of matchResult.matched) {
        if (!prospect.rankings) prospect.rankings = {};
        prospect.rankings[scraper.name] = scraped.rank;

        if (!prospect.source_raw) prospect.source_raw = {};
        const rawData = {
          rank: scraped.rank,
          position: scraped.position,
          scraped_date: new Date().toISOString().split('T')[0]
        };
        if (scraped.school) rawData.school = scraped.school;
        if (scraped.best) rawData.best = scraped.best;
        if (scraped.worst) rawData.worst = scraped.worst;
        if (scraped.avg) rawData.avg = scraped.avg;
        if (scraped.rating) rawData.rating = scraped.rating;
        prospect.source_raw[`${scraper.name}_ranking`] = rawData;

        if (scraped.height_in && (!prospect.bio?.height_in || prospect.bio.height_in === null)) {
          if (!prospect.bio) prospect.bio = {};
          prospect.bio.height_in = scraped.height_in;
        }
        if (scraped.weight_lbs && (!prospect.bio?.weight_lbs || prospect.bio.weight_lbs === null)) {
          if (!prospect.bio) prospect.bio = {};
          prospect.bio.weight_lbs = scraped.weight_lbs;
        }
        if (scraped.class_year) {
          if (!prospect.bio) prospect.bio = {};
          prospect.bio.class_year = scraped.class_year;
        }

        if (scraped.report && scraped.report.length > 50) {
          if (!prospect.source_raw.scouting_reports) prospect.source_raw.scouting_reports = {};
          prospect.source_raw.scouting_reports[scraper.name] = sanitizeScrapedText(scraped.report);
          results.scoutingReportsAdded++;
        }
        if (scraped.summary && scraped.summary.length > 30) {
          if (!prospect.source_raw.scouting_reports) prospect.source_raw.scouting_reports = {};
          prospect.source_raw.scouting_reports[scraper.name] = sanitizeScrapedText(scraped.summary);
          results.scoutingReportsAdded++;
        }
        if (scraped.comparison) {
          if (!prospect.source_raw.comparisons) prospect.source_raw.comparisons = {};
          prospect.source_raw.comparisons[scraper.name] = scraped.comparison;
        }
      }

      if (scraper.name === 'drafttek') {
        let added = 0;
        for (const u of matchResult.unmatched) {
          const s = u.scraped;
          if (!s.name || !s.position || !s.school) continue;

          const nameParts = s.name.trim().split(/\s+/);
          const first = nameParts[0] || '';
          const last = nameParts.slice(1).join(' ') || '';
          const schoolSlug = s.school.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
          const nameSlug = s.name.toLowerCase()
            .replace(/[''`]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          let id = nameSlug + '-2026';
          if (data.prospects.some(p => p.id === id)) {
            id = nameSlug + '-' + schoolSlug + '-2026';
          }
          if (data.prospects.some(p => p.id === id)) continue;

          const position = normalizePosition(s.position);
          const newProspect = {
            id,
            name: { display: s.name, first, last },
            position,
            position_source: 'drafttek',
            school: s.school,
            conference: null,
            class_year: s.class_year || null,
            bio: {
              height_in: s.height_in || null,
              weight_lbs: s.weight_lbs || null,
              birth_date: null,
              age_years: null,
              age_months: null,
              hometown: null,
              arm_length_in: null,
              hand_size_in: null,
              class_year: s.class_year || null
            },
            rankings: { drafttek: s.rank },
            position_rankings: {},
            consensus: { rank: s.rank, range_low: s.rank, range_high: s.rank, sources_count: 1 },
            grades: {},
            combine: {},
            skills: null,
            traits: null,
            archetype: null,
            projection: {
              round: getRound(s.rank),
              range_low: s.rank,
              range_high: s.rank,
              label: getProjectionLabel(s.rank)
            },
            scouting_report: null,
            comparison: null,
            source_raw: {
              drafttek_ranking: {
                rank: s.rank,
                position: s.position,
                scraped_date: new Date().toISOString().split('T')[0]
              }
            },
            developmentCertainty: null
          };

          data.prospects.push(newProspect);
          added++;
        }
        if (added > 0) {
          results.newProspectsAdded += added;
          console.log(`[drafttek] Added ${added} NEW prospects from extended big board`);
        }
      }

      for (const u of matchResult.unmatched) {
        if (u.scraped.rank <= 100) {
          results.unmatchedNames.push({
            name: u.scraped.name,
            source: scraper.name,
            rank: u.scraped.rank,
            bestCandidate: u.bestCandidate?.name?.display,
            confidence: Math.round((u.confidence || 0) * 100)
          });
        }
      }

      console.log(`[${scraper.name}] ${matchResult.matched.length} matched, ${matchResult.unmatched.length} unmatched`);
    } catch (err) {
      results.errors.push({ source: scraper.name, error: err.message });
      console.error(`[${scraper.name}] Error:`, err.message);
    }
  }

  progressCallback?.({ stage: 'consensus', status: 'recalculating' });
  let updated = 0;
  for (const prospect of data.prospects) {
    const oldRank = prospect.consensus?.rank;

    const allReports = prospect.source_raw?.scouting_reports || {};
    const reportTexts = Object.values(allReports).filter(r => r && r.length > 50);
    if (reportTexts.length > 0) {
      const longest = reportTexts.reduce((a, b) => a.length > b.length ? a : b, '');
      const cleanLongest = sanitizeScrapedText(longest);
      if (!prospect.scouting_report || prospect.scouting_report.length < cleanLongest.length) {
        prospect.scouting_report = cleanLongest;
      }
    }

    const newConsensus = recalcConsensus(prospect.rankings);
    if (newConsensus) {
      prospect.consensus = newConsensus;
      prospect.projection = {
        round: getRound(newConsensus.rank),
        range_low: newConsensus.range_low,
        range_high: newConsensus.range_high,
        label: getProjectionLabel(newConsensus.rank)
      };
      if (oldRank !== newConsensus.rank) updated++;
    }
  }
  results.updatedProspects = updated;

  data.meta.last_updated = new Date().toISOString().split('T')[0];
  const srcLabels = scrapers.map(s => s.label);
  for (const lbl of srcLabels) {
    if (!data.meta.sources.includes(lbl)) data.meta.sources.push(lbl);
  }

  saveProspects(data);
  progressCallback?.({ stage: 'complete', status: 'done', results });

  return results;
}

module.exports = {
  scrapeNFLMDD, scrapeCBSSports, scrapeDraftTek, scrapeJeremiah,
  scrapeNFLDraftBuzz, scrapeTankathon, scrapeFantasyPros,
  runRankingScrape, recalcConsensus
};
