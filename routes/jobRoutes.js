const express = require('express');
const router = express.Router();
const { fetchAndStoreNewJobs, getStoredJobs, getJobsByCategory,
    setFeaturedJobs, getFeaturedJobs, filterJobs }
    = require('../controllers/jobController');
// Fetch and Store New Jobs --> Corn-Job
router.get('/jobs/fetchAndStoreNewJobs', fetchAndStoreNewJobs)
// Fetch all jobs
router.get('/jobs', getStoredJobs);

// Fetch jobs by category
router.get('/jobs/category', getJobsByCategory);

// Set top 10 featured jobs  --> Corn-Job
router.get('/jobs/setTop10Featured', setFeaturedJobs);

// Fetch top 10 Featured Jobs
router.get('/jobs/getTop10Featured', getFeaturedJobs)

// Filter jobs
router.get('/jobs/filter', filterJobs);

module.exports = router;
