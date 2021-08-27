// Bring in Mongo
const mongoose = require('mongoose');

//initialize Mongo schema
const Schema = mongoose.Schema;

//create a schema object
const ContactSchema = new Schema({
    contact_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    contact_date: {
        type: Date,
        default: Date.now
    },
    replies: {
        type: [
            {
                reply_name: {
                    type: String,
                    required: true
                },
                email: {
                    type: String,
                    required: true
                },
                message: {
                    type: String,
                    required: true
                },
                reply_date: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    }
});

//contact: the name of this model
module.exports = mongoose.model('contact', ContactSchema);