import React, { useState, useRef } from "react";
import { Upload, X, Camera, Image } from "lucide-react";

export default function CustomerInfo({ customer, setCustomer, vehicle, setVehicle, vehiclePhotos, setVehiclePhotos }) {
  const [focusedField, setFocusedField] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const odometerMismatch = (
    (vehicle?.odometer || "") !== (vehicle?.confirmOdometer || "") &&
    (vehicle?.odometer || "").length > 0 &&
    (vehicle?.confirmOdometer || "").length > 0
  );

  // Helper function to determine input border style
  const getInputStyle = (fieldName, value) => {
    const isFocused = focusedField === fieldName;
    const hasContent = value && value.trim() !== '';
    const isOdometerField = fieldName === 'vehicleOdometer' || fieldName === 'vehicleConfirmOdometer';

    // Show red border for odometer mismatch when both fields have content
    if (isOdometerField && odometerMismatch) {
      return "border-2 border-red-500 p-2 rounded focus:outline-none";
    }
    
    if (isFocused || hasContent) {
      return "border-2 border-[#29cc6a] p-2 rounded focus:outline-none";
    }
    return "border border-gray-300 p-2 rounded focus:outline-none";
  };

  // Handle photo upload
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setVehiclePhotos(prev => [...prev, ...newPhotos]);
  };

  // Remove photo
  const removePhoto = (photoId) => {
    setVehiclePhotos(prev => {
      const photoToRemove = prev.find(p => p.id === photoId);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions or use gallery option.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const newPhoto = {
          id: Date.now() + Math.random(),
          file,
          url: URL.createObjectURL(blob),
          name: file.name
        };
        setVehiclePhotos(prev => [...prev, newPhoto]);
        stopCamera();
        setShowPhotoModal(false);
      }, 'image/jpeg', 0.8);
    }
  };

  // Handle gallery selection
  const handleGallerySelect = () => {
    fileInputRef.current?.click();
    setShowPhotoModal(false);
  };

  // Handle modal close
  const handleModalClose = () => {
    stopCamera();
    setShowPhotoModal(false);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-green-600 mb-3">Customer Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input 
          className={getInputStyle('customerName', customer.name)}
          placeholder="Customer Name" 
          value={customer.name} 
          onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
          onFocus={() => setFocusedField('customerName')}
          onBlur={() => setFocusedField(null)}
        />
        <input 
          className={getInputStyle('customerPhone', customer.phone)}
          placeholder="Phone Number" 
          value={customer.phone} 
          onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
          onFocus={() => setFocusedField('customerPhone')}
          onBlur={() => setFocusedField(null)}
        />
      </div>

      <h3 className="text-sm font-semibold text-green-600 mt-6 mb-2">Vehicle Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input 
          className={getInputStyle('vehicleMake', vehicle.make)}
          placeholder="Make" 
          value={vehicle.make} 
          onChange={(e) => setVehicle((v) => ({ ...v, make: e.target.value }))}
          onFocus={() => setFocusedField('vehicleMake')}
          onBlur={() => setFocusedField(null)}
        />
        <input 
          className={getInputStyle('vehicleModel', vehicle.model)}
          placeholder="Model" 
          value={vehicle.model} 
          onChange={(e) => setVehicle((v) => ({ ...v, model: e.target.value }))}
          onFocus={() => setFocusedField('vehicleModel')}
          onBlur={() => setFocusedField(null)}
        />
        <input 
          className={getInputStyle('vehicleVin', vehicle.vin)}
          placeholder="VIN" 
          value={vehicle.vin} 
          onChange={(e) => setVehicle((v) => ({ ...v, vin: e.target.value }))}
          onFocus={() => setFocusedField('vehicleVin')}
          onBlur={() => setFocusedField(null)}
        />
        <input 
          className={getInputStyle('vehicleYear', vehicle.year)}
          placeholder="Year" 
          value={vehicle.year} 
          onChange={(e) => setVehicle((v) => ({ ...v, year: e.target.value }))}
          onFocus={() => setFocusedField('vehicleYear')}
          onBlur={() => setFocusedField(null)}
        />
        <input 
          className={getInputStyle('vehicleOdometer', vehicle.odometer)}
          placeholder="Odometer" 
          value={vehicle.odometer} 
          onChange={(e) => {
            const digitsOnly = (e.target.value || '').replace(/\D+/g, '');
            setVehicle((v) => ({ ...v, odometer: digitsOnly }));
          }}
          onFocus={() => setFocusedField('vehicleOdometer')}
          onBlur={() => setFocusedField(null)}
        />
        <input 
          className={getInputStyle('vehicleConfirmOdometer', vehicle.confirmOdometer)}
          placeholder="Confirm Odometer" 
          value={vehicle.confirmOdometer} 
          onChange={(e) => {
            const digitsOnly = (e.target.value || '').replace(/\D+/g, '');
            setVehicle((v) => ({ ...v, confirmOdometer: digitsOnly }));
          }}
          onFocus={() => setFocusedField('vehicleConfirmOdometer')}
          onBlur={() => setFocusedField(null)}
        />
        <input 
          className={`${getInputStyle('vehicleTrim', vehicle.trim)} col-span-1 sm:col-span-2 lg:col-span-3`}
          placeholder="Trim" 
          value={vehicle.trim} 
          onChange={(e) => setVehicle((v) => ({ ...v, trim: e.target.value }))}
          onFocus={() => setFocusedField('vehicleTrim')}
          onBlur={() => setFocusedField(null)}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-green-600 mb-3">Vehicle Photos</h3>
        
        {/* Photo Upload Button */}
        <div className="mb-4">
          <button 
            onClick={() => setShowPhotoModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
          >
            <Upload size={16} />
            Upload Vehicle Photos
          </button>
          
          {/* Hidden file input for gallery */}
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          <p className="text-xs text-gray-500 mt-1">Upload multiple photos of the vehicle</p>
        </div>

        {/* Photo Upload Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
              {!isCameraActive ? (
                // Modal Options
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Upload Vehicle Photos</h3>
                    <button 
                      onClick={handleModalClose}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      onClick={startCamera}
                      className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Camera size={24} className="text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Camera</div>
                        <div className="text-sm text-gray-500">Take a new photo</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleGallerySelect}
                      className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Image size={24} className="text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">Gallery</div>
                        <div className="text-sm text-gray-500">Choose from gallery</div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                // Camera Preview
                <div className="relative">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Take Photo</h3>
                    <button 
                      onClick={handleModalClose}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="relative bg-black">
                    <video 
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      autoPlay 
                      playsInline 
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <div className="p-4 flex justify-center gap-4">
                    <button
                      onClick={handleModalClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Camera size={16} />
                      Capture
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo Preview Grid */}
        {vehiclePhotos && vehiclePhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {vehiclePhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img 
                  src={photo.url} 
                  alt={photo.name}
                  className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X size={12} />
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{photo.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
