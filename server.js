const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const app = express();
const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

// GitHub config
const GITHUB_OWNER = 'nwcarlson-dev';
const GITHUB_REPO = 'gm-ops';
const TRANSCRIPTS_PATH = 'dev-planning-transcripts';

let connectionSettings = null;

async function getAccessToken() {
    if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
        return connectionSettings.settings.access_token;
    }

    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
        ? 'repl ' + process.env.REPL_IDENTITY
        : process.env.WEB_REPL_RENEWAL
            ? 'depl ' + process.env.WEB_REPL_RENEWAL
            : null;

    if (!xReplitToken) {
        throw new Error('X_REPLIT_TOKEN not found');
    }

    connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
        {
            headers: {
                'Accept': 'application/json',
                'X_REPLIT_TOKEN': xReplitToken
            }
        }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
        throw new Error('GitHub not connected');
    }
    return accessToken;
}

async function getGitHubClient() {
    const accessToken = await getAccessToken();
    return new Octokit({ auth: accessToken });
}

app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.json')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    next();
});
app.get('/offseason', (req, res) => {
    res.redirect('/game-shell.html?mode=offseason');
});
app.use(express.static('.'));
app.use(express.json());

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    try {
        const audioPath = req.file.path;
        const audioFile = fs.createReadStream(audioPath);
        
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1'
        });

        fs.unlinkSync(audioPath);

        res.json({ text: transcription.text });
    } catch (error) {
        console.error('Transcription error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Transcription failed', details: error.message });
    }
});

app.post('/api/save-transcript', async (req, res) => {
    const { filename, content } = req.body;

    if (!filename || !content) {
        return res.status(400).json({ error: 'Missing filename or content' });
    }

    try {
        const octokit = await getGitHubClient();
        const filePath = `${TRANSCRIPTS_PATH}/${filename}`;

        // Check if file exists (to get SHA for update)
        let sha = null;
        try {
            const { data } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: filePath
            });
            sha = data.sha;
        } catch (e) {
            // File doesn't exist, that's fine
        }

        // Create or update file
        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            message: `Add transcript: ${filename}`,
            content: Buffer.from(content).toString('base64'),
            sha: sha
        });

        res.json({ success: true, path: filePath });
    } catch (error) {
        console.error('GitHub save error:', error);
        res.status(500).json({ error: 'Failed to save to GitHub', details: error.message });
    }
});

app.get('/api/transcripts', async (req, res) => {
    try {
        const octokit = await getGitHubClient();
        
        const { data } = await octokit.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: TRANSCRIPTS_PATH
        });

        const files = data
            .filter(f => f.name.endsWith('.md'))
            .map(f => ({ name: f.name, path: f.path }));

        res.json({ files });
    } catch (error) {
        if (error.status === 404) {
            res.json({ files: [] });
        } else {
            console.error('GitHub list error:', error);
            res.status(500).json({ error: 'Failed to list transcripts', details: error.message });
        }
    }
});

