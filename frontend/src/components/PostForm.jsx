import { useState } from 'react';
import axios from 'axios';
import MyBoxModal from './MyBoxModal';

export default function PostForm({ onPostSuccess, onClose }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('blindBoxToken');
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts`,
        { content, imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent('');
      setImageUrl('');
      onPostSuccess();
      onClose();
    } catch (error) {
      console.error('发帖失败:', error);
      alert('发帖失败');
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded mb-6">
      <textarea
        className="w-full border p-2 rounded mb-2"
        placeholder="分享你的抽盒体验..."
        rows="3"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="flex-1 border p-2 rounded"
            placeholder="图片地址"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-gray-200 px-2 rounded hover:bg-gray-300"
          >
            选择我的盲盒图片
          </button>
        </div>
      <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
        发布
      </button>
    </form>

    {showModal && (
      <MyBoxModal
        onSelect={(url) => setImageUrl(url)}
        onClose={() => setShowModal(false)}
      />
    )}
    </>
  );
}
