var socket = io.connect('http://localhost:8087');

socket.emit('app.tologin',{name: 'debbie'});

socket.on('app.login', function(data){
    $('#loginname').find('a').html(data.name);

    socket.emit('room.fetchlist');
    socket.on('room.msg',function(data){
        addRoommsg(data.roomid, data.msg);
    });

    socket.on('room.list', function(data){
        setRoomlist(data.roomlist)
    });

    socket.on('room.create', function (data) {
        addRoom(data.roomid);
        socket.emit('room.msgput', {roomid:data.roomid, msg: '欢迎光临' });
    });
    socket.on('room.history', function (data) {
        setRoomhistory(data.roomid, data.msgs);
    });
});


var selected_roomid = null;

function setRoomlist(roomlist){
    $('#roomlist').empty().append('<div class="span12" id="roomlist_blank">&nbsp;</div>');
    roomlist.forEach(function(room){
        $('#roomlist').append('<button class="span12 btn margin-bottom" onclick="roomclick(\''+room+'\')" id=list'+room+'>user'+room+'</button>')
    });
}
function addRoom(room){
    $('#roomlist').append('<button class="span12 btn margin-bottom" onclick="roomclick(\''+room+'\')" id=list'+room+' data-id="'+room+'">user'+room+'</button>')
}

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
        var $roomlist = $('#roomlist');
        if($roomlist.find('button[data-id="'+roomid+'"]').size()<=0) addRoom(roomid);
        $roomlist.find('button[data-id="'+roomid+'"]').append('<span class="badge badge-warning" style="position: relative; left: 50px;">1</span>')
    }
}

function roomclick(roomid){
    selected_roomid = roomid;
    socket.emit('room.fetchhistory',{roomid: roomid });
    $('#roomlist').find('button[data-id="'+roomid+'"] span.badge').remove();
}

function sendmsg(){
    var msg = $('#msgtosend').val();
    socket.emit('room.msgput', {roomid: selected_roomid, msg: msg})
}
