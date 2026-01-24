const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'nwcarlson-dev';
const REPO_NAME = 'gm-ops';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, fromType, toType } = req.body;
    
    if (!topic || !fromType || !toType) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const fromFolder = fromType === 'technical' ? 'dev-technical-transcripts' : 'dev-planning-transcripts';
    const toFolder = toType === 'technical' ? 'dev-technical-transcripts' : 'dev-planning-transcripts';

    const listRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fromFolder}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!listRes.ok) {
      return res.status(404).json({ error: 'Source folder not found' });
    }

    const files = await listRes.json();
    
    for (const file of files.filter(f => f.name.endsWith('.md'))) {
      const contentRes = await fetch(file.download_url);
      const content = await contentRes.text();
      
      if (content.includes(topic)) {
        const sections = content.split(/---\n\n/);
        const topicSection = sections.find(s => s.includes(topic));
        const remainingSections = sections.filter(s => !s.includes(topic));
        
        if (topicSection) {
          const dateStr = new Date().toISOString().split('T')[0];
          const toFilename = toType === 'technical' 
            ? `dev-technical_${dateStr}_0001.md`
            : `dev-planning_${dateStr}_0001.md`;
          const toPath = `${toFolder}/${toFilename}`;
          
          let existingToContent = '';
          let toSha = null;
          
          try {
            const getToRes = await fetch(
              `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${toPath}`,
              {
                headers: {
                  Authorization: `token ${GITHUB_TOKEN}`,
                  Accept: 'application/vnd.github.v3+json',
                },
              }
            );
            if (getToRes.ok) {
              const toData = await getToRes.json();
              existingToContent = Buffer.from(toData.content, 'base64').toString('utf-8');
              toSha = toData.sha;
            }
          } catch (e) {}
          
          const newToContent = existingToContent 
            ? existingToContent + '\n\n---\n\n' + topicSection.trim()
            : topicSection.trim();
          
          await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${toPath}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Move topic: ${topic}`,
                content: Buffer.from(newToContent).toString('base64'),
                branch: 'main',
                ...(toSha && { sha: toSha }),
              }),
            }
          );
          
          if (remainingSections.length > 0 && remainingSections.some(s => s.trim())) {
            const getFromRes = await fetch(
              `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fromFolder}/${file.name}`,
              {
                headers: {
                  Authorization: `token ${GITHUB_TOKEN}`,
                  Accept: 'application/vnd.github.v3+json',
                },
              }
            );
            const fromData = await getFromRes.json();
            
            await fetch(
              `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fromFolder}/${file.name}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `token ${GITHUB_TOKEN}`,
                  Accept: 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: `Remove moved topic: ${topic}`,
                  content: Buffer.from(remainingSections.filter(s => s.trim()).join('\n\n---\n\n')).toString('base64'),
                  sha: fromData.sha,
                  branch: 'main',
                }),
              }
            );
          }
          
          return res.status(200).json({ success: true });
        }
      }
    }

    return res.status(404).json({ error: 'Topic not found' });

  } catch (error) {
    console.error('Move error:', error);
    return res.status(500).json({ error: 'Move failed', details: error.message });
  }
}
