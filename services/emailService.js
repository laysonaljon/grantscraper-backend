import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like Outlook, etc.
  auth: {
    user: process.env.EMAIL_USER, // Use the email from .env
    pass: process.env.EMAIL_PASS, // Use the password from .env
  },
});

/**
 * Generates a styled HTML email body.
 * @param {string} title - The title of the email.
 * @param {string} content - The main content of the email.
 * @returns {string} - The complete HTML string for the email.
 */
const generateEmailBody = (title, content) => {
  return `
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
            border-radius: 15px; /* Rounded corners */
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            width: 80%; /* Set width to 80% of the viewport */
            max-width: 600px; /* Maximum width */
            margin: auto; /* Center the container */
          }
          h1 {
            color: #333333;
            font-size: 20px; /* Smaller title size */
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
            display: block; /* Make it a block element */
            background-color: #800000; /* Maroon background */
            border-radius: 8px; /* Rounded corners */
            padding: 20px; /* Increased padding for height */
            margin-bottom: 10px; /* Space between cards */
            box-shadow: 0 1px 3px rgba(0,0,0,0.2); /* Subtle shadow for depth */
            text-align: center; /* Center text */
            color: white; /* Set text color to white */
            text-decoration: none; /* Remove underline */
            transition: background-color 0.2s, transform 0.2s; /* Smooth transition for hover effect */
            min-height: 50px; /* Set minimum height for consistency */
          }
          .scholarship-card:hover {
            background-color: #6b0000; /* Darker shade on hover */
            transform: scale(1.02); /* Slightly enlarge on hover */
          }
          .scholarship-link {
            color: white; /* Ensure scholarship title is white */
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
};

/**
 * Formats a date to "Month Day, Year" format.
 * @param {string} dateString - The date string to format.
 * @returns {string} - Formatted date string.
 */
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Sends a subscription email.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} scholarshipName - The name of the subscribed scholarship.
 * @param {string} scholarshipLink - The link to view the scholarship details.
 */
const subscribeEmail = async (to, subject, scholarshipName, scholarshipLink) => {
  const title = 'Welcome to Our Platform!';
  const content = `Hi there, welcome! You have subscribed to the scholarship: <strong>${scholarshipName}</strong>.<br><br>You can view the scholarship details here.`;

  const htmlBody = generateEmailBody(title, content);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlBody,
    });
    console.log('Subscription email sent successfully');
  } catch (error) {
    console.error('Error sending subscription email:', error);
    throw new Error('Failed to send subscription email');
  }
};

/**
 * Sends a recommendation email.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {Array} scholarships - List of recommended scholarships.
 */
const recommendEmail = async (to, subject, scholarships) => {
  const title = 'Scholarship Recommendations Just for You!';
  
  let content = `Hi there, here are some scholarships you might like based on your preferences:<br><br>`;
  
  scholarships.forEach(scholarship => {
    const formattedDeadline = formatDate(scholarship.deadline); // Format deadline
    content += `
      <a href="${process.env.DASHBOARD}/${scholarship._id}" target="_blank" class="scholarship-card">
        <strong class="scholarship-link">${scholarship.name}</strong><br />
        <span class="scholarship-link">${formattedDeadline}</span> <!-- Display formatted deadline -->
      </a>
    `;
  });

  const htmlBody = generateEmailBody(title, content);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlBody,
    });
    console.log('Recommendation email sent successfully');
  } catch (error) {
    console.error('Error sending recommendation email:', error);
    throw new Error('Failed to send recommendation email');
  }
};

// Export both functions
export {
  subscribeEmail,
  recommendEmail,
};
