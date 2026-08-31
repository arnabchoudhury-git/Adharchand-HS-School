import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, writeBatch, deleteDoc, getDocs, where } from 'firebase/firestore';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
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
  LogOut,
  Award,
  CheckCheck,
  CheckSquare,
  Square,
  ShieldCheck,
  Sparkles,
  Eye,
  Download,
  Image as ImageIcon,
  FileCheck,
  Trash2,
  Users,
  UserX,
  Search,
  ShieldAlert,
  Calendar,
  Filter,
  ExternalLink
} from 'lucide-react';
import DocumentPhotoModal from '../components/DocumentPhotoModal';
import DeleteStudentAccountModal, { StudentDeleteTarget } from '../components/DeleteStudentAccountModal';

interface DocumentInfo {
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}

interface StudentUserAccount {
  id: string;
  uid: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  createdAt?: string;
  lastLoginAt?: string;
}

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
  documents?: {
    birthCertificate?: DocumentInfo | null;
    marksheet?: DocumentInfo | null;
    transferCertificate?: DocumentInfo | null;
    passportPhoto?: DocumentInfo | null;
    aadhaarCard?: DocumentInfo | null;
    casteCertificate?: DocumentInfo | null;
    incomeCertificate?: DocumentInfo | null;
  };
}

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

