import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, UserPlus, FileText, Users, LogOut, Edit2, Trash2, X, Check, BookOpen, AlertCircle, ShieldCheck, Upload, Filter, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [identifiedStudent, setIdentifiedStudent] = useState(null);
  
  // Forms
  const [studentForm, setStudentForm] = useState({ name: '', rollNo: '', email: '', department: '', batch: '', password: '' });
  const [resultForm, setResultForm] = useState({ rollNo: '', semester: '1', subjects: [] });
  const [curriculumForm, setCurriculumForm] = useState({ department: '', semester: '1', subjectNames: [''] });
  
  // Filters
  const [filters, setFilters] = useState({ department: '', batch: '' });
  const [publishForm, setPublishForm] = useState({ department: '', batch: '', semester: '1' });

  useEffect(() => {
    fetchStudents();
    fetchResults();
  }, []);

  // Auto-load subjects when roll number or semester changes
  useEffect(() => {
    if (resultForm.rollNo.length >= 3) {
      const student = students.find(s => s.rollNo.toUpperCase().trim() === resultForm.rollNo.toUpperCase().trim());
      if (student) {
        setIdentifiedStudent(student);
        loadSubjectsForEntry(student.department, resultForm.semester);
      } else {
        setIdentifiedStudent(null);
        setResultForm(prev => ({ ...prev, subjects: [] }));
      }
    } else {
      setIdentifiedStudent(null);
      setResultForm(prev => ({ ...prev, subjects: [] }));
    }
  }, [resultForm.rollNo, resultForm.semester, students]);

  const loadSubjectsForEntry = async (dept, sem) => {
    try {
      const res = await axios.get(`/api/admin/subjects?department=${dept}&semester=${sem}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.length > 0) {
        setResultForm(prev => ({
          ...prev,
          subjects: res.data.map(name => ({ subjectName: name, marks: '' }))
        }));
      } else {
        setResultForm(prev => ({ ...prev, subjects: [] }));
        if (dept) {
          toast.warning(`No subjects mapped for Department: ${dept}, Semester: ${sem}`);
        }
      }
    } catch (err) { console.error(err); }
  };

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

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        if (rawData.length === 0) {
          toast.error("The Excel file is empty");
          return;
        }

        // Robust Column Mapping (Lowercase + No Spaces)
        const normalizedData = rawData.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toLowerCase().replace(/\s/g, '');
            // Map variations
            if (normalizedKey.includes('name')) newRow.fullName = row[key];
            if (normalizedKey.includes('roll') || normalizedKey.includes('id')) newRow.rollNumber = row[key];
            if (normalizedKey.includes('email')) newRow.email = row[key];
            if (normalizedKey.includes('dept') || normalizedKey.includes('department')) newRow.department = row[key];
            if (normalizedKey.includes('batch') || normalizedKey.includes('year')) newRow.batchYear = row[key];
            if (normalizedKey.includes('pass') || normalizedKey.includes('key')) newRow.password = row[key];
          });
          return newRow;
        });

        // Final Validation
        const sample = normalizedData[0];
        const required = ['fullName', 'rollNumber', 'email', 'department', 'batchYear'];
        const missing = required.filter(k => !sample[k]);

        if (missing.length > 0) {
          toast.error(`Missing columns: ${missing.join(', ')}. Please check Excel headers.`);
          return;
        }
        
        const res = await axios.post('/api/admin/bulk-add-students', { students: normalizedData }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success(res.data.message);
        fetchStudents();
        e.target.value = null; // Reset input
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error processing Excel file');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddCurriculum = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/map-subjects', curriculumForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Curriculum mapped successfully');
      setCurriculumForm({ department: '', semester: '1', subjectNames: [''] });
    } catch (err) { toast.error('Check all fields'); }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/add-student', studentForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Student added successfully');
      setStudentForm({ name: '', rollNo: '', email: '', department: '', batch: '', password: '' });
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/update-student/${editingStudent._id}`, editingStudent, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Student updated successfully');
      setEditingStudent(null);
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure? This will also remove all results for this student.')) return;
    try {
      await axios.delete(`/api/admin/delete-student/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Student removed from registry');
      fetchStudents();
      fetchResults();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    if (resultForm.subjects.length === 0) {
      toast.error('No subjects mapped for this department/semester');
      return;
    }
    try {
      await axios.post('/api/admin/add-result', resultForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Results saved successfully');
      setResultForm({ rollNo: '', semester: '1', subjects: [] });
      fetchResults();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleBatchPublish = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/batch-publish', publishForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(res.data.message);
      fetchResults();
    } catch (err) { toast.error('Publish failed'); }
  };

  const handleUpdateResult = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/update-result/${editingResult._id}`, editingResult, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Scores updated successfully');
      setEditingResult(null);
      fetchResults();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDeleteResult = async (id) => {
    if (!window.confirm('Are you sure? This scorecard will be permanently removed.')) return;
    try {
      await axios.delete(`/api/admin/delete-result/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Scorecard purged from system');
      fetchResults();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const filteredStudents = students.filter(s => {
    return (filters.department === '' || s.department === filters.department) &&
           (filters.batch === '' || s.batch === filters.batch);
  });

  const filteredResults = results.filter(r => {
    return (filters.department === '' || r.department === filters.department) &&
           (filters.batch === '' || r.batch === filters.batch);
  });

  const uniqueDepts = [...new Set(students.map(s => s.department))];
  const uniqueBatches = [...new Set(students.map(s => s.batch))];
  const uniqueSems = [...new Set(results.map(r => r.semester))].sort();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Enhanced Sidebar */}
      <div className="w-72 bg-indigo-950 text-white p-8 pb-12 flex flex-col shadow-2xl relative z-10">
        <div className="mb-10 text-center">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-black tracking-widest text-white uppercase italic">Staff OS v2</h2>
          <p className="text-[10px] text-indigo-400 font-black tracking-widest uppercase mt-2">Academic Control Unit</p>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Control Center' },
            { id: 'curriculum', icon: BookOpen, label: 'Curriculum Map' },
            { id: 'bulkEnroll', icon: Upload, label: 'Bulk Enrollment' },
            { id: 'addStudent', icon: UserPlus, label: 'Single Entry' },
            { id: 'addResult', icon: FileText, label: 'Mark Scoring' },
            { id: 'manageResults', icon: Send, label: 'Batch Publish' },
            { id: 'viewStudents', icon: Users, label: 'Master Registry' },
            { id: 'viewResults', icon: Check, label: 'Stored Results' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-4 w-full p-4 rounded-2xl transition-all duration-300 group ${activeTab === tab.id ? 'bg-indigo-600 shadow-xl shadow-indigo-900/40 text-white' : 'hover:bg-indigo-900/50 text-indigo-300'}`}>
              <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'group-hover:text-indigo-200'} />
              <span className="font-bold text-xs uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <button className="mt-8 flex items-center space-x-3 p-4 rounded-2xl text-red-300 hover:bg-red-500/10 transition-all font-black text-xs uppercase tracking-widest"
          onClick={() => { localStorage.clear(); window.location.href='/'; }}>
          <LogOut size={20} /> <span>Terminate Session</span>
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-auto p-12 bg-[#f8fafc]">
        
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-in">
            <div className="flex items-center space-x-4 mb-10">
              <div className="h-12 w-2 bg-indigo-600 rounded-full"></div>
              <div>
                 <h1 className="text-5xl font-black text-indigo-950 tracking-tighter leading-none">Global Overview</h1>
                 <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mt-2 ml-1">Live Institutional Metrics</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
              <div className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                 <Users size={120} className="absolute -bottom-10 -right-10 text-white/10" />
                 <h3 className="text-white/60 font-black text-[10px] uppercase tracking-widest mb-4">Registry Size</h3>
                 <p className="text-7xl font-black tracking-tighter">{students.length}</p>
                 <p className="text-[10px] font-black uppercase mt-4 text-indigo-200 tracking-[0.2em]">Authenticated Students</p>
              </div>
              <div className="bg-purple-600 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                 <FileText size={120} className="absolute -bottom-10 -right-10 text-white/10" />
                 <h3 className="text-white/60 font-black text-[10px] uppercase tracking-widest mb-4">Total Results</h3>
                 <p className="text-7xl font-black tracking-tighter">{results.length}</p>
                 <p className="text-[10px] font-black uppercase mt-4 text-purple-200 tracking-[0.2em]">Verified Scorecards</p>
              </div>
              <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                 <ShieldCheck size={120} className="absolute -bottom-10 -right-10 text-white/5" />
                 <h3 className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-4">Core System</h3>
                 <p className="text-3xl font-black tracking-tighter uppercase leading-none">Protection<br/>Enabled</p>
                 <div className="mt-6 inline-flex px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/30">Node Active</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: BULK ENROLLMENT */}
        {activeTab === 'bulkEnroll' && (
          <div className="max-w-4xl animate-in">
             <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5"><Upload size={200}/></div>
                <h2 className="text-4xl font-black text-indigo-950 tracking-tighter mb-4">Bulk Student Ingestion</h2>
                <p className="text-gray-500 font-medium mb-10 max-w-xl">Upload an Excel (.xlsx) file containing fullName, rollNumber, email, department, and batchYear column headers.</p>
                
                <div className="border-4 border-dashed border-indigo-50 rounded-[2.5rem] p-16 flex flex-col items-center justify-center hover:border-indigo-200 transition-all group bg-indigo-50/20">
                   <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl group-hover:scale-110 transition-transform duration-500 mb-6">
                      <Upload size={40} />
                   </div>
                   <label className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-black shadow-xl transition-all">
                      Select Master Excel File
                      <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                   </label>
                   <p className="text-xs text-indigo-300 font-bold mt-6 uppercase tracking-widest italic">Supports Legacy .XLS and XML types</p>
                </div>
             </div>
          </div>
        )}

        {/* TAB: CURRICULUM mapping */}
        {activeTab === 'curriculum' && (
          <div className="max-w-4xl animate-in">
             <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-4xl font-black text-indigo-950 tracking-tighter">Academic Curriculum</h2>
                   <BookOpen size={48} className="text-indigo-100" />
                </div>

                <form onSubmit={handleAddCurriculum} className="space-y-8">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Target Department</label>
                        <select className="w-full p-5 bg-indigo-50/30 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold text-gray-800"
                          value={curriculumForm.department} onChange={e => setCurriculumForm({...curriculumForm, department: e.target.value})} required>
                          <option value="">Select Department</option>
                          {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Target Semester</label>
                        <select className="w-full p-5 bg-indigo-50/30 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold"
                          value={curriculumForm.semester} onChange={e => setCurriculumForm({...curriculumForm, semester: e.target.value})}>
                          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester 0{n}</option>)}
                        </select>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Course Syllabus List</h3>
                         <button type="button" onClick={() => setCurriculumForm({...curriculumForm, subjectNames: [...curriculumForm.subjectNames, '']})} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">+ Append Course</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {curriculumForm.subjectNames.map((name, idx) => (
                           <div key={idx} className="relative group">
                             <input type="text" value={name} placeholder="Course Title" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold transition-all"
                               onChange={(e) => {
                                 const updated = [...curriculumForm.subjectNames];
                                 updated[idx] = e.target.value;
                                 setCurriculumForm({...curriculumForm, subjectNames: updated});
                               }} required />
                             {idx > 0 && <button type="button" onClick={() => setCurriculumForm({...curriculumForm, subjectNames: curriculumForm.subjectNames.filter((_, i) => i !== idx)})} className="absolute right-4 top-4 text-red-300 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>}
                           </div>
                         ))}
                      </div>
                   </div>

                   <button type="submit" className="bg-indigo-600 text-white px-12 py-5 rounded-[1.5rem] font-black hover:bg-black shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-xs">Establish Curriculum Map</button>
                </form>
             </div>
          </div>
        )}

        {/* TAB: ADD STUDENT */}
        {activeTab === 'addStudent' && (
          <div className="max-w-4xl animate-in">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <div className="bg-indigo-950 p-10 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Manual Enrollment</h2>
                  <p className="text-indigo-300 font-medium mt-1">Register a single student identity</p>
                </div>
                <UserPlus size={48} className="text-indigo-400/50" />
              </div>

              <div className="p-12">
                <form onSubmit={handleAddStudent} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                        <span className="w-8 h-[1px] bg-gray-200 mr-3"></span> Identity
                      </h3>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Full Name</label>
                        <input type="text" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl outline-none font-bold"
                          value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Institutional Email</label>
                        <input type="email" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl outline-none font-bold"
                          value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                        <span className="w-8 h-[1px] bg-gray-200 mr-3"></span> Records
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Roll No</label>
                          <input type="text" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl outline-none font-black uppercase"
                            value={studentForm.rollNo} onChange={e => setStudentForm({...studentForm, rollNo: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Batch</label>
                          <input type="text" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-center"
                            value={studentForm.batch} onChange={e => setStudentForm({...studentForm, batch: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Department</label>
                        <input type="text" className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl outline-none font-bold"
                          value={studentForm.department} onChange={e => setStudentForm({...studentForm, department: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Initial Password</label>
                        <input type="password" placeholder="Define Passkey" className="w-full p-4 bg-slate-900 text-white rounded-2xl font-black outline-none placeholder:text-slate-600"
                          value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} />
                     </div>
                     <button className="bg-indigo-600 text-white px-12 py-5 rounded-[1.5rem] font-black hover:bg-black transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-xs h-fit">Confirm Enrollment</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ADD RESULT */}
        {activeTab === 'addResult' && (
          <div className="max-w-4xl animate-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Examination Scoring</h2>
                  <p className="text-slate-500 font-medium mt-1">Numerical entry based on department curriculum</p>
                </div>
                <FileText size={48} className="text-slate-800" />
              </div>

              <div className="p-12">
                <form onSubmit={handleAddResult} className="space-y-10">
                  <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2rem]">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Credential Identifier</label>
                      <input type="text" placeholder="Enter Roll Number / ID" className="w-full p-5 bg-white border-2 border-transparent focus:border-slate-900 rounded-2xl outline-none font-black text-slate-900 uppercase tracking-widest"
                        value={resultForm.rollNo} onChange={e => setResultForm({...resultForm, rollNo: e.target.value.toUpperCase().trim()})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Assessment Semester</label>
                      <select className="w-full p-5 bg-white border-2 border-transparent focus:border-slate-900 rounded-2xl outline-none font-bold"
                        value={resultForm.semester} onChange={e => setResultForm({...resultForm, semester: e.target.value})}>
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                      </select>
                    </div>
                  </div>

                  {identifiedStudent && (
                    <div className="bg-indigo-50/50 p-6 rounded-[1.5rem] border border-indigo-100 animate-in">
                       <div className="flex items-center space-x-4">
                          <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg">
                             <Check size={20} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Identified Student</p>
                             <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-black text-indigo-950">{identifiedStudent.name}</h3>
                                <span className="text-[10px] px-2 py-0.5 bg-indigo-200 text-indigo-700 rounded-md font-bold">{identifiedStudent.department}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {resultForm.subjects.length > 0 ? (
                    <div className="space-y-6">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                          <span className="w-8 h-[1px] bg-slate-200 mr-3"></span> Curriculum Checklist
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {resultForm.subjects.map((sub, idx) => (
                           <div key={idx} className="flex items-center space-x-4 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
                             <div className="flex-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{sub.subjectName}</p>
                               <input type="number" placeholder="Enter Score (0-100)" className="w-full p-1 font-black text-2xl text-slate-900 outline-none border-b-2 border-transparent focus:border-slate-900 transition-all"
                                 value={sub.marks} onChange={(e) => {
                                   const updated = [...resultForm.subjects];
                                   updated[idx].marks = e.target.value;
                                   setResultForm({...resultForm, subjects: updated});
                                 }} required />
                             </div>
                             <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl">
                               <Check size={20} className={sub.marks ? 'text-green-500' : 'text-slate-200'} />
                             </div>
                           </div>
                         ))}
                       </div>
                       <button className="w-full bg-slate-950 text-white px-10 py-6 rounded-[2rem] font-black hover:bg-black transition-all shadow-xl uppercase tracking-widest text-sm flex items-center justify-center space-x-4">
                          <span>Store Assessment Data</span>
                          <Check size={24} />
                       </button>
                    </div>
                  ) : (
                    <div className="text-center p-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                       <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                       <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Awaiting Student Identification or Subject Map</p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MANAGE / BATCH PUBLISH */}
        {activeTab === 'manageResults' && (
          <div className="max-w-4xl animate-in">
              <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-gray-100">
                 <div className="flex items-center justify-between mb-10">
                    <h2 className="text-4xl font-black text-indigo-950 tracking-tighter">Batch Publication</h2>
                    <Send size={48} className="text-indigo-100 rotate-[-45deg]" />
                 </div>
                 
                 <p className="text-gray-500 mb-10 font-medium">Use this console to release examination scores to the public student portal. Once published, students can generate their official marksheets and transcripts.</p>
                 
                 <form onSubmit={handleBatchPublish} className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-50">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1 text-center block">Department</label>
                       <select className="w-full p-4 bg-white rounded-2xl font-black text-indigo-900 outline-none border-2 border-transparent focus:border-indigo-600"
                         value={publishForm.department} onChange={e => setPublishForm({...publishForm, department: e.target.value})}>
                         <option value="">Select</option>
                         {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1 text-center block">Batch Year</label>
                       <select className="w-full p-4 bg-white rounded-2xl font-black text-indigo-900 outline-none border-2 border-transparent focus:border-indigo-600"
                         value={publishForm.batch} onChange={e => setPublishForm({...publishForm, batch: e.target.value})}>
                         <option value="">Select</option>
                         {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1 text-center block">Semester</label>
                       <select className="w-full p-4 bg-white rounded-2xl font-black text-indigo-900 outline-none border-2 border-transparent focus:border-indigo-600"
                         value={publishForm.semester} onChange={e => setPublishForm({...publishForm, semester: e.target.value})}>
                         {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Sem 0{n}</option>)}
                       </select>
                    </div>
                    <button className="md:col-span-3 bg-indigo-600 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all mt-4">
                       Broadcast Batch Results Now
                    </button>
                 </form>
              </div>
           </div>
        )}

        {/* TAB: VIEW RECORDS */}
        {activeTab === 'viewStudents' && (
          <div className="animate-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-1.5 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-4xl font-black text-indigo-950 tracking-tighter">Institutional Registry</h2>
                </div>
                
                <div className="flex items-center space-x-4 bg-white p-2 rounded-[2rem] shadow-xl border border-gray-50">
                   <div className="flex items-center px-4 space-x-3 border-r border-gray-100">
                      <Filter size={16} className="text-indigo-300" />
                      <select className="p-2 font-black text-[10px] uppercase tracking-widest outline-none bg-transparent"
                        value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
                        <option value="">All Departments</option>
                        {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                   </div>
                   <div className="flex items-center px-4 space-x-3">
                      <Filter size={16} className="text-indigo-300" />
                      <select className="p-2 font-black text-[10px] uppercase tracking-widest outline-none bg-transparent"
                        value={filters.batch} onChange={e => setFilters({...filters, batch: e.target.value})}>
                        <option value="">All Batches</option>
                        {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-indigo-50/50 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                         <th className="p-8 text-left">Credential ID</th>
                         <th className="p-8 text-left">Identity Profile</th>
                         <th className="p-8 text-left">Academic Dept</th>
                         <th className="p-8 text-left">Course Batch</th>
                         <th className="p-8 text-left">Passkey</th>
                         <th className="p-8 text-center">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredStudents.map(s => (
                        <tr key={s._id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                          <td className="p-8">
                             <span className="bg-slate-950 text-white px-5 py-2 rounded-2xl font-black text-xs tracking-widest shadow-lg">{s.rollNo}</span>
                          </td>
                          <td className="p-8">
                             <div>
                                <p className="font-black text-indigo-950 text-lg leading-none">{s.name}</p>
                                <p className="text-indigo-300 font-bold text-[10px] mt-1 uppercase tracking-widest italic">{s.email}</p>
                             </div>
                          </td>
                          <td className="p-8">
                             <div className="inline-flex items-center px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-tighter border border-indigo-100">
                                {s.department}
                             </div>
                          </td>
                          <td className="p-8">
                             <p className="font-black text-slate-400 text-xs tracking-widest">Session {s.batch}</p>
                          </td>
                          <td className="p-8">
                             <code className="bg-slate-100 text-indigo-600 px-3 py-1 rounded-lg font-black text-[10px] tracking-widest">{s.displayPassword}</code>
                          </td>
                          <td className="p-8">
                             <div className="flex items-center justify-center space-x-3 transition-all duration-300">
                               <button className="p-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-2xl shadow-sm transition-all"
                                 onClick={() => setEditingStudent(s)}>
                                 <Edit2 size={18} />
                               </button>
                               <button className="p-3 bg-red-100 text-red-700 hover:bg-red-500 hover:text-white rounded-2xl shadow-sm transition-all"
                                 onClick={() => handleDeleteStudent(s._id)}>
                                 <Trash2 size={18} />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* TAB: VIEW RESULTS */}
        {activeTab === 'viewResults' && (
          <div className="animate-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-1.5 bg-green-500 rounded-full"></div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Academic Transcripts</h2>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="p-8 text-left text-white">Student</th>
                         <th className="p-8 text-left text-white">Semester</th>
                         <th className="p-8 text-left text-white">Scores Matrix</th>
                         <th className="p-8 text-left text-white">Total</th>
                         <th className="p-8 text-left text-white">Status</th>
                         <th className="p-8 text-center">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredResults.map(r => (
                        <tr key={r._id} className="hover:bg-slate-50 transition-all duration-300">
                          <td className="p-8">
                             <div>
                                <p className="font-black text-slate-900 text-lg leading-none">{r.studentId?.name || 'N/A'}</p>
                                <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-widest">{r.studentId?.rollNo}</p>
                             </div>
                          </td>
                          <td className="p-8">
                             <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-black text-xs">Sem {r.semester}</span>
                          </td>
                          <td className="p-8">
                             <div className="flex flex-wrap gap-2">
                                {r.subjects.map((s, i) => (
                                  <div key={i} className="flex flex-col items-center bg-white border border-slate-100 p-2 rounded-xl min-w-[60px]">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{s.subjectName}</span>
                                    <span className="text-xs font-black text-indigo-600">{s.marks}</span>
                                  </div>
                                ))}
                             </div>
                          </td>
                          <td className="p-8">
                             <div>
                                <p className="text-2xl font-black text-slate-950">{r.total}</p>
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">{r.grade} Grade</p>
                             </div>
                          </td>
                          <td className="p-8">
                             {r.published ? (
                               <span className="inline-flex items-center px-4 py-1.5 bg-green-500 text-white rounded-full font-black text-[9px] uppercase tracking-widest border-2 border-green-100">Live</span>
                             ) : (
                               <span className="inline-flex items-center px-4 py-1.5 bg-slate-200 text-slate-500 rounded-full font-black text-[9px] uppercase tracking-widest">Draft</span>
                             )}
                          </td>
                          <td className="p-8">
                             <div className="flex items-center justify-center space-x-3 transition-all duration-300">
                               <button className="p-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-2xl shadow-sm transition-all"
                                 onClick={() => setEditingResult(r)}>
                                 <Edit2 size={18} />
                               </button>
                               <button className="p-3 bg-red-100 text-red-700 hover:bg-red-500 hover:text-white rounded-2xl shadow-sm transition-all"
                                 onClick={() => handleDeleteResult(r._id)}>
                                 <Trash2 size={18} />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                {filteredResults.length === 0 && (
                  <div className="p-20 text-center">
                    <p className="font-black text-slate-300 uppercase tracking-[0.3em]">No Assessment Data Found</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* EDIT RESULT MODAL */}
        {editingResult && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-6">
            <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Modify Scorecard</h2>
                    <p className="text-slate-400 font-medium">Updating {editingResult.studentId?.name}'s Sem {editingResult.semester} data</p>
                  </div>
                  <button onClick={() => setEditingResult(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                    <X size={24} />
                  </button>
               </div>
               
               <form onSubmit={handleUpdateResult} className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {editingResult.subjects.map((sub, idx) => (
                      <div key={idx} className="flex items-center space-x-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{sub.subjectName}</p>
                          <input type="number" className="w-full p-1 font-black text-2xl text-slate-950 bg-transparent outline-none border-b-2 border-transparent focus:border-slate-900 transition-all"
                            value={sub.marks} onChange={(e) => {
                              const updated = [...editingResult.subjects];
                              updated[idx].marks = e.target.value;
                              setEditingResult({...editingResult, subjects: updated});
                            }} required />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-4 pt-6 border-t border-slate-50">
                    <button type="submit" className="flex-1 bg-slate-950 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all shadow-xl">Recalculate & Save</button>
                    <button type="button" onClick={() => setEditingResult(null)} className="px-10 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Cancel</button>
                  </div>
               </form>
            </div>
          </div>
        )}

        {/* EDIT STUDENT MODAL */}
        {editingStudent && (
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-[100] p-6">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in">
               <div className="bg-indigo-900 p-8 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Update Profile</h2>
                    <p className="text-indigo-300 font-medium">Modify record for {editingStudent.rollNo}</p>
                  </div>
                  <button onClick={() => setEditingStudent(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                    <X size={24} />
                  </button>
               </div>
               
               <form onSubmit={handleUpdateStudent} className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Full Name</label>
                       <input type="text" className="w-full p-4 bg-indigo-50 border-2 border-indigo-50 focus:border-indigo-600 rounded-2xl outline-none font-bold"
                         value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Institutional Email</label>
                       <input type="email" className="w-full p-4 bg-indigo-50 border-2 border-indigo-50 focus:border-indigo-600 rounded-2xl outline-none font-bold"
                         value={editingStudent.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Department</label>
                       <select className="w-full p-4 bg-indigo-50 border-2 border-indigo-50 focus:border-indigo-600 rounded-2xl outline-none font-bold"
                         value={editingStudent.department} onChange={e => setEditingStudent({...editingStudent, department: e.target.value})} required>
                          {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Session Batch</label>
                       <input type="text" className="w-full p-4 bg-indigo-50 border-2 border-indigo-50 focus:border-indigo-600 rounded-2xl outline-none font-bold"
                         value={editingStudent.batch} onChange={e => setEditingStudent({...editingStudent, batch: e.target.value})} required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Access Passkey (Leave blank to keep current)</label>
                     <input type="text" className="w-full p-4 bg-slate-900 text-white border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black tracking-widest"
                       placeholder="Enter New Password if needed"
                       value={editingStudent.password || ''} onChange={e => setEditingStudent({...editingStudent, password: e.target.value, displayPassword: e.target.value})} />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-indigo-200">Commit Changes</button>
                    <button type="button" onClick={() => setEditingStudent(null)} className="px-10 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Discard</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
