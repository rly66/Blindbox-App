import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ResultModal from '../components/ResultModal';

export default function DrawPage({ user }) {
  const { seriesId } = useParams();
  const [boxes, setBoxes] = useState([]);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchBoxes = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/boxes?seriesId=${seriesId}`);
      setBoxes(res.data);
    } catch (error) {
      console.error('加载盲盒失败:', error);
    }
  };

  const handleDraw = async (boxId) => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/draw`, { boxId });
      setResult(res.data.box);
      setShowModal(true);
      fetchBoxes(); // 刷新状态
    } catch (error) {
      alert(error.response?.data?.error || '抽取失败');
    }
  };

  useEffect(() => {
  async function fetchBoxes() {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/boxes?seriesId=${seriesId}`);
      setBoxes(res.data);
    } catch (err) {
      console.error('加载盲盒失败:', err);
    }
  }

  fetchBoxes();
}, [seriesId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-indigo-700">抽取盲盒</h2>
      <div className="grid grid-cols-3 gap-4">
        {boxes.map((box) => (
          <div
            key={box.id}
            onClick={() => !box.claimed && handleDraw(box.id)}
            className={`p-4 rounded-lg shadow-md text-center ${
              box.claimed ? 'bg-gray-200 cursor-not-allowed' : 'bg-white cursor-pointer hover:shadow-lg'
            }`}
          >
            <img src="/icon.gif" alt="box" className="w-24 h-24 mx-auto" />
            <p className="mt-2">{box.name}</p>
            {box.claimed && <p className="text-red-500 text-sm mt-1">已被抽取</p>}
          </div>
        ))}
      </div>
      {showModal && result && (
        <ResultModal
          box={result}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
