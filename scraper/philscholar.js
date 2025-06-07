import request from 'request-promise';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';

const identifyLevel = (text) => {
    if (/elementary|high school|k-12|basic education/i.test(text)) return 'Basic Education';
    if (/undergraduate|college|bachelor|tertiary/i.test(text)) return 'College';
    if (/postgraduate|graduate|master'?s|phd|doctorate|advance/i.test(text)) return 'Graduate';
    if (/vocational|technical|trade school|certificate/i.test(text)) return 'Vocational';
    return 'College';
  };
  
  const identifyType = (text) => {
    if (/\b(financial need|low income|disadvantaged|need-based|indigent|indigency|scholarship for the poor)\b/i.test(text)) {
        return 'Need-based';
    }
    if (/\b(grant|funding|financial aid|assistance|stipend|subsidy)\b/i.test(text)) {
        return 'Grant';
    }
    if (/\b(merit|excellence|academic achievement|accomplishments|honors|scholastic|score|gwa|top student|valedictorian|summa|magna|cum laude)\b/i.test(text)) {
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

  
const philscholar = async (testMode = false) => {
  let currentPage = 1;
  const scholarships = [];
  let isScraping = true;

  while (isScraping) {
    try {
      const url = `https://philscholar.com/category/scholarship-programs/page/${currentPage}`;
      const options = {
        uri: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        },
        transform: body => cheerio.load(body)
      };

      const $ = await request(options);

      // Find scholarship titles and links
      const titles = $('h2.wp-block-post-title.has-large-font-size a').map((index, element) => {
        return {
          title: $(element).text(),
          link: $(element).attr('href')
        };
      }).get();

      // Filter out titles containing "List"
      const filteredTitles = titles.filter(title => !title.title.includes('List'));

      for (const { link } of filteredTitles) {
        try {
            const scholarshipOptions = {
                uri: link,
                headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                },
                transform: body => cheerio.load(body)
            };

            const scholarship$ = await request(scholarshipOptions);

            // Extract name from <h1>
            const name = scholarship$('h1.wp-block-post-title.has-x-large-font-size').text().trim().split('|')[0].trim();

            // Extract descriptions
            const heading = scholarship$('h2:contains("About")').first();
            const descriptions = [];
            
            if (heading.length) {
              // Define where to stop: next h2, spacer div, or blockquote
              const stopSelector = 'h2, div.wp-block-spacer[aria-hidden="true"], blockquote';
            
              // Select all <p> elements between heading and the next stop element
              heading.nextUntil(stopSelector, 'p').each((index, element) => {
                descriptions.push(scholarship$(element).text().trim());
              });
            }            
            
            // Join paragraphs with newline breaks
            const description = descriptions.join('\n\n');

            // Extract deadline
            const extractDeadline = (scholarship$) => {
              const extractDates = (selector) => {
                  let dates = [];
                  scholarship$(selector).each((_, el) => {
                      const text = scholarship$(el).text().trim();

                      // Check if deadline has "passed"
                      if (/deadline.*has passed/i.test(text) || /\b(passed|closed)\b/i.test(text)) {
                          dates.push("Passed");
                          return;
                      }

                      // Match possible date formats, including ranges
                      const match = text.match(/\b(?:\d{1,2}[-–]\d{1,2} )?(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2},? \d{4}(?:,? \d{1,2}:\d{2} (AM|PM)?)?\b/g);
                      if (match) {
                          dates.push(match.pop()); // Get the last date in a range
                      }

                      // Handling date ranges like "January 16-24, 2025"
                      const rangeMatch = text.match(/\b(\w+ \d{1,2})[-–](\d{1,2}, \d{4})\b/);
                      if (rangeMatch) {
                          dates.push(`${rangeMatch[1]} ${rangeMatch[2]}`);
                      }


                      // Handling dates found in tables
                      const tableMatch = text.match(/(\d{1,2} [A-Za-z]+ \d{4})/g);
                      if (tableMatch) {
                          dates = dates.concat(tableMatch);
                      }
                  });
                  return dates.length ? dates : null;
              };

              // Extract from relevant elements
              let deadlineTexts = extractDates(`
                  #application-deadline ~ p, 
                  #application-deadline ~ table td, 
                  #application-deadline ~ li, 
                  #application-period-and-key-dates ~ ul, 
                  li:contains("Application Deadline"), 
                  li:contains("Application Period"), 
                  li:contains("Last Day for Filing"), 
                  li:contains("Deadline"), 
                  p:contains("deadline"), 
                  p:contains("apply"), 
                  p:contains("submission"), 
                  table th:contains("Deadline"), 
                  table td:contains("Deadline"), 
                  ul li strong:contains("Deadline"), 
                  ul li strong:contains("Application Period")
              `);

              if (!deadlineTexts) return 'Passed';
              if (deadlineTexts.includes("Passed")) return "Passed";

              // Convert extracted dates to standardized format
              let parsedDates = deadlineTexts.map(dateText => {
                  let cleanDate = dateText.replace(/(st|nd|rd|th)/, '').replace(',', '');
                  let dateFormat = cleanDate.includes(':') 
                      ? 'MMMM D, YYYY, h:mm A' 
                      : ['D MMMM YYYY', 'MMMM D, YYYY'];
                  let date = moment.tz(cleanDate, dateFormat, 'Asia/Manila');
                  return date.isValid() ? date.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : null;
              }).filter(Boolean);

              return parsedDates.length ? parsedDates.pop() : 'Passed'; // Return the last/latest date
            };

            // Usage
            const deadline = extractDeadline(scholarship$);

            // Extract benefits
            const benefits = [];
            let benefitsSection = scholarship$('h2:contains("Benefits"), h2:contains("Scholarship Coverage"), h3:contains("Benefits")').first();

            if (benefitsSection.length) {
            let benefitsList = benefitsSection.nextAll('ul').first();
            benefitsList.find('li').each((index, element) => {
                const benefitText = scholarship$(element).text().trim();
                
                // Remove any item with newline characters
                if (benefitText && !benefitText.includes('\n')) {
                benefits.push(benefitText);
                }
            });
            }

            // Extract eligibility
            const eligibility = [];

            scholarship$('h2:contains("Eligibility"), h2:contains("Qualifications"), h3:contains("Eligibility"), h2:contains("Eligibility Criteria"), h3:contains("Eligibility Criteria")')
            .nextAll()
            .each((_, element) => {
              const el = scholarship$(element);
          
              // Stop processing once we reach a spacer
              if (el.hasClass('wp-block-spacer')) return false;
          
              // Process only ordered and unordered lists
              if (el.is('ol, ul')) {
                el.find('> li').each((_, li) => {
                  const fullText = scholarship$(li).clone().children('ul').remove().end().text().trim();
                  const subItems = scholarship$(li).find('ul li').map((_, subLi) => scholarship$(subLi).text().trim()).get();
          
                  // If the item has nested sub-items, store it properly
                  if (subItems.length) {
                    eligibility.push({ title: fullText, items: subItems });
                  } else {
                    eligibility.push(fullText);
                  }
                });
              }
            });

            // Extract requirements
            const requirements = [];

            // Find all lists following "Requirements" heading and stop at the first .wp-block-spacer
            scholarship$('h3#requirements, h2:contains("Requirements"), h3:contains("Requirements")')
            .nextAll()
            .each((_, element) => {
                const el = scholarship$(element);
            
                // Stop processing once we reach a spacer
                if (el.hasClass('wp-block-spacer')) return false;
            
                // Process only ordered and unordered lists
                // Process only ordered and unordered lists
                if (el.is('ol, ul')) {
                    el.find('> li').each((_, li) => {
                    const fullText = scholarship$(li).clone().children('ul').remove().end().text().trim();
                    const subItems = scholarship$(li).find('ul li').map((_, subLi) => scholarship$(subLi).text().trim()).get();
            
                    // If the item has nested sub-items, store it properly
                    if (subItems.length) {
                        requirements.push({ title: fullText, items: subItems });
                    } else {
                        requirements.push(fullText);
                    }
                    });
                }
            });

            // Extract misc buttons and form links
            const misc = [];
            const seenUrls = new Set();  // Set to track unique URLs

            // Find all anchor tags
 

            // Extract misc buttons (from wp-block-button__link elements)
            scholarship$('.wp-block-button__link').each((_, element) => {
            const el = scholarship$(element);
            
            const linkUrl = el.attr('href');  // Extract the href (URL)
            const buttonText = el.text().trim();  // Extract and trim the text content

            // Only add to misc if the link and text exist and the URL has not been seen
            if (linkUrl && buttonText && !seenUrls.has(linkUrl)) {
                misc.push({
                type: buttonText, // Text inside the button
                data: linkUrl  // URL of the link 
                });
                seenUrls.add(linkUrl);  // Add URL to the set to track it
            }
            });

            // If no misc links are found, return an empty array
            if (misc.length === 0) {
            misc.push([]);
            }

            // Identify Level
            // Level is Either ['Basic Education', 'College', 'Graduate', 'Vocational']
            const level = identifyLevel(`${name} ${description} ${requirements} ${eligibility.join(' ')}`);
  

            // Identify Type
            // Type is Either ['Athletic', 'Art', 'Merit', 'Need-based', 'Grant']
            const type = identifyType(`${name} ${description} ${requirements} ${eligibility.join(' ')}`);

            // Store the result
            scholarships.push({
                name,
                deadline,
                level,
                type,
                description,
                benefits,
                eligibility,
                requirements,
                misc,
                source: {
                link,
                site: 'Philscholar'
                }
            });

            // Add a delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`Error scraping scholarship page: ${link}`, error);
        }
      }

      // Check if there is a next page
      const nextPageLink = $('a.wp-block-query-pagination-next').attr('href');
      if (!nextPageLink || testMode) {
        isScraping = false;
      } else {
        currentPage++;
      }

      // Add a delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error scraping page:', error);
      isScraping = false;
    }
  }

  return scholarships;
};

export default philscholar;
