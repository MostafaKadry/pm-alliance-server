const axios = require('axios');
const { truncateKeywords } = require("../utils/keywords");
const { rolsKeywords } = require('../utils/keywords');
// Fetch from Adzuna API
const fetchAdzunaJobs = async (queryLocation, queryKeyword) => {
    try {
        const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/gb/search/`, {
            params: {
                app_id: process.env.ADZUNA_APP_ID,
                app_key: process.env.ADZUNA_APP_KEY,
                results_per_page: 200,
                what: queryKeyword || 'Project Management Consultant', // Adzuna accepts only one param
                where: queryLocation || 'japan'
            },
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching from Adzuna:', error);
        throw error;
    }
};

// Fetch from Jooble API
const fetchJoobleJobs = async (availableTitles, queryLocation, queryKeyword) => {
    const joobleKeyWords = truncateKeywords(rolsKeywords, 200);
    try {
        const response = await axios.post(`https://jooble.org/api/${process.env.JOOBLE_API_KEY}`, {
            keywords: queryKeyword || joobleKeyWords || '',
            location: queryLocation || '',
        });
        return response.data.jobs;
    } catch (error) {
        console.error('Error fetching from Jooble:', error);
        throw error;
    }
};

// Fetch from USA Jobs API
const fetchUSAJobs = async (queryKeyword) => {
    try {
        const response = await axios.get(`https://data.usajobs.gov/api/Search`, {
            headers: {
                'Authorization-Key': process.env.USAJOBS_API_KEY,
            },
            params: {
                ResultsPerPage: 200,
                PositionTitle: queryKeyword || 'Program Manager',
            },
        });
        return response.data.SearchResult.SearchResultItems.map(job => job.MatchedObjectDescriptor);
    } catch (error) {
        console.error('Error fetching from USA Jobs:', error);
        throw error;
    }
};

// Combine data from multiple APIs
const fetchJobs = async (availableTitles, queryKeyword, queryLocation) => {
    const [adzunaResponse, joobleResponse, usaJobsResponse] = await Promise.allSettled([
        fetchAdzunaJobs(queryLocation, queryKeyword),
        fetchJoobleJobs(availableTitles, queryLocation, queryKeyword),
        fetchUSAJobs(queryKeyword)
    ]);

    const handleAPIResponse = (apiName, response) => {
        if (response.status === 'rejected') {
            console.error(`${apiName} API failed:`, response.reason);
            return [];
        }
        return response.value;
    };

    const adzunaJobs = handleAPIResponse('Adzuna', adzunaResponse);
    const joobleJobs = handleAPIResponse('Jooble', joobleResponse);
    const usaJobs = handleAPIResponse('USA Jobs', usaJobsResponse);

    return [...adzunaJobs, ...joobleJobs, ...usaJobs];
};

module.exports = { fetchJobs };
