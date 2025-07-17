import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyBoxModal({ onSelect, onClose }) {
  const [boxes, setBoxes] = useState([]);

  useEffect(() => {
    const fetchMyBoxes = async () => {
      const token = localStorage.getItem('blindBoxToken');
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/my-boxes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBoxes(res.data);
      } catch (err) {
        console.error('加载盲盒失败:', err);
      }
    };

    fetchMyBoxes();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-4 text-center">选择你想分享的盲盒</h2>
        <div className="grid grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
          {boxes.map((box) => (
            <div
              key={box.id}
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => {
                onSelect(box.imageUrl);
                onClose();
              }}
            >
              <img src={box.imageUrl} alt="盲盒" className="w-24 h-24 mx-auto rounded" />
              <p className="text-sm text-center mt-1">{box.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <button onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white px-2 py-1 rounded">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
