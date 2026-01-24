const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'nwcarlson-dev';
const REPO_NAME = 'gm-ops';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, full } = req.query;
    const folder = type === 'technical' ? 'dev-technical-transcripts' : 'dev-planning-transcripts';

    const listRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!listRes.ok) {
      if (listRes.status === 404) {
        return res.status(200).json({ topics: [] });
      }
      throw new Error('Failed to list files');
    }

    const files = await listRes.json();
    const topics = [];

    for (const file of files.filter(f => f.name.endsWith('.md'))) {
      if (full === '1') {
        const contentRes = await fetch(file.download_url);
        const content = await contentRes.text();
        
        const sections = content.split(/---\n\n/);
        for (const section of sections) {
          const titleMatch = section.match(/## ([\w.]+) - (.+)/);
          if (titleMatch) {
            const topicNum = titleMatch[1];
            const title = titleMatch[2];
            const body = section.replace(/## .+\n\*[^*]+\*\n\n/, '').trim();
            topics.push({ 
              title: `${topicNum} - ${title}`,
              content: body
            });
          }
        }
      } else {
        topics.push({ title: file.name.replace('.md', '') });
      }
    }

    topics.sort((a, b) => {
      const numA = parseFloat(a.title.match(/[\d.]+/)?.[0] || 0);
      const numB = parseFloat(b.title.match(/[\d.]+/)?.[0] || 0);
      return numB - numA;
    });

    return res.status(200).json({ topics });

  } catch (error) {
    console.error('Topics error:', error);
    return res.status(500).json({ error: 'Failed to load topics', details: error.message });
  }
}
