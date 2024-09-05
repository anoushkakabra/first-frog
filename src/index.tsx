import { serveStatic } from '@hono/node-server/serve-static';
import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { kv } from '@vercel/kv'; // Import Vercel KV for vote storage
import dotenv from 'dotenv';
import Confetti from 'react-dom-confetti'; // Confetti animation

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

// Confetti configuration for aesthetic appeal
const confettiConfig = {
  angle: 90,
  spread: 45,
  startVelocity: 45,
  elementCount: 50,
  decay: 0.9,
  colors: ['#bb0000', '#ffffff'],
};

// Define frame for the Kramer voting contest
app.frame('/', async (c) => {
  const { buttonValue, status } = c;
  const vote = buttonValue;
  let yesVotes = 0;
  let noVotes = 0;
  let userVote = null;
  let showConfetti = false;

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
      showConfetti = true; // Trigger confetti when the user votes
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
          alignItems: 'center',
          backgroundImage: `url('https://cdn.psychologytoday.com/sites/default/files/styles/image-article_inline_full_caption/public/field_blog_entry_images/2022-01/image_for_blog_-_the_brain_as_a_prediction_machine_-_key_to_the_self_-_fran_kie_-_adobestock_1.jpeg?itok=wPqRyd8u')`,
          backgroundSize: 'full',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh', // Use full viewport height
          justifyContent: 'center',
          overflow: 'hidden',
          textAlign: 'center',
          width: '100%',
          fontFamily: "'Playfair Display', serif", // Elegant serif font
          color: 'white',
        }}
      >
        {/* Confetti animation */}
        <Confetti active={showConfetti} config={confettiConfig} />

        <div
          style={{
            fontSize: '3rem',
            marginBottom: '20px',
            padding: '0 60px',
            whiteSpace: 'pre-wrap',
            fontWeight: 400,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
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
          <Button value="yes">
            👍 Yes
          </Button>,
          <Button value="no">
            👎 No
          </Button>,
        ],
  });
});

// Enable devtools for testing
devtools(app, { serveStatic });
