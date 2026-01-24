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

async function transcribeWithRetry(audioBuffer, filename, contentType = 'audio/webm', maxRetries = 3) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Transcription attempt ${attempt}/${maxRetries}...`);
            console.log(`File: ${filename}, ContentType: ${contentType}, Size: ${(audioBuffer.length / 1024).toFixed(1)}KB`);
            
            // Use OpenAI SDK with toFile helper for Node.js compatibility
            const openai = new OpenAI({ apiKey, timeout: 55000, maxRetries: 0 });
            
            // Use OpenAI's toFile helper which works in Node.js
            const file = await OpenAI.toFile(audioBuffer, filename, { type: contentType });
            
            const transcription = await openai.audio.transcriptions.create({
                file: file,
                model: 'whisper-1'
            });
            
            return transcription;
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
    const startTime = Date.now();
    console.log('[transcribe] Request received at', new Date().toISOString());
    
    if (!req.file) {
        console.log('[transcribe] ERROR: No audio file in request');
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Get original filename and extension, or default to webm
    const origName = req.file.originalname || '';
    const ext = origName.includes('.') ? origName.split('.').pop().toLowerCase() : 'webm';
    const filename = 'recording-' + timestamp + '.' + ext;
    
    // Map extension to proper MIME type (browsers can report weird types)
    const mimeMap = {
        'webm': 'audio/webm',
        'mp3': 'audio/mpeg',
        'mp4': 'audio/mp4',
        'm4a': 'audio/mp4',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'flac': 'audio/flac'
    };
    const contentType = mimeMap[ext] || req.file.mimetype || 'audio/webm';
    
    console.log('[transcribe] File:', filename);
    console.log('[transcribe] Original:', origName, '| Reported MIME:', req.file.mimetype, '| Using:', contentType);
    console.log('[transcribe] Size:', (req.file.buffer.length / 1024).toFixed(1), 'KB');
    
    try {
        const transcription = await transcribeWithRetry(req.file.buffer, filename, contentType);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('[transcribe] SUCCESS in', elapsed, 's | Text length:', transcription.text.length);

        const text = transcription.text;
        const detection = detectTechnical(text);
        
        res.json({ 
            text,
            technicalDetected: detection.isTechnical,
            technicalMatches: detection.matches
        });
    } catch (error) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error('[transcribe] FAILED after', elapsed, 's:', error.message);
        console.error('[transcribe] Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Transcription failed', 
            details: error.message,
            elapsed: elapsed + 's'
        });
    }
});

// Clean up rambling transcripts into structured points
app.post('/api/cleanup-transcript', express.json(), async (req, res) => {
    const { text, topicNumber } = req.body;
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
                    role: 'system',
                    content: `You clean up rambling voice transcripts into clear, structured notes. 
