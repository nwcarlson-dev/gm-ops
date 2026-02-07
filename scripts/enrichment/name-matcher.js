const fs = require('fs');
const path = require('path');

const PROSPECTS_PATH = path.join(__dirname, '../../data/prospects/current/2026_prospects.json');

function loadProspects() {
  return JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
}

function saveProspects(data) {
  fs.writeFileSync(PROSPECTS_PATH, JSON.stringify(data, null, 2));
}

function canonicalize(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/\bjr\.?\b/gi, '')
    .replace(/\bsr\.?\b/gi, '')
    .replace(/\bii\b/gi, '')
    .replace(/\biii\b/gi, '')
    .replace(/\biv\b/gi, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  const ca = canonicalize(a);
  const cb = canonicalize(b);
  if (ca === cb) return 1.0;

  const aParts = ca.split(' ');
  const bParts = cb.split(' ');
  const aLast = aParts[aParts.length - 1];
  const bLast = bParts[bParts.length - 1];
  const aFirst = aParts[0];
  const bFirst = bParts[0];

  if (aLast === bLast && aFirst === bFirst) return 0.95;
  if (aLast === bLast && aFirst[0] === bFirst[0]) return 0.8;
  if (aLast === bLast) return 0.7;

  const longer = ca.length > cb.length ? ca : cb;
  const editDist = levenshtein(ca, cb);
  return Math.max(0, 1 - editDist / longer.length);
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const POSITION_MAP = {
  'QB': 'QB', 'RB': 'RB', 'WR': 'WR', 'TE': 'TE',
  'OT': 'OT', 'IOL': 'OG', 'OG': 'OG', 'C': 'C',
  'EDGE': 'EDGE', 'DE': 'EDGE', 'ED': 'EDGE',
  'DL': 'IDL', 'DT': 'IDL', 'IDL': 'IDL', 'NT': 'IDL',
  'LB': 'LB', 'ILB': 'LB', 'OLB': 'LB',
  'CB': 'CB', 'S': 'S', 'FS': 'S', 'SS': 'S',
  'K': 'K', 'P': 'P', 'LS': 'LS'
};

const POSITION_GROUPS = {
  'QB': 'QB', 'RB': 'RB', 'WR': 'WR', 'TE': 'TE',
  'OT': 'OL', 'OG': 'OL', 'C': 'OL',
  'EDGE': 'DL', 'IDL': 'DL',
  'LB': 'LB',
  'CB': 'DB', 'S': 'DB',
  'K': 'ST', 'P': 'ST', 'LS': 'ST'
};

function normalizePosition(pos) {
  return POSITION_MAP[pos] || pos;
}

function matchScrapedToProspects(scrapedList, prospects) {
  const results = { matched: [], unmatched: [] };
  const claimedProspects = new Map();

  for (const scraped of scrapedList) {
    let bestMatch = null;
    let bestScore = 0;

    const scrapedPos = normalizePosition(scraped.position);
    const scrapedGroup = POSITION_GROUPS[scrapedPos] || scrapedPos;

    for (const prospect of prospects) {
      let score = similarity(scraped.name, prospect.name.display);

      const prospectPos = normalizePosition(prospect.position);
      const prospectGroup = POSITION_GROUPS[prospectPos] || prospectPos;

      if (scrapedPos === prospectPos) {
        score += 0.1;
      } else if (scrapedGroup === prospectGroup) {
        score += 0.05;
      } else if (scraped.position && prospect.position) {
        score -= 0.15;
      }

      if (scraped.school && prospect.school) {
        const sSchool = canonicalize(scraped.school);
        const pSchool = canonicalize(prospect.school);
        if (sSchool === pSchool || sSchool.includes(pSchool) || pSchool.includes(sSchool)) {
          score += 0.15;
        } else {
          score -= 0.05;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = prospect;
      }
    }

    const minConfidence = 0.90;
    if (bestScore >= minConfidence && bestMatch) {
      const prospectId = bestMatch.name.display;
      const existing = claimedProspects.get(prospectId);
      if (!existing || bestScore > existing.confidence) {
        if (existing) {
          results.matched = results.matched.filter(m => m.prospect !== bestMatch);
          results.unmatched.push({ scraped: existing.scraped, bestCandidate: bestMatch, confidence: existing.confidence });
        }
        claimedProspects.set(prospectId, { scraped, confidence: bestScore });
        results.matched.push({
          scraped,
          prospect: bestMatch,
          confidence: Math.min(bestScore, 1.0)
        });
      } else {
        results.unmatched.push({ scraped, bestCandidate: bestMatch, confidence: bestScore });
      }
    } else {
      results.unmatched.push({ scraped, bestCandidate: bestMatch, confidence: bestScore });
    }
  }

  return results;
}

module.exports = {
  loadProspects,
  saveProspects,
  canonicalize,
  similarity,
  normalizePosition,
  matchScrapedToProspects,
  PROSPECTS_PATH
};
