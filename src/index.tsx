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
  let userVote = null;

  const userId = getUserId();

  try {
    // Check if the user has already voted using KV
    userVote = await kv.get(`vote_${userId}`);
    if (!userVote && vote) {
      // Store the new vote in KV
      await kv.set(`vote_${userId}`, vote);

      // Increment the vote count in KV
      if (vote === 'yes') {
        await kv.incr('yesVotes');
      } else if (vote === 'no') {
        await kv.incr('noVotes');
      }

      // Mark the user's vote as completed
      userVote = vote;
    }

    // Fetch the updated vote counts from KV
    yesVotes = (await kv.get('yesVotes')) || 0;
    noVotes = (await kv.get('noVotes')) || 0;
  } catch (error) {
    console.error('Error with vote management:', error);
  }

  return c.res({
    image: (
      <div
        style={{
          position: 'relative', 
          height: '100vh',
          width: '100%',
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('https://cdn.analyticsvidhya.com/wp-content/uploads/2024/03/Stock-Market-Prediction-Using-Machine-Learning-.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
            opacity: vote ? 0.5 : 1, // Only background gets this opacity change
            transform: vote ? 'scale(1.5)' : 'scale(1)', // Only background zooms
            display: 'flex',
          }}
        ></div>
  

        <div
          style={{
            position: 'relative', // Make sure the text stays on top of the background
            fontSize: '3rem',
            marginBottom: '20px',
            padding: '0 60px',
            whiteSpace: 'pre-wrap',
            fontWeight: 400,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
            opacity: vote ? 1 : 0, // Fade in effect for the text content
            transition: 'opacity 1s ease-in-out, transform 1s ease-in-out', // Animation for fading in
            transform: vote ? 'translateY(0)' : 'translateY(-50px)', // Slide up effect for text
            color: 'white',
            display: 'flex',
          }}
        >
          {userVote
            ? `You voted: ${userVote}. \nCurrent results:\nYes - ${yesVotes}, No - ${noVotes}`
            : 'Vote in the Kramer Contest!\nThere will be over 10,000 Kramer predictions before 9/29 midnight!'}
        </div>
      </div>
    ),
    intents: userVote
      ? [] // If user has already voted, no buttons are shown
      : [
          <Button value="yes">👍 Yes</Button>,
          <Button value="no">👎 No</Button>,
        ],
  });  
});

devtools(app, { serveStatic });
