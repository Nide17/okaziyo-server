// Bring in Mongo
const mongoose = require('mongoose');
const slugify = require("slugify");

//initialize Mongo schema
const Schema = mongoose.Schema;

//job Schema
const multijobsSchema = new Schema({

    title: {
        type: String,
        required: true,
    },
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
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
},
    {
        timestamps: true,
    });

multijobsSchema.pre("validate", function (next) {
    const multijobs = this;

    if (multijobs.title) {
        multijobs.slug = slugify(multijobs.title, { lower: true, strict: true });
    }
    next();
})

//Export
module.exports = mongoose.model("Multijobs", multijobsSchema);