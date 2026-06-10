import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  connectTimeout: 10000,
  maxHttpBufferSize: 1e6,
});

const rooms = new Map();
const MAX_USERS_PER_ROOM = 2;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    totalUsers: [...rooms.values()].reduce((sum, room) => sum + room.size, 0),
    uptime: process.uptime(),
  });
});

app.get('/rooms', (req, res) => {
  const roomList = [];
  rooms.forEach((users, roomId) => {
    roomList.push({
      roomId,
      userCount: users.size,
      isFull: users.size >= MAX_USERS_PER_ROOM,
    });
  });
  res.json(roomList);
});

io.use((socket, next) => {
  const roomId = socket.handshake.query.roomId;
  if (roomId && typeof roomId === 'string' && roomId.trim().length > 0) {
    socket.pendingRoomId = roomId.trim();
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`[连接] 用户已连接: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
      socket.emit('join-error', { message: '无效的房间号' });
      return;
    }

    roomId = roomId.trim();
    console.log(`[房间] 用户 ${socket.id} 请求加入房间: ${roomId}`);

    if (rooms.has(roomId)) {
      const existingRoom = rooms.get(roomId);
      if (existingRoom.has(socket.id)) {
        socket.emit('join-error', { message: '你已经在此房间中' });
        return;
      }
      if (existingRoom.size >= MAX_USERS_PER_ROOM) {
        socket.emit('room-full', { roomId });
        return;
      }
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    const room = rooms.get(roomId);
    const otherUsers = [...room];

    room.add(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.joinTime = Date.now();

    console.log(`[房间] 用户 ${socket.id} 成功加入房间: ${roomId} (当前人数: ${room.size})`);

    if (otherUsers.length > 0) {
      const otherUserId = otherUsers[0];
      socket.emit('user-joined', otherUserId);
      socket.to(otherUserId).emit('user-joined', socket.id);
    }

    socket.emit('room-users', [...room]);
    socket.to(roomId).emit('room-users', [...room]);
  });

  socket.on('offer', (data) => {
    if (!data || !data.target) {
      console.warn(`[信令] 无效的 offer 数据，来源: ${socket.id}`);
      return;
    }
    console.log(`[信令] 从 ${socket.id} 发送 offer 到 ${data.target}`);
    socket.to(data.target).emit('offer', {
      sdp: data.sdp,
      sender: socket.id,
    });
  });

  socket.on('answer', (data) => {
    if (!data || !data.target) {
      console.warn(`[信令] 无效的 answer 数据，来源: ${socket.id}`);
      return;
    }
    console.log(`[信令] 从 ${socket.id} 发送 answer 到 ${data.target}`);
    socket.to(data.target).emit('answer', {
      sdp: data.sdp,
      sender: socket.id,
    });
  });

  socket.on('ice-candidate', (data) => {
    if (!data || !data.target) {
      console.warn(`[信令] 无效的 ICE candidate 数据，来源: ${socket.id}`);
      return;
    }
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      sender: socket.id,
    });
  });

  socket.on('leave-room', () => {
    handleLeaveRoom(socket, '主动离开');
  });

  socket.on('disconnect', (reason) => {
    console.log(`[断开] 用户已断开: ${socket.id}, 原因: ${reason}`);
    handleLeaveRoom(socket, reason);
  });

  socket.on('error', (err) => {
    console.error(`[错误] Socket ${socket.id} 错误:`, err.message);
  });
});

function handleLeaveRoom(socket, reason) {
  const roomId = socket.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (room) {
    room.delete(socket.id);
    console.log(`[房间] 用户 ${socket.id} 离开房间: ${roomId}, 原因: ${reason}, 剩余人数: ${room.size}`);

    socket.to(roomId).emit('user-left', socket.id);
    socket.to(roomId).emit('room-users', [...room]);

    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`[房间] 房间 ${roomId} 已清空并删除`);
    }
  }

  socket.leave(roomId);
  delete socket.roomId;
  delete socket.joinTime;
}

setInterval(() => {
  const now = Date.now();
  io.sockets.sockets.forEach((socket) => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (!room || !room.has(socket.id)) {
        console.log(`[清理] 清理孤立 socket: ${socket.id}`);
        delete socket.roomId;
      }
    }
  });

  if (rooms.size > 0) {
    console.log(`[状态] 当前房间数: ${rooms.size}, 总在线: ${io.sockets.sockets.size}`);
  }
}, 60000);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`[服务器] 信令服务器运行在端口 ${PORT}`);
  console.log(`[服务器] 健康检查: http://localhost:${PORT}/health`);
  console.log(`[服务器] 房间列表: http://localhost:${PORT}/rooms`);
});
