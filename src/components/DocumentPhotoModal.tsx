import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface DocumentPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  photoUrl: string;
  fileName?: string;
}

export default function DocumentPhotoModal({
  isOpen,
  onClose,
  title,
  photoUrl,
  fileName
}: DocumentPhotoModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !photoUrl) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = fileName || `${title.replace(/\s+/g, '_').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-between p-4 md:p-8 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white/10 p-4 text-white border border-white/20 backdrop-blur-md rounded-t-sm">
        <div>
          <h3 className="font-black text-sm uppercase tracking-wider">{title}</h3>
          {fileName && <p className="text-[10px] text-white/70 font-mono">{fileName}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Controls */}
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
            title="Rotate 90deg"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors ml-2"
            title="Close Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Preview Canvas Area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4 relative">
        <div 
          className="transition-transform duration-200 ease-out origin-center max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={photoUrl}
            alt={title}
            className="max-h-[75vh] max-w-[85vw] object-contain shadow-2xl border-2 border-white/20"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-white/60 font-mono py-2">
        Adharchand Higher Secondary School • Document Verification Portal
      </div>
    </div>
  );
}
