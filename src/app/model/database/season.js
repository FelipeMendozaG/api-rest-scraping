const mongoose = require('mongoose');
const Schema = new mongoose.Schema(
    {
        name:String,
        isValid:String,
        title:String
    }
);

const Season = mongoose.model('season',Schema);

module.exports = Season;