const express = require('express')
const app = express();
const http = require('http');
fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const objectID = require('mongodb').ObjectID;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const server = http.createServer(app)
const port = 8080;
const keys = require('./keys.json')
const environment = app.get('env');
const async = require('async');
const socketio = require('socket.io');
const bcrypt = require('bcrypt');
const api = require('./routes/apiRoutes');
const bodyParser = require('body-parser')
const saltRounds = 10;

const io = socketio.listen(server);

app.use(express.static('client'))

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json());

app.use(session({
  secret: keys.sessionKey,
  resave: false,
  rolling: true,
  cookie: {
    maxAge: 900000
  },
  store: new MongoStore({
    url: 'mongodb://localhost/session?authSource=admin'
  }),
  saveUninitialized: false
}))

const messages = [];
const sockets = [];

api(app);

io.on('connection', function(socket) {
  messages.forEach(function(data) {
    socket.emit('message', data);
  });

  sockets.push(socket);

  socket.on('disconnect', function() {
    sockets.splice(sockets.indexOf(socket), 1);
    updateRoster();
  });

  socket.on('message', function(msg) {
    const text = String(msg || '');

    if (!text)
      return;

    socket.get('name', function(err, name) {
      const data = {
        name: name,
        text: text
      };

      broadcast('message', data);
      messages.push(data);
    });
  });

  socket.on('identify', function(name) {
    socket.set('name', String(name || 'Anonymous'), function(err) {
      updateRoster();
    });
  });
});

function updateRoster() {
  async.map(
    sockets,
    function(socket, callback) {
      socket.get('name', callback);
    },
    function(err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function(socket) {
    socket.emit(event, data);
  });
}

server.listen(port, function() {
  console.log('Server is running! on port ' + port + ' and is running with a ' + environment + ' environment.');
})

app.get('/', function(req, res) {
  let userSession = req.session;
  if (!userSession.user) {
    res.redirect('/login');
  } else {
     res.redirect('/home');
  }
})

app.get('/login', function(req, res) {
  res.sendFile(__dirname+"/client/login.html")
})

app.get('/home', function(req, res) {
  res.sendFile(__dirname+"/client/dashboard.html")
})

app.get('/logout', function(req, res) {
  req.session.destroy();
  console.log("session destroyed")
  res.redirect('/')
})

app.post('/login', function(req, res) {
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

app.post('/register', function(req,res){
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
                            if(error) res.send(false)
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

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}