import request from 'request-promise';
import * as cheerio from 'cheerio';

const pageURL = 'https://oica.upd.edu.ph/grants-awards/';

const scrapeUPDOICA = async () => {
    try {
        const html = await request(pageURL);
        const $ = cheerio.load(html);

        let scholarships = [];
        const grantLinks = [];

        $('a.btn-primary').each((_, element) => {
            const link = $(element).attr('href');
            if (link) grantLinks.push(link);
        });

        for (const grantLink of grantLinks) {
            try {
                const grantHTML = await request(grantLink);
                const $grant = cheerio.load(grantHTML);

                const name = $grant('h1.entry-title').text().trim();
                const description = $grant('p.has-text-align-justify').first().text().trim();
                const link = grantLink;

                // Extract eligibility criteria
                let eligibility = [];
                $grant('.wpsm_panel-title').each((_, element) => {
                    const title = $(element).text().trim();
                    if (title.toUpperCase().includes("ELIGIBILITY") || title.toUpperCase().includes("ELIGIBLE")) {
                        const panel = $grant(element).closest('.wpsm_panel');
                        panel.find('ol li').each((_, li) => {
                            eligibility.push($grant(li).text().trim());
                        });
                        return false;
                    }
                });

                // Check for additional eligibility under "Eligible applicants"
                $grant('p.has-text-align-left').each((_, element) => {
                    if ($grant(element).text().trim().startsWith("1. Eligible applicants")) {
                        const nextOl = $grant(element).next('ol');
                        if (nextOl.length) {
                            nextOl.html().split('<br>').forEach(item => {
                                let eligibilityItem = item.trim();
                                eligibilityItem = eligibilityItem.replace(/^[a-zA-Z]\. /, '').trim();
                                eligibilityItem = eligibilityItem.replace(/<em>/g, '').replace(/<\/em>/g, '').trim();
                                if (eligibilityItem) eligibility.push(eligibilityItem);
                            });
                        }
                    }
                });

                eligibility = [...new Set(eligibility)];

                // Extract benefits
                const benefits = [];
                $grant('.wpsm_panel-title').each((_, element) => {
                    if ($(element).text().trim().includes("ENTITLEMENTS")) {
                        const panel = $grant(element).closest('.wpsm_panel');
                        panel.find('ol li').each((_, li) => {
                            benefits.push($grant(li).text().trim());
                        });
                        return false;
                    }
                });

                const requirements = [];

                $grant('h4.wpsm_panel-title').each((_, element) => {
                    const title = $(element).find('span.ac_title_class').text().trim().toUpperCase();
                    const panelBody = $(element).closest('.wpsm_panel').find('.wpsm_panel-body');
                
                    // Check if this is the "APPLICATION REQUIREMENTS" or "APPLICATION PROCEDURE" section
                    if (title.includes("APPLICATION REQUIREMENTS") || title.includes("APPLICATION PROCEDURE")) {
                
                        // Iterate through each <ol> in the panel body
                        panelBody.find('ol').each((index, olElement) => {
                            const $ol = $grant(olElement);
                            const $ul = $ol.next('ul');
                
                            // Extract title from the OL's first LI
                            const requirementsTitle = $ol.find('li').first().text().trim();
                
                            // Extract the items from the UL's LIs
                            const items = [];
                            if ($ul.length) {  // Check if a UL exists
                                $ul.find('li').each((_, li) => {
                                    const $li = $grant(li);
                                    let text = $li.html().trim().replace(/<strong>/g, '').replace(/<\/strong>/g, '').replace(/<u>/g, '').replace(/<\/u>/g, '');
                                    text = text.replace(/<br\s*\/?>/gi, '\n').replace(/\s+/g, ' ').trim();
                                    if (!/<ul>[\s\S]*?<\/ul>/gi.test(text)) {
                                        items.push(text);
                                    }
                                });
                
                                // Create the requirements object and push it to the array
                                requirements.push({
                                    title: requirementsTitle,
                                    items: items
                                });
                            } else {
                                // If there's no UL, then scrape only the first <ol>'s <li> items
                                if ($ol.is(':first-of-type')) { // Ensure we are processing only the first <ol>
                                    $ol.children('li').each((_, li) => { // Get direct <li> children
                                        const $li = $grant(li);
                                        let text = $li.html().trim()
                                            .replace(/<strong>|<\/strong>|<u>|<\/u>/g, '') // Remove strong and underline tags
                                            .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newline
                                            .replace(/\s+/g, ' ') // Normalize spaces
                                            .trim();
                                        requirements.push(text);
                                    });
                                }
                            }
                        });
                
                        // New condition to scrape the entire <li> content and split by <br>
                        panelBody.find('li').each((_, li) => {
                            const $li = $grant(li);
                            const liText = $li.text().trim();
                
                            if (liText.includes('Submission of the following documents:')) {
                                // Extract the entire HTML content of the <li>
                                let liHtml = $li.html().trim();
                
                                // Clean up the HTML (optional, but recommended)
                                liHtml = liHtml.replace(/<strong>|<\/strong>|<u>|<\/u>/g, ''); // Remove formatting tags
                                liHtml = liHtml.replace(/\s+/g, ' '); // Normalize spaces
                
                
                                const splitRequirements = liHtml.split('<br>');
                                requirements.length = 0; // Clear existing requirements
                
                                splitRequirements.forEach(item => {
                                    let trimmedItem = item.trim();
                                    //Remove "Submission of the following documents:" and letters like a., b., c.
                                    trimmedItem = trimmedItem.replace(/^Submission of the following documents:\s*/i, '');
                                    trimmedItem = trimmedItem.replace(/^[a-z]\.\s*/i, '');
                
                
                                    if (trimmedItem) { // Avoid empty strings
                                        requirements.push(trimmedItem);
                                    }
                                });
                                return false; // Break out of the `each` loop after finding the <li>
                            }
                        });
                
                        return false; // Prevent from scraping other sections
                    }
                });

                scholarships.push({
                    name,
                    description,
                    eligibility,
                    requirements,
                    benefits,
                    deadline: 'Ongoing',
                    level: 'College',
                    type: 'Art',
                    source: {
                        link,
                        site: 'UPD-OICA Grants & Awards'
                    }
                });

            } catch (grantError) {
                console.error(`Failed to scrape grant details for ${grantLink}:`, grantError);
            }
        }

        return scholarships;

    } catch (error) {
        console.error('Scraping error:', error);
        throw new Error('Failed to scrape data');
    }
};

export default scrapeUPDOICA;