export default function Dashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'certificates' | 'students' | 'settings'>('applications');
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [certRequests, setCertRequests] = useState<CertificateRequest[]>([]);
  const [selectedCert, setSelectedCert] = useState<CertificateRequest | null>(null);
  const [certComment, setCertComment] = useState('');
  const [certFilter, setCertFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Student accounts state
  const [studentAccounts, setStudentAccounts] = useState<StudentUserAccount[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentUserAccount | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; student: StudentDeleteTarget | null }>({
    isOpen: false,
    student: null
  });
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  // Batch selection and approval state
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchMessage, setBatchMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [admissionsOpen, setAdmissionsOpen] = useState<boolean | null>(null);
  
  // Document photo preview modal state for admin inspection
  const [photoPreview, setPhotoPreview] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });

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
      handleFirestoreError(error, OperationType.GET, 'settings/admissions');
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
      handleFirestoreError(error, OperationType.WRITE, 'settings/admissions');
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

  // Real-time synchronization of users collection for student account administration
  useEffect(() => {
    if (!hasAdminAccess) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      })) as StudentUserAccount[];
      setStudentAccounts(usersList);
    }, (error) => {
      console.error("Error fetching student accounts:", error);
    });

    return () => unsubscribe();
  }, [hasAdminAccess]);

  // Aggregate all registered students & applicants to ensure complete visibility
  const allStudentProfiles = useMemo(() => {
    const map = new Map<string, StudentUserAccount>();
    
    // First add all users from users collection
    studentAccounts.forEach(u => {
      map.set(u.uid, u);
    });

    // Supplement with any userIds found in applications
    applications.forEach(app => {
      if (app.userId && !map.has(app.userId)) {
        map.set(app.userId, {
          id: app.userId,
          uid: app.userId,
          email: app.email,
          phone: app.phone,
          displayName: app.studentName,
          createdAt: app.submittedAt
        });
      }
    });

    // Supplement with any userIds found in certificates
    certRequests.forEach(cert => {
      if (cert.userId && !map.has(cert.userId)) {
        map.set(cert.userId, {
          id: cert.userId,
          uid: cert.userId,
          email: cert.email,
          phone: cert.phone,
          displayName: cert.studentName,
          createdAt: cert.submittedAt
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [studentAccounts, applications, certRequests]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return allStudentProfiles;
    const term = studentSearch.toLowerCase();
    return allStudentProfiles.filter(s => 
      (s.displayName && s.displayName.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.phone && s.phone.toLowerCase().includes(term)) ||
      (s.uid && s.uid.toLowerCase().includes(term))
    );
  }, [allStudentProfiles, studentSearch]);

  const handleDeleteStudentAccount = async (targetUid: string, deleteLinkedRecords: boolean) => {
    setIsDeletingStudent(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Delete user record in users collection
      batch.delete(doc(db, 'users', targetUid));

      // 2. If requested, delete all linked applications and certificates
      if (deleteLinkedRecords) {
        const appsSnap = await getDocs(query(collection(db, 'admissions'), where('userId', '==', targetUid)));
        appsSnap.forEach(appDoc => {
          batch.delete(appDoc.ref);
        });

        const certsSnap = await getDocs(query(collection(db, 'certificate_requests'), where('userId', '==', targetUid)));
        certsSnap.forEach(certDoc => {
          batch.delete(certDoc.ref);
        });
      }

      await batch.commit();

      if (selectedApp && selectedApp.userId === targetUid) {
        setSelectedApp(null);
      }
      if (selectedCert && selectedCert.userId === targetUid) {
        setSelectedCert(null);
      }
      if (selectedStudent && selectedStudent.uid === targetUid) {
        setSelectedStudent(null);
      }

      setBatchMessage({
        type: 'success',
        text: `Student account (UID: ${targetUid.slice(-8)}) and linked records successfully deleted.`
      });
      setTimeout(() => setBatchMessage(null), 6000);
    } catch (error) {
      console.error("Error deleting student account:", error);
      setBatchMessage({
        type: 'error',
        text: 'Failed to delete student account. Check permissions and try again.'
      });
      handleFirestoreError(error, OperationType.DELETE, `users/${targetUid}`);
    } finally {
      setIsDeletingStudent(false);
    }
  };

  useEffect(() => {
    if (!hasAdminAccess) return;

    const q = query(collection(db, 'admissions'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdmissionApplication[];
      setApplications(apps);
    }, (error) => {
      console.error("Error fetching admissions list:", error);
      handleFirestoreError(error, OperationType.LIST, 'admissions');
    });

    return () => unsubscribe();
  }, [hasAdminAccess]);

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      await updateDoc(doc(db, 'admissions', id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        reviewedBy: user?.email || 'admin'
      });
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
      setBatchMessage({
        type: 'success',
        text: `Application for ${applications.find(a => a.id === id)?.studentName || 'Student'} marked as ${newStatus.toUpperCase()}.`
      });
      setTimeout(() => setBatchMessage(null), 4000);
    } catch (error) {
      console.error("Error updating status:", error);
      handleFirestoreError(error, OperationType.UPDATE, `admissions/${id}`);
    }
  };

  const approveAllPending = async () => {
    const pendingApps = applications.filter(app => app.status === 'pending');
    if (pendingApps.length === 0) return;

    if (!window.confirm(`AUTHORITY ACTION:\nAre you sure you want to APPROVE all ${pendingApps.length} pending admission application(s) at once?`)) {
      return;
    }

    setIsBatchProcessing(true);
    try {
      const batch = writeBatch(db);
      pendingApps.forEach(app => {
        batch.update(doc(db, 'admissions', app.id), {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: user?.email || 'admin'
        });
      });
      await batch.commit();

      if (selectedApp && pendingApps.some(p => p.id === selectedApp.id)) {
        setSelectedApp({ ...selectedApp, status: 'approved' });
      }

      setBatchMessage({
        type: 'success',
        text: `Authority Approved: Successfully approved all ${pendingApps.length} pending admission application(s).`
      });
      setSelectedAppIds([]);
      setTimeout(() => setBatchMessage(null), 6000);
    } catch (error) {
      console.error("Error batch approving admissions:", error);
      setBatchMessage({
        type: 'error',
        text: 'Failed to bulk approve applications. Please try again.'
      });
      handleFirestoreError(error, OperationType.UPDATE, 'admissions/batch');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const approveSelected = async () => {
    const targetApps = applications.filter(app => selectedAppIds.includes(app.id) && app.status !== 'approved');
    if (targetApps.length === 0) return;

    setIsBatchProcessing(true);
    try {
      const batch = writeBatch(db);
      targetApps.forEach(app => {
        batch.update(doc(db, 'admissions', app.id), {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: user?.email || 'admin'
        });
      });
      await batch.commit();

      if (selectedApp && targetApps.some(t => t.id === selectedApp.id)) {
        setSelectedApp({ ...selectedApp, status: 'approved' });
      }

      setBatchMessage({
        type: 'success',
        text: `Authority Approved: Successfully approved ${targetApps.length} selected admission application(s).`
      });
      setSelectedAppIds([]);
      setTimeout(() => setBatchMessage(null), 6000);
    } catch (error) {
      console.error("Error approving selected admissions:", error);
      setBatchMessage({
        type: 'error',
        text: 'Failed to approve selected applications.'
      });
      handleFirestoreError(error, OperationType.UPDATE, 'admissions/batch');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const rejectSelected = async () => {
    const targetApps = applications.filter(app => selectedAppIds.includes(app.id) && app.status !== 'rejected');
    if (targetApps.length === 0) return;

    if (!window.confirm(`Are you sure you want to REJECT ${targetApps.length} selected application(s)?`)) {
      return;
    }

    setIsBatchProcessing(true);
    try {
      const batch = writeBatch(db);
      targetApps.forEach(app => {
        batch.update(doc(db, 'admissions', app.id), {
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectedBy: user?.email || 'admin'
        });
      });
      await batch.commit();

      if (selectedApp && targetApps.some(t => t.id === selectedApp.id)) {
        setSelectedApp({ ...selectedApp, status: 'rejected' });
      }

      setBatchMessage({
        type: 'success',
        text: `Authority Action: Marked ${targetApps.length} selected admission application(s) as Rejected.`
      });
      setSelectedAppIds([]);
      setTimeout(() => setBatchMessage(null), 6000);
    } catch (error) {
      console.error("Error rejecting selected admissions:", error);
      handleFirestoreError(error, OperationType.UPDATE, 'admissions/batch');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const toggleSelectApp = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAppIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = (filteredList: AdmissionApplication[]) => {
    const allFilteredIds = filteredList.map(a => a.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedAppIds.includes(id));
    if (allSelected) {
      setSelectedAppIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedAppIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  useEffect(() => {
    if (!hasAdminAccess) return;

    const q = query(collection(db, 'certificate_requests'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CertificateRequest[];
      setCertRequests(requestsList);
    }, (error) => {
      console.error("Error fetching certificate requests:", error);
      handleFirestoreError(error, OperationType.LIST, 'certificate_requests');
    });

    return () => unsubscribe();
  }, [hasAdminAccess]);

  const updateCertStatus = async (id: string, newStatus: 'approved' | 'rejected', comment: string) => {
    try {
      await updateDoc(doc(db, 'certificate_requests', id), {
        status: newStatus,
        adminComment: comment.trim()
      });
      
      const updatedItem = certRequests.find(r => r.id === id);
      if (updatedItem) {
        const withNewStatus = { ...updatedItem, status: newStatus, adminComment: comment.trim() };
        if (selectedCert?.id === id) {
          setSelectedCert(withNewStatus);
        }
      }
    } catch (error) {
      console.error("Error updating certificate status:", error);
      handleFirestoreError(error, OperationType.UPDATE, `certificate_requests/${id}`);
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
              <h1 className="text-4xl md:text-6xl font-black text-[#1E3A8A] tracking-tighter italic uppercase">
                {activeTab === 'applications' ? 'ADMISSIONS REVIEW.' : activeTab === 'certificates' ? 'CERTIFICATE REQUESTS.' : activeTab === 'students' ? 'STUDENT ACCOUNTS.' : 'SYSTEM SETTINGS.'}
              </h1>
            </div>
            
            <div className="flex flex-wrap gap-3">
               <button 
                onClick={() => setActiveTab('applications')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all ${activeTab === 'applications' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A]/5'}`}
              >
                <FileText className="w-4 h-4" /> Applications ({applications.length})
              </button>
              <button 
                onClick={() => setActiveTab('certificates')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all ${activeTab === 'certificates' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A]/5'}`}
              >
                <Award className="w-4 h-4" /> Certificates ({certRequests.length})
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all ${activeTab === 'students' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A]/5'}`}
              >
                <Users className="w-4 h-4" /> Student Accounts ({allStudentProfiles.length})
              </button>
              <button 
                onClick={() => { setActiveTab('settings'); setNewEmail(user?.email || ''); }}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all ${activeTab === 'settings' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A]/5'}`}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-md"
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

          {activeTab === 'certificates' && (
            <div className="flex bg-white border-2 border-[#1E3A8A] p-1 w-fit">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setCertFilter(f)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    certFilter === f ? 'bg-[#1E3A8A] text-white' : 'text-[#1E3A8A] hover:bg-[#1E3A8A]/5'
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
        {/* Admin Authority Alert / Toast Message */}
        <AnimatePresence>
          {batchMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-8 p-4 border-2 flex items-center justify-between shadow-lg ${
                batchMessage.type === 'success' 
                  ? 'bg-green-50 border-green-600 text-green-900' 
                  : 'bg-red-50 border-red-600 text-red-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {batchMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span className="text-xs font-black uppercase tracking-wider">{batchMessage.text}</span>
              </div>
              <button 
                onClick={() => setBatchMessage(null)}
                className="text-xs font-bold uppercase underline opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'applications' ? (
            <motion.div 
              key="apps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              {/* List & Controls Column */}
              <div className="lg:col-span-1 space-y-6">
                {/* Admin Authority Approval Hub */}
                <div id="admin-authority-card" className="bg-[#1E3A8A] text-white p-6 space-y-4 shadow-xl border-4 border-[#1E3A8A] relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 -rotate-12 translate-x-12 -translate-y-12"></div>
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-black tracking-widest text-amber-300 uppercase">ADMIN AUTHORITY</span>
                    </div>
                    <span className="text-[9px] font-bold font-mono bg-white/10 px-2 py-0.5 rounded-sm">
                      {applications.filter(a => a.status === 'pending').length} PENDING
                    </span>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <h4 className="text-lg font-black uppercase tracking-tight leading-tight">
                      ADMISSION APPROVALS
                    </h4>
                    <p className="text-[11px] text-white/80 leading-relaxed">
                      Exercise administrative power to grant full admission approvals individually or in batch.
                    </p>
                  </div>

                  {/* Approve All Pending Button */}
                  <div className="pt-2 space-y-2 relative z-10">
                    <button
                      id="approve-all-pending-btn"
                      onClick={approveAllPending}
                      disabled={isBatchProcessing || applications.filter(a => a.status === 'pending').length === 0}
                      className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      {isBatchProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> EXECUTING APPROVAL...
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-4 h-4" /> APPROVE ALL PENDING ({applications.filter(a => a.status === 'pending').length})
                        </>
                      )}
                    </button>

                    {/* Multi-select contextual buttons */}
                    {selectedAppIds.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20">
                        <button
                          onClick={approveSelected}
                          disabled={isBatchProcessing}
                          className="py-2.5 bg-white text-[#1E3A8A] font-black text-[10px] uppercase tracking-wider hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                          Approve ({selectedAppIds.length})
                        </button>
                        <button
                          onClick={rejectSelected}
                          disabled={isBatchProcessing}
                          className="py-2.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject ({selectedAppIds.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admissions Status Portal Toggle */}
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
                      Control the admission cycle status. Toggle to open or close candidate applications dynamically.
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

                {/* Applications Header with Select All */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                  <h3 className="text-xl font-black text-[#1E3A8A] flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    APPLICATIONS ({filteredApps.length})
                  </h3>
                  {filteredApps.length > 0 && (
                    <button
                      onClick={() => toggleSelectAllFiltered(filteredApps)}
                      className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A] hover:underline flex items-center gap-1.5"
                    >
                      {filteredApps.every(a => selectedAppIds.includes(a.id)) ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-[#1E3A8A]" /> Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-gray-400" /> Select All
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Application Items List */}
                <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                  {filteredApps.map((app) => {
                    const isSelected = selectedAppIds.includes(app.id);
                    const isActive = selectedApp?.id === app.id;

                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`w-full text-left p-5 border-2 transition-all cursor-pointer relative group ${
                          isActive 
                            ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl translate-x-1.5' 
                            : 'bg-white border-gray-200 hover:border-[#1E3A8A]/50 text-[#1E3A8A]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectApp(app.id, e)}
                              className="p-1 hover:opacity-80 transition-opacity"
                            >
                              {isSelected ? (
                                <CheckSquare className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#1E3A8A]'}`} />
                              ) : (
                                <Square className={`w-4 h-4 ${isActive ? 'text-white/40' : 'text-gray-300'}`} />
                              )}
                            </button>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                              app.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="pl-6">
                          <h4 className="font-black text-lg uppercase leading-none mb-1">{app.studentName}</h4>
                          <p className={`text-xs font-bold ${isActive ? 'text-white/70' : 'text-gray-400'} uppercase tracking-wider mb-3`}>
                            Grade {app.gradeSelection} • {app.gender}
                          </p>

                          {/* Quick Action buttons on card */}
                          <div className="flex items-center gap-2 pt-2 border-t border-black/5" onClick={(e) => e.stopPropagation()}>
                            {app.status !== 'approved' && (
                              <button
                                onClick={() => updateStatus(app.id, 'approved')}
                                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 rounded-xs transition-colors ${
                                  isActive ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                            )}
                            {app.status !== 'rejected' && (
                              <button
                                onClick={() => updateStatus(app.id, 'rejected')}
                                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 rounded-xs transition-colors ${
                                  isActive ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'
                                }`}
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            )}
                            {app.status !== 'pending' && (
                              <button
                                onClick={() => updateStatus(app.id, 'pending')}
                                className={`px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                                  isActive ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-[#1E3A8A]'
                                }`}
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                    className="bg-white border-4 border-[#1E3A8A] p-8 md:p-12 relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E3A8A] rotate-45 translate-x-16 -translate-y-16"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <p className="text-[#B45309] font-black text-xs uppercase tracking-widest border-b-2 border-[#B45309] inline-block">
                            Application ID: {selectedApp.id.slice(-8).toUpperCase()}
                          </p>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xs border ${
                            selectedApp.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                            selectedApp.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            STATUS: {selectedApp.status}
                          </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#1E3A8A] tracking-tighter leading-none uppercase">
                          {selectedApp.studentName}
                        </h2>
                      </div>
                      
                      {/* Authority Actions in Detail view */}
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedApp.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => updateStatus(selectedApp.id, 'approved')}
                              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Grant Full Approval
                            </button>
                            <button 
                              onClick={() => updateStatus(selectedApp.id, 'rejected')}
                              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            {selectedApp.status === 'approved' && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase">
                                <CheckCircle2 className="w-4 h-4" /> Approved By Admin Authority
                              </div>
                            )}
                            <button 
                              onClick={() => updateStatus(selectedApp.id, 'pending')}
                              className="flex items-center gap-2 border-2 border-[#1E3A8A] text-[#1E3A8A] px-5 py-2 text-xs font-black uppercase tracking-widest hover:bg-[#1E3A8A]/5 transition-colors"
                            >
                              Reset to Pending
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => setDeleteModalState({
                            isOpen: true,
                            student: {
                              uid: selectedApp.userId,
                              name: selectedApp.studentName,
                              email: selectedApp.email,
                              phone: selectedApp.phone,
                              applicationCount: applications.filter(a => a.userId === selectedApp.userId).length,
                              certificateCount: certRequests.filter(c => c.userId === selectedApp.userId).length
                            }
                          })}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-600 border-2 border-red-300 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-sm"
                          title="Delete this student account and associated records"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Account
                        </button>
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

                    {/* Uploaded Verification Documents Section */}
                    <div className="mt-12 pt-8 border-t-2 border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-[#B45309]" />
                          <h4 className="font-black text-lg text-[#1E3A8A] uppercase tracking-wide">
                            Uploaded Verification Documents & Photos
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-3 py-1 font-bold uppercase">
                          {selectedApp.documents ? Object.values(selectedApp.documents).filter(Boolean).length : 0} of 7 Uploaded
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { key: 'passportPhoto', title: '1. Passport Size Photo', req: true, isPortrait: true },
                          { key: 'birthCertificate', title: '2. Birth Certificate Original', req: true },
                          { key: 'marksheet', title: '3. Academic Marksheet / Report', req: true },
                          { key: 'transferCertificate', title: '4. Transfer Certificate (TC)', req: true },
                          { key: 'aadhaarCard', title: '5. Aadhaar Card', req: true },
                          { key: 'casteCertificate', title: '6. Caste Certificate (If Any)', req: false },
                          { key: 'incomeCertificate', title: '7. Income Certificate', req: false }
                        ].map((item) => {
                          const docData = selectedApp.documents ? (selectedApp.documents as any)[item.key] : null;
                          return (
                            <div 
                              key={item.key}
                              className={`p-4 border-2 flex flex-col justify-between transition-all ${
                                docData 
                                  ? 'bg-blue-50/30 border-[#1E3A8A]/30 hover:border-[#1E3A8A]' 
                                  : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                            >
                              <div className="space-y-2 mb-3">
                                <div className="flex items-start justify-between gap-1">
                                  <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-tight">
                                    {item.title}
                                  </span>
                                  {docData ? (
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-200 shrink-0">
                                      Attached
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-gray-200 text-gray-600 shrink-0">
                                      Not Provided
                                    </span>
                                  )}
                                </div>

                                {docData ? (
                                  <div 
                                    onClick={() => setPhotoPreview({ isOpen: true, url: docData.url, title: item.title })}
                                    className={`relative bg-black/5 border border-gray-200 overflow-hidden cursor-pointer group flex items-center justify-center ${
                                      item.isPortrait ? 'h-36 w-28 mx-auto' : 'h-28 w-full'
                                    }`}
                                  >
                                    <img 
                                      src={docData.url} 
                                      alt={item.title} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                    />
                                    <div className="absolute inset-0 bg-[#1E3A8A]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-2">
                                      <Eye className="w-5 h-5" />
                                      <span className="text-[9px] font-bold uppercase tracking-wider">Inspect Photo</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-24 bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-1">
                                    <ImageIcon className="w-6 h-6 opacity-40" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">No Photo</span>
                                  </div>
                                )}
                              </div>

                              {docData && (
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-[10px]">
                                  <span className="text-gray-500 truncate max-w-[120px] font-mono text-[9px]">
                                    {docData.name}
                                  </span>
                                  <button
                                    onClick={() => setPhotoPreview({ isOpen: true, url: docData.url, title: item.title })}
                                    className="text-[#1E3A8A] hover:text-[#B45309] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" /> View
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
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
          ) : activeTab === 'certificates' ? (
            <motion.div 
              key="certs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              {/* List */}
              <div className="lg:col-span-1 space-y-6">
                <h3 className="text-xl font-black text-[#1E3A8A] pt-4 mb-2 flex items-center gap-2 border-t-2 border-gray-100">
                  <Award className="w-6 h-6" />
                  REQUESTS ({certRequests.filter(r => certFilter === 'all' ? true : r.status === certFilter).length})
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                  {certRequests
                    .filter(r => certFilter === 'all' ? true : r.status === certFilter)
                    .map((req) => (
                      <button
                        key={req.id}
                        onClick={() => {
                          setSelectedCert(req);
                          setCertComment(req.adminComment || '');
                        }}
                        className={`w-full text-left p-6 border-2 transition-all ${
                          selectedCert?.id === req.id ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl translate-x-2' : 'bg-white border-transparent hover:border-[#1E3A8A]/30 text-[#1E3A8A]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {req.status}
                          </span>
                          <span className="text-[10px] opacity-60 font-mono">
                            {new Date(req.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-black text-lg uppercase leading-none mb-1">{req.studentName}</h4>
                        <p className={`text-xs font-bold ${selectedCert?.id === req.id ? 'text-white/70' : 'text-gray-400'} uppercase tracking-wider`}>
                          Type: {req.certificateType === 'character' ? 'Character' : req.certificateType === 'transfer' ? 'Transfer' : 'Reading'}
                        </p>
                      </button>
                    ))}
                  {certRequests.filter(r => certFilter === 'all' ? true : r.status === certFilter).length === 0 && (
                    <div className="bg-white border-2 border-dashed border-[#1E3A8A]/20 p-12 text-center">
                      <Clock className="w-12 h-12 text-[#1E3A8A]/20 mx-auto mb-4" />
                      <p className="text-[#1E3A8A]/40 font-bold uppercase tracking-widest text-xs">No certificate requests found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Details View */}
              <div className="lg:col-span-2">
                {selectedCert ? (
                  <motion.div 
                    key={selectedCert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border-4 border-[#1E3A8A] p-8 md:p-12 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E3A8A] rotate-45 translate-x-16 -translate-y-16"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 relative z-10">
                      <div>
                        <p className="text-[#B45309] font-black text-xs uppercase tracking-widest mb-4 border-b-2 border-[#B45309] inline-block">Request ID: {selectedCert.id.slice(-8).toUpperCase()}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#1E3A8A] tracking-tighter leading-none uppercase">{selectedCert.studentName}</h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedCert.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateCertStatus(selectedCert.id, 'approved', certComment)}
                              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                            <button 
                              onClick={() => updateCertStatus(selectedCert.id, 'rejected', certComment)}
                              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </>
                        )}
                        {selectedCert.status !== 'pending' && (
                          <button 
                            onClick={() => updateCertStatus(selectedCert.id, 'pending', certComment)}
                            className="flex items-center gap-2 border-2 border-[#1E3A8A] text-[#1E3A8A] px-5 py-2 text-xs font-black uppercase tracking-widest hover:bg-[#1E3A8A]/5 transition-colors"
                          >
                            Reset to Pending
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteModalState({
                            isOpen: true,
                            student: {
                              uid: selectedCert.userId,
                              name: selectedCert.studentName,
                              email: selectedCert.email,
                              phone: selectedCert.phone,
                              applicationCount: applications.filter(a => a.userId === selectedCert.userId).length,
                              certificateCount: certRequests.filter(c => c.userId === selectedCert.userId).length
                            }
                          })}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-600 border-2 border-red-300 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-sm"
                          title="Delete this student account and associated records"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Account
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
                      <div className="space-y-8">
                        <section>
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <User className="w-3 h-3" /> Certificate Target Details
                          </h5>
                          <div className="grid grid-cols-1 gap-4">
                            <InfoItem label="Student Full Name" value={selectedCert.studentName} />
                            <InfoItem label="Father's Name" value={selectedCert.fatherName} />
                            <InfoItem label="Roll Number" value={selectedCert.rollNumber} />
                            <InfoItem label="Admission Number" value={selectedCert.admissionNumber} />
                          </div>
                        </section>
                      </div>

                      <div className="space-y-8">
                        <section>
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <School className="w-3 h-3" /> Academic & Category Info
                          </h5>
                          <div className="grid grid-cols-1 gap-4">
                            <InfoItem label="Class / Grade" value={selectedCert.classSelection} />
                            <InfoItem label="Academic Year" value={selectedCert.academicYear} />
                            <InfoItem label="Certificate Type" value={selectedCert.certificateType.toUpperCase()} />
                            <InfoItem label="Purpose" value={selectedCert.purpose} />
                          </div>
                        </section>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Contact Information
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem label="Phone Number" value={selectedCert.phone} />
                        <InfoItem label="Email Address" value={selectedCert.email} />
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t-2 border-[#1E3A8A]/10 space-y-4">
                      <label className="block text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest">
                        Administrative Notes / Instructions
                      </label>
                      <textarea
                        disabled={selectedCert.status !== 'pending'}
                        value={certComment}
                        onChange={(e) => setCertComment(e.target.value)}
                        className="w-full bg-[#F4F4F1] border-2 border-transparent focus:border-[#1E3A8A] px-4 py-3 outline-none font-bold text-sm text-[#1E3A8A] min-h-[100px] resize-none disabled:opacity-60"
                        placeholder="Add comments, pickup dates, rejection reasons..."
                      />
                      {selectedCert.status !== 'pending' && selectedCert.adminComment && (
                        <p className="text-xs text-[#B45309] font-bold italic">
                          Comment saved: "{selectedCert.adminComment}"
                        </p>
                      )}
                    </div>

                  </motion.div>
                ) : (
                  <div className="h-full bg-white border-4 border-dashed border-[#1E3A8A]/10 flex flex-col items-center justify-center p-20 text-center">
                    <div className="w-24 h-24 bg-[#1E3A8A]/5 rounded-sm flex items-center justify-center mb-6">
                      <Award className="w-10 h-10 text-[#1E3A8A]/20" />
                    </div>
                    <h3 className="text-2xl font-black text-[#1E3A8A]/30 uppercase tracking-tight italic">Select a certificate request to view</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Process character, transfer, and school reading certificates</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'students' ? (
            <motion.div 
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Top Stats and Search Bar */}
              <div className="bg-white border-4 border-[#1E3A8A] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">
                      Student Accounts Directory
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Total Registered Accounts: {allStudentProfiles.length} | Filtered: {filteredStudents.length}
                  </p>
                </div>

                {/* Search Bar */}
                <div className="w-full md:w-96 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name, email, phone, UID..."
                    className="w-full bg-[#F4F4F1] border-2 border-gray-200 focus:border-[#1E3A8A] pl-11 pr-8 py-3 text-xs font-bold text-[#1E3A8A] outline-none transition-all placeholder:text-gray-400"
                  />
                  {studentSearch && (
                    <button 
                      onClick={() => setStudentSearch('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Master-Detail Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Student List Column */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" /> Registered Users ({filteredStudents.length})
                    </h4>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[72vh] pr-2">
                    {filteredStudents.map((student) => {
                      const appCount = applications.filter(a => a.userId === student.uid).length;
                      const certCount = certRequests.filter(c => c.userId === student.uid).length;
                      const isSelected = selectedStudent?.uid === student.uid;

                      return (
                        <div
                          key={student.uid}
                          onClick={() => setSelectedStudent(student)}
                          className={`p-5 border-2 transition-all cursor-pointer relative ${
                            isSelected 
                              ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl translate-x-2' 
                              : 'bg-white border-gray-200 hover:border-[#1E3A8A]/40 text-[#1E3A8A]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-xs flex items-center justify-center font-black text-xs ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-[#1E3A8A]/10 text-[#1E3A8A]'
                              }`}>
                                {(student.displayName || student.email || 'S').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h5 className="font-black text-sm uppercase leading-tight truncate max-w-[170px]">
                                  {student.displayName || 'Unnamed Student'}
                                </h5>
                                <span className={`text-[10px] font-mono block truncate max-w-[170px] ${
                                  isSelected ? 'text-white/80' : 'text-gray-500'
                                }`}>
                                  {student.email || student.phone || 'No direct contact'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModalState({
                                  isOpen: true,
                                  student: {
                                    uid: student.uid,
                                    name: student.displayName,
                                    email: student.email,
                                    phone: student.phone,
                                    applicationCount: appCount,
                                    certificateCount: certCount
                                  }
                                });
                              }}
                              className={`p-2 rounded-xs border transition-colors cursor-pointer shrink-0 ${
                                isSelected
                                  ? 'border-red-400 bg-red-500/20 text-red-200 hover:bg-red-600 hover:text-white'
                                  : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                              }`}
                              title="Delete this student account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-current/10 text-[10px] font-bold">
                            <div className="flex gap-2">
                              <span className={`px-2 py-0.5 rounded-xs ${
                                isSelected ? 'bg-white/15 text-white' : 'bg-blue-50 text-[#1E3A8A]'
                              }`}>
                                {appCount} App{appCount !== 1 ? 's' : ''}
                              </span>
                              <span className={`px-2 py-0.5 rounded-xs ${
                                isSelected ? 'bg-white/15 text-white' : 'bg-amber-50 text-[#B45309]'
                              }`}>
                                {certCount} Cert{certCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <span className="opacity-60 font-mono text-[9px]">
                              UID: {student.uid.slice(-6)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredStudents.length === 0 && (
                      <div className="bg-white border-2 border-dashed border-[#1E3A8A]/20 p-12 text-center">
                        <Users className="w-12 h-12 text-[#1E3A8A]/20 mx-auto mb-4" />
                        <p className="text-[#1E3A8A]/40 font-bold uppercase tracking-widest text-xs">
                          No matching student accounts found
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Profile & Linked Records Column */}
                <div className="lg:col-span-2">
                  {selectedStudent ? (
                    <motion.div
                      key={selectedStudent.uid}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white border-4 border-[#1E3A8A] p-8 md:p-12 relative shadow-2xl space-y-8"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-gray-100">
                        <div>
                          <span className="text-[#B45309] font-black text-xs uppercase tracking-widest border-b-2 border-[#B45309] inline-block mb-3">
                            Student Account Dossier
                          </span>
                          <h2 className="text-3xl md:text-4xl font-black text-[#1E3A8A] uppercase tracking-tight">
                            {selectedStudent.displayName || 'Student Account'}
                          </h2>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            Full UID: {selectedStudent.uid}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            const appCount = applications.filter(a => a.userId === selectedStudent.uid).length;
                            const certCount = certRequests.filter(c => c.userId === selectedStudent.uid).length;
                            setDeleteModalState({
                              isOpen: true,
                              student: {
                                uid: selectedStudent.uid,
                                name: selectedStudent.displayName,
                                email: selectedStudent.email,
                                phone: selectedStudent.phone,
                                applicationCount: appCount,
                                certificateCount: certCount
                              }
                            });
                          }}
                          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Student Account
                        </button>
                      </div>

                      {/* Account Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#F4F4F1] p-6 border-2 border-gray-200">
                        <InfoItem label="Display / Student Name" value={selectedStudent.displayName || 'Not Set'} />
                        <InfoItem label="Email Address" value={selectedStudent.email || 'Not Provided'} />
                        <InfoItem label="Phone Contact" value={selectedStudent.phone || 'Not Provided'} />
                        <InfoItem 
                          label="Account Created" 
                          value={selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleString() : 'N/A'} 
                        />
                      </div>

                      {/* Linked Admission Applications */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#1E3A8A]" />
                          Linked Admission Applications ({applications.filter(a => a.userId === selectedStudent.uid).length})
                        </h4>

                        <div className="space-y-3">
                          {applications.filter(a => a.userId === selectedStudent.uid).map(app => (
                            <div 
                              key={app.id}
                              className="p-4 border-2 border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-black text-sm text-[#1E3A8A] uppercase">{app.studentName}</span>
                                  <span className="text-xs font-bold text-gray-500 font-mono">({app.gradeSelection})</span>
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono">
                                  App ID: {app.id.slice(-8).toUpperCase()} | Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xs border ${
                                  app.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                  app.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                  'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                  {app.status}
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setActiveTab('applications');
                                  }}
                                  className="text-xs font-black uppercase text-[#1E3A8A] hover:text-[#B45309] flex items-center gap-1 cursor-pointer"
                                >
                                  Inspect Form <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {applications.filter(a => a.userId === selectedStudent.uid).length === 0 && (
                            <p className="text-xs text-gray-400 italic p-4 bg-gray-50 border border-dashed border-gray-200">
                              No admission applications registered under this student UID.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Linked Certificate Requests */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-wider flex items-center gap-2">
                          <Award className="w-4 h-4 text-[#B45309]" />
                          Linked Certificate Requests ({certRequests.filter(c => c.userId === selectedStudent.uid).length})
                        </h4>

                        <div className="space-y-3">
                          {certRequests.filter(c => c.userId === selectedStudent.uid).map(cert => (
                            <div 
                              key={cert.id}
                              className="p-4 border-2 border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-black text-sm text-[#1E3A8A] uppercase">{cert.studentName}</span>
                                  <span className="text-xs font-bold text-gray-500">({cert.certificateType.toUpperCase()})</span>
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono">
                                  Req ID: {cert.id.slice(-8).toUpperCase()} | Purpose: {cert.purpose}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xs border ${
                                  cert.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                  cert.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                  'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                  {cert.status}
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedCert(cert);
                                    setCertComment(cert.adminComment || '');
                                    setActiveTab('certificates');
                                  }}
                                  className="text-xs font-black uppercase text-[#1E3A8A] hover:text-[#B45309] flex items-center gap-1 cursor-pointer"
                                >
                                  Inspect Request <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {certRequests.filter(c => c.userId === selectedStudent.uid).length === 0 && (
                            <p className="text-xs text-gray-400 italic p-4 bg-gray-50 border border-dashed border-gray-200">
                              No certificate requests registered under this student UID.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full bg-white border-4 border-dashed border-[#1E3A8A]/10 flex flex-col items-center justify-center p-20 text-center min-h-[400px]">
                      <div className="w-24 h-24 bg-[#1E3A8A]/5 rounded-sm flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-[#1E3A8A]/20" />
                      </div>
                      <h3 className="text-2xl font-black text-[#1E3A8A]/30 uppercase tracking-tight italic">
                        Select a student account to inspect
                      </h3>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                        View registered credentials, linked submissions, and manage deletion authority
                      </p>
                    </div>
                  )}
                </div>
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

      {/* Admin Photo & Document Inspection Modal */}
      <DocumentPhotoModal
        isOpen={photoPreview.isOpen}
        imageUrl={photoPreview.url}
        title={photoPreview.title}
        onClose={() => setPhotoPreview({ isOpen: false, url: '', title: '' })}
      />

      {/* Admin Student Account Deletion Confirmation Modal */}
      <DeleteStudentAccountModal
        isOpen={deleteModalState.isOpen}
        student={deleteModalState.student}
        isLoading={isDeletingStudent}
        onClose={() => setDeleteModalState({ isOpen: false, student: null })}
        onConfirm={handleDeleteStudentAccount}
      />
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
