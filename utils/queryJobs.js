// this File makes the following : when user search for jobs which not in our DB,
//  then this code search in external APIS with his quiry's params 
const axios = require('axios');

// Fetch from Adzuna API
const fetchAdzunaJobs = async (query) => {
    const jobType = query.contract_type;
    // Initialize params object with common parameters
        const params = {
            app_id: process.env.ADZUNA_APP_ID,
            app_key: process.env.ADZUNA_APP_KEY,
            title_only: query.title || undefined,
            what: query.keyword || query.title || undefined,  // Set either `keyword` or `title` for Adzuna
            where: query.location || undefined,
            company: query.company || undefined,
        };

    // Check if contractType is defined and set the appropriate parameter
    if (jobType) {
        if (jobType === "1") {
            params.full_time = "1";
        } else if (jobType === "2") {
            params.part_time = "1";
        } else if (jobType === "3") {
            params.contract = "1";
        }else if (jobType === "4") {
            params.permanent = "1";
        }
    }
   console.log(params)
    const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/gb/search/`, {params});
    // console.log('adzunaResponse',response)
    return response.data.results; // Adzuna returns jobs in 'results' key
};

// Fetch from Jooble API with available quiries in their API
const fetchJoobleJobs = async (query) => {
    if(query.contract_type) return [];
    const response = await axios.post(`https://jooble.org/api/${process.env.JOOBLE_API_KEY}`, {
        keywords: query.keyword, // any keywords includes job title
        location: query.location || '',
        // salary: query.salary || 100 // min salary
    });
    return response.data.jobs; // Jooble returns jobs in 'jobs' key
};
// Fetch from USAJobs API
const fetchUSAJobs = async (query) => {
    const jobType = query.contract_type;
    console.log('USA query', query)
    const params = {
        ResultsPerPage: query.results_per_page || 200,
        PositionTitle: query.title || query.keyword || '',
        LocationName: query.location || '',
    }
        // Check if contractType is defined and set the appropriate parameter
        if (jobType) {
            if (jobType === "1") {
                params.PositionScheduleTypeCode = "1";
            } else if (jobType === "2") {
                params.PositionScheduleTypeCode = "2";
            } else if (jobType === "3") {
                params.PositionScheduleTypeCode = "3";
            }else if (jobType === "4") {
                params.PositionScheduleTypeCode = "4";
            } else if (jobType === "5") {
                 params.PositionScheduleTypeCode = "5";
            }else if (jobType === "6") {
                params.PositionScheduleTypeCode = "6";
            }
        }
        console.log("USA Params", params)

    const response = await axios.get(`https://data.usajobs.gov/api/Search`, {
        headers: {
            'Authorization-Key': process.env.USAJOBS_API_KEY,
        },
        params
    });
    // console.log("USA Response", response.data.SearchResult.SearchResultItems.map(job => job.MatchedObjectDescriptor))
    return response.data.SearchResult.SearchResultItems.map(job => job.MatchedObjectDescriptor); // Extract relevant job details
};
// Combine both APIs data
const queryJobs = async (query) => { 
    console.log(query);
    const [adzunaResponse, joobleResponse, usaJobsResponse] = await Promise.allSettled([
        fetchAdzunaJobs(query),
        fetchJoobleJobs(query),
        fetchUSAJobs(query) 
    ]);
    // Handle results: log or handle errors for failed API calls
    if (adzunaResponse.status === 'rejected') {
        console.error('Adzuna API failed:', adzunaResponse.reason);
        // You can also take other actions, like sending an alert or retrying the request
    }

    if (joobleResponse.status === 'rejected') {
        console.error('Jooble API failed:', joobleResponse.reason);
    }

    if (usaJobsResponse.status === 'rejected') {
        console.error('USA Jobs API failed:', usaJobsResponse.reason);
    }

    // Handle results: filter successful calls and ignore failed ones
    const adzunaJobs = adzunaResponse.status === 'fulfilled' ? adzunaResponse.value : [];
    const joobleJobs = joobleResponse.status === 'fulfilled' ? joobleResponse.value : [];
    const usaJobs = usaJobsResponse.status === 'fulfilled' ? usaJobsResponse.value : [];
    if (adzunaJobs.length === 0 && joobleJobs.length === 0 && usaJobs.length === 0) {
        console.log("No jobs found in external APIs");
        return "no-jobs"
    }
    return [...adzunaJobs, ...joobleJobs, ...usaJobs]; // Merge results
};

module.exports = { queryJobs };