import request from 'request-promise';
import * as cheerio from 'cheerio';
import { extractProgramsFromFields } from '../utils/programExtractor.js';

const pageURL = `https://www.tesda.gov.ph/barangay/`;

const scrapeTesda = async () => {
    const tesda = [];
    try {
        const html = await request(pageURL);
        const $ = cheerio.load(html);

        // Iterate over each scholarship section
        $('.row.content').each((index, element) => {
            const scholarship = {
                name: $(element).find('h3').first().text().trim(),
                description: '', // Initialize description
                deadline: 'Ongoing', // Set current date or define a specific date if available
                type: 'Grant', // Set type to Grant
                level: 'Vocational', // Set level to Vocational
                eligibility: [],
                benefits: [],
                requirements: [], // You may need to extract this from the page if available
                source: {
                    link: pageURL,
                    site: 'TESDA'
                },
                misc: [], // Populate if there are any miscellaneous data points
                deleted_at: null // Default value for soft delete field
            };

            // Extract description text and join into a single string
            const description = [];
            $(element).find('p:not(.font-italic)').each((i, p) => {
                const descText = $(p).text().trim();
                if (descText) {
                    description.push(descText);
                }
            });
            scholarship.description = description.join(' '); // Combine into a single string

            // Extract programs from all text content
            scholarship.programs = extractProgramsFromFields({
                name: scholarship.name,
                description: scholarship.description,
                benefits: scholarship.benefits,
                eligibility: scholarship.eligibility,
                requirements: scholarship.requirements
            });

            if (index === 0) {
                $(element).find('.col-md-6[data-aos="fade-up"] ul li').each((i, li) => {
                    const eligibilityText = $(li).text().trim();
                    if (eligibilityText) {
                        scholarship.eligibility.push(eligibilityText);
                    }
                });
            } else {
                $(element).find('.col-md-6[data-aos="fade-up"]').first().find('ul li').each((i, li) => {
                    const eligibilityText = $(li).text().trim();
                    if (eligibilityText) {
                        scholarship.eligibility.push(eligibilityText);
                    }
                });

                $(element).find('.col-md-6[data-aos="fade-up"]').last().find('ul li').each((i, li) => {
                    const benefitText = $(li).text().trim();
                    if (benefitText) {
                        scholarship.benefits.push(benefitText);
                    }
                });
            }

            tesda.push(scholarship);
        });

        return tesda;
    } catch (error) {
        console.error(`Error scraping TESDA data: ${error.message}`);
        return [];
    }
};

export default scrapeTesda;
