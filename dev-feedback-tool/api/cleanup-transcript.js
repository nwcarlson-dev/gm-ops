import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, topicNumber } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You clean up voice transcripts. Fix grammar, remove filler words (um, uh, like), and organize rambling into clear numbered sub-points if there are multiple ideas. Keep the original meaning. If there are multiple distinct points, format them as ${topicNumber}.1, ${topicNumber}.2, etc. Be concise.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 1000,
    });

    const cleaned = response.choices[0]?.message?.content || text;

    return res.status(200).json({ cleaned });

  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(200).json({ cleaned: null });
  }
}
