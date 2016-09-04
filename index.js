var app = require('express')();
var http = require('http').Server(app);
var util = require('util');
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var user_names=[];

mongoose.connect('mongodb://localhost/chatroom', function(err){
    if(err){
      console.log();
    }else{
      console.log("Successfully connected to the Chatroom DB")
    }
});
// DB Schema
var chatRSchema = mongoose.Schema({
  username :String,
  message:String,
  ctime:{type:Date, default:Date.now()}
});
//Model
var chatModel = mongoose.model('Message', chatRSchema);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  var dt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  dt +=" P.M";
  var dbquery = chatModel.find({}) ;
    dbquery.sort('-created').limit(2).exec(function(err, docs){
    if(err)throw err;
    socket.emit('load old messages', docs);
  });

  socket.on('chat message', function(msg){
      var chatMsg = chatModel( {username: socket.usernames, message: msg});
      chatMsg.save(function(err){
        if(err){
          throw err;
        }
      });
      io.emit('chat message', {username: socket.usernames, message: msg , ctime: dt});
  });

  socket.on('usernames' , function(name , callback){
    if(user_names.indexOf(name) != -1){
      callback(false);
      console.log("UserName already taken");
    }else{
      callback(true);
      socket.usernames = name;
      user_names.push(name);
  }
  });
  socket.on('disconnect', function(){
   console.log('user disconnected');
    if(!socket.usernames) return;
    console.log("Before: " + user_names);
    user_names.splice(user_names.indexOf(socket.usernames),1);
    console.log("After: " + user_names);
 });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
