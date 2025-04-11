import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const scrapeDataJob = async () => {
  console.log('Triggering the /scrape endpoint...');
  const apiUrl = `${process.env.API}/scholarships/run-scraper`;
  try {
    await axios.post(apiUrl);
    console.log('Scraping triggered successfully:', new Date().toLocaleString());
  } catch (error) {
    console.error('Error in scrapeDataJob:', {
      message: error.message,
      stack: error.stack,
    });
  }
};

export default scrapeDataJob;
