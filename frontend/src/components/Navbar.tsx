import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          🚀 Node.js 학습
        </Link>
        
        <ul className="navbar-nav">
          <li>
            <Link to="/">홈</Link>
          </li>
          
          {user ? (
            <>
              <li>
                <Link to="/dashboard">대시보드</Link>
              </li>
              <li>
                <Link to="/posts">게시물</Link>
              </li>
              <li>
                <Link to="/chat">채팅</Link>
              </li>
              <li>
                <Link to="/profile">프로필</Link>
              </li>
              <li>
                <span style={{ color: '#667eea', fontWeight: 'bold' }}>
                  안녕하세요, {user.username}님!
                </span>
              </li>
              <li>
                <button className="btn btn-danger" onClick={handleLogout}>
                  로그아웃
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="btn">
                  로그인
                </Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-secondary">
                  회원가입
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
