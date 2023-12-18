const express=require('express');
const { GetWebs, PostScraping } = require('../../app/controller/scrapingController');
const routes = express.Router();

routes.get('/',GetWebs)
routes.post('/footballia',PostScraping)

module.exports=routes