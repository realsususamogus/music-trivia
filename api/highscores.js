// Vercel serverless function for high scores
// Note: This uses Vercel KV for persistence. For development, it falls back to a simple approach.

let highScores = []; // Fallback for development

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch (error) {
    return null; // KV not available (local development)
  }
}

export default async function handler(req, res) {
  const kv = await getKV();
  
  if (req.method === 'GET') {
    try {
      let scores = [];
      
      if (kv) {
        // Production: Use Vercel KV
        const scoreList = await kv.lrange('highScores', 0, 9);
        scores = scoreList.map(s => JSON.parse(s));
      } else {
        // Development: Use in-memory fallback
        scores = highScores;
      }
      
      res.status(200).json(scores);
    } catch (error) {
      console.error('Error fetching high scores:', error);
      res.status(500).json({ error: 'Failed to fetch high scores' });
    }
  } 
  else if (req.method === 'POST') {
    try {
      const { playerName, score, mode } = req.body;
      
      if (!playerName || typeof score !== 'number' || !mode) {
        return res.status(400).json({ error: 'Invalid data provided' });
      }
      
      const scoreEntry = {
        playerName,
        score,
        mode,
        timestamp: new Date().toISOString()
      };
      
      if (kv) {
        // Production: Use Vercel KV
        await kv.lpush('highScores', JSON.stringify(scoreEntry));
        
        // Get updated scores and sort
        const allScores = await kv.lrange('highScores', 0, -1);
        const sortedScores = allScores
          .map(s => JSON.parse(s))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        
        // Update the list with sorted top 10
        await kv.del('highScores');
        for (const score of sortedScores.reverse()) {
          await kv.lpush('highScores', JSON.stringify(score));
        }
        
        const rank = sortedScores.findIndex(s => 
          s.playerName === playerName && s.score === score && s.timestamp === scoreEntry.timestamp
        ) + 1;
        
        res.status(200).json({ success: true, rank });
      } else {
        // Development: Use in-memory fallback
        highScores.push(scoreEntry);
        highScores.sort((a, b) => b.score - a.score);
        
        if (highScores.length > 10) {
          highScores.splice(10);
        }
        
        const rank = highScores.findIndex(s => s === scoreEntry) + 1;
        res.status(200).json({ success: true, rank });
      }
    } catch (error) {
      console.error('Error saving high score:', error);
      res.status(500).json({ error: 'Failed to save high score' });
    }
  } 
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}