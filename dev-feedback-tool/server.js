const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Octokit } = require('@octokit/rest');
const OpenAI = require('openai');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static(__dirname));

// Explicit route for the HTML file (Vercel compatibility)
app.get('/dev-feedback.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dev-feedback.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dev-feedback.html'));
});

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'nwcarlson-dev';
const GITHUB_REPO = process.env.GITHUB_REPO || 'gm-ops';

const TECHNICAL_KEYWORDS = [
    'replit', 'github', 'git', 'deploy', 'server', 'api', 'endpoint',
    'bug', 'debug', 'error', 'fix', 'node', 'npm', 'package',
    'cursor', 'chatgpt', 'claude', 'ai tool', 'workflow', 'tooling',
    'environment', 'variable', 'token', 'auth', 'whisper', 'transcri',
    'feedback tool', 'recorder', 'localhost', 'vercel', 'hosting'
];

function detectTechnical(text) {
    const lower = text.toLowerCase();
    const matches = TECHNICAL_KEYWORDS.filter(kw => lower.includes(kw));
    return { isTechnical: matches.length >= 2, matches };
}

function getGitHubClient() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN not set');
    return new Octokit({ auth: token });
}

function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    return new OpenAI({ 
        apiKey,
        timeout: 30000,
        maxRetries: 0
    });
}

// Use /tmp for serverless (Vercel), local folder for development
const RECORDINGS_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'recordings');
if (!process.env.VERCEL && !fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

async function transcribeWithRetry(audioBuffer, filename, maxRetries = 3) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Transcription attempt ${attempt}/${maxRetries}...`);
            
            // Use FormData with fetch instead of SDK
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('file', audioBuffer, { filename, contentType: 'audio/webm' });
            formData.append('model', 'whisper-1');
            
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    ...formData.getHeaders()
                },
                body: formData
            });
            
            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${err}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Waiting ${waitTime/1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = 'recording-' + timestamp + '.webm';
    console.log('Processing:', filename);
    console.log('File size:', (req.file.buffer.length / 1024).toFixed(1), 'KB');
    
    try {
        const transcription = await transcribeWithRetry(req.file.buffer, filename);

        const text = transcription.text;
        const detection = detectTechnical(text);
        
        res.json({ 
            text,
            technicalDetected: detection.isTechnical,
            technicalMatches: detection.matches
        });
    } catch (error) {
        console.error('Transcription failed after all retries:', error.message);
        res.status(500).json({ 
            error: 'Transcription failed after 3 attempts', 
            details: error.message
        });
    }
});

// Generate a short title from transcript
app.post('/api/generate-title', express.json(), async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'No text provided' });
    }
    
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY not set');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: `Generate a short 2-5 word title for this dev planning note. Return ONLY the title, no quotes or punctuation:\n\n${text.slice(0, 500)}`
                }],
                max_tokens: 20
            })
        });
        
        if (!response.ok) {
            throw new Error('OpenAI API error');
        }
        
        const data = await response.json();
        const title = data.choices[0]?.message?.content?.trim() || 'Untitled Topic';
        res.json({ title });
    } catch (error) {
        console.error('Title generation error:', error.message);
        res.json({ title: 'Untitled Topic' });
    }
});

// Endpoint to retry transcription from saved file
app.post('/api/transcribe-file', express.json(), async (req, res) => {
    const { filePath } = req.body;
    
    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(400).json({ error: 'Audio file not found' });
    }
    
    try {
        const transcription = await transcribeWithRetry(filePath);

        const text = transcription.text;
        const detection = detectTechnical(text);
        
        res.json({ 
            text,
            technicalDetected: detection.isTechnical,
            technicalMatches: detection.matches
        });
    } catch (error) {
        console.error('Transcription failed after all retries:', error.message);
        res.status(500).json({ error: 'Transcription failed after 3 attempts', details: error.message });
    }
});

// List saved recordings
app.get('/api/recordings', (req, res) => {
    try {
        const files = fs.readdirSync(RECORDINGS_DIR)
            .filter(f => f.endsWith('.webm'))
            .sort()
            .reverse()
            .slice(0, 20);
        res.json({ recordings: files });
    } catch (e) {
        res.json({ recordings: [] });
    }
});

app.get('/api/topics', async (req, res) => {
    try {
        const octokit = getGitHubClient();
        const type = req.query.type || 'game';
        const full = req.query.full === '1';
        const folder = type === 'technical' ? 'dev-technical-transcripts' : 'dev-planning-transcripts';
        
        let files = [];
        try {
            const { data } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: folder
            });
            files = data.filter(f => f.name.endsWith('.md'));
        } catch (e) {}

        const topics = [];
        for (const file of files.slice(-5)) {
            const { data } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: file.path
            });
            const content = Buffer.from(data.content, 'base64').toString('utf8');
            
            // Split by topic headers
            const sections = content.split(/(?=## [T]?[0-9]+\.[0-9]+ - )/);
            for (const section of sections) {
                const titleMatch = section.match(/## ([T]?[0-9]+\.[0-9]+ - .+)/);
                if (titleMatch) {
                    const title = titleMatch[1];
                    const bodyStart = section.indexOf('\n');
                    const body = bodyStart > -1 ? section.slice(bodyStart).trim() : '';
                    // Remove date line
                    const cleanBody = body.replace(/^\*[0-9-]+\*\n*/, '').trim();
                    
                    if (full) {
                        topics.push({ title, content: cleanBody });
                    } else {
                        topics.push(title);
                    }
                }
            }
        }

        res.json({ topics: topics.reverse() });
    } catch (error) {
        res.json({ topics: [] });
    }
});

app.post('/api/save-transcript', async (req, res) => {
    const { filename, content, type } = req.body;

    if (!filename || !content) {
        return res.status(400).json({ error: 'Missing filename or content' });
    }

    try {
        const octokit = getGitHubClient();
        const folder = type === 'technical' ? 'dev-technical-transcripts' : 'dev-planning-transcripts';
        const filePath = folder + '/' + filename;

        let sha = null;
        let existingContent = '';
        try {
            const { data } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: filePath
            });
            sha = data.sha;
            existingContent = Buffer.from(data.content, 'base64').toString('utf8');
        } catch (e) {}

        const finalContent = existingContent ? existingContent + '\n---\n\n' + content : content;

        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            message: 'Add transcript: ' + filename,
            content: Buffer.from(finalContent).toString('base64'),
            sha: sha
        });

        res.json({ success: true, path: filePath });
    } catch (error) {
        console.error('GitHub save error:', error);
        res.status(500).json({ error: 'Failed to save to GitHub', details: error.message });
    }
});

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log('Server running on port ' + PORT);
        console.log('Dev Feedback tool available at /dev-feedback.html');
    });
}

// Export for Vercel
module.exports = app;
