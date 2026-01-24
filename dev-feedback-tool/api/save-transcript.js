const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'nwcarlson-dev';
const REPO_NAME = 'gm-ops';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, content, type } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({ error: 'Missing filename or content' });
    }

    const folder = type === 'technical' ? 'dev-technical-transcripts' : 'dev-planning-transcripts';
    const path = `${folder}/${filename}`;

    let existingContent = '';
    let sha = null;

    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (getRes.ok) {
        const data = await getRes.json();
        existingContent = Buffer.from(data.content, 'base64').toString('utf-8');
        sha = data.sha;
      }
    } catch (e) {
      console.log('File does not exist yet, creating new');
    }

    const newContent = existingContent ? existingContent + '\n\n---\n\n' + content : content;
    const encoded = Buffer.from(newContent).toString('base64');

    const putBody = {
      message: `Add topic: ${filename}`,
      content: encoded,
      branch: 'main',
    };
    
    if (sha) {
      putBody.sha = sha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putBody),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      console.error('GitHub PUT error:', err);
      return res.status(500).json({ error: 'Failed to save to GitHub', details: err });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ error: 'Save failed', details: error.message });
  }
}
