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

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('Dev Feedback tool available at /dev-feedback.html');
});
