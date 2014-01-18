var assert = require("assert");
var io = require('socket.io-client');

var socket     = io.connect('http://localhost:8087',{'force new connection':true});
var socketUser = io.connect('http://localhost:8087',{'force new connection':true});
var socketUser2= io.connect('http://localhost:8087',{'force new connection':true});

rediscli = require('redis').createClient();

var msgs = ['你好啊','我很好','呵呵','哈哈','华为荣耀货太少了吧！','信春哥，不挂科！'];

var User = require('../models/user'),
    Room = require('../models/room');

describe('xin.io', function(){

    before(function(done){
        rediscli.flushall();
        User.create('debbie', true, function(){
            console.log('create debbie success');
            done();
        });
    });

    describe('app.test', function(){
        it('should works', function(done){

            var msgcount = 0;

            var staff = 'debbie';

            socket.emit('app.tologin',{name: staff});
            socket.on('app.login', function(data){

                assert.equal(staff, data.name);

                socket.on('room.msg',function(data){
                    assert.equal(data.roomid     > 0 , true);
                    assert.equal(data.msg.length > 0 , true);
                    socket.emit('room.msgput', {roomid:data.roomid,msg:msgs[parseInt(Math.random()*msgs.length)]});
                    msgcount += 1; if(msgcount == 10) done();
                });

                socket.on('room.list', function(data){
                    assert.equal(data.roomlist.length > 0, true);
                });

                socket.on('room.create', function (data) {
                    assert.equal(data.roomid > 0, true);
                    socket.emit('room.msgput', {roomid:data.roomid, msg: '欢迎光临' });
                    socket.emit('room.fetchlist');
                });
            });


            var name = Math.random();
            socketUser.emit('app.tologin',{name: name});
            socketUser.on('app.login', function(data){

                socketUser.on('room.create', function(data){
                    assert.equal(data.roomid > 0, true);
                    console.log('已链接至客服',data.roomid);
                });

                socketUser.on('room.msg',function(data){
                    assert.equal(data.roomid     > 0 , true);
                    assert.equal(data.msg.length > 0 , true);
                    socketUser.emit('room.msgput',{roomid:data.roomid,msg:msgs[parseInt(Math.random()*msgs.length)]});
                });
            });

            var name2 = Math.random();
            socketUser2.emit('app.tologin',{name: name2});
            socketUser2.on('app.login', function(data){

                socketUser2.on('room.create', function(data){
                    assert.equal(data.roomid > 0, true);
                    console.log('已链接至客服',data.roomid);
                });

                socketUser2.on('room.msg',function(data){
                    assert.equal(data.roomid > 0 , true);
                    assert.equal(data.msg.length > 0 , true);
                    socketUser2.emit('room.msgput',{roomid:data.roomid,msg:msgs[parseInt(Math.random()*msgs.length)]});
                });
            });
        });
    });
});