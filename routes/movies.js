var express = require('express');
var router = express.Router();
var imdb = require('imdb-api')
var IMDB_API_KEY = '91a2920a';

/* GET movies - Return a list of all movies */
router.get('/', function(req, res, next) {

  var params = {
   ExpressionAttributeNames: {
    "#y": 'Year',
   },
   FilterExpression: "attribute_exists (imdbid)",
   ProjectionExpression: "imdbid, actors, director, #y, generas, imdblink, poster, rating, title ",
   TableName: "Movies"
  };

  ddb.scan(params, function(err, data) {
    if (err) {
      console.log("Error", err);
      res.send("Error : ", err)
    } else {
        console.log("Success", data)
        res.status(200).send(data.Items);
    }
  });

});

/* GET movie count - Return the total count of all movies not watched  */
router.get('/count', (req, res, next) => {
  var params = {
    TableName: "Movies",
    ExpressionAttributeValues: {
      ":w": {
        BOOL: true
       }
     },
    FilterExpression: "contains (watched, :w)",
  };

  ddb.scan(params, (err, data) => {
    if (err) {
      console.log("Error : ", err)
      res.status(400).send(err);
    } else {
      res.send(data);
    }
  })
});

/* PUT movie - Add a new movie to the list */
router.put('/', function(req, res, next) {
  var movieID = req.body.imdbid;
  var addBy = req.body.addedBy;
  var date = new Date;

  if (req.body.imdbid && req.body.addedBy) {
    imdb.getById(movieID, {apiKey: IMDB_API_KEY}).then((imdbResponse) => {
      var params = {
        TableName: 'Movies',
        Item: {
          'imdbid': {S: imdbResponse.imdbid},
          'title': {S: imdbResponse.title},
          'year': {S: imdbResponse.year.toString()},
          'director': {S: imdbResponse.director},
          'actors': {SS: imdbResponse.actors.split(', ')},
          'rating': {N: imdbResponse.rating},
          'genres': {SS: imdbResponse.genres.split(', ')},
          'imdburl': {S: imdbResponse.imdburl},
          'poster': {S: imdbResponse.poster},
          'addedName': {S: addedBy},
          'addedDate': {S: date.toISOString().slice(0,10)},
          'updateName': {S: null},
          'updateDate': {S: null},
          'rank': {N: null},
          'oldRank': {N: null},
          'watched': {BOOL: false},
        },
      }

      ddb.putItem(params, (err, data) => {
        if (err) {
          console.log("Error : ", err)
          res.status(400).send("Error : did not upload new item")
        } else {
          console.log("Success : item was uploaded", data)
          res.status(200).send("Success: new item was uploaded")
        }
      })
    })
  } else {
    res.status(400).send('Error: Invalid Request - No imdbid included in request')
  }
});

router.post('/search', function(req, res, next) {
  if (req.body.title) {
    imdb.search({title: req.body.title}, {apiKey: IMDB_API_KEY}).then((imdbResponse)=>{
      console.log("hitttttttt", imdbResponse);
      res.send(imdbResponse);
    })

  } else {
    res.status(400).send(`bad search request: title missing `)
  }

});

module.exports = router;
