## redis design

### user[name]     
_[hash]_

-  `id`
-  `name`
-  `state                 # 链接后在线，退出后离线`
-  `is_staff              # 是否是客服`
-  `device`
 
### room[roomid]  
_[hash]_

-  `staff`

### roomsof:[staff_name] 
_[zset]_

-  `score`: `[time]`
-  `member`: `roomid`

### message[roomid] 
_[list]_

-  `[time]:[sender]:message`


## workflow

### 1. staff[debbie] connect
1.1. `set state online`

1.2. `sub room.create`

1.3. `sub room.msg`

### 2. user[random] connect
2.1. `create room`

2.2. `pub room.create`

2.3. `sub room.msg`

### 3. staff[debbie] on room.create
3.1. `send msg      欢迎`

3.2. 对话开始


