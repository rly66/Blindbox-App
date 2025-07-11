import React from 'react';
import '../index.css';

export default function WelcomePage({ onShowLogin, onShowRegister }) {
  return (
    <div className="h-screen w-full relative flex justify-center items-center overflow-hidden">
      {/* 背景图 */}
      <img
        src="/img/nl.gif"
        alt="背景"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* 中央欢迎内容 */}
      <div className="relative z-10 text-center text-black bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-6 drop-shadow-lg">欢迎来到 RLY 的盲盒世界！</h1>
        <div className="flex space-x-4 justify-center">
          <button
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-md text-lg text-white"
            onClick={onShowLogin}
          >
            登录
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-md text-lg text-white"
            onClick={onShowRegister}
          >
            注册
          </button>
        </div>
      </div>
    </div>
  );
}
