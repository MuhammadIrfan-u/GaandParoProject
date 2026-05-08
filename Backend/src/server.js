import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Supabase Database: ${process.env.SUPABASE_URL}`);
});

// Keep-alive to prevent premature exit
setInterval(() => {
  // console.log('Keep-alive ping');
}, 1000 * 60 * 60);
