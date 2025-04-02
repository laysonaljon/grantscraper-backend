import scrapeDataJob from './crons/scrapeData.js';
import sendRecommendations from './crons/sendRecommendations.js';
import deleteOudated from './crons/deleteOutdated.js';

const initializeCronJobs = () => {
  //scrapeDataJob();
  //sendRecommendations();
  deleteOudated();
};

export default initializeCronJobs;
