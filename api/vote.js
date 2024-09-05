// ./api/vote.js

import { Database } from 'sqlite3';

const db = new Database('./votes.db');

export default async function handler(req, res) {
  const { userId, vote } = req.body;

  if (req.method === 'POST') {
    // Check if the user has already voted
    db.get('SELECT * FROM votes WHERE userId = ?', [userId], (err, row) => {
      if (row) {
        return res.status(400).json({ error: 'User has already voted' });
      }

      // Insert new vote
      db.run('INSERT INTO votes (userId, vote) VALUES (?, ?)', [userId, vote], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        return res.status(200).json({ success: true });
      });
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
