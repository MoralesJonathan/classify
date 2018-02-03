const express = require('express')
const app = express();
const http = require('http');
fs=require('fs');
const server = http.createServer(app)
const port = 8080;
const environment = app.get('env');
const async = require('async');
const socketio = require('socket.io');
const api = require('./routes/apiRoutes');
const bodyParser = require('body-parser')

const io = socketio.listen(server);

app.use(express.static('client'))

app.use(bodyParser.urlencoded({ extended: true , limit: '50mb'}));
app.use(bodyParser.json());


const messages = [];
const sockets = [];

api(app);

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      const text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        const data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(port, function() {
  console.log('Server is running! on port ' + port + ' and is running with a ' + environment + ' environment.');
})

app.get('/test', function(req, res){
  res.send('Hello World')
})