import request from 'request-promise';
import * as cheerio from 'cheerio';

const careersFilipinoScraper = async () => {
  let currentPage = 1;
  const scholarships = [];
  let isScraping = true;

  console.log('Starting Careers Filipino scraping...');

  while (isScraping) {
    const pageURL = `https://careersfilipino.com/scholarships/page/${currentPage}/`;
    console.log(`Scraping page ${currentPage}...`);

    try {
      const response = await request(pageURL);
      const $ = cheerio.load(response);

      const pageData = [];
      $('a.ct-media-container').each((_, element) => {
        const link = $(element).attr('href');
        if (link) pageData.push(link);
      });

      if (pageData.length === 0) {
        console.log('No more data found on the page. Scraping complete.');
        isScraping = false;
      } else {
        scholarships.push(...pageData);
        currentPage++;
      }
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`Page ${currentPage} not found (404). Scraping complete.`);
      } else {
        console.error(`Error scraping page ${currentPage}:`, error.message);
      }
      isScraping = false;
    }
  }

  console.log('First scraping round complete. Total URLs scraped:', scholarships.length);

  const scholarshipsWithDetails = [];
  console.log('Starting second round of scraping...');

  for (const url of scholarships) {
    try {
      const detailsResponse = await request(url);
      const details$ = cheerio.load(detailsResponse);

      const name = details$('h2').first().text().trim();
      if (name) {
        scholarshipsWithDetails.push({ name, url });
      } else {
        console.warn(`No <h2> found on page: ${url}`);
      }
    } catch (detailsError) {
      console.error(`Error scraping details from ${url}:`, detailsError.message);
    }
  }

  return {
    data: scholarshipsWithDetails,
  };
};

export default careersFilipinoScraper;
