import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="w-48 bg-indigo-100 p-4 h-screen">
      <h2 className="text-2xl font-bold mb-6">导航</h2>
      <ul className="space-y-4">
        <li><NavLink to="/" className="hover:text-indigo-700"># 首页</NavLink></li>
        <li><NavLink to="/my-boxes" className="hover:text-indigo-700"># 我的盲盒</NavLink></li>
        <li><NavLink to="/feed" className="hover:text-indigo-700"># 玩家秀</NavLink></li>
      </ul>
    </div>
  );
}
