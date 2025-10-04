import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 프로필 업데이트 로직
    setIsEditing(false);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>프로필</h1>
          <p>사용자 정보를 관리하세요</p>
        </div>

        <div className="card">
          <h2>사용자 정보</h2>
          
          {!isEditing ? (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <p><strong>사용자명:</strong> {user?.username}</p>
                <p><strong>이메일:</strong> {user?.email}</p>
                <p><strong>역할:</strong> {user?.role}</p>
                {user?.profile?.fullName && (
                  <p><strong>이름:</strong> {user.profile.fullName}</p>
                )}
                {user?.profile?.bio && (
                  <p><strong>자기소개:</strong> {user.profile.bio}</p>
                )}
              </div>
              <button className="btn" onClick={() => setIsEditing(true)}>
                프로필 수정
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="이름을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>성</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="성을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>자기소개</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="자기소개를 입력하세요"
                />
              </div>
              
              <button type="submit" className="btn">
                저장
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                취소
              </button>
            </form>
          )}
        </div>

        <div className="card">
          <h2>비밀번호 변경</h2>
          <form>
            <div className="form-group">
              <label>현재 비밀번호</label>
              <input type="password" placeholder="현재 비밀번호를 입력하세요" />
            </div>
            <div className="form-group">
              <label>새 비밀번호</label>
              <input type="password" placeholder="새 비밀번호를 입력하세요" />
            </div>
            <div className="form-group">
              <label>새 비밀번호 확인</label>
              <input type="password" placeholder="새 비밀번호를 다시 입력하세요" />
            </div>
            <button className="btn">비밀번호 변경</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
