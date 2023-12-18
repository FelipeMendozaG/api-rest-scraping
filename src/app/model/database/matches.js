const mongoose = require('mongoose')
const Schema = new mongoose.Schema(
    {
        season:String,
        ubication:String,
        competition:String,
        language:String,
        title:String,
        instance:String,
        team_local:{
            name:String,
            logo:String,
            players:[
                {name:String, number:String, nationality:String, age:String}
            ],
            substitutes:[
                {name:String, number:String, nationality:String, age:String}
            ],
            coach:{name:String, nationality:String, age:String}
        },
        team_visit:{
            name:String,
            logo:String,
            players:[
                {name:String, number:String, nationality:String}
            ],
            substitutes:[
                {name:String, number:String, nationality:String}
            ],
            coach:{name:String, nationality:String}
        },
        score:{
            goal:{ type: Number, default: 0 },
            goal_local:{ type: Number, default: 0 },
            goal_visit:{ type: Number, default: 0 },
            result:String
        },
        video:[String]
    }
);
const Matches = mongoose.model('matches',Schema);

module.exports = Matches;