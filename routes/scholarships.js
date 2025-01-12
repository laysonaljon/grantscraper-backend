import express from 'express';
import Scholarships from '../mongodb/models/scholarships.js';

const router = express.Router();

// GET all scholarships with sorting and pagination
router.route('/').get(async (req, res) => {
  const { sort, page, limit } = req.query; // Default to page 1 and limit 10 if not provided

  // Define sorting options
  const sortOptions = {};
  if (sort) {
    const sortFields = sort.split(','); // e.g., "name,-level"
    sortFields.forEach(field => {
      const key = field.startsWith('-') ? field.slice(1) : field;
      sortOptions[key] = field.startsWith('-') ? -1 : 1; // -1 for descending, 1 for ascending
    });
  }

  try {
    // Calculate total items and apply pagination
    const totalItems = await Scholarships.countDocuments({ deleted_at: null });
    const scholarships = await Scholarships.find({ deleted_at: null })
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Calculate pagination details
    const totalPages = Math.ceil(totalItems / limit);
    const currentItemsCount = Math.min(Number(page) * Number(limit), totalItems); // Total items sent so far

    res.status(200).json({
      items: scholarships,
      meta: {
        current_items: currentItemsCount,
        current_page: Number(page),
        next_page: Number(page) < totalPages ? Number(page) + 1 : null,
        last_page: totalPages,
        total_items: totalItems,
        sortKey: sort,
      },
    });
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

    // Validate each scholarship object
    for (const scholarship of scholarships) {
      const { name, deadline, type, level, eligibility, benefits, requirements, source, misc } = scholarship;

      // Check required fields
      if (!name || !deadline || !type || !level || !eligibility || !benefits || !requirements || !source) {
        return res.status(400).json({ message: 'All fields are required for each scholarship.' });
      }

      // Validate types
      if (typeof name !== 'string' || typeof type !== 'string' || typeof level !== 'string') {
        return res.status(400).json({ message: 'Name, type, and level must be strings.' });
      }

      if (!Array.isArray(eligibility) || !Array.isArray(requirements) || !Array.isArray(benefits) || !Array.isArray(misc)) {
        return res.status(400).json({ message: 'Eligibility, requirements, benefits, and misc must be arrays.' });
      }

      // Validate deadline format (ISO 8601)
      if (isNaN(new Date(deadline).getTime())) {
        return res.status(400).json({ message: 'Invalid deadline format. Must be a valid date.' });
      }

      // Validate source structure
      if (!source.link || !source.site) {
        return res.status(400).json({ message: 'Source must have a link and a site.' });
      }
      if (typeof source.link !== 'string' || typeof source.site !== 'string') {
        return res.status(400).json({ message: 'Source link and site must be strings.' });
      }

      // Validate misc structure
      for (const item of misc) {
        if (!item.type || !item.data) {
          return res.status(400).json({ message: 'Each misc item must have a type and data.' });
        }
        if (typeof item.type !== 'string' || typeof item.data !== 'string') {
          return res.status(400).json({ message: 'Misc type and data must be strings.' });
        }
      }
    }

    // Save scholarships to the database
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

// GET specific scholarship by ID
router.get('/:scholarshipId', async (req, res) => {
  const { scholarshipId } = req.params;

  try {
    // Find scholarship by ID
    const scholarship = await Scholarships.findById(scholarshipId);

    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }

    res.status(200).json(scholarship);
  } catch (error) {
    console.error(`Error fetching scholarship with ID ${scholarshipId}:`, error);
    res.status(500).json({ message: 'Error fetching scholarship details', error: error.message });
  }
});

export default router;
