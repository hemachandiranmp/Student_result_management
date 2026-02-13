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
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); 
      doc.text('OFFICIAL ACADEMIC MARKSHEET', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Student Result Management Portal', 105, 28, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(`SEMESTER ${result.semester || 'N/A'} EXAMINATION`, 105, 34, { align: 'center' });
      
      // Student Info
      doc.setDrawColor(200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 40, 182, 40, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('STUDENT INFORMATION', 20, 50);
      
      autoTable(doc, {
        startY: 55,
        body: [
          [`Name: ${profile?.name || 'N/A'}`, `Department: ${profile?.department || 'N/A'}`],
          [`Roll Number: ${profile?.rollNo || 'N/A'}`, `Batch: ${profile?.batch?.includes('-') ? profile.batch : (profile?.batch ? `${profile.batch}-${parseInt(profile.batch)+4}` : 'N/A')}`]
        ],
        theme: 'plain',
        styles: { fontSize: 10 }
      });
      
      // Result Table
      const tableData = result.subjects.map(s => [s.subjectName, s.grade, s.credits]);
      
      autoTable(doc, {
        startY: 90,
        head: [['Subject Name', 'Grade', 'Credits']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        styles: { halign: 'center' },
        columnStyles: { 0: { halign: 'left' } }
      });
      
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`SEMESTER GPA: ${result.average}`, 14, finalY);
      doc.text(`RESULT STATUS: ${result.grade}`, 14, finalY + 8);
      
      doc.save(`${profile?.rollNo}_Sem${result.semester}.pdf`);
    } catch (error) { console.error(error); }
  };

  const calculateCGPA = () => {
    if (results.length === 0) return '0.00';
    let totalPoints = 0;
    let totalCredits = 0;
    const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'U': 0, 'RA': 0, 'SA': 0, 'W': 0 };
    
    results.forEach(res => {
      res.subjects.forEach(sub => {
        const points = gradePoints[sub.grade] || 0;
        totalPoints += (points * sub.credits);
        totalCredits += sub.credits;
      });
    });
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  return (
    <div className="h-screen bg-[#fcfdfe] flex font-sans overflow-hidden">
      {/* Premium Sidebar */}
      <div className="w-72 h-screen bg-indigo-950 text-white p-8 shadow-[10px_0_30px_rgba(0,0,0,0.05)] border-r border-white/5 relative z-10 flex flex-col shrink-0">
        <div className="mb-16">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-indigo-500/30">Siet</div>
            <h2 className="text-2xl font-black tracking-tight tracking-[-0.05em]">RESULT HUB</h2>
          </div>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Academic Portal 4.0</p>
        </div>
        
        <nav className="space-y-6 flex-1 overflow-y-auto">
          <div className="group">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 ml-1">Main Menu</p>
            <div className="flex items-center space-x-3 p-4 bg-indigo-900/50 rounded-2xl border-l-4 border-indigo-400 shadow-xl transition-all">
              <User size={18} className="text-indigo-400" /> <span className="font-bold text-sm">Academic Profile</span>
            </div>
          </div>
        </nav>

        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="mt-8 flex items-center space-x-3 w-full p-4 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all border border-transparent hover:border-red-400/20 group">
          <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> <span className="font-black text-xs uppercase tracking-widest">Terminate Session</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-screen p-16 overflow-y-auto scroll-smooth">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-2 text-indigo-500 font-bold text-xs uppercase tracking-widest mb-3">
              <ShieldCheck size={14} /> <span>Institutional Auth Verified</span>
            </div>
            <h1 className="text-5xl font-black text-indigo-950 leading-none tracking-tighter">Graduate Ledger</h1>
            <p className="text-gray-400 mt-4 font-medium flex items-center">
              Student Information System <span className="mx-2 opacity-30">/</span> {profile?.department} <span className="mx-2 opacity-30">/</span> {profile?.batch?.includes('-') ? `Batch ${profile.batch}` : (profile?.batch ? `Batch ${profile.batch}-${parseInt(profile.batch) + 4}` : 'Batch Not Set')}
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
                
                // Header
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40, 40, 90);
                doc.text('OFFICIAL ACADEMIC TRANSCRIPT', 105, 20, { align: 'center' });
                
                // Student Info Box
                doc.setDrawColor(200, 200, 220);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(14, 30, 182, 35, 3, 3, 'FD');
                
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 120);
                doc.text('STUDENT IDENTITY', 20, 40);
                doc.text('ACADEMIC DETAILS', 110, 40);
                
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(profile?.name?.toUpperCase() || '', 20, 48);
                doc.text(profile?.rollNo || '', 20, 56);
                
                doc.text(profile?.department || '', 110, 48);
                const batchStr = profile?.batch?.includes('-') ? profile.batch : (profile?.batch ? `${profile.batch}-${parseInt(profile.batch) + 4}` : 'N/A');
                doc.text(`Batch: ${batchStr}`, 110, 56);
                
                let yPos = 75;

                // Results Loop
                results.sort((a,b) => a.semester - b.semester).forEach((res, i) => {
                  // Page Break if needed
                  if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                  }

                  // Semester Header
                  doc.setFillColor(79, 70, 229); // Indigo
                  doc.rect(14, yPos, 182, 8, 'F');
                  doc.setTextColor(255, 255, 255);
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`SEMESTER 0${res.semester}`, 20, yPos + 5.5);
                  doc.text(`GPA: ${res.average}   |   STATUS: ${res.grade}`, 180, yPos + 5.5, { align: 'right' });
                  
                  yPos += 12;

                  // Table Body
                  const tableData = res.subjects.map(s => {
                    const status = ['U', 'RA', 'SA', 'AB'].includes(s.grade) ? 'FAIL' : 'PASS';
                    return [
                      s.subjectCode || '---',
                      s.subjectName,
                      s.credits,
                      s.grade,
                      status
                    ];
                  });

                  autoTable(doc, {
                    startY: yPos,
                    head: [['Code', 'Course Title', 'Credits', 'Grade', 'Result']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [240, 240, 250], textColor: [60, 60, 80], fontStyle: 'bold', lineWidth: 0.1, lineColor: [220, 220, 230] },
                    bodyStyles: { textColor: [50, 50, 60], fontSize: 9 },
                    columnStyles: {
                      0: { cellWidth: 25, fontStyle: 'bold' },
                      1: { cellWidth: 'auto' },
                      2: { cellWidth: 20, halign: 'center' },
                      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                      4: { cellWidth: 25, halign: 'center' }
                    },
                    styles: { lineColor: [230, 230, 240], lineWidth: 0.1 },
                    margin: { left: 14, right: 14 }
                  });

                  yPos = doc.lastAutoTable.finalY + 10;
                });

                // Footer / CGPA
                if (yPos > 240) {
                   doc.addPage();
                   yPos = 30;
                }
                
                doc.setDrawColor(79, 70, 229);
                doc.setLineWidth(0.5);
                doc.line(14, yPos + 5, 196, yPos + 5);
                
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text(`CUMULATIVE GPA (CGPA): ${calculateCGPA()}`, 196, yPos + 15, { align: 'right' });
                
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, yPos + 15);

                doc.save(`${profile?.rollNo}_Official_Transcript.pdf`);
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
          
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <Award className="absolute -bottom-6 -right-6 text-white/10 w-32 h-32 transform group-hover:rotate-12 transition-transform duration-500" />
            <div className="relative z-10">
              <h3 className="text-white/60 font-black text-[10px] uppercase tracking-widest mb-1">Cumulative GPA</h3>
              <p className="text-5xl font-black tracking-tighter">{calculateCGPA()}</p>
            </div>
            <div className="relative z-10 mt-6">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest opacity-60">Status</p>
              <p className="text-sm font-bold">Academic Standing: Good</p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,58,138,0.06)] border border-indigo-50 flex flex-col justify-between group">
            <h3 className="text-indigo-900/30 font-black text-[10px] uppercase tracking-widest">Division</h3>
            <div>
              <p className="text-2xl font-black text-indigo-950 tracking-tighter uppercase">{profile?.department}</p>
              <div className="h-1 w-8 bg-indigo-200 mt-4 rounded-full group-hover:w-16 transition-all duration-500"></div>
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
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Semester GPA</p>
                    <div className="flex items-center justify-end space-x-4">
                      <p className="text-6xl font-black text-white leading-none tracking-tighter">
                        {res.average > 10 ? (res.average / 10).toFixed(2) : res.average}
                      </p>
                      <div className={`w-3 h-12 rounded-full ${res.grade !== 'FAIL' && res.grade !== 'RA' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-12">
                <div className="bg-gray-50/50 rounded-[2rem] p-4 mb-10 border border-gray-100/50">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">
                          <th className="p-6">Sem</th>
                          <th className="p-6">Course Code</th>
                          <th className="p-6">Course Title</th>
                          <th className="p-6 text-center">Credits</th>
                          <th className="p-6 text-center">Letter Grade</th>
                          <th className="p-6 text-center">Grade Point</th>
                          <th className="p-6 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {res.subjects.map((s, i) => {
                          const currentGrade = s.grade || (s.marks ? (s.marks >= 90 ? 'O' : s.marks >= 80 ? 'A+' : s.marks >= 70 ? 'A' : s.marks >= 60 ? 'B+' : s.marks >= 50 ? 'B' : 'RA') : 'U');
                          const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'U': 0, 'RA': 0, 'SA': 0, 'W': 0 };
                          const point = gradePoints[currentGrade] || 0;
                          const status = ['U', 'RA', 'SA'].includes(currentGrade) ? 'FAIL' : 'PASS';
                          
                          return (
                            <tr key={i} className="hover:bg-white transition-all group/row">
                              <td className="p-6 font-bold text-slate-400 text-xs text-center">0{res.semester}</td>
                              <td className="p-6">
                                  <p className="font-black text-indigo-400 uppercase tracking-tighter text-xs">{s.subjectCode || '---'}</p>
                              </td>
                              <td className="p-6">
                                  <p className="font-black text-indigo-900 group-hover/row:translate-x-2 transition-transform uppercase tracking-tight text-xs">{s.subjectName}</p>
                              </td>
                              <td className="p-6 text-center">
                                  <span className="text-sm font-black text-slate-400">{s.credits || '0'}</span>
                              </td>
                              <td className="p-6 text-center">
                                  <span className={`text-lg font-black tracking-tighter ${status === 'PASS' ? 'text-indigo-600' : 'text-red-500'}`}>{currentGrade}</span>
                              </td>
                              <td className="p-6 text-center">
                                  <span className="text-sm font-black text-slate-400">{point}</span>
                              </td>
                              <td className="p-6 text-right">
                                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${status === 'PASS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {status}
                                  </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                </div>
                
                <div className="flex justify-between items-center bg-indigo-50/30 p-10 rounded-[2.5rem] border border-indigo-100/50">
                   <div className="flex space-x-12">
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Current CGPA</span>
                         <span className="text-4xl font-black text-indigo-600 tracking-tighter">{calculateCGPA()}</span>
                       </div>
                       <div className="w-[1px] h-16 bg-indigo-100"></div>
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Performance Status</span>
                         <span className={`text-sm font-black tracking-widest uppercase py-3 px-6 rounded-2xl shadow-sm ${res.grade !== 'FAIL' && res.grade !== 'RA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {res.grade !== 'FAIL' && res.grade !== 'RA' ? 'Validated & Promoted' : 'Re-Examination Pending'}
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
