const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobID: { type: String, unique: true, index: true }, // Unique index
    title: { type: String, required: true, index: true }, // Index for quick searches
    company: { type: mongoose.Schema.Types.Mixed, index: true }, // Index if needed
    location: { type: mongoose.Schema.Types.Mixed, required: true, index: true }, // Index for quick searches
    salary: { type: mongoose.Schema.Types.Mixed, index: true }, // Index if needed
    description: String,
    contract_type: String,
    category: { type: mongoose.Schema.Types.Mixed, index: true }, // Index if needed
    redirect_url: { type: mongoose.Schema.Types.Mixed }, // Can handle strings or arrays of URLs
    addedAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    longitude: { type: mongoose.Schema.Types.Mixed },
    latitude: { type: mongoose.Schema.Types.Mixed },
});

// Compound index 
jobSchema.index({ title: 1, category: 1 }, { default_language: 'none' }); // 'none' ensures no stemming is done

jobSchema.index({
    title: 'text',
    category: 'text',
});
// Index location separately
jobSchema.index({ location: 1 });
const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
