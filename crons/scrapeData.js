import cron from 'node-cron';
import runScraper from '../scraper/index.js';

export const scrapeDataJob = () => {
  cron.schedule('*/50 * * * * *', async () => {
    try {
      const scrapedData = await runScraper(); 
      // Insert into the database or further process the data here
    } catch (error) {
      console.error('Error in scrapeData job:', error.message);
    }
  });
};

export default scrapeDataJob;
