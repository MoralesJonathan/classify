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
io = socketio.listen(server);

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

let rooms = [];

api(app);
views(app);

io.on('connection', function(socket) {
  rooms.push(socket.id);
  socket.on('join', (room) => {
    if(rooms.indexOf(room) != -1 && socket.id != room){
      socket.join(room);
      socket.leave(socket.id);
      socket.emit('roomJoinStatus', { data: true });
      socket.emit('notifcation', { message: "Logged in!" });
      socket.to(room).emit('updateAttendance',io.sockets.adapter.rooms[room].length-1);
    } else {
      socket.emit('roomJoinStatus', { data: false });
    }
    })
    socket.on('pretranscription',function(words){
     socket.to(socket.id).emit('transcription', words);
  })
  socket.on('logout',function(room){
    socket.leave(room)
  })
  socket.on('disconnect', function() {
    if(rooms.indexOf(socket.id) != -1){
      let index = rooms.indexOf(socket.id)
      let professorID = rooms[index]
      rooms.splice(rooms[index], 1)
      console.log("Is this professor ID? "+professorID)
      // socket.to(professorID).emit('updateAttendance',io.sockets.adapter.rooms[professorID].length-1);
    }
  });
  });


server.listen(port, function() {
  console.log('Server is running! on port ' + port + ' and is running with a ' + environment + ' environment.');
})


app.get('/test', function(req, res) {
  googleTranslate.translate('My name is Brandon', 'es', function(err, translation) {
    res.send(translation.translatedText);

  });
})

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}
