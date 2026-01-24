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
                { role: 'system', content: 'Generate a short, descriptive title (3-5 words max) for this dev planning note. Return ONLY the title, no quotes or extra text.' },
                { role: 'user', content: transcript.substring(0, 1500) }
            ],
            max_tokens: 30
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
                
                let content = fileData.content;
                let modified = false;
                
                // Find all topic headers with placeholder titles
                const topicPattern = /## ([T]?\d+\.\d+) - \[(Topic Title|Untitled)\]\n\*[^*]+\*\n\n([\s\S]*?)(?=\n---|\n## |$)/g;
                let match;
                
                while ((match = topicPattern.exec(content)) !== null) {
                    const topicNum = match[1];
                    const topicContent = match[3].trim();
                    
                    if (topicContent.length > 10) {
                        const newTitle = await generateTitle(topicContent);
                        if (newTitle) {
                            const oldHeader = `## ${topicNum} - [${match[2]}]`;
                            const newHeader = `## ${topicNum} - ${newTitle}`;
                            content = content.replace(oldHeader, newHeader);
                            modified = true;
                            results.push({ topic: topicNum, newTitle });
                        }
                    }
                }
                
                if (modified) {
                    await updateFileOnGitHub(
                        file.path,
                        content,
                        fileData.sha,
                        `Fix placeholder titles: ${results.map(r => r.topic).join(', ')}`
                    );
                }
            }
        }
        
        res.json({ success: true, fixed: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
