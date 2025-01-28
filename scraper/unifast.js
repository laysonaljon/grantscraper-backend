import request from 'request-promise';
import * as cheerio from 'cheerio';

const pageURL = `https://unifast.gov.ph/tes.html`;
const baseUrl = 'https://unifast.gov.ph';

const scrapeUnifast = async () => {
    const unifastData = [];

    try {
        const html = await request(pageURL);
        const $ = cheerio.load(html);

        // Function to clean text by replacing newlines with a single space
        const cleanText = (text) => {
            return text.replace(/\n+/g, ' ') // Replace multiple newlines with a single space
                       .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
                       .trim(); // Trim leading and trailing whitespace
        };

         // Function to convert text to title case (capitalize first letter only)
        const toTitleCase = (text) => {
            return text.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
        };

        // Function to extract program details
        const extractProgramDetails = (programSelector) => {
            const program = {
                name: toTitleCase(cleanText($(programSelector).find('.page-title').text())),
                description: cleanText($(programSelector).find('.fs-5').first().text()),
                level: 'College', // Set level to College
                type: 'Need-based', // Set type to Need-based
                deadline: 'Ongoing', // Set deadline to Ongoing
                source: {
                    link: pageURL, // Source link
                    site: 'UniFAST' // Source site name
                },
                eligibility: [],
                benefits: [],
                requirements: [],
                misc: []
            };

            // Extract eligibility criteria
            $(programSelector).find('.faq-list ol').first().find('li').each((index, element) => {
                const eligibilityText = cleanText($(element).text());
                if (eligibilityText) program.eligibility.push(eligibilityText);
            });

            // Extract benefits for Tertiary Education Subsidy (TES)
            if (program.name.includes("Tertiary Education Subsidy")) {
                $(programSelector).find('.faq-sub-container .col-6').first().find('ul li').each((index, element) => {
                    const benefitText = cleanText($(element).text());
                    if (benefitText) program.benefits.push(benefitText);
                });
            }

            // Extract benefits for Tulong Dunong Program
            if (program.name.includes("Tulong Dunong Program")) {
                const benefitsTitleElement = $(programSelector).find('.faq-title:contains("Benefits")');
                if (benefitsTitleElement.length) {
                    const benefitsArray = [];
                    benefitsTitleElement.nextAll('p').each((index, element) => {
                        const benefitText = cleanText($(element).text());
                        if (benefitText) benefitsArray.push(benefitText);
                    });

                    if (benefitsArray.length) {
                        program.benefits.push(benefitsArray.join(' '));
                    }
                }
            }

            // Extract documentary requirements
            $(programSelector).find('.faq-sub-container .col-6').last().find('ul li').each((index, element) => {
                const requirementText = cleanText($(element).text());
                if (requirementText) program.requirements.push(requirementText);
            });

            // Extract downloadable resources
            $(programSelector).find('a[download]').each((index, element) => {
                const resourceText = cleanText($(element).text());
                const resourceLink = $(element).attr('href');
                if (resourceLink) {
                    program.misc.push({
                        type: resourceText,
                        data: `${baseUrl}/${resourceLink}`,
                    });
                }
            });

            return program;
        };

        // Scrape each program individually
        $('.faq-container').each((index, element) => {
            const programDetails = extractProgramDetails(element);
            unifastData.push(programDetails);
        });

        console.log(JSON.stringify(unifastData, null, 2)); // For debugging
        return unifastData;
    } catch (error) {
        console.error(`Error scraping Unifast data: ${error.message}`);
        return [];
    }
};

export default scrapeUnifast;
