var socket = io.connect('http://localhost:8087');
var selected_roomid = null;

var name = Math.random();
socket.emit('app.tologin',{name: name});

socket.on('app.login', function(data){

    socket.on('room.create', function(data){
        selected_roomid = data.roomid;
        $('#flush').html('已链接至客服');
    });

    socket.on('room.msg',function(data){
        addRoommsg(data.roomid, data.msg);
    });
});


function setRoomhistory(roomid, msgs){
    $('#msgs').empty().append('<div class="span12" id="roomhistory_blank">&nbsp;</div>');

    msgs.forEach(function(msg){
        var isme = msg.indexOf('debbie:') == 0 ;

        $('#msgs').append('<div class="span12 msg-row '+(isme ? '' : 'right')+'"><span class=" badge">'+msg+'</span></div>')
    });
}
function addRoommsg(roomid, msg){
    var isme = msg.indexOf('debbie:') == 0 ;
    if(roomid == selected_roomid){
        $('#roomhistory_blank').after('<div class="span12 msg-row '+(isme ? '' : 'right')+'"><span class=" badge">'+msg+'</span></div>')
    }else{
        alert('got msg'+ msg);
    }
}

function roomclick(roomid){
    selected_roomid = roomid;
    socket.emit('room.fetchhistory',{roomid: roomid });
}

function sendmsg(){
    var msg = $('#msgtosend').val();
    socket.emit('room.msgput', {roomid: selected_roomid, msg: msg})
}