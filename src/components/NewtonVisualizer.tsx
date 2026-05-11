"use client";

import React, { useState, useEffect } from "react";
import GraphingTool from "./GraphingTool";
import "./NewtonVisualizer.css";

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

export default function NewtonVisualizer() {
  const [functionStr, setFunctionStr] = useState("Math.pow(x, 2) - 2");
  const [x0, setX0] = useState<number>(0);
  const [tolerance, setTolerance] = useState(0.001);
  const [maxIter, setMaxIter] = useState(20);
  
  const [steps, setSteps] = useState<StepData[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 means initial x0 state

  const [parseError, setParseError] = useState<string | null>(null);

  // Initialize random x0 on mount
  useEffect(() => {
    setX0(Math.round((Math.random() * 20 - 10) * 100) / 100);
  }, []);

  useEffect(() => {
    // Recompute all steps whenever inputs change
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("Math", "x", `return ${functionStr};`).bind(null, Math) as (x: number) => number;
      fn(0); // Test execution
      setParseError(null);

      const computedSteps: StepData[] = [];
      let currentX = x0;
      const h = 1e-7;

      for (let i = 0; i < maxIter; i++) {
        const fxn = fn(currentX);
        const dfxn = (fn(currentX + h) - fn(currentX - h)) / (2 * h);
        
        if (Math.abs(dfxn) < 1e-12) {
          computedSteps.push({ n: i, xn: currentX, fxn, dfxn, xNext: currentX, error: 0, isRoot: false, isDivergent: true });
          break;
        }

        const xNext = currentX - (fxn / dfxn);
        
        // Relative error if currentX is not too small, else absolute
        const error = Math.abs(currentX) > 1e-5 ? Math.abs(xNext - currentX) / Math.abs(currentX) : Math.abs(xNext - currentX);
        
        const isRoot = error < tolerance;
        
        computedSteps.push({
          n: i,
          xn: currentX,
          fxn,
          dfxn,
          xNext,
          error,
          isRoot,
          isDivergent: false
        });

        if (isRoot) break;
        currentX = xNext;
      }

      setSteps(computedSteps);
      setCurrentStepIndex(-1); // Reset to start view

    } catch (e) {
      setParseError("Expression invalide.");
      setSteps([]);
    }
  }, [functionStr, x0, tolerance, maxIter]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > -1) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const isFinished = currentStepIndex === steps.length - 1;

  return (
    <div className="newton-layout">
      {/* Left Column: Graph & Controls */}
      <div className="left-panel">
        <div className="controls panel">
          <div className="control-group">
            <label>Fonction f(x) :</label>
            <input type="text" value={functionStr} onChange={(e) => setFunctionStr(e.target.value)} />
          </div>
          <div className="control-row">
            <div className="control-group">
              <label>Point de départ (x₀) :</label>
              <input type="number" step="0.1" value={x0} onChange={(e) => setX0(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="control-group">
              <label>Tolérance (Erreur) :</label>
              <input type="number" step="0.001" value={tolerance} onChange={(e) => setTolerance(parseFloat(e.target.value) || 0.001)} />
            </div>
            <div className="control-group">
              <label>Itérations Max :</label>
              <input type="number" value={maxIter} onChange={(e) => setMaxIter(parseInt(e.target.value) || 10)} />
            </div>
          </div>
          {parseError && <div className="error-message">{parseError}</div>}
        </div>

        <GraphingTool 
          functionStr={functionStr} 
          currentStep={currentStep} 
          initialX={currentStepIndex === -1 ? x0 : undefined}
        />

        <div className="action-buttons">
          <button onClick={handlePrev} disabled={currentStepIndex === -1} className="btn-secondary">
            &larr; Précédent
          </button>
          <button onClick={handleNext} disabled={isFinished} className="btn-primary">
            Suivant &rarr;
          </button>
        </div>
      </div>

      {/* Right Column: Explanations */}
      <div className="right-panel panel">
        <h3>Calculs Détaillés</h3>
        
        {currentStepIndex === -1 ? (
          <div className="step-details step-details-content" key="init">
            <p><strong>Initialisation</strong></p>
            <p>Nous commençons avec la valeur initiale :</p>
            <div className="math-block">
              x₀ = {x0.toFixed(4)}
            </div>
            <p>Cliquez sur "Suivant" pour calculer la première itération de la méthode de Newton.</p>
          </div>
        ) : (
          <div className="step-details step-details-content" key={`step-${currentStep?.n}`}>
            <p><strong>Itération n = {currentStep?.n}</strong></p>
            
            {currentStep?.isDivergent ? (
              <div className="error-message">
                <strong>Non convergence :</strong> La dérivée est trop proche de zéro, la méthode échoue.
              </div>
            ) : (
              <>
                <ul>
                  <li>
                    <strong>Point actuel :</strong> <br/>
                    x<sub>{currentStep?.n}</sub> = {currentStep?.xn.toFixed(6)}
                  </li>
                  <li>
                    <strong>Valeur de la fonction :</strong> <br/>
                    f(x<sub>{currentStep?.n}</sub>) = {currentStep?.fxn.toFixed(6)}
                  </li>
                  <li>
                    <strong>Valeur de la dérivée :</strong> <br/>
                    f'(x<sub>{currentStep?.n}</sub>) = {currentStep?.dfxn.toFixed(6)}
                  </li>
                </ul>

                <p>Calcul du point suivant :</p>
                <div className="math-block">
                  x<sub>{currentStep!.n + 1}</sub> = x<sub>{currentStep?.n}</sub> - f(x<sub>{currentStep?.n}</sub>) / f'(x<sub>{currentStep?.n}</sub>)
                  <br/><br/>
                  x<sub>{currentStep!.n + 1}</sub> = {currentStep?.xn.toFixed(4)} - ({currentStep?.fxn.toFixed(4)} / {currentStep?.dfxn.toFixed(4)})
                  <br/><br/>
                  <strong>x<sub>{currentStep!.n + 1}</sub> = {currentStep?.xNext.toFixed(6)}</strong>
                </div>

                <p>Erreur relative :</p>
                <div className="math-block">
                  ε = |x<sub>{currentStep!.n + 1}</sub> - x<sub>{currentStep?.n}</sub>| / |x<sub>{currentStep?.n}</sub>|
                  <br/>
                  ε = {currentStep?.error.toExponential(4)}
                </div>

                {currentStep?.isRoot && (
                  <div className="success-message">
                    <strong>Convergence atteinte !</strong> L'erreur est inférieure à la tolérance de {tolerance}.<br/>
                    La racine est approximativement <strong>{currentStep?.xNext.toFixed(6)}</strong>.
                  </div>
                )}
                
                {isFinished && !currentStep?.isRoot && !currentStep?.isDivergent && (
                  <div className="error-message">
                    <strong>Non convergence :</strong> Le nombre maximum d'itérations a été atteint sans converger.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
