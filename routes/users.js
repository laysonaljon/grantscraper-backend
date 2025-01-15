import express from 'express';
import Users from '../mongodb/models/users.js';
import Scholarships from '../mongodb/models/scholarships.js';
import { subscribeEmail, recommendEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  const { email, level, type, scholarship_id } = req.body;


  try {
    // Fetch scholarship details based on scholarship_id
    const scholarship = await Scholarships.findById(scholarship_id);
    if (!scholarship) {
      console.log('Scholarship not found');
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    const scholarshipName = scholarship.name;
    const scholarshipLink = `${process.env.DASHBOARD}/${scholarship_id}`;

    // Check if the user already exists with the same email and scholarship_id
    let existingUser = await Users.findOne({ email, scholarship_id });

    if (existingUser) {
      return res.status(200).json({ 
        type: 'error',
        message: 'Email already favorited this scholarship!' 
      });
    }

    // Create a new user record if no existing user found with the same email and scholarship_id
    const user = await Users.create({ email, scholarship_id, level, type });
    console.log('New user created:', user);

    // Send an email only for new subscriptions
    const subject = 'Welcome to Our Platform!';
    const text = `Hi there, welcome! You have subscribed to the scholarship: ${scholarshipName}.
    
You can view the scholarship details here: ${scholarshipLink}`;
    await subscribeEmail(email, subject, text);
    console.log('Email sent successfully to:', email);

    res.status(201).json({
      type: 'success',
      message: 'Subscription Successful',
      user,
    });
  } catch (error) {
    console.error('Error during user creation or email sending:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recommend', async (req, res) => {
  try {
    // Fetch all users with their associated levels and types
    const users = await Users.find({}, 'email level type');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found to send emails.' });
    }

    const processedEmails = new Set(); // Track unique emails
    const userPreferences = {}; // To store aggregated preferences

    // Aggregate user preferences by email
    users.forEach(user => {
      const { email, level, type } = user;
      if (!userPreferences[email]) {
        userPreferences[email] = { levels: new Set(), types: new Set() };
      }
      userPreferences[email].levels.add(level);
      userPreferences[email].types.add(type);
    });

    // Convert Sets to Arrays for each user
    for (const email in userPreferences) {
      userPreferences[email].levels = Array.from(userPreferences[email].levels);
      userPreferences[email].types = Array.from(userPreferences[email].types);
    }

    for (const email in userPreferences) {
      const { levels, types } = userPreferences[email]; // Get aggregated preferences

      // Skip if email has already been processed
      if (processedEmails.has(email)) {
        continue;
      }

      // Initialize recommendations
      let recommendedScholarships = [];

      // 1. Scholarships matching both levels and types
      if (levels.length > 0 && types.length > 0) {
        for (const level of levels) {
          for (const type of types) {
            const scholarships = await Scholarships.find({
              level,
              type
            });
            recommendedScholarships.push(...scholarships);
          }
        }
      }

      // 2. If no scholarships match both levels and types, get scholarships matching only levels
      if (recommendedScholarships.length === 0 && levels.length > 0) {
        for (const level of levels) {
          const byLevel = await Scholarships.find({
            level
          });
          recommendedScholarships.push(...byLevel);
        }
      }

      // 3. If still no matches, get scholarships matching only types
      if (recommendedScholarships.length === 0 && types.length > 0) {
        for (const type of types) {
          const byType = await Scholarships.find({
            type
          });
          recommendedScholarships.push(...byType);
        }
      }

      // 4. If no matches at all, recommend random scholarships
      if (recommendedScholarships.length === 0) {
        const randomScholarships = await Scholarships.aggregate([
          { $sample: { size: 5 } } // Randomly sample up to 5 scholarships
        ]);
        recommendedScholarships.push(...randomScholarships);
      }

      // Remove duplicates based on scholarship ID using a Set
      const uniqueScholarshipIds = new Set();
      recommendedScholarships = recommendedScholarships.filter(scholarship => {
        const idString = scholarship._id.toString();
        if (!uniqueScholarshipIds.has(idString)) {
          uniqueScholarshipIds.add(idString);
          return true; // Keep this scholarship
        }
        return false; // Skip duplicate scholarship
      });

      // Limit to a maximum of 5 scholarships
      recommendedScholarships = recommendedScholarships.slice(0, 5);

      // Compose the email body with the scholarship recommendations
      const subject = 'Scholarship Recommendations Just for You!';
      let text = `Hi there, here are some scholarships you might like based on your preferences:\n\n`;

      recommendedScholarships.forEach(scholarship => {
        console.log(`Adding scholarship: ${scholarship.name} for ${email}`);
        console.log(`Recommended Scholarship - Level: ${scholarship.level}, Type: ${scholarship.type}`);
        text += `${scholarship.name}\n${process.env.DASHBOARD}/${scholarship._id}\n\n`;
      });

      // Send the email
      try {
        await recommendEmail(email, subject, text);
        processedEmails.add(email); // Mark email as processed
      } catch (error) {
        console.error(`Failed to send email to: ${email}`, error);
      }
    }

    res.status(200).json({ message: 'Emails sent successfully to all users.' });
  } catch (error) {
    console.error('Error while sending emails to users:', error);
    res.status(500).json({ error: 'Failed to send emails to users.' });
  }
});

export default router;
