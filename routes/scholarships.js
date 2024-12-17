import express from 'express';
import Scholarships from '../mongodb/models/scholarships.js';

const router = express.Router();

router.route('/').get(async (req, res) => {
  try {
    // Fetch scholarships where 'deleted_at' is null
    const scholarships = await Scholarships.find();
    res.status(200).json(scholarships);
  } catch (err) {
    console.error('Error fetching scholarships:', err); // Log the error
    res.status(500).json({ success: false, message: 'Fetching scholarships failed, please try again' });
  }
});

// POST endpoint to add multiple scholarships
router.post('/add', async (req, res) => {
  try {
    const scholarships = req.body; // Expecting an array of scholarship objects

    if (!Array.isArray(scholarships) || scholarships.length === 0) {
      return res.status(400).json({ message: 'Invalid input. Expecting a non-empty array of scholarships.' });
    }

    // Validate and save scholarships
    const savedScholarships = await Scholarships.insertMany(scholarships);

    res.status(201).json({ 
      message: `${savedScholarships.length} scholarships added successfully.`,
      scholarships: savedScholarships
    });
  } catch (error) {
    console.error('Error adding scholarships:', error);
    res.status(500).json({ message: 'Error adding scholarships', error: error.message });
  }
});

export default router;
