import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ApiClient } from "@/lib/api";

interface UserPhotoUploaderProps {
  currentPhotoUrl?: string;
  onUploadSuccess: (photo: string, photoUrl: string) => void;
  onClose?: () => void;
}

export const UserPhotoUploader = ({ currentPhotoUrl, onUploadSuccess, onClose }: UserPhotoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, or WebP)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      setUploadProgress(20);
      const res = await ApiClient.uploadUserPhoto(selectedFile);
      setUploadProgress(100);
      if (res.success) {
        setPreview(res.data.photoUrl || null);
        onUploadSuccess(res.data.photo, res.data.photoUrl);
          // If parent provided an onClose (dialog), close it after success
          if (typeof onClose === 'function') onClose();
      } else {
        toast.error('Failed to upload photo');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!preview) return;
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      setIsUploading(true);
      const res = await ApiClient.deleteUserPhoto();
      if (res.success) {
        setPreview(null);
        onUploadSuccess('', null as any);
          if (typeof onClose === 'function') onClose();
        toast.success('Profile photo removed');
      } else {
        toast.error('Failed to remove profile photo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(currentPhotoUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="p-2">
      <div className="space-y-2">
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-full border" />
              {!isUploading && (
                <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemove}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Drag and drop your image here, or click to browse</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP • Max 5MB</p>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
        </div>

        {isUploading && (
          <div className="space-y-1">
            <div className="w-full bg-secondary rounded-full h-1">
              <div className="bg-primary h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="flex-1">
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </>
          )}
          </Button>
          <Button variant="outline" onClick={handleDelete} disabled={isUploading || !preview}>
            Remove
          </Button>
        </div>
      </div>
    </Card>
  );
};
