import request from 'request-promise';
import * as cheerio from 'cheerio';

const pageURL = `https://www.hau.edu.ph/admissions/scholarship-and-grants`;

const identifyType = (text) => {
    if (/\b(financial need|low income|disadvantaged|need-based|indigent|indigency|scholarship for the poor)\b/i.test(text)) {
        return 'Need-based';
    }
    if (/\b(grant|funding|financial aid|assistance|stipend|subsidy)\b/i.test(text)) {
        return 'Grant';
    }
    if (/\b(valedictorian|rank|merit|excellence|academic achievement|accomplishments|honors|scholastic|score|gwa|top student|valedictorian|summa|magna|cum laude)\b/i.test(text)) {
        return 'Merit';
    }
    if (/\b(athlete|sports|olympic|athletic|varsity|sports-related)\b/i.test(text)) {
        return 'Athletic';
    }
    if (/\b(art|music|painting|dance|theater|creative|design|fine arts|performing arts)\b/i.test(text)) {
        return 'Art';
    }
    return 'Grant';
};

const scrapeHAU = async () => {
    try {
        const html = await request({
            uri: pageURL,
            rejectUnauthorized: false,
            strictSSL: false
        });

        const $ = cheerio.load(html);

        let scholarships = [];
        let level = 'College'; // Default level

        // Process sections in order
        $('p.default-text-color.primary-font.bold.mt-20.text-uppercase').each((i, header) => {
            const sectionTitle = $(header).text().trim();
            if (sectionTitle === 'Senior High School') {
                level = 'Basic Education';
            }

            // Find scholarship tab links within this section
            const tabContainer = $(header).next('.nav-tabs-wrapper');
            tabContainer.find('.nav-tabs a[data-toggle="tab"]').each((index, element) => {
                const anchor = $(element);
                const name = anchor.text().trim();
                const tabId = anchor.attr('href');

                if (name && tabId && tabId.startsWith('#')) {
                    const tabContent = tabContainer.find(tabId);

                    // Extract and format description from <p> and lists <ul>/<ol>
                    let description = "";
                    let foundRequirements = false;
                    let benefits = [];

                    tabContent.children().each((_, elem) => {
                        const tag = $(elem).prop("tagName");
                        const textContent = $(elem).text().trim();

                        if (tag === "P" && !textContent.toLowerCase().includes("requirements:")) {
                            if (description) description += "\n"; // Separate paragraphs
                            description += textContent;
                        }

                        else if ((tag === "UL" || tag === "OL") && !foundRequirements) {
                            let formattedList = [];
                            $(elem).find("li").each((_, li) => {
                                const listItem = $(li).text().trim();
                                formattedList.push(listItem);
                            });

                            // If the list is a list of benefits, store separately
                            if (description === "") {
                                benefits = [...formattedList];
                            } else {
                                description += `\n${formattedList.join("\n")}\n`;
                            }
                        }

                        if (textContent.toLowerCase().includes("requirements:")) {
                            foundRequirements = true;
                        }
                    });

                    // Extract eligibility (eligibility) from <td> containing "eligibility:"
                    const eligibility = [];
                    tabContent.find('td:contains("eligibility:")').next('td').find('li').each((_, li) => {
                        eligibility.push($(li).text().trim());
                    });

                    // Extract eligibility from the specified table structure
                    let qualificationTdFound = false;  // Flag to ensure we only process the FIRST td with the style
                    tabContent.find('td[style="width: 48.527%;"]').each((index, td) => {
                        if (!qualificationTdFound) {  // Check if we've already processed the qualification TD
                            const ul = $(td).find('ul');
                            if (ul.length) {
                                ul.find('li').each((_, li) => {
                                    eligibility.push($(li).text().trim());
                                });
                                qualificationTdFound = true; // Set the flag to prevent further processing
                            }
                        }
                    });

                    // Extract requirements from <td> containing "REQUIREMENTS:"
                    const requirements = [];
                    tabContent.find('td:contains("REQUIREMENTS:")').next('td').find('li').each((_, li) => {
                        requirements.push($(li).text().trim());
                    });

                    // Alternative requirement extraction from other formats
                    tabContent.find('p:contains("REQUIREMENTS:"), p:contains("Requirements:")').next('ol').find('li').each((_, li) => {
                        requirements.push($(li).text().trim());
                    });

                    // Extract requirements from the specified table structure
                    let requirementTdFound = false;

                    tabContent.find('td[style="width: 48.527%;"]').each((index, td) => {
                        if (qualificationTdFound && !requirementTdFound) {
                            const ol = $(td).find('ol');
                            if (ol.length) {
                                ol.find('li').each((_, li) => {
                                    requirements.push($(li).text().trim());
                                });
                                requirementTdFound = true;

                            }
                        }
                    });

                    // Identify Type
                    const type = identifyType(`${name} ${description} ${requirements} ${eligibility.join(' ')}`);

                    scholarships.push({
                        name,
                        description,
                        eligibility,
                        requirements,
                        benefits,
                        deadline: 'Ongoing',
                        level,
                        type,
                        source: {
                            link: pageURL,
                            site: 'HAU Scholarships & Grants'
                        }
                    });
                }
            });
        });

        return scholarships;
    } catch (error) {
        console.error("Error scraping the page:", error);
        throw error;
    }
};

export default scrapeHAU;
