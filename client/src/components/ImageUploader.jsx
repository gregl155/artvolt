import { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

// Compress image to reduce upload time and API fetch time
async function compressImage(file, maxSize = 1200, quality = 0.85) {
  const startTime = performance.now();
  const originalSize = file.size;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if larger than maxSize
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          const compressionTime = Math.round(performance.now() - startTime);
          const compressedSize = compressedFile.size;

          console.log(`Compressed: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB in ${compressionTime}ms`);

          // Attach compression info to the file object
          compressedFile.compressionInfo = {
            time: compressionTime,
            originalSize,
            compressedSize,
          };

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function ImageUploader({
  onUpload,
  preview,
  isLoading,
  showAnalyzeButton = false,
  onAnalyze,
  isAnalyzing = false,
}) {
  const cameraInputRef = useRef(null);

  const handleCameraCapture = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const processedFile = file.size > 200 * 1024
        ? await compressImage(file)
        : file;
      onUpload(processedFile);
    }
    e.target.value = '';
  }, [onUpload]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Compress if larger than 200KB
      const processedFile = file.size > 200 * 1024
        ? await compressImage(file)
        : file;
      onUpload(processedFile);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    maxFiles: 1,
    disabled: isLoading || isAnalyzing,
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer
          transition-all duration-300 bg-white
          ${isDragActive ? 'border-artvolt-vivid-cyan-blue bg-artvolt-vivid-cyan-blue/5 scale-[1.02]' : 'border-artvolt-gray-200 hover:border-artvolt-black hover:shadow-xl'}
          ${isLoading || isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Hidden camera input for mobile */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraCapture}
          disabled={isLoading || isAnalyzing}
        />

        {preview ? (
          <div className="space-y-6">
            <div className="relative inline-block mx-auto group">
              <img
                src={preview}
                alt="Preview"
                className={`max-h-64 rounded-2xl shadow-lg transition-all duration-500 ${
                  isLoading || isAnalyzing ? 'brightness-75 blur-[1px]' : 'group-hover:brightness-95'
                }`}
              />
              
              {isLoading && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  {/* Scanning line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-artvolt-vivid-cyan-blue to-transparent shadow-[0_0_15px_rgba(6,147,227,1)] animate-scan z-10"></div>

                  {/* Overlay pulsing */}
                  <div className="absolute inset-0 bg-artvolt-vivid-cyan-blue/10 animate-pulse"></div>
                </div>
              )}

              {isAnalyzing && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  {/* Scanning line - purple for analyze mode */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-artvolt-vivid-purple to-transparent shadow-[0_0_15px_rgba(155,81,224,1)] animate-scan z-10"></div>

                  {/* Overlay pulsing */}
                  <div className="absolute inset-0 bg-artvolt-vivid-purple/10 animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Analyze Button - shown in manual mode */}
            {showAnalyzeButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalyze?.();
                }}
                className="px-8 py-3 bg-artvolt-black text-white font-semibold rounded-full
                  hover:bg-artvolt-vivid-cyan-blue transition-all duration-300
                  shadow-lg hover:shadow-xl transform hover:scale-105
                  flex items-center gap-2 mx-auto"
              >
                <span>Analyze</span>
              </button>
            )}

            <p className={`text-sm font-medium transition-colors duration-300 ${
              isLoading || isAnalyzing ? 'text-artvolt-vivid-cyan-blue animate-pulse' : 'text-artvolt-gray-500'
            }`}>
              {isLoading ? 'Analyzing artwork...' :
               isAnalyzing ? 'Preparing results...' :
               showAnalyzeButton ? 'Click Analyze when ready' :
               'Drop a new image or click to replace'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-24 h-24 mx-auto bg-artvolt-gray-50 rounded-full flex items-center justify-center group-hover:bg-artvolt-gray-100 transition-colors">
              <svg className="w-10 h-10 text-artvolt-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-artvolt-black font-serif">
                {isDragActive ? 'Drop your painting here' : 'Upload a painting'}
              </p>
              <p className="text-base text-artvolt-gray-500 mt-2">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-artvolt-cyan-bluish-gray mt-2 uppercase tracking-wide font-medium">
                Supports PNG, JPG, WEBP, GIF
              </p>
            </div>

            {/* Camera button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="px-6 py-2 bg-artvolt-gray-100 text-artvolt-black font-medium rounded-full
                hover:bg-artvolt-gray-200 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Camera</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
