var cli = global.rediscli;
function Room(roomid, staffname){
    this.id = roomid;
    this.staff = staffname;
    this.attributes = {id: this.id, staff: this.staff};
}

Room.create = function(username, staffname, fn){
    var room = new Room(username, staffname);
    cli.hmset('room:' + room.id, room.attributes , function(){
        fn(room);
    });
};

module.exports = Room;