import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { CheckCircle2, Send, Download, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';

export default function Admission() {
  const { user, loading: authLoading } = useAuth();
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormStatus('submitting');
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user found in Firebase Auth state. Please try signing in again.');
      }
      
      console.log('Submitting application for UID:', currentUser.uid);
      console.log('Form data being sent:', formData);
      
      const submissionData = {
        ...formData,
        userId: currentUser.uid,
        status: 'pending',
        submittedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'admissions'), submissionData);
      console.log('Application submitted successfully');
      setFormStatus('success');
    } catch (err: any) {
      console.error('CRITICAL SUBMISSION ERROR:', err);
      let msg = 'Failed to submit application. Please try again.';
      
      if (err.code === 'permission-denied') {
        msg = `FIREBASE PERMISSION ERROR: Your account (${currentUser?.email || currentUser?.phoneNumber}) does not have permission to write to the database. Please ensure Firestore is enabled in your Firebase console and rules are updated.`;
      } else if (err.message) {
        msg = `Submission failed: ${err.message}`;
      }
      
      setError(msg);
      setFormStatus('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
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

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-20">
        {/* Admission Info */}
        <div className="lg:col-span-4 space-y-12">
          {user && (
            <div className="p-6 bg-[#1E3A8A]/5 border-2 border-[#1E3A8A] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Signed in as</p>
                <p className="font-black text-[#1E3A8A] truncate max-w-[150px]">{user.displayName || user.email}</p>
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

          <div className="p-10 bg-white border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#1E3A8A]"></div>
            <h3 className="text-xl font-bold text-[#1E3A8A] mb-8 flex items-center gap-2">
              <Download className="w-5 h-5" /> Eligibility
            </h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center font-bold text-[#1E3A8A] text-xs">6</div>
                <div>
                  <h4 className="font-bold text-sm text-[#1E3A8A]">Grade 6</h4>
                  <p className="text-xs text-gray-500 mt-1">Completion of Grade 5 from a recognized board. (Boys only)</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center font-bold text-[#1E3A8A] text-xs">11</div>
                <div>
                  <h4 className="font-bold text-sm text-[#1E3A8A]">Grade 11</h4>
                  <p className="text-xs text-gray-500 mt-1">Completion of Grade 10 Board Exams. Minimum 75% for Science stream. (Co-ed)</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Document Checklist</h3>
            <div className="space-y-3">
              {[
                'Birth Certificate (Original & Copy)',
                'Previous Academic Records',
                'Transfer Certificate (Original) with PEN and APAAR ID',
                'Recent Passport Size Photos (6)',
                'Aadhaar / ID Proof',
                'Caste Certificate (If Any)',
                'Income Certificate'
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-4 text-xs font-bold text-[#1E3A8A] border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-[#B45309]" />
                  {doc}
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
            <div className="bg-white border-2 border-[#1E3A8A] p-8 md:p-12">
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
                <h3 className="text-3xl font-black text-[#1E3A8A]">ONLINE APPLICATION</h3>
                <div className="hidden md:flex border border-[#1E3A8A] px-4 py-2 text-[10px] font-bold text-[#1E3A8A] items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#B45309] rounded-full animate-pulse"></span> SYSTEM READY
                </div>
              </div>

              {formStatus === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-24 text-center max-w-sm mx-auto"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h4 className="text-2xl font-bold text-[#1E3A8A] mb-4">Application Submitted</h4>
                  <p className="text-gray-500 mb-8 font-medium italic">Reference ID: AHSS-2024-{(Math.random() * 10000).toFixed(0)}</p>
                  <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                    Our admissions office will review your application and contact you via email within 5 working days.
                  </p>
                  <button 
                    onClick={() => setFormStatus('idle')}
                    className="bg-[#1E3A8A] text-white px-8 py-4 font-bold tracking-wide hover:bg-[#B45309] transition-all"
                  >
                    SUBMIT ANOTHER
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Full Name</label>
                      <input 
                        required 
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Father's Name</label>
                      <input 
                        required 
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mother's Name</label>
                      <input 
                        required 
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grade Selection</label>
                      <select 
                        required 
                        name="gradeSelection"
                        value={formData.gradeSelection}
                        onChange={handleInputChange}
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all appearance-none cursor-pointer"
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
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                      <input 
                        required 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        type="email" 
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
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
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</label>
                      <select 
                        required 
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
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
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
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
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
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
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
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
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all appearance-none cursor-pointer"
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
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
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
                        className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
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
                      className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all" 
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
                      className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all resize-none"
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
                      className="w-full bg-[#F4F4F1] border-b-2 border-transparent focus:border-[#1E3A8A] px-4 py-4 outline-none font-bold text-[#1E3A8A] transition-all resize-none"
                    ></textarea>
                  </div>

                  {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold max-w-md uppercase">
                       <CheckCircle2 className="shrink-0 w-5 h-5 text-[#B45309]" />
                       I agree to the admission privacy policy and academic terms of the institution.
                    </div>
                    <button 
                      disabled={formStatus === 'submitting'}
                      type="submit" 
                      className="w-full md:w-auto bg-[#1E3A8A] text-white px-12 py-5 font-bold tracking-[0.2em] hover:bg-[#B45309] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {formStatus === 'submitting' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          TRANSMITTING...
                        </>
                      ) : (
                        <>
                          INITIALIZE APPLICATION
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
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
