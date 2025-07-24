// src/components/AdminPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('blindBoxToken');
        if (!token) {
          navigate('/'); // 未登录则跳转首页
          return;
        }

        const res = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data.isAdmin) {
          navigate('/'); // 非管理员禁止访问
        }
      } catch (err) {
        console.error('获取用户信息失败', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div className="p-4 text-center">加载中...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">管理员后台</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => navigate('/admin/boxes')}
          className="cursor-pointer p-6 border rounded-xl shadow hover:bg-gray-50 transition"
        >
          <h2 className="text-xl font-semibold mb-2">盲盒管理</h2>
          <p className="text-gray-600">查看盲盒系列、批次、上架新箱子</p>
        </div>

        <div
          onClick={() => navigate('/admin/orders')}
          className="cursor-pointer p-6 border rounded-xl shadow hover:bg-gray-50 transition"
        >
          <h2 className="text-xl font-semibold mb-2">订单管理</h2>
          <p className="text-gray-600">查看所有用户的抽取记录</p>
        </div>
      </div>
    </div>
  );
}
