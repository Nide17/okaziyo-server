const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let documentSchema = new Schema(
    {
        document_id: { type: Number, default: 0 },
        description: { type: String },
        fileLink: { type: String },
        s3_key: { type: String }
    },
    {
        // createdAt,updatedAt fields are automatically added into records
        timestamps: true
    }
);

module.exports = mongoose.model("Document", documentSchema);