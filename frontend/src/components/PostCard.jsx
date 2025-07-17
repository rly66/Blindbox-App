import axios from 'axios';
import { useState } from 'react';
import CommentSection from './CommentSection';

export default function PostCard({ post, onLikeToggle }) {
  const token = localStorage.getItem('blindBoxToken');
  const [showComments, setShowComments] = useState(false);

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

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-600 mb-1">{post.user.username} 发表于 {new Date(post.createdAt).toLocaleString()}</div>
      <p className="mb-2">{post.content}</p>
      {post.imageUrl && <img src={post.imageUrl} alt="post" className="w-48 mb-2 rounded" />}
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
        <button onClick={handleLike} className="hover:text-red-600">❤️ {post.likes.length}</button>
        <button onClick={() => setShowComments(!showComments)}>💬 {post.comments.length}</button>
      </div>

      {showComments && <CommentSection postId={post.id} comments={post.comments} onCommentAdd={onLikeToggle} />}
    </div>
  );
}
