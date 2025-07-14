import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import Home from './pages/Home';
import DrawPage from './pages/DrawPage';
import MyBoxes from './pages/MyBoxes';
import Feed from './pages/Feed';
import Sidebar from './components/Sidebar';
import AuthForm from './components/Authform';
import axios from 'axios';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('blindBoxToken'));
  const [user, setUser] = useState(() =>
    localStorage.getItem('blindBoxUser') ? JSON.parse(localStorage.getItem('blindBoxUser')) : null
  );

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  // 保存 token 到 localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('blindBoxToken', token);
    }
  }, [token]);

  // 登录处理
  const handleLogin = async (username, password) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
        username,
        password,
      });
      setToken(res.data.token);
      localStorage.setItem('blindBoxToken', res.data.token);
      setUser(res.data.user);
      localStorage.setItem('blindBoxUser', JSON.stringify(res.data.user));
      setShowLogin(false);
      navigate('/');
    } catch (err) {
      console.error('登录失败:', err);
      alert('登录失败，请检查用户名或密码');
    }
  };

  // 注册处理
  const handleRegister = async (username, password) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/register`, {
        username,
        password,
      });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('blindBoxUser', JSON.stringify(res.data.user));
      setShowRegister(false);
      alert('注册成功，请登录');
    } catch (err) {
      console.error('注册失败:', err);
      alert('注册失败，用户名可能已存在');
    }
  };

  const isAuthenticated = !!token;

  return (
    <>
      {!isAuthenticated ? (
        <>
          {/* 未登录状态显示欢迎页 */}
          <Routes>
            <Route
              path="/"
              element={
                <WelcomePage
                  onShowLogin={() => setShowLogin(true)}
                  onShowRegister={() => setShowRegister(true)}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          {/* 登录弹窗 */}
          {showLogin && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded shadow-lg z-50 w-96">
              <h2 className="text-xl font-bold mb-4 text-center">登录</h2>
              <AuthForm
                mode="login"
                onLogin={handleLogin}
                onClose={() => setShowLogin(false)}
              />
            </div>
          )}

          {/* 注册弹窗 */}
          {showRegister && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded shadow-lg z-50 w-96">
              <h2 className="text-xl font-bold mb-4 text-center">注册</h2>
              <AuthForm
                mode="register"
                onRegister={handleRegister}
                onClose={() => setShowRegister(false)}
              />
            </div>
          )}
        </>
      ) : (
        // 登录后页面
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/draw/:seriesId" element={<DrawPage user={user} />} />
              <Route path="/my-boxes" element={<MyBoxes user={user} />} />
              <Route path="/feed" element={<Feed user={user} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      )}
    </>
  );
}
