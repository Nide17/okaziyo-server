const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PswdResetToken = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "user",
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 900
        // expires in 900 secs
    },
});

module.exports = mongoose.model("Token", PswdResetToken);