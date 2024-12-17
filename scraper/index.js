import careersFilipino from './careersFilipino.js';

const runScraper = async () => {
  try {
    console.log('Starting all scrapers...');

    // Run all scrapers in parallel
    const results = await Promise.all([
      careersFilipino(),
    ]);

    // Combine results into one JSON object
    const combinedData = results.map(result => ({
      data: result.data,
    }));

    console.log('Combined Scraped Data:', JSON.stringify(combinedData, null, 2));
  } catch (error) {
    console.error('Error running scrapers:', error.message);
  }
};

export default runScraper;