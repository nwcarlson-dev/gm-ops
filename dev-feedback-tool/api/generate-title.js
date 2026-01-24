import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a short, descriptive title (3-6 words) for this development note. No quotes, no punctuation at the end. Just the title.'
        },
        {
          role: 'user',
          content: text.slice(0, 500)
        }
      ],
      max_tokens: 20,
    });

    const title = response.choices[0]?.message?.content?.trim() || 'Untitled Topic';

    return res.status(200).json({ title });

  } catch (error) {
    console.error('Title generation error:', error);
    return res.status(200).json({ title: 'Untitled Topic' });
  }
}
