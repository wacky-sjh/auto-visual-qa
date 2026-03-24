import React, { useState } from 'react';
import type { Decorator } from '@storybook/react';

export const withOverlay: Decorator = (Story, context) => {
  // 사용법: parameters: { overlay: { url: '/baseline.png' } }
  const overlayUrl = context.parameters?.overlay?.url;
  const [opacity, setOpacity] = useState(0.5);
  const [showOverlay, setShowOverlay] = useState(false);

  if (!overlayUrl) return <Story />;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Story />
      
      {showOverlay && (
        <div 
          style={{ 
            position: 'absolute', top: 0, left: 0, 
            width: '100%', height: '100%', 
            backgroundImage: `url(${overlayUrl})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'top left',
            backgroundRepeat: 'no-repeat',
            opacity, 
            pointerEvents: 'none',
            zIndex: 9999
          }} 
        />
      )}

      {/* Floating Control Toggle / Panel */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        right: '-20px', 
        padding: '12px 16px',
        background: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        fontFamily: 'sans-serif', 
        color: '#333',
        transform: 'translateX(100%)', // Position to the right of the component
      }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          fontSize: '14px', 
          fontWeight: 600, 
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          <input 
            type="checkbox" 
            checked={showOverlay} 
            onChange={(e) => setShowOverlay(e.target.checked)} 
            style={{ cursor: 'pointer' }}
          />
          Figma Overlay (QA)
        </label>
        
        {showOverlay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', width: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 500 }}>
              <span style={{ color: opacity === 0 ? '#2563eb' : '#888' }}>구현 화면</span>
              <span style={{ color: opacity === 1 ? '#ea580c' : '#888' }}>Figma 원본</span>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.05" 
              value={opacity} 
              onChange={(e) => setOpacity(parseFloat(e.target.value))} 
              style={{ cursor: 'pointer', width: '100%' }}
            />
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '2px' }}>
              현재 Figma 불투명도: {Math.round(opacity * 100)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
