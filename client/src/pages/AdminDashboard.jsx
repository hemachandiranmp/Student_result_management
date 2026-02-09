import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, UserPlus, FileText, Users, LogOut, Edit2, Trash2, X, Check, BookOpen, AlertCircle, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  
  const [studentForm, setStudentForm] = useState({ name: '', rollNo: '', email: '', department: '', batch: '', password: '' });
  const [resultForm, setResultForm] = useState({ rollNo: '', semester: '1', subjects: [{ subjectName: '', marks: '' }] });

  useEffect(() => {
    fetchStudents();
    fetchResults();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/admin/students', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchResults = async () => {
    try {
      const res = await axios.get('/api/admin/results', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setResults(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/add-student', studentForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Student added successfully');
      setStudentForm({ name: '', rollNo: '', email: '', department: '', batch: '', password: '' });
      fetchStudents();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/update-student/${editingStudent._id}`, editingStudent, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Student updated successfully');
      setEditingStudent(null);
      fetchStudents();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure? This will also delete all results for this student.')) return;
    try {
      await axios.delete(`/api/admin/delete-student/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Student deleted successfully');
      fetchStudents();
      fetchResults();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/add-result', resultForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Result published successfully');
      setResultForm({ rollNo: '', semester: '1', subjects: [{ subjectName: '', marks: '' }] });
      fetchResults();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleUpdateResult = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/update-result/${editingResult._id}`, { 
        semester: editingResult.semester,
        subjects: editingResult.subjects 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Result updated successfully');
      setEditingResult(null);
      fetchResults();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const addSubject = () => {
    setResultForm({ ...resultForm, subjects: [...resultForm.subjects, { subjectName: '', marks: '' }] });
  };

  const addSubjectToEdit = () => {
    setEditingResult({ ...editingResult, subjects: [...editingResult.subjects, { subjectName: '', marks: '' }] });
  };

  const removeSubjectFromEdit = (idx) => {
    const newSubs = editingResult.subjects.filter((_, i) => i !== idx);
    setEditingResult({ ...editingResult, subjects: newSubs });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white p-6 shadow-2xl overflow-y-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black italic tracking-tighter">STAFF PORTAL</h2>
          <div className="h-1 w-12 bg-indigo-400 mx-auto mt-2 rounded-full"></div>
        </div>
        <nav className="space-y-3">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}>
            <LayoutDashboard size={20} /> <span className="font-bold text-sm">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('addStudent')} className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${activeTab === 'addStudent' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}>
            <UserPlus size={20} /> <span className="font-bold text-sm">Add Student</span>
          </button>
          <button onClick={() => setActiveTab('addResult')} className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${activeTab === 'addResult' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}>
            <FileText size={20} /> <span className="font-bold text-sm">Enter Marks</span>
          </button>
          <button onClick={() => setActiveTab('manageResults')} className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${activeTab === 'manageResults' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}>
            <BookOpen size={20} /> <span className="font-bold text-sm">Manage Results</span>
          </button>
          <button onClick={() => setActiveTab('viewStudents')} className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${activeTab === 'viewStudents' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}>
            <Users size={20} /> <span className="font-bold text-sm">View Records</span>
          </button>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="flex items-center space-x-3 w-full p-3 mt-20 text-red-300 hover:bg-red-900/30 rounded-xl transition-all">
            <LogOut size={20} /> <span className="font-bold text-sm">Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-12 bg-[#f8fafc]">
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center space-x-4 mb-10">
              <div className="h-12 w-2 bg-indigo-600 rounded-full"></div>
              <div>
                 <h1 className="text-5xl font-black text-indigo-950 tracking-tighter leading-none">Global Overview</h1>
                 <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mt-2 ml-1">Live Institutional Metrics</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group hover:shadow-indigo-500/10 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center"><Users size={14} className="mr-2"/> Total Students</h3>
                <p className="text-7xl font-black text-indigo-900 tracking-tighter">{students.length}</p>
                <div className="mt-6 flex items-center text-green-500 font-black text-[10px] uppercase tracking-widest">
                  <Check size={14} className="mr-2" /> Encrypted Records
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group hover:shadow-purple-500/10 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center"><FileText size={14} className="mr-2"/> Published Results</h3>
                <p className="text-7xl font-black text-purple-900 tracking-tighter">{results.length}</p>
                <div className="mt-6 flex items-center text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                  <BookOpen size={14} className="mr-2" /> Verified Ledger
                </div>
              </div>

              <div className="bg-indigo-900 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
                <ShieldCheck size={120} className="absolute -bottom-10 -right-10 text-white/5 transform group-hover:rotate-12 transition-transform duration-700" />
                <h3 className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-4">System Status</h3>
                <div>
                   <p className="text-3xl font-black text-white leading-tight uppercase tracking-tighter">Secure<br/>Environment</p>
                   <div className="mt-6 inline-flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/30">
                     <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                     Core Online
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'addStudent' && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <div className="bg-indigo-900 p-10 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Student Enrollment</h2>
                  <p className="text-indigo-300 font-medium mt-1">Register new academic profiles to the central ledger</p>
                </div>
                <UserPlus size={48} className="text-indigo-400/50" />
              </div>

              <div className="p-12">
                <form onSubmit={handleAddStudent} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Details Section */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                        <span className="w-8 h-[1px] bg-gray-200 mr-3"></span> Personal Details
                      </h3>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Full Identity Name</label>
                        <input type="text" placeholder="e.g. John Doe" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold text-indigo-950 transition-all placeholder:text-indigo-200 placeholder:font-normal" required
                          value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Email Address</label>
                        <input type="email" placeholder="e.g. john@siet.edu" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold text-indigo-950 transition-all placeholder:text-indigo-200 placeholder:font-normal" required
                          value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} />
                      </div>
                    </div>

                    {/* Academic Details Section */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                        <span className="w-8 h-[1px] bg-gray-200 mr-3"></span> Academic Records
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Roll Identifier</label>
                          <input type="text" placeholder="7140..." className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-black text-indigo-900 transition-all placeholder:text-indigo-200 placeholder:font-normal uppercase tracking-wider" required
                            value={studentForm.rollNo} onChange={e => setStudentForm({...studentForm, rollNo: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Batch Year</label>
                          <input type="text" placeholder="2022" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-black text-indigo-900 transition-all placeholder:text-indigo-200 placeholder:font-normal uppercase tracking-wider text-center" required
                            value={studentForm.batch} onChange={e => setStudentForm({...studentForm, batch: e.target.value})} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Department / Division</label>
                        <input type="text" placeholder="e.g. B.E - CSE" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold text-indigo-950 transition-all placeholder:text-indigo-200 placeholder:font-normal" required
                          value={studentForm.department} onChange={e => setStudentForm({...studentForm, department: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="pt-8 border-t border-gray-50 mt-4">
                    <div className="bg-indigo-50 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <ShieldCheck size={24} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Account Security</p>
                          <input type="password" placeholder="Define Initial Password" className="bg-transparent border-none outline-none font-black text-indigo-900 w-48 placeholder:font-bold placeholder:text-indigo-200" required
                            value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} />
                        </div>
                      </div>
                      <button className="bg-indigo-600 text-white px-12 py-5 rounded-[1.5rem] font-black hover:bg-indigo-700 shadow-[0_10px_25px_rgba(79,70,229,0.3)] hover:shadow-indigo-500/50 transition-all flex items-center space-x-3 group">
                        <span className="uppercase tracking-widest text-xs">Authorize & Enroll Student</span>
                        <Check size={18} className="translate-y-[-1px] group-hover:scale-125 transition-transform" />
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 font-bold mt-6 uppercase tracking-widest italic flex items-center justify-center">
                      <AlertCircle size={12} className="mr-2" /> Authenticated profiles are immediately active upon registration
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'addResult' && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <div className="bg-purple-900 p-10 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Grade Publication</h2>
                  <p className="text-purple-300 font-medium mt-1">Submit examination marks for student verification</p>
                </div>
                <BookOpen size={48} className="text-purple-400/50" />
              </div>

              <div className="p-12">
                <form onSubmit={handleAddResult} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Identification Section */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                        <span className="w-8 h-[1px] bg-gray-200 mr-3"></span> Examination Context
                      </h3>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Student Roll Identity</label>
                        <input type="text" placeholder="Enter Registration Number" className="w-full p-4 bg-purple-50/50 border-2 border-purple-100 focus:border-purple-700 focus:bg-white rounded-2xl outline-none font-black text-purple-900 transition-all placeholder:text-purple-200 placeholder:font-normal uppercase tracking-widest" required
                          value={resultForm.rollNo} onChange={e => setResultForm({...resultForm, rollNo: e.target.value})} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Academic Semester</label>
                        <select className="w-full p-4 bg-purple-50/50 border-2 border-purple-100 focus:border-purple-700 focus:bg-white rounded-2xl outline-none font-bold text-gray-700 transition-all" 
                          value={resultForm.semester} onChange={e => setResultForm({...resultForm, semester: e.target.value})}>
                          {[1,2,3,4,5,6,7,8].map(num => <option key={num} value={num}>Semester 0{num}</option>)}
                        </select>
                      </div>

                      <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center">
                           <AlertCircle size={12} className="mr-2" /> Protocol Note
                        </p>
                        <p className="text-xs text-purple-900/60 font-medium leading-relaxed">
                          Results published here will be instantly visible to students and included in their official academic transcript.
                        </p>
                      </div>
                    </div>

                    {/* Marks Entry Section */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                          <span className="w-8 h-[1px] bg-gray-200 mr-3"></span> Course Evaluation
                        </h3>
                        <button type="button" onClick={addSubject} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 hover:text-white transition-all shadow-sm">
                          + Add Course
                        </button>
                      </div>

                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {resultForm.subjects.map((sub, idx) => (
                          <div key={idx} className="flex space-x-3 items-center group animate-in fade-in slide-in-from-right-4">
                            <div className="flex-1 space-y-1">
                              <input type="text" placeholder="Course Name" className="w-full p-3 bg-purple-50 border-2 border-purple-100 focus:border-purple-700 focus:bg-white rounded-xl font-bold text-sm outline-none transition-all" required
                                value={sub.subjectName} onChange={e => {
                                  const newSubs = [...resultForm.subjects];
                                  newSubs[idx].subjectName = e.target.value;
                                  setResultForm({...resultForm, subjects: newSubs});
                                }} />
                            </div>
                            <div className="w-24">
                              <input type="number" placeholder="Marks" className="w-full p-3 bg-purple-50 border-2 border-purple-100 focus:border-purple-700 focus:bg-white rounded-xl font-black text-center text-sm outline-none transition-all" required
                                value={sub.marks} onChange={e => {
                                  const newSubs = [...resultForm.subjects];
                                  newSubs[idx].marks = e.target.value === '' ? '' : parseInt(e.target.value);
                                  setResultForm({...resultForm, subjects: newSubs});
                                }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button className="bg-purple-900 text-white px-10 py-5 rounded-[1.5rem] font-black w-full hover:bg-black transition-all shadow-[0_10px_30px_rgba(88,28,135,0.3)] flex items-center justify-center space-x-3 group">
                         <span className="uppercase tracking-widest text-xs">Broadcast Examination Ledger</span>
                         <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manageResults' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8 bg-purple-50 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-purple-900">Manage Published Results</h2>
              <span className="bg-purple-200 text-purple-700 px-4 py-1 rounded-full text-xs font-black uppercase">{results.length} Published</span>
            </div>
            
            {editingResult ? (
              <div className="p-8 bg-gray-50 border-b animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Editing Marks for: {editingResult.studentId?.name} ({editingResult.studentId?.rollNo})</h3>
                  <button onClick={() => setEditingResult(null)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><X size={20}/></button>
                </div>
                <form onSubmit={handleUpdateResult} className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-xl mb-4">
                    <label className="text-xs font-bold text-indigo-400 uppercase mb-1 block">Specify Semester</label>
                    <select className="w-full p-2 border border-indigo-200 rounded-lg font-bold" value={editingResult.semester}
                      onChange={e => setEditingResult({...editingResult, semester: e.target.value})}>
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                    </select>
                  </div>
                  {editingResult.subjects.map((sub, idx) => (
                    <div key={idx} className="flex space-x-3 items-center">
                      <input type="text" className="flex-1 p-3 border-2 border-indigo-100 rounded-xl font-bold" value={sub.subjectName}
                        onChange={e => {
                          const newSubs = [...editingResult.subjects];
                          newSubs[idx].subjectName = e.target.value;
                          setEditingResult({ ...editingResult, subjects: newSubs });
                        }} />
                      <input type="number" className="w-24 p-3 border-2 border-indigo-100 rounded-xl font-black text-center" value={sub.marks}
                        onChange={e => {
                          const newSubs = [...editingResult.subjects];
                          newSubs[idx].marks = e.target.value === '' ? '' : parseInt(e.target.value);
                          setEditingResult({ ...editingResult, subjects: newSubs });
                        }} />
                      <button type="button" onClick={() => removeSubjectFromEdit(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-4 mt-6">
                    <button type="button" onClick={addSubjectToEdit} className="bg-indigo-100 text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-200">+ Add Subject</button>
                    <button type="submit" className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black hover:bg-indigo-700 shadow-lg">Save Changes</button>
                    <button type="button" onClick={() => setEditingResult(null)} className="bg-gray-200 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-300">Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="p-5 text-left">Student Info</th>
                    <th className="p-5 text-left">Subjects & Marks</th>
                    <th className="p-5 text-center">Summary</th>
                    <th className="p-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map(r => (
                    <tr key={r._id} className="hover:bg-purple-50/30 transition-all">
                      <td className="p-5">
                        <p className="font-black text-indigo-900">{r.studentId?.name}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{r.studentId?.rollNo} • {r.studentId?.department} • Batch: {r.studentId?.batch}</p>
                        <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">SEM {r.semester}</span>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {r.subjects.map((s, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-bold">
                              {s.subjectName}: <span className="text-indigo-600">{s.marks}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xl font-black text-indigo-900">{r.total}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${r.grade !== 'F' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Grade: {r.grade}</span>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <button onClick={() => setEditingResult({...r, semester: r.semester || 1})} className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all" title="Edit Marks">
                          <Edit2 size={20}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                     <tr>
                        <td colSpan="4" className="p-20 text-center">
                           <div className="flex flex-col items-center opacity-20">
                              <BookOpen size={48} className="mb-4"/>
                              <p className="font-black">No Results Found</p>
                           </div>
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'viewStudents' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8 bg-indigo-50 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-indigo-900">Student Log Records</h2>
              <span className="bg-indigo-200 text-indigo-700 px-4 py-1 rounded-full text-xs font-black uppercase">{students.length} Entries</span>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-5 text-left">Roll Number</th>
                  <th className="p-5 text-left">Full Name</th>
                  <th className="p-5 text-left">Dept</th>
                  <th className="p-5 text-left">Batch</th>
                  <th className="p-5 text-left">Passkey</th>
                  <th className="p-5 text-left">Email</th>
                  <th className="p-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => (
                  <tr key={s._id} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="p-5"><span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black text-xs tracking-wider">{s.rollNo}</span></td>
                    <td className="p-5">
                      {editingStudent?._id === s._id ? (
                        <input type="text" className="p-1 border rounded w-full font-bold" value={editingStudent.name} 
                          onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} />
                      ) : <span className="font-bold text-gray-800">{s.name}</span>}
                    </td>
                    <td className="p-5">
                      {editingStudent?._id === s._id ? (
                        <input type="text" className="p-1 border rounded w-full" value={editingStudent.department} 
                          onChange={e => setEditingStudent({...editingStudent, department: e.target.value})} />
                      ) : <span className="text-gray-500 font-medium">{s.department}</span>}
                    </td>
                    <td className="p-5">
                      {editingStudent?._id === s._id ? (
                        <input type="text" className="p-1 border rounded w-full" value={editingStudent.batch} 
                          onChange={e => setEditingStudent({...editingStudent, batch: e.target.value})} />
                      ) : <span className="text-indigo-600 font-bold">{s.batch}</span>}
                    </td>
                    <td className="p-5">
                      {editingStudent?._id === s._id ? (
                        <input type="text" className="p-1 border rounded w-full" value={editingStudent.displayPassword} 
                          onChange={e => setEditingStudent({...editingStudent, displayPassword: e.target.value, password: e.target.value})} />
                      ) : <span className="bg-amber-100 text-amber-700 font-mono font-bold px-2 py-1 rounded">{s.displayPassword || '••••••'}</span>}
                    </td>
                    <td className="p-5">
                      {editingStudent?._id === s._id ? (
                        <input type="text" className="p-1 border rounded w-full" value={editingStudent.email} 
                          onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} />
                      ) : <span className="text-gray-400 text-sm italic">{s.email}</span>}
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {editingStudent?._id === s._id ? (
                          <>
                            <button onClick={handleUpdateStudent} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-lg"><Check size={16}/></button>
                            <button onClick={() => setEditingStudent(null)} className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition shadow-lg"><X size={16}/></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingStudent(s)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"><Edit2 size={16}/></button>
                            <button onClick={() => handleDeleteStudent(s._id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