// Endpoint to list all transcripts from GitHub (both planning and technical)
app.get('/api/all-transcripts', async (req, res) => {
    try {
        const octokit = await getGitHubClient();
        const result = { planning: [], technical: [] };
        
        for (const folder of ['dev-planning-transcripts', 'dev-technical-transcripts']) {
            try {
                const { data } = await octokit.repos.getContent({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path: folder
                });
                
                for (const file of data.filter(f => f.name.endsWith('.md'))) {
                    const { data: fileData } = await octokit.repos.getContent({
                        owner: GITHUB_OWNER,
                        repo: GITHUB_REPO,
                        path: file.path
                    });
                    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
                    
                    // Extract topic titles
                    const topics = [];
                    const sections = content.split(/(?=## [T]?[0-9]+\.[0-9]+ - )/);
                    for (const section of sections) {
                        const match = section.match(/## ([T]?[0-9]+\.[0-9]+ - .+)/);
                        if (match) topics.push(match[1]);
                    }
                    
                    const key = folder.includes('technical') ? 'technical' : 'planning';
                    result[key].push({ file: file.name, topics });
                }
            } catch (e) {
                // Folder doesn't exist
            }
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching transcripts:', error);
        res.status(500).json({ error: 'Failed to fetch transcripts', details: error.message });
    }
});

// Webhook endpoint for new transcript notifications
app.post('/api/transcript-notification', (req, res) => {
    const { topic, type, title } = req.body;
    console.log('\n========================================');
    console.log('NEW TRANSCRIPT SAVED');
    console.log(`Type: ${type || 'game'}`);
    console.log(`Topic: ${topic}`);
    console.log(`Title: ${title}`);
    console.log('========================================\n');
    res.json({ received: true });
});

const { runRankingScrape } = require('./scripts/enrichment/scrape-rankings');
const { runReportScrape } = require('./scripts/enrichment/scrape-reports');
const { runSkillGeneration } = require('./scripts/enrichment/generate-skills');
const { enrichBios } = require('./scripts/enrichment/enrich-bios');

let enrichmentJob = null;

app.post('/api/prospects/enrich/rankings', async (req, res) => {
    if (enrichmentJob?.running) {
        return res.status(409).json({ error: 'An enrichment job is already running', stage: enrichmentJob.stage });
    }

    enrichmentJob = { running: true, stage: 'rankings', progress: [], startTime: Date.now() };
    res.json({ status: 'started', stage: 'rankings' });

    try {
        const results = await runRankingScrape((progress) => {
            enrichmentJob.progress.push(progress);
            enrichmentJob.lastUpdate = progress;
        });
        enrichmentJob.results = results;
        enrichmentJob.running = false;
        enrichmentJob.stage = 'complete';
        console.log('[Enrichment] Rankings scrape complete:', JSON.stringify(results, null, 2));
    } catch (err) {
        enrichmentJob.running = false;
        enrichmentJob.stage = 'error';
        enrichmentJob.error = err.message;
        console.error('[Enrichment] Rankings error:', err);
    }
});

app.post('/api/prospects/enrich/reports', async (req, res) => {
    if (enrichmentJob?.running) {
        return res.status(409).json({ error: 'An enrichment job is already running', stage: enrichmentJob.stage });
    }

    const limit = parseInt(req.body.limit) || 100;
    const overwrite = req.body.overwrite || false;

    enrichmentJob = { running: true, stage: 'reports', progress: [], startTime: Date.now() };
    res.json({ status: 'started', stage: 'reports', limit });

    try {
        const results = await runReportScrape((progress) => {
            enrichmentJob.progress.push(progress);
            enrichmentJob.lastUpdate = progress;
        }, { limit, overwrite });
        enrichmentJob.results = results;
        enrichmentJob.running = false;
        enrichmentJob.stage = 'complete';
        console.log('[Enrichment] Reports scrape complete:', JSON.stringify(results, null, 2));
    } catch (err) {
        enrichmentJob.running = false;
        enrichmentJob.stage = 'error';
        enrichmentJob.error = err.message;
        console.error('[Enrichment] Reports error:', err);
    }
});

app.post('/api/prospects/enrich/skills', async (req, res) => {
    if (enrichmentJob?.running) {
        return res.status(409).json({ error: 'An enrichment job is already running', stage: enrichmentJob.stage });
    }

    const limit = parseInt(req.body.limit) || 50;
    const overwrite = req.body.overwrite || false;
    const concurrency = parseInt(req.body.concurrency) || 2;

    enrichmentJob = { running: true, stage: 'skills', progress: [], startTime: Date.now() };
    res.json({ status: 'started', stage: 'skills', limit, concurrency });

    try {
        const results = await runSkillGeneration((progress) => {
            enrichmentJob.progress.push(progress);
            enrichmentJob.lastUpdate = progress;
        }, { limit, overwrite, concurrency });
        enrichmentJob.results = results;
        enrichmentJob.running = false;
        enrichmentJob.stage = 'complete';
        console.log('[Enrichment] Skill generation complete:', JSON.stringify(results, null, 2));
    } catch (err) {
        enrichmentJob.running = false;
        enrichmentJob.stage = 'error';
        enrichmentJob.error = err.message;
        console.error('[Enrichment] Skills error:', err);
    }
});

app.post('/api/prospects/enrich/bios', async (req, res) => {
    if (enrichmentJob?.running) {
        return res.status(409).json({ error: 'An enrichment job is already running', stage: enrichmentJob.stage });
    }

    const limit = parseInt(req.body.limit) || 337;
    const overwrite = req.body.overwrite || false;

    enrichmentJob = { running: true, stage: 'bios', progress: [], startTime: Date.now() };
    res.json({ status: 'started', stage: 'bios', limit });

    try {
        const results = await enrichBios((progress) => {
            enrichmentJob.progress.push(progress);
            enrichmentJob.lastUpdate = progress;
        }, { limit, overwrite });
        enrichmentJob.results = results;
        enrichmentJob.running = false;
        enrichmentJob.stage = 'complete';
        console.log('[Enrichment] Bio enrichment complete:', JSON.stringify(results, null, 2));
    } catch (err) {
        enrichmentJob.running = false;
        enrichmentJob.stage = 'error';
        enrichmentJob.error = err.message;
        console.error('[Enrichment] Bio error:', err);
    }
});

app.get('/api/prospects/enrich/status', (req, res) => {
    if (!enrichmentJob) {
        return res.json({ running: false, stage: 'idle' });
    }
    res.json({
        running: enrichmentJob.running,
        stage: enrichmentJob.stage,
        lastUpdate: enrichmentJob.lastUpdate,
        results: enrichmentJob.results,
        error: enrichmentJob.error,
        elapsed: Date.now() - enrichmentJob.startTime
    });
});

app.get('/api/prospects/stats', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/prospects/current/2026_prospects.json'), 'utf8'));
        const stats = {
            total: data.prospects.length,
            lastUpdated: data.meta.last_updated,
            sources: data.meta.sources,
            withSkills: data.prospects.filter(p => p.skills && Object.keys(p.skills).length > 0).length,
            withReports: data.prospects.filter(p => p.scouting_report && p.scouting_report.length > 50).length,
            rankingSources: {}
        };

        const rankingKeys = ['pff', 'cbs', 'espn', 'nfl', 'nflmdd', 'fantasypros', 'nfldraftbuzz', 'tankathon', 'jeremiah', 'drafttek'];
        for (const key of rankingKeys) {
            stats.rankingSources[key] = data.prospects.filter(p => p.rankings?.[key] != null).length;
        }

        const sampleProspects = data.prospects
            .sort((a, b) => (a.consensus?.rank || 999) - (b.consensus?.rank || 999))
            .slice(0, 20)
            .map(p => ({
                name: p.name.display,
                position: p.position,
                consensus: p.consensus?.rank,
                sources: Object.entries(p.rankings || {}).filter(([k, v]) => v != null).length,
                hasSkills: p.skills && Object.keys(p.skills).length > 0,
                hasReport: p.scouting_report && p.scouting_report.length > 50
            }));

        stats.top20 = sampleProspects;
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('Dev Feedback tool available at /dev-feedback.html');
});
