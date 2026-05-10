import React, { useEffect, useRef } from 'react';
import { pixiApp } from './pixiApp';
import { STAGE_WIDTH_PX, STAGE_HEIGHT_PX } from '../core/constants';

interface Props {
  onInit?: () => void;
}

export const PixiOfficeCanvas = ({ onInit }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const initialize = async () => {
      await pixiApp.init(containerRef.current!, STAGE_WIDTH_PX, STAGE_HEIGHT_PX);
      if (mounted && onInit) {
        onInit();
      }
    };

    initialize();

    return () => {
      mounted = false;
      pixiApp.destroy();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="pixi-office-canvas" 
      style={{ 
        width: STAGE_WIDTH_PX, 
        height: STAGE_HEIGHT_PX,
        imageRendering: 'pixelated'
      }} 
    />
  );
};
