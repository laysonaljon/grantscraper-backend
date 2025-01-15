import scrapeDataJob from './crons/scrapeData.js';
import sendRecommendations from './crons/sendRecommendations.js';

const initializeCronJobs = () => {
  // scrapeDataJob(); disable scraping temp
  // sendRecommendations();
};

export default initializeCronJobs;
