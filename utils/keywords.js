const rolsKeywords = `
    Program Management , Product Management, Project Management, Project Coordination,Delivery Manager,
 DevOps, Client Success Manager,Program Manager, Senior Program Manager, Technical Program Manager (TPM),
  Global Program Manager, IT Program Manager, Agile Program Manager, Program Director, Assistant Program Manager,
   Strategic Program Manager, Program Lead, Program Portfolio Manager, Program Delivery Manager, 
   Product Manager, Senior Product Manager, Technical Product Manager, Digital Product Manager,
   Product Owner, Associate Product Manager, Junior Product Manager, Lead Product Manager, 
   Chief Product Officer (CPO), Principal Product Manager, Product Portfolio Manager, 
   Product Development Manager, Product Lifecycle Manager, Product Strategy Manager,
    Product Operations Manager,Project Manager, Senior Project Manager, Technical Project Manager, 
    Digital Project Manager, IT Project Manager, Construction Project Manager, Agile Project Manager, 
    Project Director, Junior Project Manager, Global Project Manager, Project Delivery Manager, 
    Implementation Project Manager, Project Portfolio Manager, Enterprise Project Manager, 
    Engineering Project Manager, Project Management Consultant, Creative Project Manager, 
    Project Governance Manager, Project Coordinator, Junior Project Coordinator, Senior Project Coordinator,
    Project Support Specialist, Project Scheduler, Project Administrator, Project Assistant,
    Project Control Officer (PCO), Program Coordinator, IT Project Coordinator, 
    Construction Project Coordinator, Project Operations Coordinator, Delivery Manager, 
    Service Delivery Manager, Business Delivery Manager, Scrum Master, Agile Coach, Business Analyst,
    Process Manager, Change Manager, Risk Manager, Operations Manager, Release Manager, DevOps Manager,
    Portfolio Manager, PMO Manager (Project Management Office Manager), Resource Manager, Implementation Manager, Deployment Manager, 
    Client Success Manager, Client Delivery Manager
`;
// Some APIs can not handle large keywords, so that keywords must be cut.
const truncateKeywords = (keywords, maxLength) => {
    const keywordArray = keywords.split(',').map(kw => kw.trim());
    let truncatedKeywords = '';

    for (const keyword of keywordArray) {
        // Check if adding the next keyword exceeds the max length
        if ((truncatedKeywords + (truncatedKeywords ? ', ' : '') + keyword).length <= maxLength) {
            truncatedKeywords += (truncatedKeywords ? ', ' : '') + keyword; // Add a comma if not the first keyword
        } else {
            break; // Stop if the max length is reached
        }
    }

    return truncatedKeywords;
};
module.exports = { rolsKeywords, truncateKeywords };

// Example usage
// const maxKeywordsLength = 210; //  200-300 is prefered for must APIs
// const truncatedKeywords = truncateKeywords(rolsKeywords, maxKeywordsLength);

// console.log(truncatedKeywords);