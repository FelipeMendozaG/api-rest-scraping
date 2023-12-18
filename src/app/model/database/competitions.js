const mongoose = require('mongoose')
const Schema = new mongoose.Schema(
    {
        name:String,
        descripcion:String,
        title:String,
        winners:[String],
        isValid:Boolean
    }
);
const Competitions = mongoose.model('competitions',Schema);
module.exports = Competitions;