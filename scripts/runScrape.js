// scripts/runScrape.js
import scrapeDataJob from '../src/crons/scrapeData.js'; // Adjust path based on your project structure
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the root .env file if running locally
// Render will provide these as environment variables in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Starting scrape data cron job...');

scrapeDataJob()
  .then(() => {
    console.log('Scrape data cron job finished.');
    process.exit(0); // Exit successfully
  })
  .catch((error) => {
    console.error('Scrape data cron job failed:', error);
    process.exit(1); // Exit with an error code
  });