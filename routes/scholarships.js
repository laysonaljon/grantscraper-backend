import express from 'express';
import Scholarships from '../mongodb/models/scholarships.js';
import runScraper from '../scraper/index.js';

const router = express.Router();

// GET all scholarships with sorting and pagination
router.route('/').get(async (req, res) => {
  const startTime = Date.now();
  const { sort, page, limit, filters = {} } = req.query; // Default to page 1 and limit 10 if not provided

  // Define sorting options
  const sortOptions = {};
  if (sort) {
    const sortFields = sort.split(','); // e.g., "name,-level"
    sortFields.forEach(field => {
      const key = field.startsWith('-') ? field.slice(1) : field;
      sortOptions[key] = field.startsWith('-') ? -1 : 1; // -1 for descending, 1 for ascending
    });
  }

  // Add secondary sorting by name to ensure consistent order
  if (!sortOptions.name) {
    sortOptions.name = 1; // Ascending order by name
  }

  // Build filter object
  const filterCriteria = {};
  for (const key in filters) {
    if (Array.isArray(filters[key])) {
      filterCriteria[key] = { $in: filters[key].map(value => value.trim()) }; // Match any of the values in the array
    } else {
      filterCriteria[key] = filters[key].trim(); // Direct match for single values
    }
  }

  try {
    // Set cache headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      'ETag': `scholarships-${page}-${limit}-${sort}-${JSON.stringify(filters)}`
    });

    // Use aggregation pipeline for better performance with large datasets
    const pipeline = [
      { $match: { deleted_at: null, ...filterCriteria } },
      { $facet: {
        items: [
          { $sort: sortOptions },
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) }
        ],
        totalItems: [
          { $count: 'count' }
        ]
      }}
    ];

    const result = await Scholarships.aggregate(pipeline);
    
    const scholarships = result[0].items.map(scholarship => {
      const { description, eligibility, benefits, requirements, source, misc, ...scholarshipWithoutFields } = scholarship;
      return {
        ...scholarshipWithoutFields,
        programs: (scholarship.name && (
          scholarship.name.toLowerCase().includes('highschool') ||
          scholarship.name.toLowerCase().includes('high school') ||
          scholarship.name.toLowerCase().includes('senior high') ||
          scholarship.name.toLowerCase().includes('junior high school') ||
          scholarship.name.toLowerCase().includes('senior high school') ||
          scholarship.name.toLowerCase().includes('grade 7') ||
          scholarship.name.toLowerCase().includes('certificate')
        )) || scholarship.level === 'Basic Education'
          ? 'N/A' 
          : (scholarship.programs ? scholarship.programs.join(', ') : '')
      };
    });
    const totalItems = result[0].totalItems[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    const responseTime = Date.now() - startTime;
    console.log(`Scholarships API response time: ${responseTime}ms for page ${page}, limit ${limit}`);

    res.status(200).json({
      items: scholarships,
      meta: {
        current_page: Number(page),
        next_page: Number(page) < totalPages ? Number(page) + 1 : null,
        last_page: totalPages,
        total_items: totalItems,
        sortKey: sort,
        response_time_ms: responseTime,
      },
    });
  } catch (err) {
    const responseTime = Date.now() - startTime;
    console.error(`Error fetching scholarships (${responseTime}ms):`, err);
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

// GET endpoint to search scholarships by keyword
router.get('/search', async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
      // Set cache headers for search results
      res.set({
        'Cache-Control': 'public, max-age=180', // Cache for 3 minutes
        'ETag': `search-${keyword}`
      });

      let results;
      
      // Use text search for simple keywords, regex for complex patterns
      if (keyword.length >= 3 && !keyword.includes('$') && !keyword.includes('^')) {
        // Use text search for better performance with simple keywords
        results = await Scholarships.find({
          deleted_at: null,
          $text: { $search: keyword }
        })
        .select('_id name level type')
        .lean()
        .limit(50);
      } else {
        // Fall back to regex search for complex patterns
        const searchRegex = new RegExp(keyword, 'i');
        const query = {
            deleted_at: null,
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { type: searchRegex },
                { level: searchRegex },
                { 'source.link': searchRegex },
                { 'source.site': searchRegex },
                { 'eligibility.title': searchRegex },
                { 'eligibility.items': searchRegex },
                { 'benefits.title': searchRegex },
                { 'benefits.items': searchRegex },
                { 'requirements.title': searchRegex },
                { 'requirements.items': searchRegex },
                { 'misc.type': searchRegex },
                { 'misc.data': searchRegex }
            ]
        };

        results = await Scholarships.find(query)
          .select('_id name level type')
          .lean()
          .limit(50);
      }

      // Transform _id to id for the response
      const transformedResults = results.map(item => ({
          id: item._id.toString(),
          name: item.name,
          level: item.level,
          type: item.type
      }));

      res.status(200).json(transformedResults);
  } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// GET specific scholarship by ID
