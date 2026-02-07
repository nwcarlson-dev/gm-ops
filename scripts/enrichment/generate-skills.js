const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { loadProspects, saveProspects } = require('./name-matcher');

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

const SCHEME_WEIGHTS_PATH = path.join(__dirname, '../../data/schemes/scheme_skill_weights.json');

function getSkillsTemplate(position) {
  const templates = {
    QB: ['arm_strength', 'accuracy_short', 'accuracy_deep', 'decision_making', 'pocket_presence', 'mobility', 'release_speed', 'anticipation'],
    RB: ['acceleration', 'vision', 'elusiveness', 'power', 'pass_blocking', 'receiving', 'ball_security', 'lateral_agility'],
    WR: ['route_running', 'separation', 'catch_radius', 'yac', 'contested_catch', 'release', 'hands', 'speed'],
    TE: ['route_running', 'hands', 'yac', 'run_blocking', 'catch_radius', 'speed', 'contested_catch'],
    OT: ['pass_protection', 'footwork', 'anchor', 'run_blocking', 'pull_ability', 'awareness', 'hand_placement'],
    OG: ['pass_protection', 'footwork', 'anchor', 'run_blocking', 'pull_ability', 'awareness', 'hand_placement'],
    C: ['pass_protection', 'footwork', 'anchor', 'run_blocking', 'pull_ability', 'awareness', 'hand_placement'],
    EDGE: ['pass_rush_moves', 'bend_flexibility', 'speed_to_power', 'first_step', 'hand_usage', 'run_stuffing', 'motor'],
    IDL: ['run_stuffing', 'anchor', 'double_team_resistance', 'pass_rush_moves', 'first_step', 'hand_usage'],
    LB: ['run_defense', 'pass_coverage', 'blitzing', 'tackling', 'instincts', 'sideline_to_sideline'],
    CB: ['press_technique', 'man_coverage', 'zone_coverage', 'ball_skills', 'recovery_speed', 'tackling'],
    S: ['range', 'man_coverage', 'zone_coverage', 'tackling', 'ball_skills', 'instincts', 'versatility'],
    K: ['accuracy', 'leg_strength', 'consistency', 'clutch'],
    P: ['hang_time', 'directional', 'consistency', 'leg_strength']
  };
  return templates[position] || templates.LB;
}

function buildPrompt(prospect, skillsList) {
  const report = prospect.scouting_report || '';
  const strengths = prospect.source_raw?.nflmdd_report?.strengths?.join(', ') || '';
  const weaknesses = prospect.source_raw?.nflmdd_report?.weaknesses?.join(', ') || '';
  const traits = (prospect.traits || []).join(', ');

  return `You are an NFL scout grading draft prospects. Grade this prospect's skills on a 0-100 scale based on all available information.

PROSPECT: ${prospect.name.display}
POSITION: ${prospect.position}
SCHOOL: ${prospect.school || 'Unknown'}
ARCHETYPE: ${prospect.archetype || 'Unknown'}
NFL COMPARISON: ${prospect.comparison || 'None'}
CONSENSUS RANK: ${prospect.consensus?.rank || 'Unknown'}
DEVELOPMENT: ${prospect.developmentCertainty?.label || 'Standard'}

SCOUTING REPORT: ${report || 'No detailed report available.'}

STRENGTHS: ${strengths || 'Not available'}
WEAKNESSES: ${weaknesses || 'Not available'}
TRAITS: ${traits || 'Not listed'}

${prospect.bio?.height_in ? `HEIGHT: ${Math.floor(prospect.bio.height_in/12)}'${prospect.bio.height_in%12}"` : ''}
${prospect.bio?.weight_lbs ? `WEIGHT: ${prospect.bio.weight_lbs} lbs` : ''}
${prospect.grades?.pff_overall ? `PFF GRADE: ${prospect.grades.pff_overall}` : ''}

Grade each skill from 0-100. Use these guidelines:
- 90-100: Elite, generational talent at this skill
- 80-89: Excellent, NFL-ready day one
- 70-79: Good, solid starter quality
- 60-69: Average, needs development
- 50-59: Below average, significant concern
- Below 50: Major weakness

Consider the prospect's consensus rank as context - a top-10 pick should generally have higher grades than a 5th rounder, but be specific about strengths vs weaknesses.

Return ONLY valid JSON with these exact keys and number values:
{${skillsList.map(s => `"${s}": <number>`).join(', ')}}`;
}

async function generateSkillsForProspect(prospect) {
  const skillsList = getSkillsTemplate(prospect.position);
  const prompt = buildPrompt(prospect, skillsList);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_completion_tokens: 500
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const skills = JSON.parse(content);

  for (const key of Object.keys(skills)) {
    if (typeof skills[key] !== 'number') {
      skills[key] = parseInt(skills[key]) || 50;
    }
    skills[key] = Math.max(0, Math.min(100, Math.round(skills[key])));
  }

  return skills;
}

async function runSkillGeneration(progressCallback, options = {}) {
  const data = loadProspects();
  const maxProspects = options.limit || 337;
  const overwrite = options.overwrite || false;
  const concurrency = options.concurrency || 2;

  const results = {
    generated: 0,
    skipped: 0,
    errors: [],
    total: 0
  };

  let prospectsToProcess = [...data.prospects]
    .sort((a, b) => (a.consensus?.rank || 999) - (b.consensus?.rank || 999));

  if (!overwrite) {
    prospectsToProcess = prospectsToProcess.filter(p =>
      !p.skills || Object.keys(p.skills).length === 0
    );
  }

  prospectsToProcess = prospectsToProcess.slice(0, maxProspects);
  results.total = prospectsToProcess.length;

  progressCallback?.({
    stage: 'skills',
    status: 'starting',
    total: prospectsToProcess.length
  });

  for (let i = 0; i < prospectsToProcess.length; i += concurrency) {
    const batch = prospectsToProcess.slice(i, i + concurrency);

    const batchPromises = batch.map(async (prospect) => {
      const originalProspect = data.prospects.find(p => p.id === prospect.id);
      try {
        const skills = await generateSkillsForProspect(prospect);
        originalProspect.skills = skills;
        results.generated++;

        progressCallback?.({
          stage: 'skills',
          status: 'generating',
          current: results.generated + results.skipped,
          total: results.total,
          name: prospect.name.display,
          position: prospect.position
        });
      } catch (err) {
        results.errors.push({ name: prospect.name.display, error: err.message });

        if (err.message?.includes('429') || err.message?.includes('rate')) {
          await new Promise(r => setTimeout(r, 10000));
        }
      }
    });

    await Promise.all(batchPromises);

    if (i % 20 === 0 && i > 0) {
      saveProspects(data);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  data.meta.last_updated = new Date().toISOString().split('T')[0];
  saveProspects(data);

  progressCallback?.({ stage: 'skills', status: 'complete', results });
  return results;
}

module.exports = { generateSkillsForProspect, runSkillGeneration, getSkillsTemplate };
