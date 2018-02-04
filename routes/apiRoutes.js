//api routes
const bcrypt = require('bcrypt');
module.exports = function(app) {
  app.post('/api/image', function(req, res) {
    let imagedata = req.body.data.split(',')[1];
    fs.writeFile('./client/img/test.png', imagedata, 'base64', function(err) {
      if (err) {
        throw err
        res.send(500)
      }
      
    request.post("")
      //res.send(200)
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




};
