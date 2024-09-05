import { serveStatic } from '@hono/node-server/serve-static';
import { Button, Frog, TextInput } from 'frog';
import { devtools } from 'frog/dev';
import axios from 'axios'; // For backend calls to update the vote count

export const app = new Frog({
  title: 'Kramer Contest Frame',
});

app.use('/*', serveStatic({ root: './public' }));

// Utility function to get or set a persistent userId
const getUserId = () => {
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }
  return `user-${Math.random().toString(36).substring(2, 15)}`;
};

// Define frame for the Kramer voting contest
app.frame('/', async (c) => {
  const { buttonValue, inputText, status } = c;
  
  const vote = buttonValue;
  let yesVotes = 0;
  let noVotes = 0;

  if (vote) {
    const userId = getUserId();
    
    try {
      // Send vote to the Vercel API
      await axios.post('/api/vote', { userId, vote });
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
    
    // Fetch current vote counts from the Vercel API
    try {
      const response = await axios.get('/api/votes');
      yesVotes = response.data.yes;
      noVotes = response.data.no;
    } catch (error) {
      console.error('Error fetching votes:', error);
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
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
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
