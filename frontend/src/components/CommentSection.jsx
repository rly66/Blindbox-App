import { useEffect, useState } from 'react';
import axios from 'axios';

export default function CommentSection({ postId, onCommentAdd }) {
  const [text, setText] = useState('');
  const [comments, setComments] = useState([]);
  const currentUserId = JSON.parse(localStorage.getItem('blindBoxUser') || '{}').id;

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${postId}/comments`);
      console.log('获取到评论：', res.data);
      setComments(res.data);
    } catch (err) {
      console.error('获取评论失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止默认表单提交行为

    const token = localStorage.getItem('blindBoxToken');
    const userStr = localStorage.getItem('blindBoxUser');
    console.log('当前token:', token);
    console.log('当前用户信息:', userStr);

    if (!token || !userStr) {
      alert('请先登录后再评论');
      return;
    }

    try {
     const user = JSON.parse(userStr);
     if (!user || !user.id) {
        alert('用户信息无效，请重新登录后再评论');
       localStorage.removeItem('blindBoxToken');
       localStorage.removeItem('blindBoxUser');
       return;
     }

    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/posts/${postId}/comments`,
      { content: text },
      { headers: { Authorization: `Bearer ${token}` } }
    );
      console.log('评论成功:', response.data);
      setText('');
      await fetchComments(); // 刷新评论
      if (onCommentAdd) onCommentAdd();
  } catch (error) {
      console.error('评论失败:', error);
      if (error.response?.status === 403) {
        alert('评论失败：登录状态可能已过期，请重新登录后再试');
        localStorage.removeItem('blindBoxToken');
        localStorage.removeItem('blindBoxUser');
        window.location.href = '/login';
      } else {
        alert('评论失败，请检查网络或稍后重试');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('blindBoxToken');
    if (!token) {
     alert('请先登录');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comments/${commentId}`, {
       method: 'DELETE',
        headers: {
         Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`删除失败：${error.message}`);
        return;
      }
    
      // 删除成功后更新本地评论状态
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
     console.error('删除评论失败', err);
      alert('删除失败');
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return (
    <div className="mt-4">
      {comments.map(c => (
        <div key={c.id} className="text-base text-gray-700 mb-1">
          <div className="flex justify-between items-center">
            <span>
              <strong>{c.user?.username || '匿名用户'}</strong>: {c.content}
            </span>
            {c.user.id === currentUserId && (
              <button onClick={() => {
             if (window.confirm('确定要删除这条评论吗？')) {
              handleDeleteComment(c.id);
             }
          }} className="ml-2">
                <img
                  src="/delete.jpg"
                  alt="删除评论"
                  className="w-3 h-3 hover:scale-105 transition-transform"
                />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">评论于 {new Date(c.createdAt).toLocaleString()}</p>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          className="flex-1 border px-2 py-1 rounded"
          placeholder="写评论..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
          发布
        </button>
      </form>
    </div>
  );
}
