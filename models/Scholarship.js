// Bring in Mongo
const mongoose = require('mongoose');
const slugify = require("slugify");

//initialize Mongo schema
const Schema = mongoose.Schema;

//Scholarship Schema
const scholarshipSchema = new Schema({

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
        default: '60cddc0f181fa53764a17295'
    },
    sub_category: {
        type: String,
        required: true,
        default: '60cde40d16f3e4305c6e897e'
    }
},
    {
        timestamps: true,
    });

scholarshipSchema.pre("validate", function (next) {
    const scholarship = this;

    if (scholarship.title && scholarship.brand) {
        scholarship.slug = slugify(`${scholarship.title} at ${scholarship.brand}`, { replacement: '-', lower: true, strict: true });
    }
    next();
})

//Export
module.exports = mongoose.model("Scholarship", scholarshipSchema);