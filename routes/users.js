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
      return res.status(404).json({ error: 'Scholarship not found' });
    }

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
    await subscribeEmail(email, 'Welcome to Our Platform!', scholarship);

    res.status(200).json({
      type: 'success',
      message: 'Subscription Successful!',
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
              type,
              deleted_at: null // Exclude soft-deleted scholarships
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

      await recommendEmail(email, 'Scholarship Recommendations Just for You!', recommendedScholarships);
      processedEmails.add(email);
    }

    res.status(200).json({ message: 'Emails sent successfully to all users.' });
  } catch (error) {
    console.error('Error while sending emails to users:', error);
    res.status(500).json({ error: 'Failed to send emails to users.' });
  }
});

router.post('/recommend-test', async (req, res) => {
  try {
    const targetEmail = 'aljonlayson21@gmail.com';

    // Fetch the user's preferences (level and type) for the target email
    // This assumes a user with this email exists and has preferences.
    // If a user can have multiple entries with different levels/types,
    // we need to aggregate them as done in the original logic.
    const userEntries = await Users.find({ email: targetEmail }, 'level type');

    if (userEntries.length === 0) {
      return res.status(404).json({ message: `No user data found for ${targetEmail}. Cannot generate recommendations.` });
    }

    // Aggregate preferences for the target user, similar to the original logic
    const userPreferences = {
      levels: new Set(),
      types: new Set()
    };
    userEntries.forEach(entry => {
      if (entry.level) userPreferences.levels.add(entry.level);
      if (entry.type) userPreferences.types.add(entry.type);
    });

    const levels = Array.from(userPreferences.levels);
    const types = Array.from(userPreferences.types);

    // Initialize recommendations
    let recommendedScholarships = [];

    // 1. Scholarships matching both levels and types
    if (levels.length > 0 && types.length > 0) {
      for (const level of levels) {
        for (const type of types) {
          const scholarships = await Scholarships.find({
            level,
            type,
            deleted_at: null // Exclude soft-deleted scholarships
          });
          recommendedScholarships.push(...scholarships);
        }
      }
    }

    // 2. If no scholarships match both levels and types, get scholarships matching only levels
    if (recommendedScholarships.length === 0 && levels.length > 0) {
      for (const level of levels) {
        const byLevel = await Scholarships.find({
          level,
          deleted_at: null // Exclude soft-deleted scholarships
        });
        recommendedScholarships.push(...byLevel);
      }
    }

    // 3. If still no matches, get scholarships matching only types
    if (recommendedScholarships.length === 0 && types.length > 0) {
      for (const type of types) {
        const byType = await Scholarships.find({
          type,
          deleted_at: null // Exclude soft-deleted scholarships
        });
        recommendedScholarships.push(...byType);
      }
    }

    // 4. If no matches at all, recommend random scholarships
    if (recommendedScholarships.length === 0) {
      const randomScholarships = await Scholarships.aggregate([
        { $match: { deleted_at: null } }, // Ensure random sample is not deleted
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

    // Send the email to the specific user
    await recommendEmail(targetEmail, 'Scholarship Recommendations Just for You! (Test)', recommendedScholarships);

    res.status(200).json({ message: `Test recommendation email sent successfully to ${targetEmail}.` });
  } catch (error) {
    console.error('Error while sending test recommendation email to aljonlayson21@gmail.com:', error);
    res.status(500).json({ error: 'Failed to send test recommendation email.', details: error.message });
  }
});

export default router;
