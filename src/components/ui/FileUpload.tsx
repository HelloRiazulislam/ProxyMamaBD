import { useState, useRef } from 'react';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, X, Check, Loader2, FileImage } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  folder?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
}

export default function FileUpload({ onUploadComplete, maxFiles = 5, folder = 'uploads' }: FileUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newUploads = files.slice(0, maxFiles - uploads.length).map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach((upload, index) => {
      startUpload(upload.file, uploads.length + index);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startUpload = async (file: File, index: number) => {
    console.log('Starting upload for:', file.name);
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      console.log('Upload completed');
      setUploads(prev => {
        const next = [...prev];
        if (next[index]) {
          next[index].status = 'completed';
          next[index].url = url;
          next[index].progress = 100;
        }
        
        // Check if all uploads are complete
        const completedUrls = next
          .filter(u => u.status === 'completed')
          .map(u => u.url as string);
        
        if (completedUrls.length > 0) {
          onUploadComplete(completedUrls);
        }
        
        return next;
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploads(prev => {
        const next = [...prev];
        if (next[index]) next[index].status = 'error';
        return next;
      });
    }
  };

  const removeUpload = (index: number) => {
    setUploads(prev => {
      const next = prev.filter((_, i) => i !== index);
      const completedUrls = next
        .filter(u => u.status === 'completed')
        .map(u => u.url as string);
      onUploadComplete(completedUrls);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 transition-all group",
          uploads.length >= maxFiles && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple 
          accept="image/*"
          className="hidden" 
        />
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <Upload size={24} />
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">Click to upload screenshots</p>
        <p className="text-xs text-gray-500 mt-1">Up to {maxFiles} images (Max 5MB each)</p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((upload, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                <FileImage size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate pr-4">
                    {upload.file.name}
                  </span>
                  <button 
                    onClick={() => removeUpload(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="relative h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-300",
                      upload.status === 'error' ? "bg-red-500" : "bg-blue-600"
                    )}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0">
                {upload.status === 'uploading' && <Loader2 size={16} className="animate-spin text-blue-600" />}
                {upload.status === 'completed' && <Check size={16} className="text-green-500" />}
                {upload.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
