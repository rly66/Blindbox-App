import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function DrawPage() {
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
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/boxes/latest?seriesId=${seriesId}`);
      const boxesData = Array.isArray(res.data) ? res.data : res.data.boxes || [];
      setBoxes(boxesData);
    } catch (error) {
      console.error('加载盲盒失败:', error);
      setError('加载盲盒失败，请稍后重试');
    } finally {
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
      setIsLoading(false);
    }
  }, [seriesId]);

  const handleDraw = async (boxId) => {
    const token = localStorage.getItem('blindBoxToken');

    console.log('Token before draw:', token);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/draw`,
        { boxId },
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
      <h1
        className="text-center text-4xl font-bold text-indigo-700"
        style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          fontFamily: '"STXingkai", "华文行楷", cursive',
        }}
      >
        {seriesName}
      </h1>

      {Array.isArray(boxes) && boxes.length > 0 && boxes.every(box => box.claimed) && (
        <div className="text-center text-gray-500 mt-3 text-sm">
          当前一箱已被全部抽完啦，请耐心等待管理员上架新的一箱～
          <div className="mt-3" />
        </div>
      )}

      <div className="pt-6 flex flex-col items-center justify-center px-4">
        <div className="grid grid-cols-4 gap-6 max-w-3xl w-full">
          {Array.isArray(boxes) &&
            boxes.map((box, index) => (
              <div
                key={box.id}
                onClick={() => !box.claimed && handleDraw(box.id)}
                className={`relative p-4 rounded-lg shadow-md transition-all duration-300 ${
                  box.claimed
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-white hover:shadow-lg hover:scale-105 cursor-pointer border border-transparent hover:border-indigo-400'
                }`}
              >
                <img src="/img/icon.gif" alt="盲盒图标" className="w-24 h-24 mx-auto" />
                <p className="text-center mt-2 font-medium">神秘盲盒 #{index + 1}</p>

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
                ×
              </button>

              {result.isRare && (
                <div className="absolute top-6 left-4 z-10 animate-float-in animate-bounce">
                  <div className="bg-gradient-to-r from-red-600 via-pink-500 to-yellow-400 
                    text-white text-base sm:text-base font-extrabold 
                    px-2 py-2 rounded-full shadow-xl 
                    backdrop-blur-md border border-white/20 
                    ring-2 ring-yellow-300/50">
                    ✨ 隐藏款 ✨
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-bold text-green-700 mb-4">🎉 恭喜您抽中了：</h2>
              <img
                src={result.imageUrl}
                alt="盲盒内容图"
                className="w-1/2 h-1/2 mx-auto mb-4"
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
