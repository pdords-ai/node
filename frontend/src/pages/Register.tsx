import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../types';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    profile: {
      firstName: '',
      lastName: '',
      bio: ''
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          [profileField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="auth-form">
          <h2>회원가입</h2>
          
          {error && (
            <div className="response error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">사용자명</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="사용자명을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="test@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="비밀번호를 입력하세요 (최소 6자)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile.firstName">이름 (선택사항)</label>
              <input
                type="text"
                id="profile.firstName"
                name="profile.firstName"
                value={formData.profile?.firstName || ''}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile.lastName">성 (선택사항)</label>
              <input
                type="text"
                id="profile.lastName"
                name="profile.lastName"
                value={formData.profile?.lastName || ''}
                onChange={handleChange}
                placeholder="성을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile.bio">자기소개 (선택사항)</label>
              <textarea
                id="profile.bio"
                name="profile.bio"
                value={formData.profile?.bio || ''}
                onChange={handleChange}
                rows={3}
                placeholder="자기소개를 입력하세요"
              />
            </div>

            <button 
              type="submit" 
              className="btn" 
              disabled={loading}
            >
              {loading ? <div className="loading"></div> : '회원가입'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              이미 계정이 있으신가요? <Link to="/login">로그인</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
