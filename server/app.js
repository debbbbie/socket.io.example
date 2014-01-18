var io    = require('socket.io').listen(8087,{log:false}),
    redis = require('redis');

var rediscli    = require('redis').createClient();
var rediscliSub = require('redis').createClient();
global.rediscli = rediscli;
global.rediscliSub = rediscliSub;

var User    = require('./models/user'),
    Room    = require('./models/room');

io.set('authorization', function (handshake, accept) {
    return accept(null, true);
});

io.sockets.on('connection', function(socket){

    var currentUser  = null,  currentStaff = null;

    function room_init(){
        function afterRoomCreate(roomid){
            currentUser.subRoomMsg(roomid);
            currentUser.onRoomMsg(roomid, function(data){
                socket.emit('room.msg',{roomid:data.roomid,msg: data.msg});
            });
            socket.emit('room.create',{roomid:roomid});
        }

        if(currentUser.isStaff()){
            currentUser.subNewroom();
            currentUser.onNewroom(function(roomid){
                currentUser.addToRoomList(currentUser.name, roomid, function(){
                    afterRoomCreate(roomid);
                });
            });
        }else{
            Room.create(currentUser.name, currentStaff.name, function(room){
                currentUser.pubNewroom(room.id);
                afterRoomCreate(room.id);
            });
        }
    }

    socket.on('app.tologin', function(data){
        var name = data.name;
        User.find(name, function(user){
            if(user){
                currentUser = user;
                currentUser.online();
                if(user.isStaff()){
                    currentStaff = user;
                    User.setOnlineStaff(user);
                }
                socket.emit('app.login',{name:user.name});
                room_init();
            }else{
                User.create(name, false, function(user){
                    currentUser = user;
                    currentUser.online();
                    User.getOnlineStaff(function(currentstaff){
                        currentStaff = currentstaff;
                        socket.emit('app.login',{name:user.name});
                        room_init();
                    });
                });
            }
        });
    });

    socket.on('room.fetchlist', function(data){
        currentUser.roomlist(function(roomlist){
            roomlist.forEach(function(roomid){
                currentUser.subRoomMsg(roomid);
                currentUser.onRoomMsg(roomid, function(data){
                    socket.emit('room.msg',{roomid:data.roomid,msg: currentUser.name+':'+data.msg});
                });
            });
            socket.emit('room.list',{roomlist: roomlist});
        });
    });

    socket.on('room.msgput', function(data){
        var val = (currentUser.name == 'debbie' ? 'debbie: ': '') + data.msg;
        currentUser.sendMsg(currentUser.name, data.roomid, val, function(){
            currentStaff.pubRoomMsg(data.roomid, val)
        });
    });

    socket.on('room.fetchhistory', function(data){
       var roomid = data.roomid;
        currentUser.roomMessages(roomid, function(msgs){
            socket.emit('room.history',{roomid:roomid, msgs:msgs});
        });
    });

    socket.on('disconnect', function () {
        console.log('disconnect');
        if(currentUser) {
            if(currentUser.isStaff()){
                User.removeOnlineStaff(currentUser.name);
            }
            currentUser.offline();
            currentUser.unsub();
        }
        io.sockets.emit('user disconnected');
    });
});