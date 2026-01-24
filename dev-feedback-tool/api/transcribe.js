import OpenAI from 'openai';

export const config = {
  maxDuration: 60,
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary in content-type' });
    }
    
    const parts = buffer.toString('binary').split(`--${boundary}`);
    let audioData = null;
    
    for (const part of parts) {
      if (part.includes('name="audio"')) {
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        if (dataStart > 3 && dataEnd > dataStart) {
          audioData = Buffer.from(part.slice(dataStart, dataEnd), 'binary');
        }
      }
    }
    
    if (!audioData || audioData.length < 100) {
      return res.status(400).json({ error: 'No audio data received' });
    }

    console.log(`[${new Date().toISOString()}] Audio size: ${audioData.length} bytes`);

    const file = await OpenAI.toFile(audioData, 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'text',
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
    console.log(`[${new Date().toISOString()}] Transcription complete in ${elapsed}`);

    const techKeywords = ['api', 'server', 'database', 'bug', 'error', 'deploy', 'git', 'code', 'function', 'variable', 'debug', 'npm', 'node', 'react', 'vercel', 'replit'];
    const lowerText = transcription.toLowerCase();
    const technicalDetected = techKeywords.some(k => lowerText.includes(k));

    return res.status(200).json({ 
      text: transcription,
      technicalDetected,
      elapsed
    });

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
    console.error(`[${new Date().toISOString()}] Error after ${elapsed}:`, error);
    
    return res.status(500).json({ 
      error: 'Transcription failed',
      details: error.message,
      elapsed
    });
  }
}
