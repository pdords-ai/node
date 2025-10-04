import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>실시간 채팅</h1>
          <p>다른 사용자들과 실시간으로 채팅하세요</p>
        </div>

        <div className="chat-container">
          <div className="chat-sidebar">
            <h3>채팅방</h3>
            <div className="form-group">
              <label>방 ID</label>
              <input type="text" placeholder="room123" defaultValue="general" />
            </div>
            <button className="btn">연결</button>
            <button className="btn btn-secondary">방 참여</button>
          </div>

          <div className="chat-main">
            <div className="chat-header">
              일반 채팅방
            </div>
            
            <div className="chat-messages">
              <div className="message other">
                <div className="message-info">시스템 • 12:00</div>
                <div>채팅방에 참여했습니다.</div>
              </div>
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="메시지를 입력하세요"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button className="btn">전송</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
