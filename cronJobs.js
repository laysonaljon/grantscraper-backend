import cron from 'node-cron';
import scrapeDataJob from './crons/scrapeData.js'; // run every 1st and 15th of the month
import sendRecommendations from './crons/sendRecommendations.js'; // every Monday at 7AM
import deleteOutdated from './crons/deleteOutdated.js'; // every day at 5AM

const initializeCronJobs = () => {
  // Run every 1st and 15th of the month at midnight
  cron.schedule('0 0 1,15 * *', () => {
    console.log('Running scrapeDataJob on 1st and 15th...');
    scrapeDataJob();
  });

  // Run every Monday at 7AM
  cron.schedule('0 7 * * 1', () => {
    console.log('Sending recommendations on Monday 7AM...');
    sendRecommendations();
  });

  // Run every day at 5AM
  cron.schedule('0 5 * * *', () => {
    console.log('Deleting outdated data at 5AM...');
    deleteOutdated();
  });
};

export default initializeCronJobs;