router.get('/:scholarshipId', async (req, res) => {
  const { scholarshipId } = req.params;

  try {
    // Set cache headers for individual scholarship
    res.set({
      'Cache-Control': 'public, max-age=600', // Cache for 10 minutes
      'ETag': `scholarship-${scholarshipId}`
    });

    // Find scholarship by ID with lean() for better performance
    const scholarship = await Scholarships.findById(scholarshipId).lean();

    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }

    res.status(200).json(scholarship);
  } catch (error) {
    console.error(`Error fetching scholarship with ID ${scholarshipId}:`, error);
    res.status(500).json({ message: 'Error fetching scholarship details', error: error.message });
  }
});

// DELETE endpoint to soft delete scholarships with different criteria
router.delete('/soft-delete', async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ 
        message: 'Type parameter is required. Valid types: all, duplicate, expired' 
      });
    }

    let result;
    let message;

    switch (type) {
      case 'all':
        // Soft delete all non-deleted scholarships
        result = await Scholarships.updateMany(
          { deleted_at: null },
          { $set: { deleted_at: new Date().toISOString() } }
        );
        message = `${result.modifiedCount} scholarship(s) marked as deleted successfully.`;
        break;

      case 'expired':
        // Soft delete scholarships with past deadlines
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        result = await Scholarships.updateMany(
          {
            $or: [
              { deadline: { $lt: today.toISOString() } },
              { deadline: 'Passed' }
            ],
            deleted_at: null
          },
          { $set: { deleted_at: new Date().toISOString() } }
        );
        message = `${result.modifiedCount} expired scholarship(s) marked as deleted successfully.`;
        break;

      case 'duplicate':
        // Find and soft delete duplicate scholarships based on name and deadline
        const duplicates = await Scholarships.aggregate([
          { $match: { deleted_at: null } },
          {
            $group: {
              _id: { name: '$name', deadline: '$deadline' },
              count: { $sum: 1 },
              docs: { $push: '$_id' }
            }
          },
          { $match: { count: { $gt: 1 } } }
        ]);

        if (duplicates.length === 0) {
          return res.status(200).json({ message: 'No duplicate scholarships found.' });
        }

        // Keep the first document of each duplicate group, delete the rest
        const idsToDelete = [];
        duplicates.forEach(group => {
          // Keep the first document, mark others for deletion
          idsToDelete.push(...group.docs.slice(1));
        });

        result = await Scholarships.updateMany(
          { _id: { $in: idsToDelete } },
          { $set: { deleted_at: new Date().toISOString() } }
        );
        message = `${result.modifiedCount} duplicate scholarship(s) marked as deleted successfully.`;
        break;

      default:
        return res.status(400).json({ 
          message: 'Invalid type parameter. Valid types: all, duplicate, expired' 
        });
    }

    if (result.matchedCount === 0) {
      return res.status(200).json({ message: `No scholarships found for type: ${type}` });
    }

    res.status(200).json({
      message,
      deleted_count: result.modifiedCount,
      type
    });
  } catch (error) {
    console.error('Error in soft delete operation:', error);
    res.status(500).json({
      message: 'Error performing soft delete operation',
      error: error.message,
    });
  }
});

