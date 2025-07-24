import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminBoxes() {
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSeriesStatus();
  }, []);

  const fetchSeriesStatus = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('blindBoxToken');
    const res = await axios.get('/api/admin/batches/status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setSeriesList(res.data);
  } catch (err) {
    alert('获取系列箱子状态失败，错误：' + err.message);
  } finally {
    setLoading(false);
  }
};

const handleAddBatch = async () => {
  if (!selectedSeriesId) return;
  try {
    const token = localStorage.getItem('blindBoxToken');
    await axios.post('/api/admin/batch/activate', { seriesId: selectedSeriesId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    alert('成功上架新一箱！');
    fetchSeriesStatus();
  } catch (err) {
    alert('上架失败：' + (err?.response?.data?.error || err.message));
  }
};

  const handleSeriesSelect = (e) => {
    setSelectedSeriesId(Number(e.target.value));
  };

  // 找到选中系列的批次
  const selectedSeries = seriesList.find(s => s.seriesId === selectedSeriesId);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-indigo-700" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>盲盒管理</h1>

      <div className="mt-4 mb-4">
        <label className="mr-2">选择系列：</label>
        <select onChange={handleSeriesSelect} className="border px-2 py-1" value={selectedSeriesId || ''}>
          <option value="">请选择</option>
          {seriesList.map(s => (
            <option key={s.seriesId} value={s.seriesId}>
              {s.seriesName}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>加载中...</p>}

      {selectedSeries && (
        <>
          <table className="table-auto w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-center">箱号</th>
                <th className="border px-4 py-2 text-center">抽取数量</th>
                <th className="border px-4 py-2 text-center">是否抽取完毕</th>
              </tr>
            </thead>
            <tbody>
              {selectedSeries.batches.map(batch => (
                <tr key={batch.batchId}>
                  <td className="border px-4 py-2 text-center">第 {batch.batchNo} 箱
                    {batch.isActive && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-xs font-medium shadow-sm border border-pink-300 animate-pulse">
                        上架中
                      </span>
                    )}</td>
                  <td className="border px-4 py-2 text-center">{batch.claimed} / {batch.total}</td>
                  <td className="border px-4 py-2 text-center">{batch.isFinished ? '是' : '否'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleAddBatch}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            上架新一箱
          </button>
        </>
      )}
    </div>
  );
}
