//packages
session = require('express-session');
MongoStore = require('connect-mongo')(session);
const express = require('express')
const async = require('async');
const socketio = require('socket.io');
request = require('request');
const bodyParser = require('body-parser')
const exphbs = require('express-handlebars');
// built in node modules
const http = require('http');
const googleTranslate = require('google-translate')("AIzaSyDqCizItnUBt7FbE_6-rHbu89PUggOJaZM");
fs = require('fs');
path = require('path')
//initializations

const app = express();

app.use(express.static('client'));
//requires from routres
const api = require('./routes/apiRoutes');
const views = require('./routes/viewRoutes')
//constants 
const environment = app.get('env');
const saltRounds = 10;
const port = 8080;
keys = require('./keys.json')
mongoClient = require('mongodb').MongoClient;
objectID = require('mongodb').ObjectID;
const server = http.createServer(app)
const io = socketio.listen(server);

//db connections
session = require('express-session');
MongoStore = require('connect-mongo')(session);




app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json());
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
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
views(app);

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


app.get('/test', function (req,res){
  googleTranslate.translate('My name is Brandon', 'es', function(err, translation) {
  res.send(translation.translatedText);

});
})

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}
