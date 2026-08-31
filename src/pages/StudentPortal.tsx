import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate, Link } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  ArrowRight, 
  User, 
  Award, 
  BookOpen, 
  FileCheck,
  Download,
  AlertCircle,
  HelpCircle,
  Mail,
  Phone,
  LogOut,
  X
} from 'lucide-react';

interface CertificateRequest {
  id: string;
  studentName: string;
  fatherName: string;
  rollNumber: string;
  admissionNumber: string;
  classSelection: string;
  academicYear: string;
  certificateType: 'character' | 'transfer' | 'reading';
  purpose: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  submittedAt: string;
  userId: string;
}

export default function StudentPortal() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<'requests' | 'apply'>('requests');
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedCert, setSelectedCert] = useState<CertificateRequest | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Form states
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [classSelection, setClassSelection] = useState('Class 12');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [certificateType, setCertificateType] = useState<'character' | 'transfer' | 'reading'>('character');
  const [purpose, setPurpose] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch student's own profile info for auto-filling the form if available
  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setPhone(user.phoneNumber || '');
    
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.displayName) setStudentName(data.displayName.toUpperCase());
        }
      } catch (err) {
        console.warn("Could not fetch user profile details:", err);
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch student's own requests
  useEffect(() => {
    if (!user) return;

    setLoadingRequests(true);
    const q = query(
      collection(db, 'certificate_requests'),
      where('userId', '==', user.uid),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CertificateRequest[];
      setRequests(fetched);
      setLoadingRequests(false);
    }, (error) => {
      console.error("Error fetching student certificates:", error);
      setLoadingRequests(false);
      handleFirestoreError(error, OperationType.LIST, 'certificate_requests');
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validation
    if (!studentName.trim() || !fatherName.trim() || !rollNumber.trim() || !admissionNumber.trim() || !purpose.trim() || !phone.trim()) {
      setError('Please fill in all the required fields.');
      setSubmitting(false);
      return;
    }

    try {
      const payload: Omit<CertificateRequest, 'id'> = {
        studentName: studentName.trim(),
        fatherName: fatherName.trim(),
        rollNumber: rollNumber.trim(),
        admissionNumber: admissionNumber.trim(),
        classSelection,
        academicYear,
        certificateType,
        purpose: purpose.trim(),
        phone: phone.trim(),
        email: email.trim(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
        userId: user.uid
      };

      await addDoc(collection(db, 'certificate_requests'), payload);
      
      setSuccess(`Application for ${getFriendlyCertName(certificateType)} submitted successfully!`);
      // Clear form except profile defaults
      setFatherName('');
      setRollNumber('');
      setAdmissionNumber('');
      setPurpose('');
      
      // Auto switch back to requests after a short delay
      setTimeout(() => {
        setActiveView('requests');
        setSuccess('');
      }, 3000);

    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || 'Failed to submit application. Please check Firestore permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFriendlyCertName = (type: 'character' | 'transfer' | 'reading') => {
    switch (type) {
      case 'character': return 'Character Certificate';
      case 'transfer': return 'Transfer Certificate (TC)';
      case 'reading': return 'School Reading Certificate';
      default: return 'Certificate';
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F4F1] gap-6">
        <div className="w-16 h-16 border-4 border-[#1E3A8A] border-t-[#B45309] rounded-full animate-spin"></div>
        <p className="text-[#1E3A8A] font-black uppercase tracking-widest text-xs animate-pulse">Establishing Secure Session...</p>
      </div>
    );
  }

  // Redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login?type=student" replace />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F4F4F1] pb-24"
    >
      {/* Header section with school styling */}
      <header className="bg-white border-b-2 border-[#1E3A8A] pt-32 pb-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[#B45309] font-bold text-xs uppercase tracking-widest mb-2">Student Portal</p>
              <h1 className="text-4xl md:text-6xl font-black text-[#1E3A8A] tracking-tighter italic uppercase">
                {activeView === 'requests' ? 'Academic Certificates.' : 'Apply Certificate.'}
              </h1>
              <p className="text-gray-500 font-medium text-sm mt-2 max-w-2xl">
                Logged in as <span className="text-[#1E3A8A] font-bold">{user.email}</span>. Request official Character, Transfer, or School Reading certificates instantly.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveView('requests')}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all ${activeView === 'requests' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A]/5'}`}
              >
                <FileText className="w-4 h-4" /> My Applications ({requests.length})
              </button>
              <button 
                onClick={() => setActiveView('apply')}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all ${activeView === 'apply' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A]/5'}`}
              >
                <Plus className="w-4 h-4" /> Apply New
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
        <AnimatePresence mode="wait">
          {activeView === 'requests' ? (
            <motion.div 
              key="requests"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {loadingRequests ? (
                <div className="bg-white border-2 border-gray-100 p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading certificate applications...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="bg-white border-2 border-gray-100 p-16 text-center max-w-2xl mx-auto space-y-6">
                  <div className="w-16 h-16 bg-[#1E3A8A]/5 flex items-center justify-center text-[#1E3A8A] mx-auto rounded-full">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight">No Certificate Requests</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                    You have not applied for any certificates yet. You can apply for a Character certificate, Transfer certificate, or School reading certificate.
                  </p>
                  <button 
                    onClick={() => setActiveView('apply')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#1E3A8A] text-white font-black uppercase tracking-widest text-xs hover:bg-[#B45309] transition-all"
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {requests.map((req) => (
                    <div 
                      key={req.id}
                      className="bg-white border-2 border-gray-100 hover:border-[#1E3A8A]/50 transition-all p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            req.certificateType === 'character' ? 'bg-[#1E3A8A]/10 text-[#1E3A8A]' :
                            req.certificateType === 'transfer' ? 'bg-purple-100 text-purple-800' :
                            'bg-teal-100 text-teal-800'
                          }`}>
                            {getFriendlyCertName(req.certificateType)}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            Applied on {new Date(req.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-[#1E3A8A] uppercase">{req.studentName}</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-500">
                          <p>Roll: <span className="font-bold text-gray-700">{req.rollNumber}</span></p>
                          <p>Class: <span className="font-bold text-gray-700">{req.classSelection}</span></p>
                          <p>Session: <span className="font-bold text-gray-700">{req.academicYear}</span></p>
                          <p>Admission No: <span className="font-bold text-gray-700">{req.admissionNumber}</span></p>
                        </div>

                        {req.adminComment && (
                          <div className="mt-4 p-3 bg-[#F4F4F1] border-l-4 border-[#B45309] text-xs">
                            <p className="font-bold text-[#B45309] uppercase tracking-wide mb-1">Administrative Note:</p>
                            <p className="text-gray-600 italic">"{req.adminComment}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end justify-between gap-4 border-t-2 border-gray-50 pt-4 md:border-t-0 md:pt-0">
                        {/* Status chip */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                          {req.status === 'pending' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-800 border border-yellow-200 text-xs font-bold uppercase tracking-wider">
                              <Clock className="w-4 h-4 text-yellow-600" /> Pending Review
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 text-xs font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-4 h-4 text-green-600" /> Approved & Issued
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-800 border border-red-200 text-xs font-bold uppercase tracking-wider">
                              <XCircle className="w-4 h-4 text-red-600" /> Rejected
                            </span>
                          )}
                        </div>

                        {req.status === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedCert(req);
                              setShowCertificateModal(true);
                            }}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white hover:bg-[#B45309] text-xs font-bold uppercase tracking-widest transition-all"
                          >
                            <Download className="w-4 h-4" /> View Certificate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="apply"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto"
            >
              <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-100 p-8 md:p-12 space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight">New Certificate Application</h2>
                  <p className="text-xs text-gray-500 mt-1">Please provide accurate academic information to prevent rejection or delays.</p>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-800 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 text-sm text-green-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500 flex items-center justify-between">
                      <span>Student Full Name <span className="text-red-500">*</span></span>
                      <span className="text-[9px] text-[#B45309] font-mono">AUTO CAPITALIZED</span>
                    </label>
                    <input 
                      type="text" 
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-bold text-[#1E3A8A] uppercase placeholder:normal-case placeholder:font-normal"
                      placeholder="ENTER FULL NAME IN CAPITAL LETTERS"
                      required
                    />
                  </div>

                  {/* Father's Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500 flex items-center justify-between">
                      <span>Father's Name <span className="text-red-500">*</span></span>
                      <span className="text-[9px] text-[#B45309] font-mono">AUTO CAPITALIZED</span>
                    </label>
                    <input 
                      type="text" 
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-bold text-[#1E3A8A] uppercase placeholder:normal-case placeholder:font-normal"
                      placeholder="ENTER FATHER'S FULL NAME IN CAPITAL LETTERS"
                      required
                    />
                  </div>

                  {/* Certificate Type */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                      Requested Certificate Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'character', label: 'Character Certificate', desc: 'Validates code of conduct' },
                        { id: 'transfer', label: 'Transfer Certificate (TC)', desc: 'For school migration/leaving' },
                        { id: 'reading', label: 'School Reading Certificate', desc: 'Certifies current school studies' },
                      ].map((opt) => (
                        <div 
                          key={opt.id}
                          onClick={() => setCertificateType(opt.id as any)}
                          className={`p-4 border-2 cursor-pointer transition-all ${
                            certificateType === opt.id 
                              ? 'border-[#1E3A8A] bg-[#1E3A8A]/5' 
                              : 'border-gray-100 hover:border-[#1E3A8A]/20 bg-white'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="cert_type"
                            checked={certificateType === opt.id}
                            onChange={() => {}}
                            className="sr-only"
                          />
                          <p className="font-bold text-[#1E3A8A] text-sm">{opt.label}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{opt.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Class / Grade Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                      Class / Grade <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={classSelection}
                      onChange={(e) => setClassSelection(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-bold text-gray-800"
                    >
                      {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map(cl => (
                        <option key={cl} value={cl}>{cl}</option>
                      ))}
                    </select>
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                      Academic Year / Session <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-bold text-gray-800"
                    >
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </select>
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                      Class Roll Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800"
                      placeholder="e.g. 42"
                      required
                    />
                  </div>

                  {/* Admission / Registration Number */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                      Admission / Reg Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800"
                      placeholder="e.g. ADH/2024/983"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800"
                        placeholder="e.g. +1 (555) 000-0000"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                      Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800"
                        placeholder="student@example.com"
                      />
                    </div>
                  </div>

                  {/* Purpose / Reason */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                      Detailed Reason / Purpose <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800 resize-none"
                      placeholder="Briefly explain why you require this certificate (e.g. Higher studies, Admission elsewhere, Bank account, Passport validation)"
                      required
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => setActiveView('requests')}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-500 hover:border-gray-400 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3.5 bg-[#1E3A8A] text-white hover:bg-[#B45309] disabled:bg-gray-300 font-black uppercase tracking-widest text-xs transition-all shadow-md"
                  >
                    {submitting ? (
                      <>Submitting application...</>
                    ) : (
                      <>Submit Application <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Elegant Digital Certificate Modal */}
      <AnimatePresence>
        {showCertificateModal && selectedCert && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-4xl w-full p-4 md:p-8 shadow-2xl relative border-4 border-[#1E3A8A]"
            >
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors print:hidden z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Certificate Template */}
              <div className="border-4 border-double border-[#B45309] p-8 md:p-12 relative overflow-hidden bg-orange-50/5 text-center select-text">
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                  <img 
                    src="/src/assets/images/adharchand_torch_logo_1779037415571.png" 
                    alt="Watermark" 
                    className="w-[450px] h-[450px] object-contain rotate-12"
                  />
                </div>

                {/* Top Headers */}
                <div className="space-y-2 mb-8">
                  <div className="w-24 h-24 mx-auto mb-4">
                    <img 
                      src="/src/assets/images/adharchand_torch_logo_1779037415571.png" 
                      alt="Adharchand School Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-[#1E3A8A] tracking-tighter uppercase">ADHARCHAND H. S. SCHOOL</h1>
                  <p className="text-xs md:text-sm font-bold text-[#B45309] tracking-[0.25em] uppercase">City Center, Heritage Road, Silchar, Assam</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">ESTD. 1954 | RECOGNIZED BY THE GOVERNMENT</p>
                  <div className="w-48 h-1 bg-[#1E3A8A] mx-auto my-4"></div>
                </div>

                {/* Certificate Name Title */}
                <div className="mb-8">
                  <h2 className="text-2xl md:text-4xl font-extrabold text-[#B45309] tracking-widest italic uppercase">
                    {selectedCert.certificateType === 'character' && 'CHARACTER CERTIFICATE'}
                    {selectedCert.certificateType === 'transfer' && 'TRANSFER CERTIFICATE'}
                    {selectedCert.certificateType === 'reading' && 'SCHOOL READING CERTIFICATE'}
                  </h2>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold">CERTIFICATE ID: ADH/2026/CERT-{selectedCert.id.slice(0, 8).toUpperCase()}</p>
                </div>

                {/* Content body */}
                <div className="space-y-6 text-sm md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed text-justify px-4">
                  {selectedCert.certificateType === 'character' && (
                    <p>
                      This is to certify that <span className="font-bold text-[#1E3A8A] border-b-2 border-gray-300 px-2">{selectedCert.studentName}</span>, 
                      son / daughter of <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.fatherName}</span>, 
                      was a student of this school in <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.classSelection}</span> 
                      under Roll Number <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.rollNumber}</span> 
                      during the Academic Year / Session <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.academicYear}</span>. 
                      To the best of our records and personal knowledge, they possess an excellent moral character and conduct.
                    </p>
                  )}

                  {selectedCert.certificateType === 'transfer' && (
                    <p>
                      This is to certify that <span className="font-bold text-[#1E3A8A] border-b-2 border-gray-300 px-2">{selectedCert.studentName}</span>, 
                      son / daughter of <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.fatherName}</span>, 
                      bearing Admission Number <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.admissionNumber}</span>, 
                      has migrated from this institution in class <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.classSelection}</span> 
                      as of the Academic Session <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.academicYear}</span>. 
                      All necessary dues of this school have been cleared. We wish them success in their future endeavors.
                    </p>
                  )}

                  {selectedCert.certificateType === 'reading' && (
                    <p>
                      This is to certify that <span className="font-bold text-[#1E3A8A] border-b-2 border-gray-300 px-2">{selectedCert.studentName}</span>, 
                      son / daughter of <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.fatherName}</span>, 
                      is a bona-fide student of Adharchand Higher Secondary School, studying in <span className="font-bold text-[#1E3A8A] border-b-2 border-gray-300 px-2">{selectedCert.classSelection}</span> 
                      under Roll Number <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.rollNumber}</span> 
                      for the ongoing Academic Term <span className="font-bold text-gray-900 border-b-2 border-gray-300 px-2">{selectedCert.academicYear}</span>.
                    </p>
                  )}

                  <p className="text-center text-sm text-gray-500 mt-4 italic">
                    This certificate is issued at their request for the purpose of: <strong className="text-gray-800 not-italic font-bold">"{selectedCert.purpose}"</strong>.
                  </p>
                </div>

                {/* Footer seal / signatures */}
                <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-gray-100">
                  <div className="text-left space-y-1">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Date of Issue</p>
                    <p className="font-bold text-[#1E3A8A]">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="inline-block border-2 border-green-600 px-4 py-1.5 rounded-sm bg-green-50 rotate-[-4deg] scale-95 print:scale-100">
                      <p className="text-[9px] font-black tracking-widest text-green-700 uppercase">DIGITALLY SECURED</p>
                      <p className="text-[7px] text-green-600 font-bold uppercase tracking-wide">APPROVED BY ADHARCHAND TRUST</p>
                    </div>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-500">Authorized Signature</p>
                  </div>
                </div>

                {/* Bottom Developed watermark */}
                <p className="text-[8px] text-gray-300 mt-8 uppercase tracking-widest select-none font-bold">
                  Developed with ❤️ by Arnab Roy Choudhury | Verified Digital Document
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-4 print:hidden">
                <button 
                  onClick={() => setShowCertificateModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 border-2 border-gray-200 hover:border-gray-400 text-xs font-black uppercase tracking-widest text-gray-500 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={handlePrintCertificate}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#1E3A8A] text-white hover:bg-[#B45309] text-xs font-black uppercase tracking-widest transition-all"
                >
                  <Download className="w-4 h-4" /> Print / Save PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
