// src/components/Navbar.jsx
import { Link } from 'react-router-dom';

const Navbar = ({ user, logout }) => {
  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">SAI Fit</Link>
      <div className="flex items-center space-x-4">
        <Link to="/" className="hover:text-gray-400">Dashboard</Link>
        <Link to="/profiles" className="hover:text-gray-400">Athlete Profiles</Link>
        <Link to="/analyze-video" className="hover:text-gray-400">Analyze Video</Link>
        <span className="text-sm">Welcome, {user.name}</span>
        <button onClick={logout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;