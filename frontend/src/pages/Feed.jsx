import { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import CommentSection from '../components/CommentSection';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPosts = async () => {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts`);
    setPosts(res.data);
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshKey]);

  return (
    <>
    <div className="p-6">
      <h1 className="text-4xl font-bold text-indigo-700" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>玩家秀</h1>
      <button
        className="absolute top-10 right-10"
        onClick={() => setShowPostForm(true)}
      >
        <img
          src="/img/post.jpg"
          alt="发帖"
          className="w-10 h-10 hover:scale-105 transition-transform"
        />
      </button>
      
      <div className="space-y-6 mt-6">
        {posts.map(post => (
          <div key={post.id} className="relative">
            <PostCard post={post} onLikeToggle={() => setRefreshKey(prev => prev + 1)} />
            <CommentSection postId={post.id} onCommentAdd={() => setRefreshKey(prev => prev + 1)}/>
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
