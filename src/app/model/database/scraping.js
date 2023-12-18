const mongoose = require('mongoose')
const schema = new mongoose.Schema(
    {
        date:Date,
        name:String,
        status:String,
        isValid:Boolean,
        pageTotal:Number,
        cod:String,
        pageCurrent:Number
    }
);
const Scraping = mongoose.model('scraping', schema);

module.exports = Scraping;