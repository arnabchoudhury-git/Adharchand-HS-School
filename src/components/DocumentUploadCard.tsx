import React, { useState, useRef } from 'react';
import { Upload, X, Eye, CheckCircle2, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { compressAndConvertImage, UploadedDocument } from '../lib/image-utils';

interface DocumentUploadCardProps {
  id: string;
  title: string;
  subtitle?: string;
  required?: boolean;
  docValue?: UploadedDocument | null;
  onChange: (doc: UploadedDocument | null) => void;
  onPreviewModal?: (doc: UploadedDocument, title: string) => void;
  isPassportPhoto?: boolean;
}

export default function DocumentUploadCard({
  id,
  title,
  subtitle,
  required = false,
  docValue,
  onChange,
  onPreviewModal,
  isPassportPhoto = false
}: DocumentUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // If passport photo, resize to a tighter aspect ratio (e.g. 600x750)
      const maxWidth = isPassportPhoto ? 600 : 1200;
      const maxHeight = isPassportPhoto ? 750 : 1200;
      const quality = isPassportPhoto ? 0.85 : 0.78;

      const result = await compressAndConvertImage(file, maxWidth, maxHeight, quality);
      onChange(result);
    } catch (err: any) {
      console.error('File compression error:', err);
      setErrorMessage(err.message || 'Failed to process photo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div 
      id={`doc-card-${id}`}
      className={`border-2 transition-all p-5 relative bg-white ${
        docValue 
          ? 'border-green-600 bg-green-50/20' 
          : isDragging 
            ? 'border-[#1E3A8A] bg-blue-50/40 ring-2 ring-[#1E3A8A]' 
            : 'border-gray-200 hover:border-[#1E3A8A]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-sm text-[#1E3A8A] uppercase tracking-tight">
              {title}
            </h4>
            {required ? (
              <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 uppercase tracking-widest">
                Required *
              </span>
            ) : (
              <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 uppercase tracking-widest">
                If Applicable
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>

        {docValue && (
          <div className="flex items-center gap-1 text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Uploaded
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileInput}
        className="hidden"
        id={`input-file-${id}`}
      />

      {isProcessing ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-2 bg-gray-50 border border-dashed border-gray-300">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
          <p className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Optimizing & Processing Photo...</p>
        </div>
      ) : docValue ? (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 border border-gray-200">
          {/* Thumbnail preview */}
          <div 
            className={`relative group shrink-0 overflow-hidden bg-gray-100 border border-gray-300 cursor-pointer ${
              isPassportPhoto ? 'w-24 h-32' : 'w-28 h-20'
            }`}
            onClick={() => onPreviewModal && onPreviewModal(docValue, title)}
          >
            <img 
              src={docValue.dataUrl} 
              alt={title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-[#1E3A8A]/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <Eye className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">Inspect</span>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0 space-y-1 w-full sm:w-auto text-center sm:text-left">
            <p className="text-xs font-bold text-[#1E3A8A] truncate uppercase">
              {docValue.fileName}
            </p>
            <p className="text-[10px] text-gray-500 font-mono">
              Size: ~{docValue.fileSizeKb} KB • Ready for submission
            </p>
            
            <div className="flex items-center gap-2 pt-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => onPreviewModal && onPreviewModal(docValue, title)}
                className="px-2.5 py-1 text-[10px] font-bold text-[#1E3A8A] bg-[#1E3A8A]/10 hover:bg-[#1E3A8A]/20 transition-colors flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> View Photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-[10px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Replace
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-[#1E3A8A] p-6 text-center cursor-pointer transition-colors bg-gray-50/50 group"
        >
          <div className="w-10 h-10 bg-white group-hover:bg-[#1E3A8A] border border-gray-200 group-hover:border-[#1E3A8A] text-gray-400 group-hover:text-white rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
            {isPassportPhoto ? (
              <ImageIcon className="w-5 h-5" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>
          <p className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wide">
            Click to upload or drag & drop photo
          </p>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            Supports JPEG, PNG, WebP (Scanned / Camera photo)
          </p>
        </div>
      )}

      {errorMessage && (
        <p className="text-red-600 text-[10px] font-bold mt-2 bg-red-50 p-2 border border-red-200">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
