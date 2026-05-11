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

  // Auto-center on initial load or step change
  useEffect(() => {
    if (currentStep) {
        setCenter({ x: currentStep.xn, y: 0 });
    } else if (initialX !== undefined) {
        setCenter({ x: initialX, y: 0 });
    }
  }, [currentStep, initialX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const unitsPerHeight = unitsPerWidth * (height / width);

    const minX = center.x - unitsPerWidth / 2;
    const maxX = center.x + unitsPerWidth / 2;
    const minY = center.y - unitsPerHeight / 2;
    const maxY = center.y + unitsPerHeight / 2;

    const scaleX = width / (maxX - minX);
    const scaleY = height / (maxY - minY);

    const originX = -minX * scaleX;
    const originY = maxY * scaleY;

    // Helper to map graph coords to pixel coords
    const getPx = (x: number) => originX + x * scaleX;
    const getPy = (y: number) => originY - y * scaleY;

    ctx.clearRect(0, 0, width, height);

    // Adaptive Grid
    const idealStep = unitsPerWidth / 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(idealStep)));
    let gridStep = magnitude;
    if (idealStep / magnitude > 5) gridStep = 5 * magnitude;
    else if (idealStep / magnitude > 2) gridStep = 2 * magnitude;
    
    const subGridStep = gridStep / 5;

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
    ctx.strokeStyle = '#2563eb';
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

    // Draw Newton's Method Steps
    if (currentStep && !currentStep.isDivergent) {
        const { xn, fxn, xNext } = currentStep;

        // 1. Draw point at (xn, fxn)
        ctx.fillStyle = '#ef4444'; // Red
        ctx.beginPath();
        ctx.arc(getPx(xn), getPy(fxn), 5, 0, 2 * Math.PI);
        ctx.fill();

        // 2. Draw Tangent line from xn to xNext
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(getPx(xn), getPy(fxn));
        ctx.lineTo(getPx(xNext), getPy(0));
        
        // Extend tangent a bit beyond xNext
        const extendedDx = (xNext - xn) * 0.5;
        ctx.lineTo(getPx(xNext + extendedDx), getPy(0 - currentStep.dfxn * extendedDx));
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // 3. Draw vertical drop from (xn, fxn) to x-axis
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(getPx(xn), getPy(fxn));
        ctx.lineTo(getPx(xn), getPy(0));
        ctx.stroke();

        // 4. Mark xNext on the axis
        ctx.fillStyle = '#10b981'; // Green
        ctx.beginPath();
        ctx.arc(getPx(xNext), getPy(0), 5, 0, 2 * Math.PI);
        ctx.fill();
    } else if (initialX !== undefined) {
        // Draw just the initial point
        const fx0 = fn(initialX);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(getPx(initialX), getPy(fx0), 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Vertical drop
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(getPx(initialX), getPy(fx0));
        ctx.lineTo(getPx(initialX), getPy(0));
        ctx.stroke();
        ctx.setLineDash([]);
    }

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
    const unitsPerPixelX = unitsPerWidth / rect.width;
    
    setCenter(prev => ({
      x: prev.x - dx * unitsPerPixelX,
      y: prev.y + dy * unitsPerPixelX,
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
    const unitsPerPixel = unitsPerWidth / rect.width;
    
    const graphMouseX = center.x - (unitsPerWidth / 2) + (mouseX * unitsPerPixel);
    const unitsPerHeight = unitsPerWidth * (rect.height / rect.width);
    const graphMouseY = center.y + (unitsPerHeight / 2) - (mouseY * unitsPerPixel);

    const newUnitsPerWidth = unitsPerWidth * zoomFactor;
    const newUnitsPerPixel = newUnitsPerWidth / rect.width;
    
    const newCenterX = graphMouseX + (newUnitsPerWidth / 2) - (mouseX * newUnitsPerPixel);
    const newUnitsPerHeight = newUnitsPerWidth * (rect.height / rect.width);
    const newCenterY = graphMouseY - (newUnitsPerHeight / 2) + (mouseY * newUnitsPerPixel);

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
