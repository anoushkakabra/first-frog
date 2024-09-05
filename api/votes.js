// ./api/votes.js

import { Database } from 'sqlite3';

const db = new Database('./votes.db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    db.all('SELECT vote, COUNT(*) AS count FROM votes GROUP BY vote', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const voteCounts = { yes: 0, no: 0 };
      rows.forEach(row => {
        if (row.vote === 'yes') {
          voteCounts.yes = row.count;
        } else if (row.vote === 'no') {
          voteCounts.no = row.count;
        }
      });

      return res.status(200).json(voteCounts);
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
