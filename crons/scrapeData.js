import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const scrapeDataJob = async () => {
  try {
    const apiUrl = `${process.env.API}/scholarships/run-tester`;
    const response = await axios.post(apiUrl);
    console.log('Scraping triggered successfully');
  } catch (error) {
    console.error('Error in scrapeDataJob:', {
      message: error.message,
      stack: error.stack,
    });
  }
};

// Schedule the cron job to run once a week (every Monday at midnight UTC)
cron.schedule('0 0 1 *  *  *', async () => {
  console.log('Running weekly scrape job...');
  //await scrapeDataJob();
});

export default scrapeDataJob;
