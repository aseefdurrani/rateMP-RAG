// app/components/CustomModal.js
import { useEffect } from "react";

export default function CustomModal({ isOpen, onClose, children }) {
  useEffect(() => {
    // Prevent scrolling when the modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-darkerPrimary rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 mt-2 mr-2 text-gray-600 hover:text-gray-900"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
