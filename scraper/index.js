import scrapeTesda from './tesda.js';
import scrapeUnifast from './unifast.js';
import philscholar from './philscholar.js';
import scrapeHAU from './hau.js';
import scrapeUPDOICA from './updOICA.js';

const runScraper = async () => {
  try {
    console.log('Starting all scrapers...');

    // Run all scrapers in parallel
    const results = await Promise.all([
      scrapeTesda(),
      scrapeUnifast(),
      scrapeUPDOICA(),
      scrapeHAU(),
      philscholar(),
    ]);

    // Combine results into a single array
    const combinedData = results.reduce((acc, result) => {
      if (Array.isArray(result)) {
        acc = acc.concat(result); // Merge arrays
      } else if (result && typeof result === 'object' && result.data) {
        acc = acc.concat(result.data); // Merge if there's a `data` key with array
      }
      return acc;
    }, []);
    return combinedData;
  } catch (error) {
    console.error('Error running scrapers:', error.message);
    throw error; // Re-throw the error to be caught by the endpoint
  }
};

export default runScraper;