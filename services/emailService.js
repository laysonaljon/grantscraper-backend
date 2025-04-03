import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Generates a styled HTML email body.
 * @param {string} title - The title of the email.
 * @param {string} content - The main content of the email.
 * @returns {string} - The complete HTML string for the email.
 */
const generateEmailBody = (title, content) => `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 80%;
          max-width: 600px;
          margin: auto;
        }
        h1 {
          color: #333333;
          font-size: 20px;
        }
        p {
          color: #555555;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #888888;
        }
        .scholarship-card {
          display: block;
          background-color: #800000;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          text-align: center;
          color: white;
          text-decoration: none;
          transition: background-color 0.2s, transform 0.2s;
          min-height: 50px;
        }
        .scholarship-card:hover {
          background-color: #6b0000;
          transform: scale(1.02);
        }
        .scholarship-link {
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>${content}</p>
        <div class="footer">
          <p>Thank you for being part of our community!</p>
        </div>
      </div>
    </body>
  </html>
`;

/**
 * Formats a date to "Month Day, Year" format.
 * @param {string} dateString - The date string to format.
 * @returns {string} - Formatted date string.
 */
const formatDate = (dateString) => {
  if (dateString === 'Ongoing') return 'Ongoing';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Generates the HTML for a scholarship card.
 * @param {Object} scholarship - Scholarship details.
 * @returns {string} - HTML string for the scholarship card.
 */
const generateScholarshipCard = (scholarship) => {
  const formattedDeadline = formatDate(scholarship.deadline);
  return `
    <a href="${process.env.DASHBOARD}/${scholarship._id}" target="_blank" class="scholarship-card">
      <strong class="scholarship-link">${scholarship.name}</strong><br />
      <span class="scholarship-link">${formattedDeadline}</span><br />
      <span class="scholarship-link">${scholarship.level}</span><br />
      <span class="scholarship-link">${scholarship.type}</span><br />
    </a>
  `;
};

/**
 * Sends an email.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} htmlBody - The HTML body of the email.
 */
const sendEmail = async (to, subject, htmlBody) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlBody,
    });
    console.log(`${subject} email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending ${subject} email:`, error);
    throw new Error(`Failed to send ${subject} email`);
  }
};

/**
 * Sends a subscription email.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {Object} scholarship - The subscribed scholarship.
 */
const subscribeEmail = async (to, subject, scholarship) => {
  const content = `Hi there, welcome! You have subscribed to the scholarship:<br><br>
    ${generateScholarshipCard(scholarship)}`;
  const htmlBody = generateEmailBody('Welcome to Our Platform!', content);
  await sendEmail(to, subject, htmlBody);
};

/**
 * Sends a recommendation email.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {Array} scholarships - List of recommended scholarships.
 */
const recommendEmail = async (to, subject, scholarships) => {
  const content = `Hi there, here are some scholarships you might like based on your preferences:<br><br>
    ${scholarships.map(generateScholarshipCard).join('')}`;
  const htmlBody = generateEmailBody('Scholarship Recommendations Just for You!', content);
  await sendEmail(to, subject, htmlBody);
};

export { subscribeEmail, recommendEmail };
