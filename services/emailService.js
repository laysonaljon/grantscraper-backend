// services/emailService.js

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like Outlook, etc.
  auth: {
    user: 'aljonlayson21@gmail.com', // Replace with your email
    pass: 'licg uonn ttho tuig', // Replace with your email password or app password
  },
});

/**
 * Sends a subscription email.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} text - The email body.
 */
const subscribeEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: 'aljonlayson21@gmail.com', // Replace with your email
      to,
      subject,
      text,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Sends a recommendation email.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} text - The email body.
 */
const recommendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: 'aljonlayson21@gmail.com', // Replace with your email
      to,
      subject,
      text,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Export both functions
export {
  subscribeEmail,
  recommendEmail,
};
