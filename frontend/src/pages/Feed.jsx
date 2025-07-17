import { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import CommentSection from '../components/CommentSection';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchPosts = async () => {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts`);
    setPosts(res.data);
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

  useEffect(() => {
    fetchPosts();
  }, [refreshKey]);

  const handleDelete = async (postId) => {
    const token = localStorage.getItem('blindBoxToken');

    console.log('删除请求的token:', token);

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

  return (
    <>
    <div className="p-6">
      <h1 className="text-4xl font-bold text-indigo-700" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>玩家秀</h1>
      <button
        className="absolute top-10 right-10"
        onClick={() => setShowPostForm(true)}
      >
        <img
          src="/post.jpg"
          alt="发帖"
          className="w-10 h-10 hover:scale-105 transition-transform"
        />
      </button>
      
      <div className="space-y-6 mt-6">
        {posts.map(post => (
          <div key={post.id} className="relative">
            <PostCard post={post} onLikeToggle={() => setRefreshKey(prev => prev + 1)} />
            {currentUser && post.user.id === currentUser.id && (
              <button
                onClick={() => {
                  if (window.confirm('确定要删除这条帖子吗？')) {
                    handleDelete(post.id);
                  }
                }}
                className="absolute top-2 right-2 text-sm text-red-500 hover:text-red-700 bg-white px-2 py-1 rounded shadow"
              >
                删除
              </button>
            )}
          </div>
        ))}
      </div>

      {showPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-4 w-96 relative shadow-lg">
            <button
              onClick={() => setShowPostForm(false)}
              className="absolute top-2 right-4 text-gray-500 hover:text-black text-xl"
            >
              ×
            </button>
            <PostForm 
              onPostSuccess={() => setRefreshKey(prev => prev + 1)} 
              onClose={() => setShowPostForm(false)}
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
