import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({ identifier: '', username: '', password: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = role === 'admin' ? '/api/admin/login' : '/api/student/login';
      const data = role === 'admin' 
        ? { username: formData.username, password: formData.password }
        : { identifier: formData.identifier, password: formData.password };
      
      console.log(data);
      const res = await axios.post(endpoint, data);
      console.log(res.data);
      login(res.data);
      navigate(role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-indigo-900 tracking-tight">SIET Portal</h2>
          <p className="text-gray-500 mt-2 font-medium">Student Result Management</p>
        </div>
        
        <div className="flex mb-8 bg-gray-100 rounded-2xl p-1.5 shadow-inner">
          <button 
            className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${role === 'student' ? 'bg-white text-indigo-600 shadow-lg scale-100' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setRole('student')}
          >Student</button>
          <button 
            className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${role === 'admin' ? 'bg-white text-indigo-600 shadow-lg scale-100' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setRole('admin')}
          >Admin</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {role === 'admin' ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2">Admin Username</label>
              <input
                type="text"
                placeholder="Enter username"
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2">Roll Number / Email</label>
              <input
                type="text"
                placeholder="Enter Roll Number or Email"
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                required
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-2">Secure Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95">
            Log In as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>
        
        <p className="text-center mt-8 text-sm text-gray-400 font-medium">
          Contact administration if you forgot your credentials.
        </p>
      </div>
    </div>
  );
};

export default Login;
