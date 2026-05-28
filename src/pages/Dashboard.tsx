import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  Phone,
  Mail,
  MapPin,
  School,
  Hash,
  Settings,
  Lock,
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';

interface AdmissionApplication {
  id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  gradeSelection: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  penNumber: string;
  apaarNumber: string;
  caste: string;
  religion: string;
  currentAddress: string;
  permanentAddress: string;
  previousSchool: string;
  leavingCause: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  userId: string;
}

export default function Dashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'settings'>('applications');
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [admissionsOpen, setAdmissionsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'admissions');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAdmissionsOpen(docSnap.data().open ?? true);
      } else {
        setAdmissionsOpen(true);
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
      setAdmissionsOpen(true);
    });
    return () => unsubscribe();
  }, []);

  const toggleAdmissions = async () => {
    if (admissionsOpen === null) return;
    const newStatus = !admissionsOpen;
    try {
      await setDoc(doc(db, 'settings', 'admissions'), {
        open: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin'
      });
    } catch (error) {
      console.error("Error setting admissions status:", error);
    }
  };

  // Settings State
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const isDirectAdmin = user?.email?.endsWith('@adharchand.edu') || 
                        user?.email === 'admin@adharchand.edu' ||
                        user?.email === 'choudhuryarnab919@gmail.com';
  const hasAdminAccess = isAdmin || isDirectAdmin;

  useEffect(() => {
    if (!hasAdminAccess) return;

    const q = query(collection(db, 'admissions'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdmissionApplication[];
      setApplications(apps);
    });

    return () => unsubscribe();
  }, [hasAdminAccess]);

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'admissions', id), {
        status: newStatus
      });
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    if (newPassword && !validatePassword(newPassword)) {
      setSettingsError('Password must be min 8 chars, with uppercase, lowercase, number, and special character.');
      setSettingsLoading(false);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSettingsError('New passwords do not match.');
      setSettingsLoading(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('No active session');

      // Re-authenticate
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      if (newEmail && newEmail !== currentUser.email) {
        await updateEmail(currentUser, newEmail);
        try {
          await updateDoc(doc(db, 'admins', currentUser.uid), {
            email: newEmail
          });
          await updateDoc(doc(db, 'users', currentUser.uid), {
            email: newEmail
          });
        } catch (dbErr) {
          console.warn("Could not sync email to Firestore admins/users collections:", dbErr);
        }
        setSettingsSuccess('User address updated successfully.');
      }

      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        setSettingsSuccess(prev => prev + ' Password updated successfully.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Settings update error:", error);
      setSettingsError(error.message || 'Failed to update credentials. Check your current password.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F4F1] gap-6">
        <div className="w-16 h-16 border-4 border-[#1E3A8A] border-t-[#B45309] rounded-full animate-spin"></div>
        <p className="text-[#1E3A8A] font-black uppercase tracking-widest text-xs animate-pulse">Establishing Secure Session...</p>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return <Navigate to="/login" replace />;
  }

  const filteredApps = applications.filter(app => 
    filter === 'all' ? true : app.status === filter
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F4F4F1] pb-24"
    >
      <header className="bg-white border-b-2 border-[#1E3A8A] pt-32 pb-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[#B45309] font-bold text-xs uppercase tracking-widest mb-2">Administrative Portal</p>
              <h1 className="text-4xl md:text-6xl font-black text-[#1E3A8A] tracking-tighter italic">
                {activeTab === 'applications' ? 'ADMISSIONS REVIEW.' : 'SYSTEM SETTINGS.'}
              </h1>
            </div>
            
            <div className="flex gap-4">
               <button 
                onClick={() => setActiveTab('applications')}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all ${activeTab === 'applications' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A]/5'}`}
              >
                <FileText className="w-4 h-4" /> Applications
              </button>
              <button 
                onClick={() => { setActiveTab('settings'); setNewEmail(user?.email || ''); }}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all ${activeTab === 'settings' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A]/5'}`}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-md"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          {activeTab === 'applications' && (
            <div className="flex bg-white border-2 border-[#1E3A8A] p-1 w-fit">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    filter === f ? 'bg-[#1E3A8A] text-white' : 'text-[#1E3A8A] hover:bg-[#1E3A8A]/5'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
        <AnimatePresence mode="wait">
          {activeTab === 'applications' ? (
            <motion.div 
              key="apps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              {/* List */}
              <div className="lg:col-span-1 space-y-6">
                {/* Admissions Status Control Widget */}
                <div id="admissions-toggle-card" className="bg-white border-4 border-[#1E3A8A] p-6 space-y-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-[#1E3A8A]/5 -rotate-12 translate-x-12 -translate-y-12"></div>
                  
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-black tracking-widest text-[#B45309] uppercase">ENTRANCE PORTAL STATUS</span>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border ${
                      admissionsOpen === null 
                        ? 'bg-gray-100 text-gray-500 border-gray-200' 
                        : admissionsOpen 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {admissionsOpen === null ? 'FETCHING...' : admissionsOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <h4 className="text-base font-black text-[#1E3A8A] uppercase tracking-tight leading-tight">REGISTRATIONS {admissionsOpen ? 'OPENED' : 'CLOSED'}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                      Control the admission cycle status for the 2024-25 sessions. Toggle to open or close candidate applications dynamically.
                    </p>
                  </div>

                  <button
                    onClick={toggleAdmissions}
                    disabled={admissionsOpen === null}
                    className={`w-full py-3 font-black text-[10px] uppercase tracking-widest border-2 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      admissionsOpen 
                        ? 'border-red-600 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                        : 'border-[#1E3A8A] bg-[#1E3A8A] text-white hover:bg-[#B45309] hover:border-[#B45309]'
                    }`}
                  >
                    {admissionsOpen === null ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> SYNCHRONIZING...
                      </>
                    ) : admissionsOpen ? (
                      'CLOSE REGISTRATION ENTRIES'
                    ) : (
                      'OPEN REGISTRATION ENTRIES'
                    )}
                  </button>
                </div>

                <h3 className="text-xl font-black text-[#1E3A8A] pt-4 mb-2 flex items-center gap-2 border-t-2 border-gray-100">
                  <FileText className="w-6 h-6" />
                  APPLICATIONS ({filteredApps.length})
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                  {filteredApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`w-full text-left p-6 border-2 transition-all ${
                        selectedApp?.id === app.id ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl translate-x-2' : 'bg-white border-transparent hover:border-[#1E3A8A]/30 text-[#1E3A8A]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border ${
                          app.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {app.status}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-black text-lg uppercase leading-none mb-1">{app.studentName}</h4>
                      <p className={`text-xs font-bold ${selectedApp?.id === app.id ? 'text-white/70' : 'text-gray-400'} uppercase tracking-wider`}>
                        Grade {app.gradeSelection} • {app.gender}
                      </p>
                    </button>
                  ))}
                  {filteredApps.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-[#1E3A8A]/20 p-12 text-center">
                      <Clock className="w-12 h-12 text-[#1E3A8A]/20 mx-auto mb-4" />
                      <p className="text-[#1E3A8A]/40 font-bold uppercase tracking-widest text-xs">No records found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Details View */}
              <div className="lg:col-span-2">
                {selectedApp ? (
                  <motion.div 
                    key={selectedApp.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border-4 border-[#1E3A8A] p-8 md:p-12 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E3A8A] rotate-45 translate-x-16 -translate-y-16"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 relative z-10">
                      <div>
                        <p className="text-[#B45309] font-black text-xs uppercase tracking-widest mb-4 border-b-2 border-[#B45309] inline-block">Application ID: {selectedApp.id.slice(-8).toUpperCase()}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#1E3A8A] tracking-tighter leading-none uppercase">{selectedApp.studentName}</h2>
                      </div>
                      <div className="flex gap-2">
                        {selectedApp.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateStatus(selectedApp.id, 'approved')}
                              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                            <button 
                              onClick={() => updateStatus(selectedApp.id, 'rejected')}
                              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </>
                        )}
                        {selectedApp.status !== 'pending' && (
                          <button 
                            onClick={() => updateStatus(selectedApp.id, 'pending')}
                            className="flex items-center gap-2 border-2 border-[#1E3A8A] text-[#1E3A8A] px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#1E3A8A]/5 transition-colors"
                          >
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <section>
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <User className="w-3 h-3" /> Personal Information
                          </h5>
                          <div className="grid grid-cols-1 gap-4">
                            <InfoItem label="Father's Name" value={selectedApp.fatherName} />
                            <InfoItem label="Mother's Name" value={selectedApp.motherName} />
                            <InfoItem label="Date of Birth" value={selectedApp.dob} />
                            <InfoItem label="Gender" value={selectedApp.gender} />
                            <InfoItem label="Religion" value={selectedApp.religion} />
                            <InfoItem label="Caste" value={selectedApp.caste} />
                          </div>
                        </section>

                        <section>
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Hash className="w-3 h-3" /> Identity Documents
                          </h5>
                          <div className="grid grid-cols-1 gap-4">
                              <InfoItem label="Aadhaar Number" value={selectedApp.aadhaarNumber} />
                              <InfoItem label="PEN Number" value={selectedApp.penNumber || 'N/A'} />
                              <InfoItem label="APAAR Number" value={selectedApp.apaarNumber || 'N/A'} />
                          </div>
                        </section>
                      </div>

                      <div className="space-y-8">
                        <section>
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Phone className="w-3 h-3" /> Contact Details
                          </h5>
                          <div className="grid grid-cols-1 gap-4">
                            <InfoItem label="Phone" value={selectedApp.phone} />
                            <InfoItem label="Email" value={selectedApp.email} />
                          </div>
                        </section>

                        <section>
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <School className="w-3 h-3" /> Academic Record
                          </h5>
                          <div className="grid grid-cols-1 gap-4">
                            <InfoItem label="Grade Applied For" value={selectedApp.gradeSelection} />
                            <InfoItem label="Previous School" value={selectedApp.previousSchool || 'N/A'} />
                            <InfoItem label="Leaving Cause" value={selectedApp.leavingCause || 'N/A'} />
                          </div>
                        </section>

                        <section>
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Address History
                          </h5>
                          <div className="grid grid-cols-1 gap-4">
                            <InfoItem label="Current Address" value={selectedApp.currentAddress} />
                            <InfoItem label="Permanent Address" value={selectedApp.permanentAddress} />
                          </div>
                        </section>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full bg-white border-4 border-dashed border-[#1E3A8A]/10 flex flex-col items-center justify-center p-20 text-center">
                    <div className="w-24 h-24 bg-[#1E3A8A]/5 rounded-sm flex items-center justify-center mb-6">
                      <FileText className="w-10 h-10 text-[#1E3A8A]/20" />
                    </div>
                    <h3 className="text-2xl font-black text-[#1E3A8A]/30 uppercase tracking-tight italic">Select an application to view details</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Manage student enrollments from this panel</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white border-4 border-[#1E3A8A] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-[#1E3A8A]/5 -rotate-12 translate-x-12 -translate-y-12"></div>
                
                <h2 className="text-3xl font-black text-[#1E3A8A] mb-8 uppercase tracking-tighter italic border-b-2 border-[#1E3A8A] pb-4">Account Security Management</h2>
                
                <form onSubmit={handleUpdateAccount} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Identity Change
                      </h3>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">New User Address</label>
                        <input 
                          type="email" 
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all"
                          placeholder="admin@adharchand.edu"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Security Credentials
                      </h3>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Current Password</label>
                        <input 
                          required
                          type="password" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all font-mono"
                          placeholder="••••••••"
                        />
                        <p className="text-[10px] text-gray-400 font-bold italic">Required for any profile changes</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1E3A8A]/5 p-8 border-l-4 border-[#1E3A8A] space-y-6">
                    <h3 className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" /> New Security Protocol
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">New Password</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-white border-b-2 border-[#1E3A8A]/20 focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all font-mono"
                          placeholder="Min. 8 chars, mixed"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Confirm New Password</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-white border-b-2 border-[#1E3A8A]/20 focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all font-mono"
                          placeholder="Repeat password"
                        />
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-500 font-bold space-y-1">
                      <p>SECURITY REQUIREMENTS:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Minimum 8 characters length</li>
                        <li>At least 1 uppercase letter</li>
                        <li>At least 1 lowercase letter</li>
                        <li>At least 1 numerical digit</li>
                        <li>At least 1 special character (@, $, !, %, *, ?, &)</li>
                      </ul>
                    </div>
                  </div>

                  {settingsError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-xs font-bold text-red-600">{settingsError}</p>
                    </div>
                  )}

                  {settingsSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <p className="text-xs font-bold text-green-600">{settingsSuccess}</p>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={settingsLoading}
                    className="w-full md:w-fit bg-[#1E3A8A] text-white px-12 py-4 font-black text-sm uppercase tracking-[0.2em] hover:bg-[#B45309] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Commit Profile Changes'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-100 pb-2">
      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-[#1E3A8A] uppercase tracking-tight truncate">{value}</p>
    </div>
  );
}
