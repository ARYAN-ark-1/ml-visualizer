import React, { useState, useEffect, useRef, useCallback } from "react";
import Footer from "../components/Footer";
import KMeansChart from "../components/KMeansChart";
import Controls from "../components/Controls";
import Random from "../utils/random";
import { runExperimentStream, getExperiment } from "../api/experiments";

// --- Logic Helpers ---

function generateRandomPoints(num, maxX = 10, maxY = 10, seed) {
  const rng = new Random(seed);
  const points = [];
  for (let i = 0; i < num; i++) {
    points.push([
      parseFloat(rng.nextFloat(0, maxX).toFixed(3)),
      parseFloat(rng.nextFloat(0, maxY).toFixed(3)),
    ]);
  }
  return points;
}

function distance(p1, p2) {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
}

function mean(points) {
  if (points.length === 0) return [0, 0];
  const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

export default function KMeans() {
  // --- State ---
  const [points, setPoints] = useState([]);
  const [k, setK] = useState(3);
  const [numPoints, setNumPoints] = useState(20);
  const [seed, setSeed] = useState(12345);
  const [refreshCount, setRefreshCount] = useState(0);

  // Playback State
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playInterval = useRef(null);

  const formatPoint = (p) => `(${p[0].toFixed(3)}, ${p[1].toFixed(3)})`;

  // --- Core Algorithm (Backend Connected) ---

  // --- Core Algorithm (Backend Connected) ---
  const [dataFetched, setDataFetched] = useState(false);

  const handleRegenerate = useCallback(() => {
    // Local Generation Only
    setRefreshCount(c => c + 1);
    const pts = generateRandomPoints(numPoints, 10, 10, seed + refreshCount + 1);
    setPoints(pts);
    setHistory([{
      iteration: 0,
      labels: new Array(pts.length).fill(-1),
      centroids: pts.slice(0, k).map(c => ({ ...c })),
      distances: null
    }]);
    setDataFetched(false);
    setIsPlaying(false);
    setCurrentStep(0);
  }, [k, numPoints, seed, refreshCount]);



  // Trigger run ONLY on initial load (mock), NOT on changes automatically
  // User MUST click "Run Experiment" to actually run backend logic
  // --- Persistence Logic ---
  const restoreExperiment = async (id) => {
    try {
      const data = await getExperiment(id);

      // 1. Extract Params & Dataset Info
      const restoredK = data.params && data.params.k ? parseInt(data.params.k) : 3;
      const restoredSeed = data.params && data.params.seed ? data.params.seed : 12345;
      const restoredNumPoints = data.dataset && data.dataset.pointCount ? data.dataset.pointCount : 20;

      // 2. Set UI State
      setK(restoredK);
      setSeed(restoredSeed);
      setNumPoints(restoredNumPoints);

      // 3. Regenerate Exact Points (Deterministic via Seed)
      // Note: We need to ensure we use the same generation logic as handleRegenerate, 
      // but bypass the refreshCount/state async delay.
      const restoredPoints = generateRandomPoints(restoredNumPoints, 10, 10, restoredSeed);
      setPoints(restoredPoints);

      // 4. Auto-Run Experiment to Restore Output
      // We do this manually here instead of calling fetchBackendData to avoid dependency on stale state.
      if (!dataFetched) {
        try {
          // Reset History First
          const initialHistory = [{
            iteration: 0,
            labels: new Array(restoredPoints.length).fill(-1),
            centroids: restoredPoints.slice(0, restoredK).map(c => ({ ...c })),
            distances: null
          }];
          setHistory(initialHistory);

          await runExperimentStream('kmeans', { k: restoredK, seed: restoredSeed }, restoredPoints, (step) => {
            // Ignore meta step for saving (loop avoidance)
            if (step.type === 'meta') return;

            const labels = step.state.points
              ? step.state.points.map(p => p.cluster !== undefined ? p.cluster : -1)
              : new Array(restoredPoints.length).fill(-1);

            let distancesMatrix = null;
            if (step.state.centroids && step.state.points) {
              distancesMatrix = step.state.points.map(p =>
                step.state.centroids.map(c => distance([p.x, p.y], [c.x, c.y]))
              );
            }

            const historyItem = {
              iteration: step.stepNo,
              phase: step.state.phase || 'Processing',
              labels,
              centroids: step.state.centroids ? step.state.centroids.map(c => [c.x, c.y]) : [],
              distances: distancesMatrix
            };

            setHistory(prev => [...prev, historyItem]);
          }, (err) => console.error("Restore Stream Failed:", err));

          setDataFetched(true);
          // Auto-jump to end result
          // We need to wait for state updates to settle, but we can't easily.
          // Instead, we can set isPlaying to false and let user see the end.
          // Or we can try to set currentStep to a high number using a timeout?
          // Better: The history updates. The Controls component uses history.length.
          // Let's just let it populate. The user will see it "replay" fast or just appear.

        } catch (err) {
          console.error("Experiment Auto-Run Failed:", err);
        }
      }

    } catch (err) {
      console.error("Failed to restore:", err);
      localStorage.removeItem("lastExperiment:kmeans");
    }
  };

  useEffect(() => {
    const lastId = localStorage.getItem("lastExperiment:kmeans");
    if (lastId) {
      restoreExperiment(lastId);
    } else {
      // Default Init
      const pts = generateRandomPoints(numPoints, 10, 10, seed);
      setPoints(pts);
      setHistory([{
        iteration: 0,
        labels: new Array(pts.length).fill(-1),
        centroids: pts.slice(0, k).map(c => ({ ...c })),
        distances: null
      }]);
    }
  }, []);

  // Save Step Position
  useEffect(() => {
    if (dataFetched) {
      localStorage.setItem("lastExperimentStep:kmeans", currentStep.toString());
    }
  }, [currentStep, dataFetched]);

  const fetchBackendData = async () => {
    if (dataFetched) return;

    try {
      // Pass seed in params so backend can store it
      await runExperimentStream('kmeans', { k, seed }, points, (step) => {
        if (step.type === 'meta') {
          localStorage.setItem("lastExperiment:kmeans", step.experimentId);
          return;
        }

        const labels = step.state.points
          ? step.state.points.map(p => p.cluster !== undefined ? p.cluster : -1)
          : new Array(points.length).fill(-1);

        let distancesMatrix = null;
        if (step.state.centroids && step.state.points) {
          distancesMatrix = step.state.points.map(p =>
            step.state.centroids.map(c => distance([p.x, p.y], [c.x, c.y]))
          );
        }

        const historyItem = {
          iteration: step.stepNo,
          phase: step.state.phase || 'Processing',
          labels,
          centroids: step.state.centroids ? step.state.centroids.map(c => [c.x, c.y]) : [],
          distances: distancesMatrix
        };

        setHistory(prev => [...prev, historyItem]);
      }, (err) => console.error("Stream Failed:", err));

      setDataFetched(true);
      setIsPlaying(true);

    } catch (err) {
      console.error("Experiment Failed:", err);
    }
  };

  // --- Playback Logic ---

  const handleStepForward = () => {
    if (currentStep < history.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false); // Stop if at end
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    if (!dataFetched && !isPlaying) {
      fetchBackendData();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      playInterval.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < history.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev; // Stop at end
          }
        });
      }, 800); // 800ms per step
    } else {
      clearInterval(playInterval.current);
    }
    return () => clearInterval(playInterval.current);
  }, [isPlaying, history.length]);

  // --- Render Helpers ---

  const currentSnapshot = history[currentStep] || {};
  const { labels = [], centroids = [], distances, phase, iteration = 0 } = currentSnapshot;

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary transition-colors duration-300 font-sans">
      <main className="flex-grow pt-28 pb-12 px-4 max-w-7xl mx-auto w-full">

        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">K-Means Clustering</h1>
            <p className="text-secondary text-lg flex items-center gap-3">
              Iteration:
              <span className="font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">{iteration}</span>
              {phase && (
                <span className={`px-2 py-0.5 rounded text-sm font-semibold tracking-wide border ${phase === 'Assignment' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  phase === 'Update Centroids' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                  {phase}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-surface p-4 rounded-xl shadow-sm border border-border w-full lg:w-auto">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Seed</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => {
                  setSeed(Number(e.target.value));
                  setRefreshCount(0);
                }}
                className="w-20 p-2 text-sm bg-background border border-border rounded-lg text-center focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Clusters (K)</span>
              <input
                type="number"
                min={2}
                max={10}
                value={k}
                onChange={(e) => setK(Math.min(10, Math.max(2, Number(e.target.value))))}
                className="w-20 p-2 text-sm bg-background border border-border rounded-lg text-center focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Points</span>
              <input
                type="number"
                min={5}
                max={100}
                value={numPoints}
                onChange={(e) => setNumPoints(Math.min(100, Math.max(5, Number(e.target.value))))}
                className="w-20 p-2 text-sm bg-background border border-border rounded-lg text-center focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              />
            </div>

            <div className="hidden sm:block h-10 w-px bg-border mx-2"></div>

            <button
              onClick={handleRegenerate}
              className="w-full sm:w-auto px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-semibold text-sm transition-colors shadow-sm active:scale-95"
            >
              Regenerate
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Chart & Controls (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-surface p-2 rounded-2xl shadow-sm border border-border relative overflow-hidden group min-h-[500px] flex flex-col">
              <div className="absolute top-4 left-4 z-10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted bg-surface/90 backdrop-blur px-2 py-1 rounded border border-border">Visualization</h3>
              </div>
              {centroids && (
                <div className="flex-grow rounded-xl bg-background border border-border/50">
                  <KMeansChart
                    points={points}
                    labels={labels}
                    centroids={centroids}
                  />
                </div>
              )}
            </div>

            <Controls
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onReset={() => setCurrentStep(0)}
              currentStep={currentStep}
              totalSteps={history.length - 1} // 0-indexed count
              canStepForward={currentStep < history.length - 1}
              canStepBackward={currentStep > 0}
            />
          </div>

          {/* Right: Data Table (1 col) */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border flex flex-col h-[600px] overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-background/50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Distance Metrics</h2>
              <p className="text-xs text-secondary mt-1">Euclidean distance calculation</p>
            </div>

            <div className="flex-grow overflow-auto p-0 custom-scrollbar">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-surface sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 border-b border-border text-secondary font-semibold w-20">Pt</th>
                    {centroids && centroids.length > 0 && centroids.map((_, i) => (
                      <th key={i} className="px-2 py-3 border-b border-border text-secondary font-semibold text-center font-mono text-xs">C{i}</th>
                    ))}
                    <th className="px-4 py-3 border-b border-border text-secondary font-semibold w-16 text-right">Cluster</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-background transition-colors group">
                      <td className="px-4 py-2 font-mono text-xs text-muted group-hover:text-primary">{formatPoint(p)}</td>
                      {distances && distances[i] ? (
                        // Show real distances if calculated
                        centroids.map((_, cIdx) => {
                          const dist = distances[i][cIdx];
                          const isMin = labels[i] === cIdx;
                          return (
                            <td key={cIdx} className="px-2 py-2 text-center">
                              <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${isMin ? 'bg-accent/10 text-accent font-bold ring-1 ring-accent/20' : 'text-muted/60'}`}>
                                {dist ? dist.toFixed(2) : '-'}
                              </span>
                            </td>
                          )
                        })
                      ) : (
                        // Initialization phase (no distances yet)
                        centroids && centroids.map((_, cIdx) => <td key={cIdx} className="px-2 py-2 text-center text-muted/30">-</td>)
                      )}
                      <td className="px-4 py-2 text-right">
                        <span
                          className="inline-block w-4 h-4 rounded-full shadow-sm ring-1 ring-white dark:ring-gray-800"
                          style={{
                            backgroundColor: (labels && labels[i] > -1)
                              ? ["rgba(99, 102, 241, 0.8)", "rgba(16, 185, 129, 0.8)", "rgba(245, 158, 11, 0.8)", "rgba(236, 72, 153, 0.8)", "rgba(6, 182, 212, 0.8)", "rgba(139, 92, 246, 0.8)", "rgba(244, 63, 94, 0.8)", "rgba(132, 204, 22, 0.8)", "rgba(14, 165, 233, 0.8)", "rgba(234, 179, 8, 0.8)"][labels[i] % 10]
                              : '#d1d5db' // gray-300
                          }}
                        ></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
