function Modal({ children, open, onClose, title }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-30 cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 z-50 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;