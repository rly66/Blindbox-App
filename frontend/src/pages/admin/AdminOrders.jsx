import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminOrders() {
  const [drawRecords, setDrawRecords] = useState([]);

  useEffect(() => {
    fetchDrawRecords();
  }, []);

  const fetchDrawRecords = async () => {
  try {
    const token = localStorage.getItem('blindBoxToken');
    const res = await axios.get('/api/admin/draw-records', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setDrawRecords(res.data);
  } catch (err) {
    alert('获取抽取记录失败：' + (err?.response?.data?.message || err.message));
  }
};


  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-indigo-700" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>盲盒订单记录</h1>

      {drawRecords.length === 0 ? (
        <p className='mt-6'>暂无记录</p>
      ) : (
        <table className="table-auto w-full border mt-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-center">用户</th>
              <th className="border px-4 py-2 text-center">盲盒名称</th>
              <th className="border px-4 py-2 text-center">盲盒类型</th>
              <th className="border px-4 py-2 text-center">抽取时间</th>
            </tr>
          </thead>
          <tbody>
            {drawRecords.map((r, i) => (
              <tr key={i}>
                <td className="border px-4 py-2 text-center">{r.username}</td>
                <td className="border px-4 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-indigo-600 font-medium">{r.seriesName}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-700 text-sm">{r.description}</span>
                  </div>
                </td>
                <td className="border px-4 py-2 text-center">
                  <span className={r.isRare
        ? 'bg-green-100 text-green-600 font-semibold px-2 py-1 rounded'
        : 'bg-gray-100 text-gray-700 px-2 py-1 rounded'}>
                    {r.isRare ? '隐藏款' : '普通款'}
                  </span>
                </td>
                <td className="border px-4 py-2 text-center">
                  {new Date(r.drawTime).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
