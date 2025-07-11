export default function ResultModal({ result, onClose, onShare }) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>×</button>
        <h2 className="text-2xl font-bold text-green-700 mb-4">🎉 恭喜您抽中了：</h2>
        <img src={result.imageUrl || '/icon.gif'} alt="盲盒内容图" className="w-32 h-32 mx-auto mb-4" />
        <h3 className="text-xl font-semibold">{result.name}</h3>
        <p className="text-gray-700 mt-2">{result.description}</p>
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={onShare}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            分享到玩家秀
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">返回</button>
        </div>
      </div>
    </div>
  );
}
