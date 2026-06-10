import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import AlertModal from '@/components/AlertModal';

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg');
  });
}

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
      setAlertConfig({
        isOpen: true,
        title: 'Lỗi',
        message: 'Có lỗi khi xử lý ảnh!',
        type: 'error'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-outline flex justify-between items-center">
          <h3 className="font-bold text-primary text-lg">Chỉnh sửa ảnh đại diện</h3>
          <button onClick={onCancel} className="text-secondary hover:text-primary p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="relative w-full h-80 bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-secondary text-sm">remove</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-outline rounded-lg appearance-none cursor-pointer"
            />
            <span className="material-symbols-outlined text-secondary text-sm">add</span>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onCancel} className="px-5 py-2 rounded-full font-bold text-sm text-secondary hover:bg-hover-bg">Hủy</button>
            <button onClick={handleSave} className="px-5 py-2 rounded-full font-bold text-sm bg-primary text-white hover:opacity-90">Sử dụng ảnh này</button>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
