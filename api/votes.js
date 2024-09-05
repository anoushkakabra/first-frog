import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get the current vote counts from KV
      const yesVotes = (await kv.get('yesVotes')) || 0;
      const noVotes = (await kv.get('noVotes')) || 0;

      return res.status(200).json({ yes: yesVotes, no: noVotes });
    } catch (error) {
      console.error('Error fetching votes:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
