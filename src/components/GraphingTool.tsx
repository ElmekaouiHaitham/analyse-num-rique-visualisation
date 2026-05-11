"use client";

import React, { useState, useEffect, useRef } from "react";
import "./GraphingTool.css";

type StepData = {
  n: number;
  xn: number;
  fxn: number;
  dfxn: number;
  xNext: number;
  error: number;
  isRoot: boolean;
  isDivergent: boolean;
};

type GraphingToolProps = {
  functionStr?: string;
  currentStep?: StepData | null;
  initialX?: number;
};

export default function GraphingTool({ functionStr = "Math.sin(x)", currentStep, initialX }: GraphingToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Viewport State
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [unitsPerWidth, setUnitsPerWidth] = useState(20);

  // Dragging State
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Auto-center only when initialX changes
  useEffect(() => {
    if (initialX !== undefined && !currentStep) {
        setCenter({ x: initialX, y: 0 });
    }
  }, [initialX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let startTime: number | null = null;
    const animationDuration = 800; // ms

    const draw = (progress: number) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Reset transform before scaling to avoid cumulative scaling
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      const yAxisScaleRatio = 3;
      const unitsPerHeight = unitsPerWidth * (height / width) * yAxisScaleRatio;

      const minX = center.x - unitsPerWidth / 2;
      const maxX = center.x + unitsPerWidth / 2;
      const minY = center.y - unitsPerHeight / 2;
      const maxY = center.y + unitsPerHeight / 2;

      const scaleX = width / (maxX - minX);
      const scaleY = height / (maxY - minY);

      const originX = -minX * scaleX;
      const originY = maxY * scaleY;

      const getPx = (x: number) => originX + x * scaleX;
      const getPy = (y: number) => originY - y * scaleY;

      ctx.clearRect(0, 0, width, height);

      // Adaptive Grid
      const idealStep = unitsPerWidth / 5;
      const magnitude = Math.pow(10, Math.floor(Math.log10(idealStep)));
      let gridStep = magnitude;
      if (idealStep / magnitude > 5) gridStep = 5 * magnitude;
      else if (idealStep / magnitude > 2) gridStep = 2 * magnitude;
      
      const subGridStep = gridStep / 2; // Reduce subgrids from 5 to 2 to minimize visual clutter

      ctx.strokeStyle = "rgba(0, 0, 0, 0.03)";
      ctx.lineWidth = 1;
      for (let x = Math.ceil(minX / subGridStep) * subGridStep; x <= maxX; x += subGridStep) {
        ctx.beginPath(); ctx.moveTo(getPx(x), 0); ctx.lineTo(getPx(x), height); ctx.stroke();
      }
      for (let y = Math.ceil(minY / subGridStep) * subGridStep; y <= maxY; y += subGridStep) {
        ctx.beginPath(); ctx.moveTo(0, getPy(y)); ctx.lineTo(width, getPy(y)); ctx.stroke();
      }

      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = 1;
      for (let x = Math.ceil(minX / gridStep) * gridStep; x <= maxX; x += gridStep) {
        ctx.beginPath(); ctx.moveTo(getPx(x), 0); ctx.lineTo(getPx(x), height); ctx.stroke();
      }
      for (let y = Math.ceil(minY / gridStep) * gridStep; y <= maxY; y += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, getPy(y)); ctx.lineTo(width, getPy(y)); ctx.stroke();
      }

      // Draw Axes
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 2;
      if (originY >= 0 && originY <= height) {
        ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(width, originY); ctx.stroke();
      }
      if (originX >= 0 && originX <= width) {
        ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, height); ctx.stroke();
      }

      // Compile Function
      let fn: (x: number) => number;
      try {
        // eslint-disable-next-line no-new-func
        fn = new Function("Math", "x", `return ${functionStr};`).bind(null, Math) as (x: number) => number;
        fn(0);
        setError(null);
      } catch (e) {
        setError("Expression invalide.");
        return;
      }

      // Draw Function
      const style = getComputedStyle(document.body);
      ctx.strokeStyle = style.getPropertyValue('--accent-color') || '#2563eb';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let firstPoint = true;
      const step = (maxX - minX) / width;

      for (let i = 0; i <= width; i++) {
        const x = minX + i * step;
        try {
          const y = fn(x);
          if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) {
              firstPoint = true;
              continue;
          }

          const px = getPx(x);
          const py = getPy(y);

          if (py < -height || py > height * 2) {
               firstPoint = true;
               continue;
          }

          if (firstPoint) {
            ctx.moveTo(px, py);
            firstPoint = false;
          } else {
            ctx.lineTo(px, py);
          }
        } catch (e) {
          firstPoint = true;
        }
      }
      ctx.stroke();

      // Draw Animated Newton's Method Steps
      if (currentStep && !currentStep.isDivergent) {
          const { xn, fxn, xNext } = currentStep;
          let fxNext = 0;
          try { fxNext = fn(xNext); } catch(e) {}

          const drawVertical = (x: number, y0: number, y1: number, p: number) => {
              if (p <= 0) return;
              const currentY = y0 + (y1 - y0) * p;
              ctx.beginPath();
              ctx.moveTo(getPx(x), getPy(y0));
              ctx.lineTo(getPx(x), getPy(currentY));
              ctx.stroke();
          };

          const drawLine = (x0: number, y0: number, x1: number, y1: number, p: number) => {
              if (p <= 0) return;
              const currentX = x0 + (x1 - x0) * p;
              const currentY = y0 + (y1 - y0) * p;
              ctx.beginPath();
              ctx.moveTo(getPx(x0), getPy(y0));
              ctx.lineTo(getPx(currentX), getPy(currentY));
              ctx.stroke();
          };

          const p1 = Math.min(Math.max(progress * 3, 0), 1);
          const p2 = Math.min(Math.max((progress - 0.333) * 3, 0), 1);
          const p3 = Math.min(Math.max((progress - 0.666) * 3, 0), 1);

          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);

          // Phase 1: Vertical line up from x-axis to curve
          drawVertical(xn, 0, fxn, p1);

          // Phase 2: Tangent line down to xNext
          if (p2 > 0) {
              ctx.strokeStyle = '#ef4444'; // Red
              ctx.lineWidth = 2;
              drawLine(xn, fxn, xNext, 0, p2);
              
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(getPx(xn), getPy(fxn), 5, 0, 2 * Math.PI);
              ctx.fill();
          }

          // Phase 3: Vertical line from xNext to curve for the next step
          if (p3 > 0) {
              ctx.strokeStyle = 'rgba(0,0,0,0.5)';
              ctx.lineWidth = 1;
              drawVertical(xNext, 0, fxNext, p3);

              ctx.fillStyle = '#10b981'; // Green
              ctx.beginPath();
              ctx.arc(getPx(xNext), getPy(0), 5, 0, 2 * Math.PI);
              ctx.fill();
              
              if (p3 === 1) {
                 ctx.fillStyle = '#3b82f6'; // Blue
                 ctx.beginPath();
                 ctx.arc(getPx(xNext), getPy(fxNext), 4, 0, 2 * Math.PI);
                 ctx.fill();
              }
          }
          ctx.setLineDash([]);
      } else if (initialX !== undefined) {
          // Just draw the starting point
          let fx0 = 0;
          try { fx0 = fn(initialX); } catch(e) {}
          
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(getPx(initialX), getPy(fx0), 5, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(getPx(initialX), getPy(0));
          ctx.lineTo(getPx(initialX), getPy(fx0));
          ctx.stroke();
          ctx.setLineDash([]);
      }
    };

    // Trigger animation loop if there is a current step, else just draw immediately
    if (currentStep && !currentStep.isDivergent) {
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        let p = (time - startTime) / animationDuration;
        if (p >= 1) p = 1;
        
        // ease-out cubic
        const easeP = 1 - Math.pow(1 - p, 3);
        draw(easeP);
        
        if (p < 1) {
          animationFrameId = requestAnimationFrame(animate);
        }
      };
      animationFrameId = requestAnimationFrame(animate);
    } else {
      draw(1);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [functionStr, center, unitsPerWidth, currentStep, initialX]);

  // Event Handlers for Panning & Zooming
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    const rect = canvas.getBoundingClientRect();
    const yAxisScaleRatio = 3;
    const unitsPerPixelX = unitsPerWidth / rect.width;
    const unitsPerHeight = unitsPerWidth * (rect.height / rect.width) * yAxisScaleRatio;
    const unitsPerPixelY = unitsPerHeight / rect.height;
    
    setCenter(prev => ({
      x: prev.x - dx * unitsPerPixelX,
      y: prev.y + dy * unitsPerPixelY,
    }));
  };

  const handleMouseUp = () => isDragging.current = false;
  const handleMouseLeave = () => isDragging.current = false;

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const yAxisScaleRatio = 3;
    const unitsPerPixelX = unitsPerWidth / rect.width;
    const unitsPerHeight = unitsPerWidth * (rect.height / rect.width) * yAxisScaleRatio;
    const unitsPerPixelY = unitsPerHeight / rect.height;
    
    const graphMouseX = center.x - (unitsPerWidth / 2) + (mouseX * unitsPerPixelX);
    const graphMouseY = center.y + (unitsPerHeight / 2) - (mouseY * unitsPerPixelY);

    const newUnitsPerWidth = unitsPerWidth * zoomFactor;
    const newUnitsPerPixelX = newUnitsPerWidth / rect.width;
    const newUnitsPerHeight = newUnitsPerWidth * (rect.height / rect.width) * yAxisScaleRatio;
    const newUnitsPerPixelY = newUnitsPerHeight / rect.height;
    
    const newCenterX = graphMouseX + (newUnitsPerWidth / 2) - (mouseX * newUnitsPerPixelX);
    const newCenterY = graphMouseY - (newUnitsPerHeight / 2) + (mouseY * newUnitsPerPixelY);

    setUnitsPerWidth(newUnitsPerWidth);
    setCenter({ x: newCenterX, y: newCenterY });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventScroll = (e: WheelEvent) => e.preventDefault();
    canvas.addEventListener('wheel', preventScroll, { passive: false });
    return () => canvas.removeEventListener('wheel', preventScroll);
  }, []);

  const handleResetView = () => {
      setCenter({ x: currentStep ? currentStep.xn : (initialX || 0), y: 0 });
      setUnitsPerWidth(20);
  };

  return (
    <div className="panel" style={{ padding: '0', border: 'none', boxShadow: 'none' }}>
      <div className="tool-header" style={{ marginBottom: '1rem', background: 'transparent', border: 'none', padding: 0 }}>
        <button className="reset-button" onClick={handleResetView} title="Recentrer">
          Recentrer la vue
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="canvas-container">
        <canvas 
          ref={canvasRef} 
          className="graph-canvas grab-cursor"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        />
      </div>
      <div className="help-text" style={{ marginTop: '0.5rem' }}>
        Scrollez pour zoomer. Cliquez et glissez pour déplacer.
      </div>
    </div>
  );
}
