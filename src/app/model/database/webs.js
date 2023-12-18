const mongoose = require('mongoose');
const Schema = new mongoose.Schema({
    title:String,
    urls:[{
        name:String,
        url:String,
        isValid:Boolean
    }]
})
const Webs = mongoose.model('webs',Schema);

module.exports = Webs;