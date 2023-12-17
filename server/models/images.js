const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const imagesSchema = new Schema({
    frame_rate: {
        type: Number,
        required: true
    },
    uploadDate: {
        type: Date,
        required: true
    },
    data: {
        type: Buffer,
        required: true
    }
});

module.exports = Images = mongoose.model("images", imagesSchema);