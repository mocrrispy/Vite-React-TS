// src/components/ContextMenu.tsx
import React, { useEffect, useRef } from 'react';
// import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  widgetId: string;
  onRemoveWidget: (widgetId: string) => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, widgetId, onRemoveWidget, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Add event listener on next tick to avoid capturing the click that opened the menu
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()} // Prevent click inside menu from closing it via app-container listener
    >
      <ul>
        <li onClick={() => { onRemoveWidget(widgetId); onClose(); }}>Remove Widget 🗑️</li>
        {/* Example of another option */}
        {/* <li onClick={() => { alert(`Configure ${widgetId}`); onClose(); }}>Configure ⚙️</li> */}
      </ul>
    </div>
  );
};

export default ContextMenu;