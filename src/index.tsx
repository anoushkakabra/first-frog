import { serveStatic } from '@hono/node-server/serve-static';
import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { kv } from '@vercel/kv'; // Import Vercel KV for vote storage
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Frog app
export const app = new Frog({
  title: 'Kramer Contest Frame',
});

app.use('/*', serveStatic({ root: './public' }));

// Utility function to get or set a persistent userId
const getUserId = () => {
  if (typeof window === 'undefined') return `user-${Math.random().toString(36).substring(2, 15)}`;

  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

// Define frame for the Kramer voting contest
app.frame('/', async (c) => {
  const { buttonValue, status } = c;
  const vote = buttonValue;
  let yesVotes = 0;
  let noVotes = 0;

  if (vote) {
    const userId = getUserId();

    try {
      // Check if the user has already voted using KV
      const existingVote = await kv.get(`vote_${userId}`);

      if (!existingVote) {
        // Store the new vote in KV
        await kv.set(`vote_${userId}`, vote);

        // Increment the vote count in KV
        if (vote === 'yes') {
          await kv.incr('yesVotes');
        } else if (vote === 'no') {
          await kv.incr('noVotes');
        }
      }
    } catch (error) {
      console.error('Error storing vote:', error);
    }

    // Fetch the updated vote counts from KV
    try {
      yesVotes = (await kv.get('yesVotes')) || 0;
      noVotes = (await kv.get('noVotes')) || 0;
    } catch (error) {
      console.error('Error fetching vote counts:', error);
    }
  }

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: '3rem',
            fontFamily: 'Helvetica, Arial, sans-serif',
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {status === 'response'
            ? `You voted: ${vote}. \nCurrent results:\nYes - ${yesVotes}, No - ${noVotes}`
            : 'Vote in the Kramer Contest!'}
        </div>
      </div>
    ),
    intents: [
      <Button value="yes">👍 Yes</Button>,
      <Button value="no">👎 No</Button>,
    ],
  });
});

// Enable devtools for testing
devtools(app, { serveStatic });
