import { NavLink } from 'react-router-dom';

export default function Sidebar({ user }) {
  return (
    <div className="w-52 bg-indigo-100 min-h-screen p-4">
      <nav className="flex flex-col space-y-2">
        {user?.isAdmin ? (
          <>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-4 py-2 rounded ${
                  isActive ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-200'
                }`
              }
            >
              》〉首页
            </NavLink>
            
            <NavLink
              to="/admin/boxes"
              className={({ isActive }) =>
                `block px-4 py-2 rounded ${
                  isActive ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-200'
                }`
              }
            >
              》〉盲盒管理
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `block px-4 py-2 rounded ${
                  isActive ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-200'
                }`
              }
            >
              》〉订单管理
            </NavLink>
          </>
        ) : (
          <>
            {/* 普通用户菜单 */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-4 py-2 rounded ${
                  isActive ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-200'
                }`
              }
            >
              》〉首页
            </NavLink>

            <NavLink
              to="/my-boxes"
              className={({ isActive }) =>
                `block px-4 py-2 rounded ${
                  isActive ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-200'
                }`
              }
            >
              》〉我的盲盒
            </NavLink>

            <NavLink
              to="/feed"
              className={({ isActive }) =>
                `block px-4 py-2 rounded ${
                  isActive ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-200'
                }`
              }
            >
              》〉玩家秀
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
}
