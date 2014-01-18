var Guid = require('guid');
var cli  = global.rediscli, subCli = global.rediscliSub;

function User(guid, name, isstaff){

    this.isStaff = function(){
        return this.is_staff == true || this.is_staff == 'true' || this.is_staff == '1' || this.is_staff == 1 ;
    };

    // attributes
    this.id = guid;
    this.name=name;
    this.is_staff = isstaff;
    this.attributes = {id: this.id, name: this.name, is_staff: this.isStaff() };

    // online offline
    this.online = function(){
        cli.hset('user:'+this.name,'status','1', function(err, r){})
    };
    this.offline = function(){
        cli.hset('user:'+this.name,'status','0', function(err, r){})
    };

    this.unsub = function(){
        subCli.unsubscribe();
    };

    this.on = function(event, fn){
        var user = this;
        user.eventStore = user.eventStore || {};
        user.eventStore[event] = fn;

        if(!user.hasSubMessage){
            subCli.on('message', function(channel, message){
                if(user.eventStore[channel]){
                    user.eventStore[channel](message);
                }
            });
            user.hasSubMessage = true;
        }
    };

    // room.create
    this.subNewroom = function(){
        subCli.subscribe('newroom');
    };
    this.pubNewroom = function(roomid){
        cli.publish('newroom',roomid);
    };
    this.onNewroom = function(fn){
        this.on('newroom',fn);
    };
    // end of room.create

    // room.msg
    this.subRoomMsg = function(roomid){
        subCli.subscribe('room:'+roomid);
    };
    this.pubRoomMsg = function(roomid, msg){
        cli.publish('room:'+roomid, msg);
    };
    this.onRoomMsg = function(roomid, fn){
        this.on('room:'+roomid,function(message){
            fn({roomid:roomid, msg: message});
        });
    };
    this.sendMsg = function(senderid, roomid, msg, fn){
        cli.lpush('message:'+roomid, msg, function(err, ret){ fn(); });
    };
    this.roomMessages = function(roomid , fn){
        cli.lrange('message:'+roomid,0,-1,function(err, ret){
            fn(ret);
        });
    };
    // end of room.msg

    // room.list
    this.roomlist = function(fn){
        cli.zrange('roomsof:'+this.name, 0, -1, function(err, ret){
            fn(ret);
        });
    };
    this.addToRoomList = function(username, roomid, fn){
        cli.zadd('roomsof:'+username, new Date().getTime(), roomid, function(err, ret){
            fn();
        });
    };
    // end of room.list
}

User.create = function(name, isstaff, fn){
    guid = Guid.create().value;
    var user = new User(guid, name, isstaff);

    cli.hmset('user:'+name, user.attributes, function(){
        fn(user);
    });
};

User.find = function(name, fn){
    cli.hgetall('user:'+name, function(err, u){
        if(err || !u ) return fn(null);

        var user =new User(u['id'], u['name'], u['is_staff']);
        fn(user);
    });
};

// onlineStaff
User.setOnlineStaff = function(user){
    cli.sadd('currentstaff', user.name);
};
User.getOnlineStaff = function(fn){
    cli.srandmember('currentstaff', function(err, name){
        User.find(name, function(user){
            fn(user);
        });
    });
};
User.removeOnlineStaff = function(name, fn){
    cli.srem('currentstaff', name);
};
// end of onlineStaff

module.exports = User;