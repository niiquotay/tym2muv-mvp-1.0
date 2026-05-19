import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 flex flex-col items-center">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mb-2">
          <Icon name="search" size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-700">Page not found</h2>
        <p className="text-slate-500">
          We couldn't find the page you were looking for. It might have been removed, renamed, or doesn't exist.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          <Icon name="home" size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
