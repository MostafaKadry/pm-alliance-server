const Job = require('../models/Job');
const { fetchJobs } = require('../utils/fetchJobs');
const { queryJobs } = require('../utils/queryJobs');
const { rolsKeywords } = require('../utils/keywords');

//  Handle  new jobs schema before storing in the database -- global method
const handleExternalJobs = async (externalJobs) => {
    // Filter and map jobs to match the schema
    if (!externalJobs) return console.log(externalJobs);
    const filteredJobs = externalJobs
        .filter(job => {
            // Only include jobs that have necessary fields
            return (job.title || job.PositionTitle) &&
                (job.company || job.OrganizationName) &&
                (job.location || job.PositionLocationDisplay) &&
                (job.url || job.ApplyURI || job.link || job.redirect_url);
        })
        .map(job => ({
            jobID: job.id || job.PositionID.toString(),
            title: job.title || job.PositionTitle,
            company: job.company?.display_name || job.company || job.OrganizationName,
            location: job.location?.display_name || job.PositionLocationDisplay || job.location,
            salary: job.salary?.salary_max || job.PositionRemuneration?.MaximumRange || job.salary_max || "Confidential",
            description: job.description || job.QualificationSummary || job.snippet || 'Get Description by Clicking Apply Link ',
            createdAt: job.created || job.PublicationStartDate || job.updated || new Date(),
            contract_type: job.contract_type || job.PositionSchedule?.[0]?.Code || 'Full-time',
            category: job.category?.label || job.JobCategory?.[0]?.Name || job.title || '',
            redirect_url: job.redirect_url || job.ApplyURI?.[0] || job.link,
            latitude: job.latitude || job.PositionLocation?.['Latitude'] || null,
            longitude: job.longitude || job.PositionLocation?.['Longitude'] || null,

        }));

    // Get unique job IDs from filtered jobs
    const jobIds = filteredJobs.map(job => String(job.jobID).trim());

    // Check which jobs already exist in the database by their unique id
    const existingJobs = await Job.find({ jobID: { $in: jobIds } }).select('jobID');

    const existingJobIds = existingJobs.map(job => String(job.jobID).trim());

    // Filter out jobs that already exist in the database
    const newJobs = filteredJobs.filter(job => !existingJobIds.includes(String(job.jobID).trim()));

    // Insert only new jobs
    if (newJobs.length > 0) {
        await Job.insertMany(newJobs, { ordered: false });
        console.log('Filtered Jobs:', filteredJobs.length);
        console.log('Existing Jobs in DB:', existingJobIds.length);
        console.log('New Jobs to Insert:', newJobs.length);
  
        console.log('New Jobs Are Added to DB!');
    }
    if (newJobs.length === 0) {
        console.log({ message: "No jobs found in external APIs." });
        return null;

    } else {
        return newJobs; // Return newly inserted jobs
    }
};
// [1] this method must to be invocked by corn-job API, do not let users invoke it,
//  it can cause an overload to DB, or expire limit of APIs
const fetchAndStoreNewJobs = async (req, res) => {
    const { queryKeyword, queryLocation } = req.query;
    try {
        const jobs = await fetchJobs({ keywords: rolsKeywords, queryKeyword, queryLocation }); // Fetch from external APIs

        // Filter and map jobs to match the schema
        const newJobs = await handleExternalJobs(jobs);
        if(handleExternalJobs === null) {
            res.status(500).json({message : "No Jobs In Exteranl APIs"});
            return;
        } else {

            res.json(newJobs); // Return newly inserted jobs
        }
    } catch (error) {
        console.error('Error inserting jobs:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};
// get Stored Jobs
const getStoredJobs = async (req, res) => {
    try {
        // Optional filters from query params (category, location, etc.)
        const { category, location, company, results_per_page } = req.query;


        // Build query object dynamically based on provided filters
        const query = {};
        if (category) query.category = category;
        if (location) query.location = location;
        if (company) query.company = company;


        // Fetch no. of Jobs.
        if (results_per_page) {
            try {
                const jobs = await Job.aggregate([
                    { $match: query }, // Apply the query if there are any filters
                    { $sample: { size: parseInt(results_per_page) } } // Randomly pick `results_per_page` documents
                ]);
                res.json(jobs);  // Send the jobs array as a JSON response
                return;
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });  // Send an error response
                return;
            }
        }


        // Fetch stored jobs from MongoDB based on the query
        const jobs = await Job.find(query);

        res.json(jobs); // Return stored jobs from the database
    } catch (error) {
        console.error('Error fetching stored jobs:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// ****
// Fetch jobs by category 
const getJobsByCategory = async (req, res) => {
    const { category } = req.query;
    // Ensure that the category parameter is provided
    if (!category) {
        return res.status(400).json({ message: 'Category parameter is required' });
    }

    try {
        // Fetch jobs based on the category
        const jobs = await Job.find({ $text: { $search: category } })
            .sort({ score: { $meta: "textScore" } }) // Sort by relevance
            .select({
                score: { $meta: "textScore" }
            }) // Include text score in the result
            .exec();

        // If no jobs are found, return a 404
        if (jobs.length === 0) {
            console.log('No jobs found for this category');
            return res.status(404).json({ message: 'No jobs found for this category' });

        }

        // Return the found jobs as a response
        res.json(jobs);
    } catch (error) {
        // Log any server error and return a 500 status
        console.error('Error fetching jobs by category:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};


// [2] set top 10 featured jobs , Also  this method must to be invocked by corn-job API, do not let users invoke it,
//  it can cause an overload to DB, or expire limit of APIs
const setFeaturedJobs = async (req, res) => {
    try {
        // Fetch all jobs and sort by salary, normalizing the salary to ensure consistency
        const jobs = await Job.find();

        // Filter jobs that have a valid numeric salary and sort them in descending order
        const sortedJobs = jobs
            .filter(job => typeof job.salary === 'number') // Only keep jobs with numeric salary
            .sort((a, b) => b.salary - a.salary); // Sort by salary (descending)

        // Get the top 10 jobs by salary
        const top10Jobs = sortedJobs.slice(0, 10);

        // Extract the IDs of the top 10 jobs
        const top10JobIds = top10Jobs.map(job => job._id);

        // Reset all 'isFeatured' fields to false
        await Job.updateMany({}, { isFeatured: false });

        // Set 'isFeatured' to true for the top 10 jobs
        await Job.updateMany({ _id: { $in: top10JobIds } }, { isFeatured: true });

        // Fetch the updated featured jobs and return them
        const featuredJobs = await Job.find({ isFeatured: true });

        res.json(featuredJobs); // Return only the featured jobs
    } catch (error) {
        console.error('Error setting featured jobs:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};
// get top 10 featured jobs
const getFeaturedJobs = async (req, res) => {

    try {
        // Query to find documents where isFeatured is true
        const featuredJobs = await Job.find({ isFeatured: true });

        res.json(featuredJobs); // Return the featured jobs as JSON response
    } catch (error) {
        console.error('Error fetching featured jobs:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};


// Filtering based on query parameters
const filterJobs = async (req, res) => {
    const { keyword, title, location, company, salary,jobType } = req.query;
    console.log('Received Queries:', { keyword, title, location, company, salary, jobType });
    // Ensure either `title` or `keyword` is provided and location is required
    if (!keyword || !location) {
        return res.status(400).json({ message: 'Both title (or keyword) and location are required.' });
    }
    try {
        const queryInDB = {};
        // Check if keyword or title is present and prioritize title for DB searches
        if (title || keyword) {
            const searchText = title || keyword; // Use title first if present, otherwise keyword
            queryInDB.$text = { $search: searchText }; // Full-text search on title, category, and description
        }
        // Add location as a regex for case-insensitive search
        if (location) {
            queryInDB.location = new RegExp(location, 'i'); // Case-insensitive search for location
        }

        // Add company as a regex if provided
        if (company) {
            queryInDB.company = new RegExp(company, 'i'); // Case-insensitive search for company
        }
        // Add salary condition if provided and valid
        if (salary && !isNaN(salary)) {
            queryInDB.salary = parseInt(salary); // Ensure salary is stored as an integer
        }
        //  Handle jobType to search accordingly
    if (jobType) {
        if(jobType === '0'){return console.log(jobType)}
        if (jobType === '1') {
            // If jobType is '1', search for both '1' and 'full-time'
            queryInDB.$or = [
                { contract_type: '1' },
                { contract_type: new RegExp('full-time', 'i') },
            ];
        } 
        if (jobType === '2') {
            // If jobType is '1', search for both '1' and 'full-time'
            queryInDB.$or = [
                { contract_type: "2" },
                { contract_type: new RegExp('part-time', 'i') }
            ];
        }
        else {
            // Map other job types to their DB equivalents
            const jobTypeMap = {
                '3': '3',
                '4': '4',
                '5': '5',
                '6': '6',
                'permanent': 'permanent',
                'contract': 'contract'
            };

            if (jobTypeMap[jobType]) {
                queryInDB.contract_type = jobTypeMap[jobType]; // Use the mapped value for DB search
            }
        
        }}
        console.log('Database Query:', queryInDB);
        
        // Step 1: Search for jobs in the database
        const jobs = await Job.find(queryInDB)
            .sort({ score: { $meta: "textScore" } }) // Sort by relevance
            .select({
                score: { $meta: "textScore" }
            }) // Include text score in the result 
            .exec();

        // Step 2: If no jobs are found, query external APIs
        if (jobs.length === 0) {
            console.log('No jobs found in database, querying external APIs...');
            const queryInAPIs = {}; 
            if (keyword) queryInAPIs.keyword = keyword;
            if (title) queryInAPIs.title = title;
            if (location) queryInAPIs.location = location;
            if (company) queryInAPIs.company = company;
            if (salary && !isNaN(salary)) queryInAPIs.salary = parseInt(salary);
            if (jobType) {
                if(jobType === '0'){return console.log(jobType)}
                if (jobType === '1') {
                    // If jobType is '1', search for both '1' and 'full-time'
                    queryInAPIs.contract_type = "1"
                } 
                if (jobType === '2') {
                     queryInAPIs.contract_type = "2"
                }
                else {
                    // Map other job types to their DB equivalents
                    const jobTypeMap = {
                        '3': '3',
                        '4': '4',
                        '5': '5',
                        '6': '6',
                        'permanent': 'permanent',
                        'contract': 'contract'
                    };
        
                    if (jobTypeMap[jobType]) {
                        queryInAPIs.contract_type = jobTypeMap[jobType]; // Use the mapped value for search
            }
        }}
            console.log('Querying external APIs with params:', queryInAPIs);

            const externalJobs = await queryJobs(queryInAPIs);
            if (externalJobs === 'no-jobs') {
                console.log('no-jobs')
                return res.status(404).json({ message: 'NO Jobs match your query in our DB nor in External APIs' });
            }
            // Fetch and store new jobs in the database
            const storedJobs = await handleExternalJobs(externalJobs);
            if(handleExternalJobs === null) {

                return res.status(500).json({message : "No Jobs In Exteranl APIs"});
            } else {
                // Return the fetched external jobs
                return res.json(storedJobs);

            }
        }

        // Step 4: Return the found jobs
        res.json(jobs);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error', error });
    }
};

module.exports = { fetchAndStoreNewJobs, getStoredJobs, getJobsByCategory, setFeaturedJobs, getFeaturedJobs, filterJobs };