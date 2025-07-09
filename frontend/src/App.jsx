import { useEffect, useState } from 'react';
import axios from 'axios';

const backendURL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [boxes, setBoxes] = useState([]);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState('login');
  const [showResultModal, setShowResultModal] = useState(false);


  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchBoxes = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/boxes`);
      setBoxes(res.data);
    } catch (error) {
      console.error('加载盲盒失败:', error);
    }
  };

  const handleDraw = async (boxId) => {
    if (!user) {
      setShowAuthForm('login');
      alert('请先登录后再抽取盲盒哦～');
      return;
    }

    try {
      const res = await axios.post(`${backendURL}/api/draw`, { boxId });
      setResult(res.data.box);
      setShowResultModal(true);
      await fetchBoxes();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || '抽取失败');
        if (error.response?.status === 401) {
          handleLogout();
        }
      } else {
        alert('抽取失败');
      }
    }
  };

  const handleRegister = async (username, password) => {
    try {
      await axios.post(`${backendURL}/api/register`, { username, password });
      alert('注册成功，请登录');
      setShowAuthForm('login');
    } catch (error) {
      alert(error.response?.data?.error || '注册失败');
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const res = await axios.post(`${backendURL}/api/login`, { username, password });
      setToken(res.data.token);
      setUser(res.data.user);
      setShowAuthForm(null);
      localStorage.setItem('blindBoxToken', res.data.token);
      localStorage.setItem('blindBoxUser', JSON.stringify(res.data.user));
    } catch (error) {
      alert(error.response?.data?.error || '登录失败');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('blindBoxToken');
    localStorage.removeItem('blindBoxUser');
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('blindBoxToken');
    const storedUser = localStorage.getItem('blindBoxUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    fetchBoxes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700" style={{ fontFamily: '"KaiTi", "楷体", serif' }}>蛋黄猫盲盒抽盒机</h1>
          {user ? (
            <div className="flex items-center">
              <span className="mr-4">欢迎, {user.username}</span>
              <button 
                onClick={handleLogout}
                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
              >
                退出登录
              </button>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowAuthForm('login')}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                登录
              </button>
              <button 
                onClick={() => setShowAuthForm('register')}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                注册
              </button>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500 mb-6" style={{ fontFamily: '"KaiTi", "楷体", serif' }}>
          Tips: 有机会抽到惊喜隐藏款新奇物种哦～
        </div>

        {showAuthForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {showAuthForm === 'login' ? '用户登录' : '用户注册'}
              </h2>
              <AuthForm 
                mode={showAuthForm} 
                onLogin={handleLogin} 
                onRegister={handleRegister}
                onClose={() => setShowAuthForm(null)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          {boxes.map((box) => (
            <div
              key={box.id}
              onClick={() => !box.claimed && handleDraw(box.id)}
              className={`relative p-4 rounded-lg shadow-md transition-all duration-300 ${
                box.claimed
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-white hover:shadow-lg hover:scale-105 cursor-pointer'
              }`}
            >
              <img
                src="/icon.gif"
                alt="盲盒图标"
                className="w-24 h-24 mx-auto"
              />
              <p className="text-center mt-2 font-medium">{box.name}</p>

              {box.claimed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                  <span className="text-white font-bold">已被抽取</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {showResultModal && result && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        onClick={() => setShowResultModal(false)}
      >
      </button>
      <h2 className="text-2xl font-bold text-green-700 mb-4">🎉 恭喜您抽中了：</h2>
      <img
        src={result.imageUrl || '/icon.gif'}
        alt="盲盒内容图"
        className="w-32 h-32 mx-auto mb-4"
      />
      <h3 className="text-xl font-semibold">{result.name}</h3>
      <p className="text-gray-700 mt-2">{result.description}</p>
      <div className="flex justify-between items-center">
      <button
        className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        onClick={() => {
          setShowResultModal(false);
          alert('你可以在这里实现跳转到玩家秀分享页面');
        }}
      >
        分享到玩家秀
      </button>
      <button
          type="button"
          onClick={() => {
          setShowResultModal(false);
        }}
          className="text-gray-500 hover:text-gray-700"
        >
          返回
        </button>
        </div>
    </div>
  </div>
)}
      </div>

    <footer className="mt-12 text-center text-xs text-gray-400">
        本项目仅用于课程作业和学习交流目的。页面中使用的卡通形象表情包均为其原版权所有方所有，若有侵权请联系删除。
    </footer>

    </div>
  );
}

function AuthForm({ mode, onLogin, onRegister, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(username, password);
    } else {
      onRegister(username, password);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2" htmlFor="username">用户名</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 mb-2" htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div className="flex justify-between items-center">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          {mode === 'login' ? '登录' : '注册'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          关闭
        </button>
      </div>
    </form>
  );
}

export default App;
