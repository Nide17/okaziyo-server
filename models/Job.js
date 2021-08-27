// Bring in Mongo
const mongoose = require('mongoose');
const slugify = require("slugify");

//initialize Mongo schema
const Schema = mongoose.Schema;

//job Schema
const jobSchema = new Schema({

    title: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true
    },
    brand_image: String,

    markdown: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    deadline: {
        type: Date,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'category',
        default: '60cddc4c181fa53764a17297'
    },
    sub_category: {
        type: String,
        required: true,
        default: '60cde50716f3e4305c6e8984'
    }
},
    {
        timestamps: true,
    });

jobSchema.pre("validate", function (next) {
    const job = this;

    if (job.title && job.brand) {
        job.slug = slugify(`${job.title} at ${job.brand}`, { replacement: '-', lower: true, strict: true });
    }
    next();
})

//Export
module.exports = mongoose.model("Job", jobSchema);