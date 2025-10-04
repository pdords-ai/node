import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>대시보드</h1>
          <p>환영합니다, {user?.username}님!</p>
        </div>

        <div className="dashboard-grid">
          <div className="stats-card">
            <h3>👤</h3>
            <p>사용자 정보</p>
            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              <p><strong>사용자명:</strong> {user?.username}</p>
              <p><strong>이메일:</strong> {user?.email}</p>
              <p><strong>역할:</strong> {user?.role}</p>
              {user?.profile?.fullName && (
                <p><strong>이름:</strong> {user.profile.fullName}</p>
              )}
            </div>
          </div>

          <div className="stats-card">
            <h3>📝</h3>
            <p>게시물 관리</p>
            <div style={{ marginTop: '20px' }}>
              <p>게시물을 작성하고 관리할 수 있습니다.</p>
            </div>
          </div>

          <div className="stats-card">
            <h3>💬</h3>
            <p>실시간 채팅</p>
            <div style={{ marginTop: '20px' }}>
              <p>다른 사용자들과 실시간으로 채팅할 수 있습니다.</p>
            </div>
          </div>

          <div className="stats-card">
            <h3>📁</h3>
            <p>파일 업로드</p>
            <div style={{ marginTop: '20px' }}>
              <p>이미지 파일을 업로드하고 관리할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