Rules:
- Fix grammar and remove filler words (um, uh, like, you know, I mean, etc.)
- Remove repetition and rambling
- Extract distinct points and number them as sub-points (e.g., if topic is "1.18", points become "1.18.1", "1.18.2", etc.)
- Keep the speaker's intent and key details
- Be concise but don't lose important information
- Return ONLY the cleaned text, no explanations`
                }, {
                    role: 'user',
                    content: `Topic ${topicNumber || '1.X'}:\n\n${text}`
                }],
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error('OpenAI API error: ' + errText);
        }
        
        const data = await response.json();
        const cleaned = data.choices[0]?.message?.content?.trim() || text;
        console.log('[cleanup] Original length:', text.length, '-> Cleaned:', cleaned.length);
        res.json({ cleaned });
    } catch (error) {
        console.error('Cleanup error:', error.message);
        res.json({ cleaned: text, error: error.message });
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
            
            // Split by topic headers (handles any title including [Untitled])
            const sections = content.split(/(?=## [T]?\d+\.\d+ - )/);
            for (const section of sections) {
                const titleMatch = section.match(/## ([T]?\d+\.\d+ - [^\n]+)/);
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

// Move a topic from one category to another
app.post('/api/move-topic', async (req, res) => {
    const { topic, fromType, toType } = req.body;
    
    if (!topic || !fromType || !toType) {
        return res.status(400).json({ error: 'Missing topic, fromType, or toType' });
    }
    
    try {
        const octokit = getGitHubClient();
        const fromFolder = fromType === 'technical' ? 'dev-technical-transcripts' : 'dev-planning-transcripts';
        const toFolder = toType === 'technical' ? 'dev-technical-transcripts' : 'dev-planning-transcripts';
        
        // Find the file containing this topic
        const { data: files } = await octokit.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: fromFolder
        });
        
        let sourceFile = null;
        let sourceContent = '';
        let sourceSha = '';
        let topicContent = '';
        
        for (const file of files.filter(f => f.name.endsWith('.md'))) {
            const { data } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: file.path
            });
            const content = Buffer.from(data.content, 'base64').toString('utf8');
            
            // Find the topic section
            const regex = new RegExp('## ' + topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n[\\s\\S]*?(?=\\n---\\n|\\n## |$)');
            const match = content.match(regex);
            
            if (match) {
                sourceFile = file;
                sourceContent = content;
                sourceSha = data.sha;
                topicContent = match[0];
                break;
            }
        }
        
        if (!topicContent) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        // Rename topic number for destination (T prefix swap)
        const topicMatch = topic.match(/^(T?)(\d+)\.(\d+) - (.+)$/);
        if (!topicMatch) {
            return res.status(400).json({ error: 'Invalid topic format' });
        }
        
        // Get count of topics in destination to determine new number
        let destTopicCount = 0;
        try {
            const { data: destFiles } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: toFolder
            });
            
            for (const file of destFiles.filter(f => f.name.endsWith('.md'))) {
                const { data } = await octokit.repos.getContent({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path: file.path
                });
                const content = Buffer.from(data.content, 'base64').toString('utf8');
                const matches = content.match(/## [T]?\d+\.\d+ - /g);
                if (matches) destTopicCount += matches.length;
            }
        } catch (e) {
            // Destination folder might not exist yet
        }
        
        const newPrefix = toType === 'technical' ? 'T' : '';
        const dayNum = topicMatch[2];
        const newTopicNum = newPrefix + dayNum + '.' + (destTopicCount + 1);
        const newTopic = newTopicNum + ' - ' + topicMatch[4];
        
        // Update topic content with new number
        const newTopicContent = topicContent.replace(/## [T]?\d+\.\d+ - /, '## ' + newTopicNum + ' - ');
        
        // Remove from source file
        const newSourceContent = sourceContent.replace(topicContent, '').replace(/\n---\n\n---\n/g, '\n---\n').replace(/^\n---\n/gm, '').trim();
        
        // Update source file
        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: sourceFile.path,
            message: 'Move topic: ' + topic + ' to ' + toType,
            content: Buffer.from(newSourceContent || '# Empty\n').toString('base64'),
            sha: sourceSha
        });
        
        // Add to destination file
        const dateStr = new Date().toISOString().split('T')[0];
        const destFilename = (toType === 'technical' ? 'dev-technical' : 'dev-planning') + '_' + dateStr + '_0001.md';
        const destPath = toFolder + '/' + destFilename;
        
        let destSha = null;
        let destContent = '';
        try {
            const { data } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: destPath
            });
            destSha = data.sha;
            destContent = Buffer.from(data.content, 'base64').toString('utf8');
        } catch (e) {}
        
        const finalDestContent = destContent ? destContent + '\n---\n\n' + newTopicContent : newTopicContent;
        
        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: destPath,
            message: 'Add moved topic: ' + newTopic,
            content: Buffer.from(finalDestContent).toString('base64'),
            sha: destSha
        });
        
        res.json({ success: true, newTopic });
    } catch (error) {
        console.error('Move topic error:', error);
        res.status(500).json({ error: 'Failed to move topic', details: error.message });
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

        // Notify Replit server about the new transcript
        const replitUrl = process.env.REPLIT_NOTIFY_URL;
        if (replitUrl) {
            try {
                await fetch(replitUrl + '/api/transcript-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        topic: req.body.topicNumber,
                        type: type || 'game',
                        title: req.body.title || filename
                    })
                });
            } catch (e) {
                console.log('Replit notification skipped:', e.message);
            }
        }

        res.json({ success: true, path: filePath });
    } catch (error) {
        console.error('GitHub save error:', error);
        res.status(500).json({ error: 'Failed to save to GitHub', details: error.message });
    }
});

// Background job to fix untitled topics
async function fixUntitledTopics() {
    try {
        const octokit = getGitHubClient();
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return;
        
        for (const folder of ['dev-planning-transcripts', 'dev-technical-transcripts']) {
            let files = [];
            try {
                const { data } = await octokit.repos.getContent({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path: folder
                });
                files = data.filter(f => f.name.endsWith('.md'));
            } catch (e) { continue; }
            
            for (const file of files) {
                const { data } = await octokit.repos.getContent({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path: file.path
                });
                let content = Buffer.from(data.content, 'base64').toString('utf8');
                
                // Find untitled topics
                const untitledMatches = content.match(/## ([T]?\d+\.\d+) - \[Untitled\]\n\*[^*]+\*\n\n([^#]+)/g);
                if (!untitledMatches) continue;
                
                let updated = false;
                for (const match of untitledMatches) {
                    const numMatch = match.match(/## ([T]?\d+\.\d+) - \[Untitled\]/);
                    const bodyMatch = match.match(/\n\n(.+)/s);
                    if (!numMatch || !bodyMatch) continue;
                    
                    const topicNum = numMatch[1];
                    const body = bodyMatch[1].trim();
                    
                    // Generate title
                    try {
                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + apiKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: 'gpt-4o-mini',
                                messages: [{
                                    role: 'user',
                                    content: 'Generate a short 2-5 word title for this dev planning note. Return ONLY the title, no quotes or punctuation:\n\n' + body.slice(0, 500)
                                }],
                                max_tokens: 20
                            })
                        });
                        
                        if (response.ok) {
                            const titleData = await response.json();
                            const newTitle = titleData.choices[0]?.message?.content?.trim();
                            if (newTitle && newTitle !== 'Untitled Topic') {
                                content = content.replace(
                                    '## ' + topicNum + ' - [Untitled]',
                                    '## ' + topicNum + ' - ' + newTitle
                                );
                                updated = true;
                                console.log('Fixed title:', topicNum, '->', newTitle);
                            }
                        }
                    } catch (e) {
                        console.error('Title fix failed for', topicNum, e.message);
                    }
                }
                
                if (updated) {
                    await octokit.repos.createOrUpdateFileContents({
                        owner: GITHUB_OWNER,
                        repo: GITHUB_REPO,
                        path: file.path,
                        message: 'Auto-fix untitled topics',
                        content: Buffer.from(content).toString('base64'),
                        sha: data.sha
                    });
                }
            }
        }
    } catch (e) {
        console.error('fixUntitledTopics error:', e.message);
    }
}

// API endpoint to fix untitled topics (can be called manually or via cron)
app.get('/api/fix-untitled', async (req, res) => {
    await fixUntitledTopics();
    res.json({ success: true, message: 'Checked and fixed untitled topics' });
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
