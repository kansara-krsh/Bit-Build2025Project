import React from 'react';
import { MousePointer2 } from 'lucide-react';

function RemoteCursors({ cursors }) {
  return (
    <>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="fixed pointer-events-none z-[9999] transition-all duration-100 ease-out"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-2px, -2px)'
          }}
        >
          {/* Cursor Icon */}
          <MousePointer2 
            className="w-6 h-6 drop-shadow-lg"
            style={{ 
              color: cursor.color,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          />
          
          {/* Username Label */}
          <div 
            className="absolute top-7 left-0 px-2 py-1 rounded-md text-white text-xs font-medium whitespace-nowrap shadow-lg"
            style={{ 
              backgroundColor: cursor.color,
              transform: 'translateX(-50%)',
              left: '12px'
            }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </>
  );
}

export default RemoteCursors;
