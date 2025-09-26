import React, { useState, useRef, useEffect } from "react";

interface ConfirmButtonProps {
  onConfirm: () => void;
  confirmText?: string;
  okText?: string;
  cancelText?: string;
  children: React.ReactNode;
}

const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  onConfirm,
  confirmText = "Bạn có chắc muốn xóa không?",
  okText = "Đồng ý",
  cancelText = "Hủy",
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    onConfirm();
    setVisible(false);
  };

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setVisible(false);
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <div onClick={() => setVisible(true)}>{children}</div>

      {visible && (
        <div className="absolute z-50 top-full mt-2 bg-white border rounded shadow-lg p-3 w-64">
          <p className="text-sm mb-3">{confirmText}</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setVisible(false)}
              className="px-3 py-1 text-gray-700 border rounded hover:bg-gray-100"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              {okText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmButton;
