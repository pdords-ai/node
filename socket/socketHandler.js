// 필요한 라이브러리들을 가져옵니다
const jwt = require('jsonwebtoken');       // 사용자 인증을 위한 토큰을 다루는 도구
const User = require('../models/User');    // 사용자 데이터 모델

// 연결된 사용자들을 저장하는 Map (현재 온라인인 사용자들의 목록)
// Map은 키-값 쌍을 저장하는 자료구조로, 마치 전화번호부와 같아요
const connectedUsers = new Map();

// Socket.io 이벤트 핸들러 (실시간 통신을 처리하는 함수들)
// 이 함수는 "실시간으로 메시지를 주고받을 수 있게 해주세요"라고 하는 기능입니다
module.exports = (io) => {
  // 인증 미들웨어 (사용자가 연결될 때 먼저 실행되는 검사)
  // 마치 건물에 들어갈 때 출입증을 확인하는 것과 같아요
  io.use(async (socket, next) => {
    try {
      // 1단계: 사용자가 보낸 토큰을 찾습니다
      // socket.handshake는 사용자가 연결할 때 보낸 정보입니다
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      // 토큰이 없으면 "로그인이 필요해요!"라고 알려줍니다
      if (!token) {
        return next(new Error('인증 토큰이 필요합니다.'));
      }

      // 2단계: 토큰이 진짜인지 확인합니다
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 3단계: 데이터베이스에서 사용자 정보를 찾습니다
      const user = await User.findById(decoded.userId).select('-password');
      
      // 사용자가 없거나 비활성화된 계정이면 "접근할 수 없어요!"라고 알려줍니다
      if (!user || !user.isActive) {
        return next(new Error('유효하지 않은 사용자입니다.'));
      }

      // 4단계: 모든 검증이 끝나면 소켓에 사용자 정보를 저장합니다
      socket.userId = user._id.toString();  // 사용자 ID 저장
      socket.user = user;                   // 사용자 전체 정보 저장
      
      // 다음 단계로 넘어갑니다
      next();
    } catch (error) {
      // 에러가 발생하면 "인증에 실패했어요!"라고 알려줍니다
      next(new Error('인증에 실패했습니다.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ 사용자 연결: ${socket.user.username} (${socket.id})`);
    
    // 사용자를 연결된 사용자 목록에 추가
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // 모든 클라이언트에게 온라인 사용자 목록 전송
    io.emit('user_online', {
      userId: socket.userId,
      username: socket.user.username,
      profile: socket.user.profile
    });

    // 현재 온라인 사용자 목록 전송
    socket.emit('online_users', Array.from(connectedUsers.values()).map(u => ({
      userId: u.user._id,
      username: u.user.username,
      profile: u.user.profile
    })));

    // 채팅방 참여
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`사용자 ${socket.user.username}이 방 ${roomId}에 참여했습니다.`);
      
      socket.to(roomId).emit('user_joined', {
        userId: socket.userId,
        username: socket.user.username,
        profile: socket.user.profile,
        roomId
      });
    });

    // 채팅방 나가기
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`사용자 ${socket.user.username}이 방 ${roomId}에서 나갔습니다.`);
      
      socket.to(roomId).emit('user_left', {
        userId: socket.userId,
        username: socket.user.username,
        roomId
      });
    });

    // 채팅 메시지 전송
    socket.on('send_message', (data) => {
      const { roomId, message, type = 'text' } = data;
      
      if (!roomId || !message) {
        socket.emit('error', { message: '방 ID와 메시지가 필요합니다.' });
        return;
      }

      const messageData = {
        id: Date.now().toString(),
        userId: socket.userId,
        username: socket.user.username,
        profile: socket.user.profile,
        message,
        type,
        timestamp: new Date(),
        roomId
      };

      // 해당 방의 모든 사용자에게 메시지 전송
      io.to(roomId).emit('new_message', messageData);
      
      console.log(`메시지 전송: ${socket.user.username} -> 방 ${roomId}: ${message}`);
    });

    // 개인 메시지 전송
    socket.on('send_private_message', (data) => {
      const { targetUserId, message, type = 'text' } = data;
      
      if (!targetUserId || !message) {
        socket.emit('error', { message: '대상 사용자 ID와 메시지가 필요합니다.' });
        return;
      }

      const targetUser = connectedUsers.get(targetUserId);
      if (!targetUser) {
        socket.emit('error', { message: '대상 사용자가 온라인이 아닙니다.' });
        return;
      }

      const messageData = {
        id: Date.now().toString(),
        fromUserId: socket.userId,
        fromUsername: socket.user.username,
        fromProfile: socket.user.profile,
        toUserId: targetUserId,
        message,
        type,
        timestamp: new Date()
      };

      // 대상 사용자에게만 메시지 전송
      io.to(targetUser.socketId).emit('private_message', messageData);
      
      // 발신자에게도 메시지 전송 (확인용)
      socket.emit('private_message_sent', messageData);
      
      console.log(`개인 메시지: ${socket.user.username} -> ${targetUserId}: ${message}`);
    });

    // 타이핑 상태 전송
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.to(roomId).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          roomId
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.to(roomId).emit('user_stopped_typing', {
          userId: socket.userId,
          username: socket.user.username,
          roomId
        });
      }
    });

    // 게시물 좋아요 알림
    socket.on('post_liked', (data) => {
      const { postId, postTitle, authorId } = data;
      
      // 게시물 작성자에게 알림 전송
      const author = connectedUsers.get(authorId);
      if (author) {
        io.to(author.socketId).emit('notification', {
          type: 'post_liked',
          message: `${socket.user.username}님이 "${postTitle}" 게시물을 좋아합니다.`,
          postId,
          fromUser: {
            userId: socket.userId,
            username: socket.user.username,
            profile: socket.user.profile
          },
          timestamp: new Date()
        });
      }
    });

    // 댓글 알림
    socket.on('comment_added', (data) => {
      const { postId, postTitle, authorId, comment } = data;
      
      // 게시물 작성자에게 알림 전송
      const author = connectedUsers.get(authorId);
      if (author) {
        io.to(author.socketId).emit('notification', {
          type: 'comment_added',
          message: `${socket.user.username}님이 "${postTitle}" 게시물에 댓글을 남겼습니다.`,
          postId,
          comment,
          fromUser: {
            userId: socket.userId,
            username: socket.user.username,
            profile: socket.user.profile
          },
          timestamp: new Date()
        });
      }
    });

    // 사용자 상태 업데이트
    socket.on('update_status', (data) => {
      const { status } = data;
      const user = connectedUsers.get(socket.userId);
      if (user) {
        user.status = status;
        user.lastActivity = new Date();
      }

      // 모든 클라이언트에게 상태 업데이트 전송
      io.emit('user_status_updated', {
        userId: socket.userId,
        username: socket.user.username,
        status,
        timestamp: new Date()
      });
    });

    // 연결 해제 처리
    socket.on('disconnect', (reason) => {
      console.log(`❌ 사용자 연결 해제: ${socket.user.username} (${socket.id}) - ${reason}`);
      
      // 연결된 사용자 목록에서 제거
      connectedUsers.delete(socket.userId);
      
      // 모든 클라이언트에게 사용자 오프라인 알림
      io.emit('user_offline', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    // 에러 처리
    socket.on('error', (error) => {
      console.error(`Socket 에러 (${socket.user.username}):`, error);
      socket.emit('error', { message: '서버 오류가 발생했습니다.' });
    });
  });

  // 주기적으로 연결 상태 확인 (5분마다)
  setInterval(() => {
    const now = new Date();
    connectedUsers.forEach((user, userId) => {
      // 10분 이상 비활성 상태인 사용자 제거
      if (now - user.connectedAt > 10 * 60 * 1000) {
        connectedUsers.delete(userId);
        console.log(`비활성 사용자 제거: ${user.user.username}`);
      }
    });
  }, 5 * 60 * 1000);

  return io;
};
