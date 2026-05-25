import React from 'react';
import { Outlet } from 'react-router-dom';

const TvLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden selection:bg-indigo-500/30">
      <Outlet />
    </div>
  );
};

export default TvLayout;
