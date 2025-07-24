import { NavLink } from 'react-router-dom';

export default function Sidebar({ user }) {
  return (
    <aside className="w-56 min-h-screen p-6 rounded-r-lg
      bg-gradient-to-b from-indigo-200 via-purple-200 to-indigo-200
     text-white shadow-lg flex flex-col"
    >
      <nav className="flex flex-col space-y-3 flex-grow">
        {(user?.isAdmin ? [
          { to: '/', label: '首页', icon: '🏠' },
          { to: '/admin/boxes', label: '盲盒管理', icon: '🎁' },
          { to: '/admin/orders', label: '订单管理', icon: '📦' },
        ] : [
          { to: '/', label: '首页', icon: '🏠' },
          { to: '/my-boxes', label: '我的盲盒', icon: '🎲' },
          { to: '/feed', label: '玩家秀', icon: '🖼️' },
        ])?.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 rounded-lg font-medium transition 
               ${
                 isActive
                   ? 'bg-indigo-500 text-white shadow-lg scale-105'
                   : 'text-indigo-700 hover:bg-indigo-300 hover:text-indigo-900 hover:scale-105'
               }`
            }
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <footer className="mt-96 text-center text-sm text-indigo-500 select-none">
        © RLY 的盲盒世界
      </footer>
    </aside>
  );
}
