import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  AlertTriangle, 
  UserX, 
  X, 
  Loader2, 
  ShieldAlert, 
  FileText, 
  Award,
  CheckSquare,
  Square
} from 'lucide-react';

export interface StudentDeleteTarget {
  uid: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  applicationCount?: number;
  certificateCount?: number;
}

interface DeleteStudentAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDeleteTarget | null;
  onConfirmDelete: (uid: string, deleteLinkedRecords: boolean) => Promise<void>;
  isDeleting: boolean;
}

export default function DeleteStudentAccountModal({
  isOpen,
  onClose,
  student,
  onConfirmDelete,
  isDeleting
}: DeleteStudentAccountModalProps) {
  const [deleteLinkedRecords, setDeleteLinkedRecords] = useState(true);
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen || !student) return null;

  const displayName = student.name || student.email || student.phone || 'Student User';
  const confirmationRequired = true;
  const isMatch = confirmInput.trim().toUpperCase() === 'DELETE';

  const handleConfirm = async () => {
    if (!isMatch) return;
    await onConfirmDelete(student.uid, deleteLinkedRecords);
    setConfirmInput('');
    onClose();
  };

  const handleModalClose = () => {
    if (isDeleting) return;
    setConfirmInput('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white border-4 border-red-600 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div className="bg-red-600 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-sm">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold tracking-widest text-red-200 uppercase">
                  Admin Authority Action
                </p>
                <h3 className="text-xl font-black tracking-tight uppercase">
                  Delete Student Account
                </h3>
              </div>
            </div>

            <button
              disabled={isDeleting}
              onClick={handleModalClose}
              className="p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Warning Alert */}
            <div className="p-4 bg-red-50 border-2 border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-red-900">
                <p className="font-black uppercase tracking-wide">Permanent Deletion Warning</p>
                <p className="leading-relaxed font-medium">
                  This action permanently removes the student account profile and revocation from Adharchand Higher Secondary School systems. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Target Account Summary */}
            <div className="bg-gray-50 border-2 border-gray-200 p-4 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">
                Account Target Identification
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
                  <UserX className="w-5 h-5 text-red-700" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-[#1E3A8A] uppercase truncate">
                    {displayName}
                  </h4>
                  <p className="text-xs text-gray-600 truncate font-mono">
                    {student.email || student.phone || 'No direct contact stored'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                    UID: {student.uid}
                  </p>
                </div>
              </div>

              {(student.applicationCount !== undefined || student.certificateCount !== undefined) && (
                <div className="pt-3 mt-3 border-t border-gray-200 flex gap-4 text-xs font-bold text-gray-700">
                  {student.applicationCount !== undefined && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span>{student.applicationCount} Admission Form(s)</span>
                    </span>
                  )}
                  {student.certificateCount !== undefined && (
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#B45309]" />
                      <span>{student.certificateCount} Certificate Request(s)</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Linked Data Cleanup Option */}
            <div 
              onClick={() => !isDeleting && setDeleteLinkedRecords(!deleteLinkedRecords)}
              className="p-3 border-2 border-gray-200 hover:border-[#1E3A8A] cursor-pointer flex items-start gap-3 bg-white transition-colors"
            >
              <div className="mt-0.5 text-red-600">
                {deleteLinkedRecords ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="text-xs space-y-0.5 select-none">
                <p className="font-black text-gray-900 uppercase">
                  Also purge all linked admission applications & certificate records
                </p>
                <p className="text-gray-500 text-[11px]">
                  Ensures all submitted files, photo verification cards, and requests linked to this student ID are completely wiped from database storage.
                </p>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-800">
                Type <span className="text-red-600 font-mono underline font-extrabold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                disabled={isDeleting}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-300 focus:border-red-600 focus:bg-white text-sm font-black uppercase tracking-wider outline-none text-red-700 transition-all font-mono"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="bg-gray-100 p-4 px-6 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleModalClose}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-700 border-2 border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting || !isMatch}
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting Account...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete Student</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
