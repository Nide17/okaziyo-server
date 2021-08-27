// Bring in Mongo
const mongoose = require('mongoose');

//initialize Mongo schema
const Schema = mongoose.Schema;

//create a schema object
const SubscriberSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  date_subscribed: {
    type: Date,
    default: Date.now
  }
});

//subscriber: the name of this model
module.exports = mongoose.model('subscriber', SubscriberSchema);
