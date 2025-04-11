import cron from 'node-cron';
import scrapeDataJob from './crons/scrapeData.js';
import sendRecommendations from './crons/sendRecommendations.js';
import deleteOutdated from './crons/deleteOutdated.js'; 

const initializeCronJobs = () => {
  // Run at 10:40 AM every day
  cron.schedule('40 10 * * *', () => {
    console.log('Running daily scheduled tasks at 10:40 AM...');
    sendRecommendations();
    deleteOutdated();
  });
};

export default initializeCronJobs;
