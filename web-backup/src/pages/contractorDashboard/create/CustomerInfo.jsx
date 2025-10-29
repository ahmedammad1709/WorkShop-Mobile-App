import React, { useState } from "react";
import { Upload, X } from "lucide-react";

export default function CustomerInfo({ customer, setCustomer, vehicle, setVehicle, vehiclePhotos, setVehiclePhotos }) {
  const [focusedField, setFocusedField] = useState(null);

  // Helper function to determine input border style
  const getInputStyle = (fieldName, value) => {
    const isFocused = focusedField === fieldName;
    const hasContent = value && value.trim() !== '';
    
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
          onChange={(e) => setVehicle((v) => ({ ...v, odometer: e.target.value }))}
          onFocus={() => setFocusedField('vehicleOdometer')}
          onBlur={() => setFocusedField(null)}
        />
        <input 
          className={getInputStyle('vehicleConfirmOdometer', vehicle.confirmOdometer)}
          placeholder="Confirm Odometer" 
          value={vehicle.confirmOdometer} 
          onChange={(e) => setVehicle((v) => ({ ...v, confirmOdometer: e.target.value }))}
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
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
            <Upload size={16} />
            Upload Vehicle Photos
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">Upload multiple photos of the vehicle</p>
        </div>

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
