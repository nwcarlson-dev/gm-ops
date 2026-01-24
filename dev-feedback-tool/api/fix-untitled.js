const OpenAI = require('openai');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const GITHUB_OWNER = 'nwcarlson-dev';
const GITHUB_REPO = 'gm-ops';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateTitle(transcript) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Generate a short, descriptive title (5-8 words max) for this dev planning transcript. Return ONLY the title, no quotes or extra text.' },
                { role: 'user', content: transcript.substring(0, 2000) }
            ],
            max_tokens: 50
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Title generation failed:', error.message);
        return null;
    }
}

async function getFileFromGitHub(path) {
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
        { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
        content: Buffer.from(data.content, 'base64').toString('utf8'),
        sha: data.sha
    };
}

async function updateFileOnGitHub(path, content, sha, message) {
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                content: Buffer.from(content).toString('base64'),
                sha
            })
        }
    );
    return response.ok;
}

async function listFilesInFolder(folder) {
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${folder}`,
        { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
    );
    if (!response.ok) return [];
    return await response.json();
}

module.exports = async function handler(req, res) {
    try {
        const folders = ['dev-planning-transcripts', 'dev-technical-transcripts'];
        const results = [];
        
        for (const folder of folders) {
            const files = await listFilesInFolder(folder);
            
            for (const file of files) {
                if (!file.name.endsWith('.md')) continue;
                
                const fileData = await getFileFromGitHub(file.path);
                if (!fileData) continue;
                
                const content = fileData.content;
                const titleMatch = content.match(/^# (.+)$/m);
                
                if (titleMatch && (titleMatch[1].includes('[Untitled]') || titleMatch[1].includes('[Topic Title]'))) {
                    const newTitle = await generateTitle(content);
                    if (newTitle) {
                        const updatedContent = content.replace(/^# .+$/m, `# ${newTitle}`);
                        const success = await updateFileOnGitHub(
                            file.path,
                            updatedContent,
                            fileData.sha,
                            `Fix title: ${newTitle}`
                        );
                        results.push({ file: file.name, newTitle, success });
                    }
                }
            }
        }
        
        res.json({ success: true, fixed: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
