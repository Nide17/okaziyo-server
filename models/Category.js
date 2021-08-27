// Bring in Mongo
const mongoose = require('mongoose');

//initialize Mongo schema
const Schema = mongoose.Schema;

//create a schema object
const CategorySchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  date_created: {
    type: Date,
    default: Date.now
  },
  sub_category: {
    type: [
      {
        name: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        date_created: {
          type: Date,
          default: Date.now
        },
        creator: {
          type: Schema.Types.ObjectId,
          ref: 'user'
        }
      }
    ]
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  }
});

//Category: the name of this model
module.exports = mongoose.model('category', CategorySchema);
