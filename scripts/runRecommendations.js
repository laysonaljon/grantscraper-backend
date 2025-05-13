// scripts/runRecommendations.js
import sendRecommendations from '../src/crons/sendRecommendations.js'; // Adjust path based on your project structure
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the root .env file if running locally
// Render will provide these as environment variables in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });


console.log('Starting recommendations cron job...');

sendRecommendations()
  .then(() => {
    console.log('Recommendations cron job finished.');
    process.exit(0); // Exit successfully
  })
  .catch((error) => {
    console.error('Recommendations cron job failed:', error);
    process.exit(1); // Exit with an error code
  });