// DELETE endpoint to soft delete scholarships with past deadlines (legacy endpoint)
router.delete('/delete-outdated', async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Ensure we compare only the date part

    const result = await Scholarships.updateMany(
      {
        $or: [
          { deadline: { $lt: today.toISOString() } }, // Match past deadlines strictly
          { deadline: 'Passed' } // Match scholarships with deadline as 'Passed'
        ],
        deleted_at: null // Ensure we only update non-deleted records
      },
      { $set: { deleted_at: new Date().toISOString() } } // Soft delete with UTC timestamp
    );

    if (result.matchedCount === 0) {
      return res.status(200).json({ message: 'No expired scholarships found.' });
    }

    res.status(200).json({
      message: `${result.modifiedCount} expired scholarship(s) marked as deleted successfully.`,
    });
  } catch (error) {
    console.error('Error marking expired scholarships as deleted:', error);
    res.status(500).json({
      message: 'Error marking expired scholarships as deleted',
      error: error.message,
    });
  }
});

// Endpoint to run the scraper and conditional save
router.post('/run-scraper', async (req, res) => {
  try {
    const scrapedData = await runScraper();

    // Fetch all scholarships (active and soft-deleted)
    const allScholarships = await Scholarships.find();
    const activeScholarships = allScholarships.filter(scholarship => !scholarship.deleted_at);

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Identify scholarships with past deadlines or marked as "Passed"
    const expiredScholarships = activeScholarships.filter(scholarship => {
      return (
        scholarship.deadline === "Passed" ||
        (scholarship.deadline !== "Ongoing" && scholarship.deadline <= todayStr) // Use <= to include today's date
      );
    });

    // Soft-delete expired scholarships
    if (expiredScholarships.length) {
      await Scholarships.updateMany(
        { _id: { $in: expiredScholarships.map(s => s._id) } },
        { $set: { deleted_at: new Date() } }
      );
    }

    // Filter out expired or "Passed" scholarships from the scraped data
    const validScrapedData = scrapedData.filter(scholarship => {
      return (
        scholarship.deadline !== "Passed" &&
        (scholarship.deadline === "Ongoing" || scholarship.deadline > todayStr)
      );
    });

    // Create a map for active scholarships for efficient lookup
    const activeScholarshipsMap = activeScholarships.reduce((map, scholarship) => {
      map[`${scholarship.name}|${scholarship.deadline}`] = scholarship;
      return map;
    }, {});

    // Separate ongoing and non-ongoing scholarships from the valid scraped data
    const ongoingScraped = validScrapedData.filter(scholarship => scholarship.deadline === 'Ongoing');
    const incomingScraped = validScrapedData.filter(scholarship => scholarship.deadline !== 'Ongoing');

    // Track added and similar scholarships
    const addedScholarships = [];
    const similarScholarships = [];
    const scholarshipsToSoftDelete = [];

    // Function to compare two scholarships for equality (excluding name and deadline)
    const compareScholarships = (existing, incoming) => {
      return (
        existing.description === incoming.description &&
        existing.type === incoming.type &&
        existing.level === incoming.level &&
        JSON.stringify(existing.eligibility) === JSON.stringify(incoming.eligibility) &&
        JSON.stringify(existing.benefits) === JSON.stringify(incoming.benefits) &&
        JSON.stringify(existing.requirements) === JSON.stringify(incoming.requirements) &&
        JSON.stringify(existing.source) === JSON.stringify(incoming.source) &&
        JSON.stringify(existing.misc) === JSON.stringify(incoming.misc)
      );
    };

    // Handle ongoing scholarships
    const newOngoingScholarships = ongoingScraped.filter(scholarship => {
      const activeScholarship = activeScholarshipsMap[`${scholarship.name}|${scholarship.deadline}`];

      if (activeScholarship) {
        // If the existing scholarship has the same name and deadline but fields differ, we soft delete it
        if (!compareScholarships(activeScholarship, scholarship)) {
          // Collect scholarship to be soft deleted
          scholarshipsToSoftDelete.push(activeScholarship._id);
          return true;  // Mark this scholarship for insertion
        }
        // If no changes, consider it similar
        similarScholarships.push(scholarship);
        return false;
      }

      return true;  // If no match exists, insert the incoming scholarship
    });

    if (newOngoingScholarships.length) {
      addedScholarships.push(...newOngoingScholarships);
      await Scholarships.insertMany(newOngoingScholarships);
    }

    // Remove ongoing scholarships no longer in the source
    const ongoingNames = ongoingScraped.map(s => `${s.name}|${s.deadline}`);
    const removedOngoingScholarships = activeScholarships.filter(scholarship => {
      return scholarship.deadline === 'Ongoing' && !ongoingNames.includes(`${scholarship.name}|${scholarship.deadline}`);
    });

    if (removedOngoingScholarships.length) {
      await Scholarships.updateMany(
        { _id: { $in: removedOngoingScholarships.map(s => s._id) } },
        { $set: { deleted_at: new Date() } }
      );
    }

    // Handle incoming scholarships (non-ongoing)
    const newIncomingScholarships = incomingScraped.filter(scholarship => {
      const activeScholarship = activeScholarshipsMap[`${scholarship.name}|${scholarship.deadline}`];

      if (activeScholarship) {
        // If the existing scholarship has the same name and deadline but fields differ, we soft delete it
        if (!compareScholarships(activeScholarship, scholarship)) {
          // Collect scholarship to be soft deleted
          scholarshipsToSoftDelete.push(activeScholarship._id);
          return true;  // Mark this scholarship for insertion
        }
        // If no changes, consider it similar
        similarScholarships.push(scholarship);
        return false;
      }

      return true;  // If no match exists, insert the incoming scholarship
    });

    if (newIncomingScholarships.length) {
      addedScholarships.push(...newIncomingScholarships);
      await Scholarships.insertMany(newIncomingScholarships);
    }

    // Soft delete scholarships that need to be replaced
    if (scholarshipsToSoftDelete.length > 0) {
      await Scholarships.updateMany(
        { _id: { $in: scholarshipsToSoftDelete } },
        { $set: { deleted_at: new Date() } }
      );
    }

    // Remove incoming scholarships no longer in the source
    const incomingNames = incomingScraped.map(s => `${s.name}|${s.deadline}`);
    const removedIncomingScholarships = activeScholarships.filter(scholarship => {
      return scholarship.deadline !== 'Ongoing' && !incomingNames.includes(`${scholarship.name}|${scholarship.deadline}`);
    });

    if (removedIncomingScholarships.length) {
      await Scholarships.updateMany(
        { _id: { $in: removedIncomingScholarships.map(s => s._id) } },
        { $set: { deleted_at: new Date() } }
      );
    }

    // Send response
    res.status(200).json({
      message: 'Scraper run successfully',
      added: addedScholarships.length,
      similar: similarScholarships.length,
      expired: expiredScholarships.length,
      removedOngoing: removedOngoingScholarships.length,
      removedIncoming: removedIncomingScholarships.length,
    });
  } catch (error) {
    console.error('Error running scraper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Tester endpoint for scraper
router.post('/run-tester', async (req, res) => {
//   try {
//     const scholarshipsData = await philscholar(); 
//     res.status(200).json(scholarshipsData); // Return the scraped data in response
//   } catch (error) {
//     console.error('Error running scraper:', error);
//     res.status(500).json({ message: 'Error running scraper', error: error.message });
//   }
  res.status(200).json({ message: 'successful'});
  console.log("Tester Endpoint Triggered")
});


export default router;