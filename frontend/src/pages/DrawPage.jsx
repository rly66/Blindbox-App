import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ResultModal from '../components/ResultModal';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

export default function DrawPage({ user }) {
  const { seriesId } = useParams();
  const [boxes, setBoxes] = useState([]);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const seriesName = location.state?.seriesName || '系列';

  const fetchBoxes = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/boxes?seriesId=${seriesId}`);
      setBoxes(res.data);
      setIsLoading(false);
    } catch (error) {
      console.error('加载盲盒失败:', error);
      setError('加载盲盒失败，请稍后重试');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('blindBoxToken');
    if (!token) {
      navigate('/login'); // 无 Token 则跳转登录页
      return;
    }

    if (seriesId) {
      fetchBoxes();
    } else {
      setError('无效的系列ID');
    }
  }, [seriesId]);

  const handleDraw = async (boxId) => {
    const token = localStorage.getItem('blindBoxToken');
    const user = JSON.parse(localStorage.getItem('blindBoxUser'));
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/draw`, { boxId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResult(res.data.box);
      setShowModal(true);
      fetchBoxes(); // 刷新状态
    } catch (error) {
      if (error.response?.status === 403) {
      alert('登录已过期，请重新登录');
      localStorage.removeItem('blindBoxToken');
      navigate(0);
    } else {
      alert(error.response?.data?.error || '抽取失败');
    }
    }
  };

  if (isLoading) {
    return <div className="text-center mt-8">加载中...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-gray-500">{error}</div>;
  }

  return (
    <div className="items-center mt-6 mb-6">
    <h1 className="text-center text-4xl font-bold text-indigo-700" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>{seriesName}</h1>
    <div className="flex flex-col items-center justify-center px-4">
      <div className="grid grid-cols-3 gap-6 max-w-3xl w-full">
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

      {showModal && result && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        onClick={() => setShowModal(false)}
      >
      </button>

      {result.isRare && (
        <div className="absolute top-6 left-4 transform rotate-[-20deg] bg-red-600 text-white font-bold px-4 py-2 rounded-full shadow-md text-bg">
          隐藏款
      </div>
      )}

      <h2 className="text-2xl font-bold text-green-700 mb-4">🎉 恭喜您抽中了：</h2>
      <img
        src={result.imageUrl}
        alt="盲盒内容图"
        className="w-32 h-32 mx-auto mb-4"
      />
      <h3 className="text-xl font-semibold">{result.description}</h3>
      <div className="flex justify-between items-center">
      <button
        className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        onClick={() => {
          setShowModal(false);
          navigate('/feed');
        }}
      >
        分享到玩家秀
      </button>
      <button
          type="button"
          onClick={() => {
          setShowModal(false);
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
    </div>
  );
}
