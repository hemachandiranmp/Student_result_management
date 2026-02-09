import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, BookOpen, LogOut, Award, Download, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentDashboard = () => {
  const [results, setResults] = useState([]);
  const [profile, setProfile] = useState(null);
  const rollNo = localStorage.getItem('rollNo');

  useEffect(() => {
    fetchProfile();
    fetchResults();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/student/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchResults = async () => {
    try {
      const storedRoll = localStorage.getItem('rollNo');
      const storedToken = localStorage.getItem('token');
      
      console.log('Fetching results for:', storedRoll);
      
      if (!storedRoll || !storedToken) {
        console.error('Missing rollNo or token in localStorage');
        return;
      }
      
      const res = await axios.get(`/api/student/view-result/${storedRoll}`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      
      console.log('API Response:', res.data);
      setResults(res.data);
    } catch (err) { 
      console.error('Fetch Results Error:', err); 
    }
  };

  const downloadMarksheet = (result) => {
    try {
      console.log('Generating marksheet for:', result);
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); // Indigo-900
      doc.text('OFFICIAL ACADEMIC MARKSHEET', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Student Result Management Portal', 105, 28, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(`SEMESTER ${result.semester || 'N/A'} EXAMINATION`, 105, 34, { align: 'center' });
      
      // Student Info Card
      doc.setDrawColor(200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 40, 182, 40, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT INFORMATION', 20, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      autoTable(doc, {
        startY: 55,
        body: [
          [`Name: ${profile?.name || 'N/A'}`, `Department: ${profile?.department || 'N/A'}`],
          [`Roll Number: ${profile?.rollNo || 'N/A'}`, `Batch: ${profile?.batch ? `${profile.batch}-${parseInt(profile.batch)+4}` : 'N/A'}`],
          [`Email: ${profile?.email || 'N/A'}`, '']
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 70 } }
      });
      
      // Result Table
      const tableData = result.subjects.map(s => [s.subjectName, s.marks, '100']);
      
      autoTable(doc, {
        startY: 90,
        head: [['Subject Name', 'Marks Obtained', 'Maximum Marks']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { halign: 'center' },
        columnStyles: { 0: { halign: 'left' } }
      });
      
      // Summary
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL MARKS: ${result.total} / ${result.subjects.length * 100}`, 14, finalY);
      doc.text(`FINAL GRADE: ${result.grade}`, 14, finalY + 8);
      
      // Footer Approval
      const footerY = doc.internal.pageSize.height - 30;
      doc.setDrawColor(30, 58, 138);
      doc.line(14, footerY, 60, footerY); // Signature line
      doc.setFontSize(8);
      doc.text('Authorised Controller of Examinations', 14, footerY + 5);
      
      doc.setTextColor(22, 163, 74);
      doc.text('VERIFIED DOCUMENT', 160, footerY + 5);
      
      doc.save(`${profile?.rollNo}_Result.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex font-sans">
      {/* Premium Sidebar */}
      <div className="w-72 bg-indigo-950 text-white p-8 shadow-[10px_0_30px_rgba(0,0,0,0.05)] border-r border-white/5 relative z-10 flex flex-col">
        <div className="mb-16">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-indigo-500/30">Siet</div>
            <h2 className="text-2xl font-black tracking-tight tracking-[-0.05em]">RESULT HUB</h2>
          </div>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Academic Portal 4.0</p>
        </div>
        
        <nav className="space-y-6 flex-1">
          <div className="group">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 ml-1">Main Menu</p>
            <div className="flex items-center space-x-3 p-4 bg-indigo-900/50 rounded-2xl border-l-4 border-indigo-400 shadow-xl transition-all">
              <User size={18} className="text-indigo-400" /> <span className="font-bold text-sm">Academic Profile</span>
            </div>
          </div>
        </nav>

        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="flex items-center space-x-3 w-full p-4 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all border border-transparent hover:border-red-400/20 group">
          <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> <span className="font-black text-xs uppercase tracking-widest">Terminate Session</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-16 overflow-auto scroll-smooth">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-2 text-indigo-500 font-bold text-xs uppercase tracking-widest mb-3">
              <ShieldCheck size={14} /> <span>Institutional Auth Verified</span>
            </div>
            <h1 className="text-5xl font-black text-indigo-950 leading-none tracking-tighter">Graduate Ledger</h1>
            <p className="text-gray-400 mt-4 font-medium flex items-center">
              Student Information System <span className="mx-2 opacity-30">/</span> {profile?.department} <span className="mx-2 opacity-30">/</span> {profile?.batch ? `Batch ${profile.batch}-${parseInt(profile.batch) + 4}` : 'Batch Not Set'}
            </p>
          </div>
          <div className="text-right flex flex-col items-end space-y-4">
            <div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Current Active Identity</p>
              <p className="text-xl font-black text-indigo-900">{profile?.name || 'Authenticating...'}</p>
            </div>
            <button 
              onClick={() => {
                if (results.length === 0) {
                   alert("No results found in database for this student.");
                   return;
                }
                const doc = new jsPDF();
                doc.setFontSize(22);
                doc.text('ACADEMIC TRANSCRIPT', 105, 20, { align: 'center' });
                autoTable(doc, {
                  startY: 35,
                  body: [
                    [`Student: ${profile?.name}`, `Batch: ${profile?.batch ? `${profile.batch}-${parseInt(profile.batch)+4}` : 'N/A'}`],
                    [`Roll No: ${profile?.rollNo}`, `Dept: ${profile?.department}`]
                  ],
                  theme: 'plain',
                  styles: { fontSize: 11, fontStyle: 'bold' },
                  columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 70 } }
                });
                
                let yPos = doc.lastAutoTable.finalY + 15;
                results.forEach((res, i) => {
                  doc.setFontSize(14);
                  doc.text(`Semester ${res.semester || i + 1} - Grade: ${res.grade}`, 20, yPos);
                  yPos += 10;
                  const data = res.subjects.map(s => [s.subjectName, s.marks]);
                  autoTable(doc, {
                    startY: yPos,
                    head: [['Subject', 'Marks']],
                    body: data
                  });
                  yPos = doc.lastAutoTable.finalY + 20;
                });
                doc.save(`${profile?.rollNo}_Transcript.pdf`);
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center space-x-2 shadow-lg hover:bg-indigo-700 transition"
            >
              <Download size={14} />
              <span>Download Transcript</span>
            </button>
          </div>
        </header>
        
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
          <div className="col-span-2 bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,58,138,0.06)] border border-indigo-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-indigo-900/30 font-black text-[10px] uppercase tracking-widest mb-8 flex items-center"><User className="mr-2" size={14}/> Student Portfolio</h3>
            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Legal Name</p>
                <p className="text-lg font-black text-indigo-900 tracking-tight">{profile?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Roll Identifier</p>
                <p className="text-lg font-black text-indigo-900 tracking-tight uppercase">{profile?.rollNo}</p>
              </div>
              <div className="col-span-2 pt-4 border-t border-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Institutional Email</p>
                <p className="text-sm font-bold text-indigo-600/80 italic">{profile?.email}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-600 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 flex flex-col justify-between relative overflow-hidden group">
            <Award className="absolute -bottom-6 -right-6 text-white/10 w-32 h-32 transform group-hover:rotate-12 transition-transform duration-500" />
            <h3 className="text-white/40 font-black text-[10px] uppercase tracking-widest">Division</h3>
            <div>
              <p className="text-3xl font-black tracking-tighter leading-tight uppercase">{profile?.department}</p>
              <div className="h-1 w-8 bg-white/30 mt-4 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-indigo-950 flex items-center tracking-tight">
              <BookOpen className="mr-4 text-indigo-500" size={36}/> Publication Ledger
            </h2>
            <div className="h-[2px] flex-1 mx-12 bg-indigo-50"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Latest Published Results</span>
        </div>

        <div className="grid gap-16">
          {results.length > 0 ? results.map((res, idx) => (
            <div key={idx} className="bg-white overflow-hidden rounded-[3rem] shadow-[0_30px_60px_rgba(15,23,42,0.08)] border border-indigo-50 transition-all hover:shadow-[0_40px_80px_rgba(15,23,42,0.12)] group">
              <div className="bg-[#1a1c23] p-10 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-full bg-indigo-600/10 skew-x-[-30deg] translate-x-32 group-hover:translate-x-20 transition-transform duration-1000"></div>
                <div>
                  <h3 className="text-white text-2xl font-black tracking-tighter uppercase relative z-10">Grade Transcript</h3>
                  <div className="flex items-center mt-2 space-x-3 relative z-10">
                    <span className="bg-indigo-500 text-[10px] font-black px-3 py-1 rounded-full text-white uppercase tracking-widest">Verified Digital Entry</span>
                    <span className="bg-white/10 text-indigo-200 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">Semester {res.semester || 1}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-10 relative z-10">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Final Index</p>
                    <div className="flex items-center justify-end space-x-4">
                      <p className="text-6xl font-black text-white leading-none tracking-tighter">{res.grade}</p>
                      <div className={`w-3 h-12 rounded-full ${res.grade !== 'F' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-12">
                <div className="bg-gray-50/50 rounded-[2rem] p-4 mb-10 border border-gray-100/50">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">
                          <th className="p-8">Course Specification</th>
                          <th className="p-8 text-center bg-gray-100/30 rounded-t-2xl">Scale</th>
                          <th className="p-8 text-right">Attained Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {res.subjects.map((s, i) => (
                          <tr key={i} className="hover:bg-white transition-all group/row">
                            <td className="p-8">
                                <p className="font-black text-indigo-900 group-hover/row:translate-x-2 transition-transform">{s.subjectName}</p>
                                <p className="text-[10px] font-bold text-indigo-300 uppercase mt-1">Core Requirement</p>
                            </td>
                            <td className="p-8 text-center bg-gray-100/20 font-bold text-gray-300">/ 100</td>
                            <td className="p-8 text-right">
                                <span className="text-3xl font-black text-indigo-800 tracking-tighter">{s.marks}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
                
                <div className="flex justify-between items-center bg-indigo-50/30 p-10 rounded-[2.5rem] border border-indigo-100/50">
                  <div className="flex space-x-12">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Aggregate Weighted Score</span>
                        <span className="text-4xl font-black text-indigo-950 tracking-tighter">{res.total} <span className="text-sm font-medium opacity-30 tracking-normal">/ {res.subjects.length * 100}</span></span>
                      </div>
                      <div className="w-[1px] h-16 bg-indigo-100"></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Performance Status</span>
                        <span className={`text-sm font-black tracking-widest uppercase py-3 px-6 rounded-2xl shadow-sm ${res.grade !== 'F' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {res.grade !== 'F' ? 'Validated & Promoted' : 'Re-Examination Pending'}
                        </span>
                      </div>
                  </div>
                  <button 
                    onClick={() => downloadMarksheet(res)}
                    className="bg-indigo-950 text-white flex items-center space-x-3 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black hover:scale-105 hover:-rotate-1 active:scale-95 transition-all shadow-xl shadow-indigo-900/10 group/btn"
                  >
                    <Download size={16} className="group-hover/btn:translate-y-1 transition-transform" />
                    <span>Download Marksheet</span>
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white p-32 rounded-[3.5rem] border-4 border-dashed border-indigo-50 text-center shadow-inner">
              <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 animate-pulse">
                <BookOpen className="text-indigo-200" size={48}/>
              </div>
              <p className="text-indigo-900 font-black text-3xl tracking-tighter">No Examination Logs Found</p>
              <p className="text-gray-400 font-medium mt-4 max-w-sm mx-auto leading-relaxed text-sm">Our academic division has not yet published any result transcripts for your student profile.</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer className="mt-32 pt-12 border-t border-gray-100 flex justify-between text-gray-300 text-[10px] font-bold uppercase tracking-widest pb-12">
            <div>&copy; 2024 Institutional Result Authority</div>
            <div className="flex space-x-10">
                <span className="hover:text-indigo-500 cursor-help transition-colors">Privacy Policy</span>
                <span className="hover:text-indigo-500 cursor-help transition-colors">Compliance Verification</span>
                <span className="hover:text-indigo-500 cursor-help transition-colors">Support Hub</span>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default StudentDashboard;
