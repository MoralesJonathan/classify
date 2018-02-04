//api routes
const bcrypt = require('bcrypt');
const googleTranslate = require('google-translate')("AIzaSyDqCizItnUBt7FbE_6-rHbu89PUggOJaZM");
module.exports = function(app) {
  app.post('/api/image', function(req, res) {
    
    var name = Math.floor(Math.random() * 3);
    let imagedata = req.body.data.split(',')[1];
    fs.writeFile('./client/img/test'+ name +'.png', imagedata, 'base64', function(err) {
      if (err) {
        throw err
        res.send(500)
      }
      var options = {
        method: "POST",
        url: 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize/',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': '5eed168a75df4ff988eb3a529da5f646'
        },
        body: '{"url": "https://mangohacks2018-jjm15c.c9users.io/img/test'+ name +'.png"}'

      };

      request(options, function(error, response, body) {
        let pull = (JSON.parse(body));
        console.log(JSON.stringify(pull) + ' ... ' + pull.length)
        if (pull.length >= 1) {
          let scores = pull[0].scores;
          let emotions = {
            "anger": -1,
            "contempt": 1,
            "disgust": 1,
            "fear": 1,
            "happiness": 1,
            "neutral": 0,
            "sadness": -1,
            "surprise": 1
          };
          let finalScore = 0;
          let counter = 0;
          for (var key in scores) {
            if (scores.hasOwnProperty(key)) {
              if (scores[key] > .2) {
                let curVal = emotions[key];
                finalScore += (curVal * scores[key]);
                counter++;
              }
            }
          }
          io.sockets.emit('graphUpdate', { "value": finalScore })
        }
        else {
          io.sockets.emit('graphUpdate', { "value": 0 })
        }
      });
    })
  })



  app.post('/api/register', function(req, res) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      if (!err) {
        mongoClient.connect("mongodb://localhost", function(error, client) {
          if (!error) {
            console.log("Connected successfully to MongoDB server");
            let db = client.db('main');
            let collection = db.collection('logins');
            collection.insert({
              username: req.body.username.toLowerCase().trim(),
              password: hash
            }, function(err, newuser) {
              var uniqueID = newuser.ops[0]._id;
              collection = db.collection('info');
              collection.insert({
                _id: uniqueID,
                firstName: toTitleCase(req.body.firstname),
                lastName: toTitleCase(req.body.lastname),
                email: req.body.email.toLowerCase()
              }, function(error, result) {
                client.close();
                if (error) res.send(false)
                else res.send(true)
              });
            });
          }
          else {
            console.dir(error);
            res.send(error);
          }
        });
      }
      else console.log(err)
    });
  })
  app.post('/api/login', function(req, res) {
    let userSession = req.session;
    mongoClient.connect("mongodb://localhost", function(error, client) {
      if (!error) {
        console.log("Connected successfully to MongoDB server");
        let db = client.db('main');
        var collection = db.collection('logins');
        collection.findOne({
          username: req.body.username.toLowerCase().trim()
        }, function(error, user) {
          if (user !== null) {
            if (bcrypt.compareSync(req.body.password, user.password)) {
              userSession.user = user.username;
              collection.findOne({
                _id: user._id
              }, function(err, result) {
                userSession.firstname = result.firstName
                userSession.lastname = result.lastName
                client.close();
                res.send(true)
              })
            }
            else {
              res.send(false) //Login failed! Bad Password
            }
          }
          else {
            res.send(false) //Login failed! Bad Username
          }
        });
      }
      else {
        console.dir(error);
        res.send(error);
      }
    });
  })
  
  app.post('/api/translate', function(req, res) {
  googleTranslate.translate(req.body.text, req.body.lang, function(err, translation) {
    res.send(translation.translatedText);
  });
})

};
