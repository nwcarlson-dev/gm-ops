const OpenAI = require('openai');
const { loadProspects, saveProspects } = require('./name-matcher');

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

function buildBioPrompt(batch) {
  const players = batch.map((p, i) => {
    const name = typeof p.name === 'object' ? p.name.display : p.name;
    return `${i + 1}. ${name} - ${p.position} - ${p.school || 'Unknown School'}`;
  }).join('\n');

  return `You are a college football data specialist. Provide accurate physical measurements and biographical data for these 2026 NFL Draft prospects.

For each player, provide:
- height_in: height in total inches (e.g., 77 for 6'5")
- weight_lbs: weight in pounds
- age: age as of January 1, 2026
- birth_date: date of birth in YYYY-MM-DD format (use your best knowledge, null if truly unknown)
- hometown: hometown city and state

These are all real college football players entering the 2026 NFL Draft. Use your knowledge of their actual listed measurements from their university rosters, NFL Combine, or pro days.

IMPORTANT: Be accurate. These are real athletes with publicly available measurements. A 6'5" 310lb defensive tackle is very different from a 5'11" 190lb cornerback. If you are uncertain about exact measurements, use the most commonly reported values.

PLAYERS:
${players}

Return ONLY valid JSON array with objects in the same order:
[{"height_in": <number>, "weight_lbs": <number>, "age": <number>, "birth_date": "<YYYY-MM-DD or null>", "hometown": "<city, state or null>"}]`;
}

async function enrichBios(progressCallback, options = {}) {
  const data = loadProspects();
  const batchSize = options.batchSize || 15;
  const overwrite = options.overwrite || false;

  const results = {
    updated: 0,
    skipped: 0,
    errors: [],
    total: 0
  };

  let toProcess = data.prospects
    .sort((a, b) => (a.consensus?.rank || 999) - (b.consensus?.rank || 999));

  if (!overwrite) {
    toProcess = toProcess.filter(p => {
      const bio = p.bio || {};
      return !bio.height_in || !bio.weight_lbs || !bio.age_years;
    });
  }

  if (options.limit) {
    toProcess = toProcess.slice(0, options.limit);
  }

  results.total = toProcess.length;
  console.log(`[Bio Enrichment] Processing ${toProcess.length} prospects in batches of ${batchSize}`);

  progressCallback?.({ stage: 'bio', status: 'starting', total: toProcess.length });

  for (let i = 0; i < toProcess.length; i += batchSize) {
    const batch = toProcess.slice(i, i + batchSize);

    try {
      const prompt = buildBioPrompt(batch);
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_completion_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      let parsed = JSON.parse(content);
      if (parsed.players) parsed = parsed.players;
      if (parsed.prospects) parsed = parsed.prospects;
      if (!Array.isArray(parsed)) {
        const vals = Object.values(parsed);
        if (vals.length > 0 && Array.isArray(vals[0])) parsed = vals[0];
        else if (vals.length > 0) parsed = vals;
      }

      for (let j = 0; j < batch.length && j < parsed.length; j++) {
        const bioData = parsed[j];
        const original = data.prospects.find(p => p.id === batch[j].id);
        if (!original) continue;

        if (!original.bio) original.bio = {};

        if (bioData.height_in && typeof bioData.height_in === 'number' && bioData.height_in > 60 && bioData.height_in < 84) {
          if (!original.bio.height_in || original.bio.height_in === null || overwrite) {
            original.bio.height_in = bioData.height_in;
          }
        }

        if (bioData.weight_lbs && typeof bioData.weight_lbs === 'number' && bioData.weight_lbs > 140 && bioData.weight_lbs < 400) {
          if (!original.bio.weight_lbs || original.bio.weight_lbs === null || overwrite) {
            original.bio.weight_lbs = bioData.weight_lbs;
          }
        }

        if (bioData.age && typeof bioData.age === 'number' && bioData.age >= 19 && bioData.age <= 27) {
          original.bio.age_years = bioData.age;
        }

        if (bioData.birth_date && bioData.birth_date !== 'null' && bioData.birth_date !== null) {
          const dateCheck = new Date(bioData.birth_date);
          if (!isNaN(dateCheck.getTime()) && dateCheck.getFullYear() >= 1998 && dateCheck.getFullYear() <= 2005) {
            original.bio.birth_date = bioData.birth_date;
          }
        }

        if (bioData.hometown && bioData.hometown !== 'null' && bioData.hometown !== null) {
          original.bio.hometown = bioData.hometown;
        }

        results.updated++;
      }

      const batchEnd = Math.min(i + batchSize, toProcess.length);
      console.log(`[Bio Enrichment] Batch ${Math.floor(i / batchSize) + 1}: Updated ${batch.length} prospects (${batchEnd}/${toProcess.length})`);

      progressCallback?.({
        stage: 'bio',
        status: 'enriching',
        current: batchEnd,
        total: toProcess.length
      });

    } catch (err) {
      console.error(`[Bio Enrichment] Batch error:`, err.message);
      results.errors.push({ batch: Math.floor(i / batchSize) + 1, error: err.message });

      if (err.message?.includes('429') || err.message?.includes('rate')) {
        console.log('[Bio Enrichment] Rate limited, waiting 15s...');
        await new Promise(r => setTimeout(r, 15000));
      }
    }

    if (i % (batchSize * 3) === 0 && i > 0) {
      saveProspects(data);
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  data.meta.last_updated = new Date().toISOString().split('T')[0];
  saveProspects(data);

  progressCallback?.({ stage: 'bio', status: 'complete', results });
  console.log(`[Bio Enrichment] Complete: ${results.updated} updated, ${results.errors.length} errors`);
  return results;
}

module.exports = { enrichBios };

if (require.main === module) {
  enrichBios(console.log).then(r => {
    console.log('Results:', JSON.stringify(r, null, 2));
  }).catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}
