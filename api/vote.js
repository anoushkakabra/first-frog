import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  const { userId, vote } = req.body;

  if (req.method === 'POST') {
    try {
      // Check if the user has already voted using KV
      const existingVote = await kv.get(`vote_${userId}`);

      if (existingVote) {
        return res.status(400).json({ error: 'User has already voted' });
      }

      // Store the new vote in KV
      await kv.set(`vote_${userId}`, vote);

      // Increment the vote count in KV
      if (vote === 'yes') {
        await kv.incr('yesVotes');
      } else if (vote === 'no') {
        await kv.incr('noVotes');
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error storing vote:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
