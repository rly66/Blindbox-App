import { useState } from 'react';
import axios from 'axios';

export default function CommentSection({ postId, comments, onCommentAdd }) {
  const [text, setText] = useState('');
  const token = localStorage.getItem('blindBoxToken');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/posts/${postId}/comments`,
        { content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setText('');
      onCommentAdd();
    } catch (error) {
      console.error('评论失败:', error);
      alert('评论失败');
    }
  };

  return (
    <div className="mt-4">
      {comments.map(c => (
        <div key={c.id} className="text-sm text-gray-700 mb-1">
          <strong>{c.user.username}</strong>: {c.content}
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
