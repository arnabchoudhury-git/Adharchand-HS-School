import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Send, 
  Download, 
  Loader2, 
  LogOut, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  UploadCloud, 
  Image as ImageIcon, 
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import DocumentUploadCard from '../components/DocumentUploadCard';
import DocumentPhotoModal from '../components/DocumentPhotoModal';
import { UploadedDocument } from '../lib/image-utils';

export default function Admission() {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [admissionsOpen, setAdmissionsOpen] = useState<boolean | null>(null);

  // Document Photo Viewer Modal
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    title: string;
    photoUrl: string;
    fileName?: string;
  }>({
    isOpen: false,
    title: '',
    photoUrl: '',
    fileName: ''
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

  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    gradeSelection: '',
    gender: '',
    dob: '',
    email: '',
    phone: '',
    aadhaarNumber: '',
    penNumber: '',
    apaarNumber: '',
    caste: '',
    religion: '',
    currentAddress: '',
    permanentAddress: '',
    previousSchool: '',
    leavingCause: ''
  });

  // State for all 7 required/specified document photos
  const [documents, setDocuments] = useState<{
    birthCertificate: UploadedDocument | null;
    marksheet: UploadedDocument | null;
    transferCertificate: UploadedDocument | null;
    passportPhoto: UploadedDocument | null;
    aadhaarCard: UploadedDocument | null;
    casteCertificate: UploadedDocument | null;
    incomeCertificate: UploadedDocument | null;
  }>({
    birthCertificate: null,
    marksheet: null,
    transferCertificate: null,
    passportPhoto: null,
    aadhaarCard: null,
    casteCertificate: null,
    incomeCertificate: null
  });

  // Auto-fill user email/phone when logged in
  useEffect(() => {
    if (user) {
      if (user.email && !formData.email) {
        setFormData(prev => ({ ...prev, email: user.email || '' }));
      }
      if (user.phoneNumber && !formData.phone) {
        setFormData(prev => ({ ...prev, phone: user.phoneNumber || '' }));
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === 'studentName' || name === 'fatherName' || name === 'motherName') {
      value = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocChange = (field: keyof typeof documents) => (doc: UploadedDocument | null) => {
    setDocuments(prev => ({ ...prev, [field]: doc }));
  };

  const openPhotoPreview = (doc: UploadedDocument, title: string) => {
    setModalData({
      isOpen: true,
      title,
      photoUrl: doc.dataUrl,
      fileName: doc.fileName
    });
  };

  const validateStep1 = () => {
    if (!formData.studentName.trim()) return 'Student Full Name is required.';
    if (!formData.fatherName.trim()) return "Father's Name is required.";
    if (!formData.motherName.trim()) return "Mother's Name is required.";
    if (!formData.gradeSelection) return 'Please select a Grade.';
    if (!formData.dob) return 'Date of Birth is required.';
    if (!formData.email.trim()) return 'Email Address is required.';
    if (!formData.phone.trim()) return 'Phone Number is required.';
    if (!formData.gender) return 'Please select gender.';
    if (!formData.aadhaarNumber.trim()) return 'Aadhaar Number is required.';
    if (!formData.caste) return 'Please select Caste category.';
    if (!formData.religion.trim()) return 'Religion is required.';
    if (!formData.currentAddress.trim()) return 'Current Address is required.';
    if (!formData.permanentAddress.trim()) return 'Permanent Address is required.';
    return null;
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateStep1();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    setError('');
    setCurrentStep(2);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Optional validation for essential document photos
    if (!documents.passportPhoto) {
      setError('Please upload a Recent Passport Size Photo of the student.');
      return;
    }
    if (!documents.birthCertificate) {
      setError('Please upload the Original Birth Certificate photo.');
      return;
    }

    setFormStatus('submitting');
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user found in Firebase Auth state. Please try signing in again.');
      }
      
      const submissionData = {
        ...formData,
        userId: currentUser.uid,
        status: 'pending',
        submittedAt: serverTimestamp(),
        // Store compressed document photo payloads for admin inspection
        documents: {
          birthCertificatePhoto: documents.birthCertificate ? {
            dataUrl: documents.birthCertificate.dataUrl,
            fileName: documents.birthCertificate.fileName,
            fileSizeKb: documents.birthCertificate.fileSizeKb,
            uploadedAt: documents.birthCertificate.uploadedAt
          } : null,
          marksheetPhoto: documents.marksheet ? {
            dataUrl: documents.marksheet.dataUrl,
            fileName: documents.marksheet.fileName,
            fileSizeKb: documents.marksheet.fileSizeKb,
            uploadedAt: documents.marksheet.uploadedAt
          } : null,
          transferCertificatePhoto: documents.transferCertificate ? {
            dataUrl: documents.transferCertificate.dataUrl,
            fileName: documents.transferCertificate.fileName,
            fileSizeKb: documents.transferCertificate.fileSizeKb,
            uploadedAt: documents.transferCertificate.uploadedAt
          } : null,
          passportPhoto: documents.passportPhoto ? {
            dataUrl: documents.passportPhoto.dataUrl,
            fileName: documents.passportPhoto.fileName,
            fileSizeKb: documents.passportPhoto.fileSizeKb,
            uploadedAt: documents.passportPhoto.uploadedAt
          } : null,
          aadhaarCardPhoto: documents.aadhaarCard ? {
            dataUrl: documents.aadhaarCard.dataUrl,
            fileName: documents.aadhaarCard.fileName,
            fileSizeKb: documents.aadhaarCard.fileSizeKb,
            uploadedAt: documents.aadhaarCard.uploadedAt
          } : null,
          casteCertificatePhoto: documents.casteCertificate ? {
            dataUrl: documents.casteCertificate.dataUrl,
            fileName: documents.casteCertificate.fileName,
            fileSizeKb: documents.casteCertificate.fileSizeKb,
            uploadedAt: documents.casteCertificate.uploadedAt
          } : null,
          incomeCertificatePhoto: documents.incomeCertificate ? {
            dataUrl: documents.incomeCertificate.dataUrl,
            fileName: documents.incomeCertificate.fileName,
            fileSizeKb: documents.incomeCertificate.fileSizeKb,
            uploadedAt: documents.incomeCertificate.uploadedAt
          } : null,
        },
        // Quick top-level avatar shortcut for admin queue
        passportPhotoUrl: documents.passportPhoto?.dataUrl || null
      };
      
      await addDoc(collection(db, 'admissions'), submissionData);
      setFormStatus('success');
    } catch (err: any) {
      console.error('CRITICAL SUBMISSION ERROR:', err);
      let msg = 'Failed to submit application. Please try again.';
      
      if (err.code === 'permission-denied') {
        msg = `FIREBASE PERMISSION ERROR: Your account (${auth.currentUser?.email || auth.currentUser?.phoneNumber || 'unknown'}) does not have permission to write to the database.`;
      } else if (err.message) {
        msg = `Submission failed: ${err.message}`;
      }
      
      setError(msg);
      setFormStatus('error');
      handleFirestoreError(err, OperationType.CREATE, 'admissions');
    }
  };

  const uploadedDocCount = Object.values(documents).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* Document Photo Viewer Modal */}
      <DocumentPhotoModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
        title={modalData.title}
        photoUrl={modalData.photoUrl}
        fileName={modalData.fileName}
      />

      <section className="bg-white border-b-2 border-[#1E3A8A] pt-12 pb-10 px-6 md:px-12 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#B45309] font-bold text-[10px] uppercase tracking-widest mb-2">Registration Gateway</p>
          <h2 className="text-3xl md:text-5xl font-black text-[#1E3A8A] tracking-tighter mb-4 italic">STEP INTO EXCELLENCE.</h2>
          <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
            {admissionsOpen === false 
              ? 'Admission for the academic session 2024-25 is currently closed. Please contact the administrative office for separate inquiries.'
              : 'Admission for the upcoming academic session 2024-25 is now open for Grade 6 and Grade 11 (Science, Commerce, Arts).'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
        {/* Admission Info & Checklist Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {user && (
            <div className="p-6 bg-[#1E3A8A]/5 border-2 border-[#1E3A8A] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Signed in as</p>
                <p className="font-black text-[#1E3A8A] truncate max-w-[170px]">{user.displayName || user.email}</p>
              </div>
              <button 
                onClick={() => auth.signOut()}
                className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Application Progress tracker */}
          <div className="bg-white border-2 border-[#1E3A8A] p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-[#1E3A8A] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B45309]" />
              APPLICATION WORKFLOW
            </h4>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`w-full text-left p-3 border transition-all flex items-center justify-between ${
                  currentStep === 1 
                    ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white font-black' 
                    : 'border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    currentStep === 1 ? 'bg-white text-[#1E3A8A]' : 'bg-[#1E3A8A] text-white'
                  }`}>
                    1
                  </span>
                  <span>Applicant Information</span>
                </div>
                {formData.studentName && <Check className="w-4 h-4 text-green-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateStep1() === null) {
                    setCurrentStep(2);
                  } else {
                    setError('Please complete Step 1 information first.');
                  }
                }}
                className={`w-full text-left p-3 border transition-all flex items-center justify-between ${
                  currentStep === 2 
                    ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white font-black' 
                    : 'border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    currentStep === 2 ? 'bg-white text-[#1E3A8A]' : 'bg-[#1E3A8A] text-white'
                  }`}>
                    2
                  </span>
                  <span>Photo & Document Uploads</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">
                  {uploadedDocCount}/7
                </span>
              </button>
            </div>
          </div>

          <div className="p-8 bg-white border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#1E3A8A]"></div>
            <h3 className="text-xl font-bold text-[#1E3A8A] mb-6 flex items-center gap-2">
              <Download className="w-5 h-5" /> Eligibility
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center font-bold text-[#1E3A8A] text-xs">6</div>
                <div>
                  <h4 className="font-bold text-xs text-[#1E3A8A]">Grade 6</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Completion of Grade 5 from recognized board. (Boys only)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center font-bold text-[#1E3A8A] text-xs">11</div>
                <div>
                  <h4 className="font-bold text-xs text-[#1E3A8A]">Grade 11</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Grade 10 Board Passed. Min 75% for Science stream. (Co-ed)</p>
                </div>
              </li>
            </ul>
          </div>

          {/* 7 Required Document Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Required Documents</h3>
              <span className="text-[10px] font-mono text-[#B45309] font-bold">7 ITEMS TOTAL</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Birth Certificate Original', uploaded: !!documents.birthCertificate },
                { label: 'Last Class Marksheet / Progress Report', uploaded: !!documents.marksheet },
                { label: 'Transfer Certificate with PEN & APAAR ID', uploaded: !!documents.transferCertificate },
                { label: 'Recent Passport Size Photo', uploaded: !!documents.passportPhoto },
                { label: 'Aadhaar Card', uploaded: !!documents.aadhaarCard },
                { label: 'Caste Certificate (If Any)', uploaded: !!documents.casteCertificate },
                { label: 'Income Certificate', uploaded: !!documents.incomeCertificate }
              ].map((doc, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3.5 text-xs font-bold border transition-colors ${
                    doc.uploaded 
                      ? 'bg-green-50/60 border-green-300 text-green-900' 
                      : 'bg-white border-gray-100 text-[#1E3A8A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {doc.uploaded ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[9px] font-mono text-gray-400 shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{doc.label}</span>
                  </div>
                  {doc.uploaded && (
                    <span className="text-[9px] font-black text-green-700 uppercase">Ready</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Online Form Area */}
        <div className="lg:col-span-8">
          {admissionsOpen === null || authLoading ? (
            <div className="bg-white border-2 border-[#1E3A8A] p-24 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-[#1E3A8A]" />
              <p className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Verifying Connection...</p>
            </div>
          ) : admissionsOpen === false ? (
            <div className="bg-white border-4 border-red-600 p-8 md:p-16 text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rotate-45 translate-x-16 -translate-y-16"></div>
              
              <div className="w-24 h-24 bg-red-50 text-red-600 border border-red-200 rounded-sm flex items-center justify-center mx-auto shadow-md">
                <Send className="w-10 h-10 rotate-45 opacity-50" />
              </div>

              <div className="space-y-4 max-w-lg mx-auto">
                <span className="text-[10px] font-black tracking-[0.2em] text-[#B45309] uppercase">PORTAL SUSPENDED</span>
                <h3 className="text-3xl md:text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase italic leading-none">REGISTRATIONS ARE CLOSED</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Adharchand Higher Secondary School has officially closed the online registration gateway for the academic session 2024-25. Applications are no longer being received under any stream at this moment. For special considerations, please contact the administrative desk.
                </p>
              </div>

              <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-center items-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                <div>SCHOOL ID: 18230200806</div>
                <div className="hidden md:block select-none">•</div>
                <div>ESTD: 1940 (SILCHAR)</div>
              </div>
            </div>
          ) : !user ? (
            <div className="space-y-8">
              <div className="bg-[#1E3A8A] text-white p-6 md:p-10">
                <h3 className="text-2xl font-black mb-2 uppercase">Authentication Required</h3>
                <p className="text-sm font-medium opacity-80">To ensure security and keep track of your application development, please sign in or create an account before filling out the form.</p>
              </div>
              <AuthForm />
            </div>
          ) : (
            <div className="bg-white border-2 border-[#1E3A8A] p-6 md:p-12 shadow-sm">
              {/* Header with Step Indicator */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-widest">
                    CONTINUOUS APPLICATION • PAGE {currentStep} OF 2
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-[#1E3A8A] uppercase">
                    {currentStep === 1 ? '1. Student & Academic Details' : '2. Photo & Document Uploads'}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold ${
                    currentStep === 1 ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Page 1: Bio Data
                  </span>
                  <span className="text-gray-300">→</span>
                  <span className={`px-3 py-1 text-xs font-bold ${
                    currentStep === 2 ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Page 2: Documents ({uploadedDocCount}/7)
                  </span>
                </div>
              </div>

              {formStatus === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center max-w-lg mx-auto space-y-6"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-green-700 bg-green-50 border border-green-200 px-3 py-1 uppercase tracking-widest">
                      TRANSMISSION SUCCESSFUL
                    </span>
                    <h4 className="text-3xl font-black text-[#1E3A8A] uppercase">Application & Documents Submitted</h4>
                    <p className="text-gray-500 font-medium font-mono text-sm">
                      Candidate: <strong className="text-[#1E3A8A]">{formData.studentName}</strong> • Grade: <strong className="text-[#1E3A8A]">{formData.gradeSelection}</strong>
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 border-2 border-dashed border-gray-200 text-left space-y-3">
                    <p className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Submitted Document Attachments ({uploadedDocCount}):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                      {documents.birthCertificate && <div>✓ Birth Certificate Original</div>}
                      {documents.marksheet && <div>✓ Academic Marksheet</div>}
                      {documents.transferCertificate && <div>✓ Transfer Certificate (TC)</div>}
                      {documents.passportPhoto && <div>✓ Passport Size Photo</div>}
                      {documents.aadhaarCard && <div>✓ Aadhaar Card</div>}
                      {documents.casteCertificate && <div>✓ Caste Certificate</div>}
                      {documents.incomeCertificate && <div>✓ Income Certificate</div>}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    Our administrative admissions desk will verify your uploaded documents and personal credentials. You will receive an official SMS and email update regarding admission approval.
                  </p>

                  <button 
                    onClick={() => {
                      setFormStatus('idle');
                      setCurrentStep(1);
                      setFormData({
                        studentName: '',
                        fatherName: '',
                        motherName: '',
                        gradeSelection: '',
                        gender: '',
                        dob: '',
                        email: '',
                        phone: '',
                        aadhaarNumber: '',
                        penNumber: '',
                        apaarNumber: '',
                        caste: '',
                        religion: '',
                        currentAddress: '',
                        permanentAddress: '',
                        previousSchool: '',
                        leavingCause: ''
                      });
                      setDocuments({
                        birthCertificate: null,
                        marksheet: null,
                        transferCertificate: null,
                        passportPhoto: null,
                        aadhaarCard: null,
                        casteCertificate: null,
                        incomeCertificate: null
                      });
                    }}
                    className="bg-[#1E3A8A] text-white px-8 py-4 font-bold tracking-wide hover:bg-[#B45309] transition-all cursor-pointer"
                  >
                    SUBMIT ANOTHER APPLICATION
                  </button>
                </motion.div>
              ) : currentStep === 1 ? (
                /* PAGE 1: STUDENT AND ACADEMIC DETAILS */
                <form onSubmit={handleProceedToStep2} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        <span>Student Full Name</span>
                        <span className="text-[9px] text-[#B45309] font-medium font-mono">AUTO CAPITALIZED</span>
                      </label>
                      <input 
                        required 
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="ENTER FULL NAME IN CAPITAL LETTERS"
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] uppercase transition-all placeholder:normal-case placeholder:text-gray-400 placeholder:font-normal text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        <span>Father's Name</span>
                        <span className="text-[9px] text-[#B45309] font-medium font-mono">AUTO CAPITALIZED</span>
                      </label>
                      <input 
                        required 
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="ENTER FATHER'S NAME IN CAPITAL LETTERS"
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] uppercase transition-all placeholder:normal-case placeholder:text-gray-400 placeholder:font-normal text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        <span>Mother's Name</span>
                        <span className="text-[9px] text-[#B45309] font-medium font-mono">AUTO CAPITALIZED</span>
                      </label>
                      <input 
                        required 
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="ENTER MOTHER'S NAME IN CAPITAL LETTERS"
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] uppercase transition-all placeholder:normal-case placeholder:text-gray-400 placeholder:font-normal text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grade Selection</label>
                      <select 
                        required 
                        name="gradeSelection"
                        value={formData.gradeSelection}
                        onChange={handleInputChange}
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all appearance-none cursor-pointer text-sm"
                      >
                        <option value="">Select Grade</option>
                        <option value="6">Grade 6 (Boys)</option>
                        <option value="7">Grade 7 (Boys)</option>
                        <option value="8">Grade 8 (Boys)</option>
                        <option value="9">Grade 9 (Boys)</option>
                        <option value="10">Grade 10 (Boys)</option>
                        <option value="11-SCI">Grade 11 - Science</option>
                        <option value="11-COM">Grade 11 - Commerce</option>
                        <option value="11-ART">Grade 11 - Arts</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</label>
                      <input 
                        required 
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        type="date" 
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</label>
                      <select 
                        required 
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all appearance-none cursor-pointer text-sm"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                      <input 
                        required 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        type="email" 
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                      <input 
                        required 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        type="tel" 
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                      />
                    </div>

                    {/* Government Identifiers */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aadhaar Number</label>
                      <input 
                        required 
                        name="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="12-digit UID"
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PEN Number</label>
                      <input 
                        name="penNumber"
                        value={formData.penNumber}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="Permanent Education Number"
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">APAAR Number</label>
                      <input 
                        name="apaarNumber"
                        value={formData.apaarNumber}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="One Nation One Student ID"
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                      />
                    </div>

                    {/* Category & Faith */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Caste Category</label>
                      <select 
                        required 
                        name="caste"
                        value={formData.caste}
                        onChange={handleInputChange}
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all appearance-none cursor-pointer text-sm"
                      >
                        <option value="">Select Category</option>
                        <option value="UR">UR (General)</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Religion</label>
                      <input 
                        required 
                        name="religion"
                        value={formData.religion}
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                      />
                    </div>

                    {/* Previous Schooling */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Previous School Name</label>
                      <input 
                        name="previousSchool"
                        value={formData.previousSchool}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="School previously attended"
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cause of leaving previous school</label>
                    <input 
                      name="leavingCause"
                      value={formData.leavingCause}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="e.g. Higher studies / Promotion / Relocation"
                      className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all text-sm" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Address</label>
                    <textarea 
                      required
                      name="currentAddress"
                      value={formData.currentAddress}
                      onChange={handleInputChange}
                      rows={2} 
                      className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all resize-none text-sm"
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Permanent Address</label>
                    <textarea 
                      required
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      rows={2} 
                      className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-3.5 outline-none font-bold text-[#1E3A8A] transition-all resize-none text-sm"
                    ></textarea>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100">
                    <div className="text-[11px] text-gray-500 font-medium">
                      All details will carry forward to the Document & Photo Upload page.
                    </div>

                    <button 
                      type="submit" 
                      className="w-full sm:w-auto bg-[#1E3A8A] text-white px-10 py-4 font-black tracking-widest hover:bg-[#B45309] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg uppercase text-xs"
                    >
                      PROCEED TO DOCUMENT UPLOADS (PAGE 2)
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                /* PAGE 2: CONTINUOUS DOCUMENT & PHOTO UPLOAD PORTAL */
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="bg-[#1E3A8A]/5 border-2 border-[#1E3A8A] p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[#1E3A8A]">
                      <UploadCloud className="w-5 h-5 text-[#B45309]" />
                      <h4 className="font-black text-sm uppercase tracking-wide">
                        DOCUMENT VERIFICATION UPLOADS
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Please upload crisp, clear photos or scanned copies of the required documents for <strong>{formData.studentName || 'the applicant'}</strong>. You can drag and drop images or select photos taken via phone camera or scanner.
                    </p>
                  </div>

                  {/* 7 Upload Document Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Birth Certificate Original */}
                    <DocumentUploadCard
                      id="birth-cert"
                      title="1. Birth Certificate Original"
                      subtitle="Upload clear photo/scan of the original Birth Certificate issued by municipal/govt authority."
                      required={true}
                      docValue={documents.birthCertificate}
                      onChange={handleDocChange('birthCertificate')}
                      onPreviewModal={openPhotoPreview}
                    />

                    {/* 2. Last class Academic marksheet/Progress report */}
                    <DocumentUploadCard
                      id="marksheet"
                      title="2. Academic Marksheet / Progress Report"
                      subtitle="Photo/scan of the latest passed class progress report or board marksheet."
                      required={true}
                      docValue={documents.marksheet}
                      onChange={handleDocChange('marksheet')}
                      onPreviewModal={openPhotoPreview}
                    />

                    {/* 3. Transfer Certificate (Original) with PEN and APAAR ID */}
                    <DocumentUploadCard
                      id="tc"
                      title="3. Transfer Certificate (Original)"
                      subtitle="Original TC from previous school mentioning PEN and APAAR ID numbers."
                      required={true}
                      docValue={documents.transferCertificate}
                      onChange={handleDocChange('transferCertificate')}
                      onPreviewModal={openPhotoPreview}
                    />

                    {/* 4. Recent Passport Size Photo */}
                    <DocumentUploadCard
                      id="passport-photo"
                      title="4. Recent Passport Size Photo"
                      subtitle="Clear colored portrait photo of the student with white/light background."
                      required={true}
                      isPassportPhoto={true}
                      docValue={documents.passportPhoto}
                      onChange={handleDocChange('passportPhoto')}
                      onPreviewModal={openPhotoPreview}
                    />

                    {/* 5. Aadhaar card */}
                    <DocumentUploadCard
                      id="aadhaar-card"
                      title="5. Aadhaar Card"
                      subtitle="Clear photo of the student's 12-digit Aadhaar Card (Front/Back)."
                      required={true}
                      docValue={documents.aadhaarCard}
                      onChange={handleDocChange('aadhaarCard')}
                      onPreviewModal={openPhotoPreview}
                    />

                    {/* 6. Caste Certificate (If Any) */}
                    <DocumentUploadCard
                      id="caste-cert"
                      title="6. Caste Certificate (If Any)"
                      subtitle="Official SC / ST / OBC caste certificate issued by competent authority (if applicable)."
                      required={formData.caste !== 'UR' && formData.caste !== ''}
                      docValue={documents.casteCertificate}
                      onChange={handleDocChange('casteCertificate')}
                      onPreviewModal={openPhotoPreview}
                    />

                    {/* 7. Income Certificate */}
                    <div className="md:col-span-2">
                      <DocumentUploadCard
                        id="income-cert"
                        title="7. Income Certificate"
                        subtitle="Annual family income certificate issued by Circle Officer / Revenue Authority for fee concessions and scholarships."
                        required={false}
                        docValue={documents.incomeCertificate}
                        onChange={handleDocChange('incomeCertificate')}
                        onPreviewModal={openPhotoPreview}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Bottom Navigation & Submission Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setCurrentStep(1);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-6 py-4 border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Page 1 (Personal Info)
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        disabled={formStatus === 'submitting'}
                        type="submit"
                        className="w-full sm:w-auto bg-[#1E3A8A] text-white px-10 py-4 font-black tracking-widest hover:bg-[#B45309] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xl uppercase text-xs"
                      >
                        {formStatus === 'submitting' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            TRANSMITTING APPLICATION...
                          </>
                        ) : (
                          <>
                            SUBMIT APPLICATION & PHOTOS
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

