export default function BlindBoxCard({ box, onClick }) {
  return (
    <div
      onClick={() => !box.claimed && onClick(box.id)}
      className={`relative p-4 rounded-lg shadow-md transition-all duration-300 ${
        box.claimed
          ? 'bg-gray-200 cursor-not-allowed'
          : 'bg-white hover:shadow-lg hover:scale-105 cursor-pointer'
      }`}
    >
      <img src="/img/icon.gif" alt="盲盒图标" className="w-24 h-24 mx-auto" />
      <p className="text-center mt-2 font-medium">{box.name}</p>
      {box.claimed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
          <span className="text-white font-bold">已被抽取</span>
        </div>
      )}
    </div>
  );
}
