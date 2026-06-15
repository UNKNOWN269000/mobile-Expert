import { useRef, useState } from 'react';
import { uploadImage, deleteImage, UploadResult } from '../lib/firebaseServices';
import { useAuth } from '../lib/AuthContext';
import { FIREBASE_STORAGE_ENABLED } from '../lib/firebase';

interface MultiImageUploaderProps {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxImages?: number;
}

const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400';

export function MultiImageUploader({
  values,
  onChange,
  label = 'Product photos',
  maxImages = 6,
}: MultiImageUploaderProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  // Keep track of which image was the cover (always index 0)

  const remainingSlots = maxImages - values.length;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    setOverallProgress(0);

    const slots = Math.min(files.length, remainingSlots);
    if (slots <= 0) {
      setError(`You can upload a maximum of ${maxImages} images.`);
      setUploading(false);
      return;
    }

    const newUrls: string[] = [];
    let allLocal = true;

    try {
      for (let i = 0; i < slots; i++) {
        const file = files[i];
        const baseProgress = (i / slots) * 100;
        const perFileProgress = 100 / slots;
        try {
          const result: UploadResult = await uploadImage(
            file,
            user?.uid,
            (p) => {
              setOverallProgress(Math.round(baseProgress + (p * perFileProgress) / 100));
            }
          );
          newUrls.push(result.url);
          if (!result.isLocal) allLocal = false;
        } catch (err: any) {
          console.error('File upload error:', err);
        }
      }
      if (newUrls.length > 0) {
        onChange([...values, ...newUrls]);
        if (allLocal && user && FIREBASE_STORAGE_ENABLED) {
          setError('Stored locally (Firebase Storage not enabled in your project).');
        }
      } else {
        setError('All uploads failed. Please try again.');
      }
    } finally {
      setUploading(false);
      setOverallProgress(0);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) handleFiles(files);
  };

  const handleRemove = async (index: number) => {
    const urlToRemove = values[index];
    await deleteImage('', urlToRemove);
    const updated = values.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const updated = [...values];
    const [cover] = updated.splice(index, 1);
    updated.unshift(cover);
    onChange(updated);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}{' '}
          <span className="text-slate-400">
            ({values.length}/{maxImages})
          </span>
        </label>
        {values.length > 0 && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            First image is the cover
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Existing images */}
        {values.map((url, index) => (
          <div
            key={index}
            className="group relative aspect-square overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
          >
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER;
              }}
            />

            {/* Cover badge */}
            {index === 0 && (
              <div className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                ⭐ Cover
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/60 group-hover:opacity-100">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetCover(index);
                  }}
                  className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow hover:bg-white"
                >
                  ⭐ Set as cover
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-600"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        ))}

        {/* Upload slot(s) */}
        {remainingSlots > 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed transition ${
              dragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10'
            } ${values.length === 0 ? 'col-span-2 aspect-video sm:col-span-3' : ''}`}
          >
            <div className="text-3xl text-slate-400">📷</div>
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {values.length === 0 ? 'Click or drop photos here' : 'Add more'}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} left
              </div>
            </div>

            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/70 text-white">
                <div className="text-xs font-semibold">Uploading… {overallProgress}%</div>
                <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-indigo-400 transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      {error && (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</div>
      )}

      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>📁 Drag & drop multiple or click to upload</span>
        <span>•</span>
        <span>Up to {maxImages} photos, JPG/PNG/WEBP, 5MB each</span>
      </div>
    </div>
  );
}
