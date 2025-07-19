import axios from 'axios';
import { useEffect, useState } from 'react';

export default function PostCard({ post, onLikeToggle }) {
  const token = localStorage.getItem('blindBoxToken');
  const [currentUser, setCurrentUser] = useState(null);
  const [setRefreshKey] = useState(0);

  const handleLike = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${post.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onLikeToggle(); // 重新获取帖子列表
    } catch (error) {
      console.error('点赞失败:', error);
      alert('点赞失败');
    }
  };

  const handleDelete = async (postId) => {
    const token = localStorage.getItem('blindBoxToken');

    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshKey(prev => prev + 1); // 触发重新加载
    } catch (error) {
      alert('删除失败');
      console.error('删除失败:', error);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('blindBoxUser');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('用户信息解析失败：', e);
      }
    }
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-base text-gray-600 mb-1">{post.user.username} 发表于 {new Date(post.createdAt).toLocaleString()}</div>
      <p className="mb-2">{post.content}</p>
      {post.imageUrl && <img src={post.imageUrl} alt="post" className="w-48 mb-2 rounded" />}
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
        <button onClick={handleLike} className="hover:text-red-600">❤️ {post.likes.length}</button>
        <button>💬 {post.comments.length}</button>
        {currentUser && post.user.id === currentUser.id && (
        <button
          onClick={() => {
             if (window.confirm('确定要删除这条帖子吗？')) {
              handleDelete(post.id);
             }
          }}
         >
           <img
            src="/delete.jpg"
             alt="删除帖子"
             className="w-4 h-4 hover:scale-105 transition-transform"
          />
        </button>
      )}
      </div>
    </div>
  );
}
