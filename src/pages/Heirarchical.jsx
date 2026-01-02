import React, { useEffect, useState, useRef, useCallback } from "react";
import * as d3 from "d3";
import Footer from "../components/Footer";
import { runExperimentStream, getExperiment } from "../api/experiments";

import Controls from "../components/Controls";
import Random from "../utils/random";

// --- Logic Helpers ---

function generateRandomPoints(num, maxX = 10, maxY = 10, seed) {
  const rng = new Random(seed);
  const points = [];
  for (let i = 0; i < num; i++) {
    points.push([
      parseFloat(rng.nextFloat(0, maxX).toFixed(2)),
      parseFloat(rng.nextFloat(0, maxY).toFixed(2)),
    ]);
  }
  return points;
}

function distance(p1, p2) {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
}

function getCentroid(points) {
  const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function formatPoint(p) {
  return `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`;
}

// Build tree from FULL history
function buildDendrogramTree(history, initialLabels) {
  if (history.length === 0) {
    return { name: initialLabels[0] || "" };
  }

  const nodesMap = new Map();
  initialLabels.forEach((label) => {
    nodesMap.set(label, { name: label, children: [] });
  });

  history.forEach(({ merge, labels }) => {
    // labels contains the names BEFORE the merge.
    // simpler: The merge info refers to indices in the 'clusters' array at that step.
    // BUT, we stored names in the history item.
    // Let's rely on the names captured in the history.

    // Actually, our history structure needs to be robust.
    // Let's assume history item has: { mergeNames: [nameA, nameB], newName: nameAB }

    // REVISIT: The old logic used indices. Let's stick to the logic provided in the original file, adapted if needed.
    // Original logic:
    // const [i, j] = merge;
    // const nameI = labels[i]; ...

    // We will ensure our history captures enough info.

    // HOWEVER, to support step-by-step, we might not build the full tree until the end.
  });

  // Re-implementing based on original logic, but we need to pass 'history' that matches the structure.
  // We'll rebuild this logic inside the component or keep it simple.
  return null;
}

function buildTreeRefined(history, initialLabels) {
  if (!history || history.length === 0) return null;

  // Map of current available nodes (forest)
  const forest = new Map();
  initialLabels.forEach(label => {
    forest.set(label, { name: label, children: null });
  });

  let root = null;

  history.forEach((step) => {
    if (!step.mergeInfo) return;
    const { nameA, nameB, mergedName } = step.mergeInfo;

    const nodeA = forest.get(nameA);
    const nodeB = forest.get(nameB);

    const newNode = {
      name: mergedName,
      children: [nodeA, nodeB].filter(Boolean)
    };

    forest.delete(nameA);
    forest.delete(nameB);
    forest.set(mergedName, newNode);

    root = newNode; // Last created node is likely root if finished
  });

  // If forest has > 1 tree, we haven't finished clustering or it's a forest.
  // But for the visualization, we return the root of the last merge.
  return root;
}


export default function Hierarchical() {
  // --- State ---
  const [points, setPoints] = useState([]);
  const [numPoints, setNumPoints] = useState(6);
  const [seed, setSeed] = useState(123);
  const [refreshCount, setRefreshCount] = useState(0);

  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playInterval = useRef(null);

  const svgRef = useRef(null);

  // --- Logic ---

  // --- Core Algorithm (Backend Connected) ---
  const [dataFetched, setDataFetched] = useState(false);

  // Helper to re-calc matrix for visualization from current clusters
  const calculateMatrix = (currentClusters) => {
    const mat = [];
    for (let i = 0; i < currentClusters.length; i++) {
      const row = [];
      for (let j = 0; j < currentClusters.length; j++) {
        if (i === j) {
          row.push(null);
        } else {
          // Check if points are in {x,y} or [x,y] format
          const cA = getCentroid(currentClusters[i].points.map(p => Array.isArray(p) ? p : [p.x, p.y]));
          const cB = getCentroid(currentClusters[j].points.map(p => Array.isArray(p) ? p : [p.x, p.y]));
          row.push(distance(cA, cB));
        }
      }
      mat.push(row);
    }
    return mat;
  };

  const handleRegenerate = useCallback(() => {
    setRefreshCount(c => c + 1);
    const pts = generateRandomPoints(numPoints, 10, 10, seed + refreshCount + 1);
    setPoints(pts);

    // Initial Cluster State
    const initClusters = pts.map((p, i) => ({
      name: `C${i}`,
      points: [p],
      id: i // Keep ID for tracking
    }));

    setHistory([{
      iteration: 0,
      matrix: calculateMatrix(initClusters),
      clusters: initClusters,
      mergeInfo: null,
      description: "Initial State"
    }]);

    setDataFetched(false);
    setIsPlaying(false);
    setCurrentStep(0);
  }, [numPoints, seed, refreshCount]);

  // Import runExperimentStream logic
  // const { runExperimentStream } = require("../api/experiments");

  // --- Persistence Logic ---
  const restoreExperiment = async (id) => {
    try {
      const data = await getExperiment(id);

      // 1. Extract Params
      const restoredSeed = data.params && data.params.seed ? data.params.seed : 123;
      const restoredNumPoints = data.dataset && data.dataset.pointCount ? data.dataset.pointCount : 6;

      // 2. Set UI State
      setSeed(restoredSeed);
      setNumPoints(restoredNumPoints);

      // 3. Regenerate Points
      const restoredPoints = generateRandomPoints(restoredNumPoints, 10, 10, restoredSeed);
      setPoints(restoredPoints);

      // 4. Auto-Run Experiment
      if (!dataFetched) {
        try {
          // Helper needed for keys
          const getTreeKey = (id) => {
            if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('merge'))) {
              return `C${id}`;
            }
            return id;
          };

          const initClusters = restoredPoints.map((p, i) => ({
            name: `C${i}`,
            points: [p],
            id: i
          }));

          setHistory([{
            iteration: 0,
            matrix: calculateMatrix(initClusters),
            clusters: initClusters,
            mergeInfo: null,
            description: "Initial State"
          }]);

          await runExperimentStream('hierarchical', { seed: restoredSeed }, restoredPoints, (step) => {
            if (step.type === 'meta') return;

            const backendClusters = step.state.clusters || [];
            const uiClusters = backendClusters.map(c => ({
              name: c.id.toString().startsWith('merge') ? 'M' : `C${c.id}`,
              points: c.points.map(p => Array.isArray(p) ? p : [p.x, p.y]),
              id: c.id
            }));

            const matrix = calculateMatrix(uiClusters);

            let mergeInfo = null;
            if (step.state.merged) {
              const [idA, idB] = step.state.merged;
              mergeInfo = {
                nameA: getTreeKey(idA),
                nameB: getTreeKey(idB),
                mergedName: `merge_${idA}_${idB}`
              };
            }

            const historyItem = {
              iteration: step.stepNo,
              matrix,
              clusters: uiClusters,
              mergeInfo: mergeInfo,
              description: step.state.phase === 'merge' ? `Merged clusters` : step.state.phase
            };

            setHistory(prev => [...prev, historyItem]);
          }, (err) => console.error("Restore Stream Failed:", err));

          setDataFetched(true);

        } catch (err) {
          console.error("Experiment Auto-Run Failed:", err);
        }
      }

    } catch (err) {
      console.error("Failed to restore:", err);
      localStorage.removeItem("lastExperiment:hierarchical");
    }
  };

  useEffect(() => {
    const lastId = localStorage.getItem("lastExperiment:hierarchical");
    if (lastId) {
      restoreExperiment(lastId);
    } else {
      // Default init
      const pts = generateRandomPoints(numPoints, 10, 10, seed);
      setPoints(pts);
      // ... (init clusters logic - duplicated, maybe extract?)
      const initClusters = pts.map((p, i) => ({
        name: `C${i}`,
        points: [p],
        id: i
      }));
      setHistory([{
        iteration: 0,
        matrix: calculateMatrix(initClusters),
        clusters: initClusters,
        mergeInfo: null,
        description: "Initial State"
      }]);
    }
  }, []);

  // Save Step Position
  useEffect(() => {
    if (dataFetched) {
      localStorage.setItem("lastExperimentStep:hierarchical", currentStep.toString());
    }
  }, [currentStep, dataFetched]); // Run once

  const fetchBackendData = async () => {
    if (dataFetched) return;

    const getTreeKey = (id) => {
      if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('merge'))) {
        return `C${id}`;
      }
      return id;
    };

    try {
      // Include seed in params for backend storage
      await runExperimentStream('hierarchical', { seed }, points, (step) => {
        if (step.type === 'meta') {
          localStorage.setItem("lastExperiment:hierarchical", step.experimentId);
          return;
        }

        const backendClusters = step.state.clusters || [];
        const uiClusters = backendClusters.map(c => ({
          name: c.id.toString().startsWith('merge') ? 'M' : `C${c.id}`,
          points: c.points.map(p => Array.isArray(p) ? p : [p.x, p.y]),
          id: c.id
        }));

        const matrix = calculateMatrix(uiClusters);

        let mergeInfo = null;
        if (step.state.merged) {
          const [idA, idB] = step.state.merged;
          mergeInfo = {
            nameA: getTreeKey(idA),
            nameB: getTreeKey(idB),
            mergedName: `merge_${idA}_${idB}`
          };
        }

        const historyItem = {
          iteration: step.stepNo,
          matrix,
          clusters: uiClusters,
          mergeInfo: mergeInfo,
          description: step.state.phase === 'merge' ? `Merged clusters` : step.state.phase
        };

        setHistory(prev => [...prev, historyItem]);
      }, (err) => console.error("Stream Failed:", err));

      setDataFetched(true);
      setIsPlaying(true);

    } catch (err) {
      console.error("Experiment Failed:", err);
    }
  };

  // --- Playback Controls ---
  const handleStepForward = () => {
    if (currentStep < history.length - 1) setCurrentStep(c => c + 1);
    else setIsPlaying(false);
  };

  const handleStepBackward = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
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
          if (prev < history.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 1000);
    } else {
      clearInterval(playInterval.current);
    }
    return () => clearInterval(playInterval.current);
  }, [isPlaying, history.length]);


  // --- D3 Effect for Final Step (or partial?) ---
  // To keep it simple, we only show the Dendrogram when we are at the LAST step, 
  // OR we try to build it incrementally. 
  // Let's build it incrementally based on history up to currentStep!

  // --- D3 Visualization ---

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (history.length === 0) return;

    // Use the container dimensions
    const container = svgRef.current.parentElement;
    const { width, height } = container.getBoundingClientRect();

    // Zoom Support
    const g = svg.append("g");
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    // Build partial tree
    const historySlice = history.slice(0, currentStep + 1);
    const initialLabels = points.map((_, i) => ({ name: `C${i}`, id: i }));

    // We need to construct the hierarchy up to this step.
    const rootNode = buildTreeRefined(historySlice, initialLabels.map(l => l.name));

    if (!rootNode) return;

    // Setup Layout
    const hierarchyRoot = d3.hierarchy(rootNode);

    // Cluster layout: leaves at the same depth
    // We want Bottom-to-Top: Leaves at Bottom (Height), Root at Top (0) 
    // Wait, D3 cluster default: Root at (0,0) (Top-Left), Leaves expanded vertically/horizontally.
    // If we want leaves at bottom, we should assume standard vertical layout and then invert Y.
    const treeHeight = height - 100;
    const treeWidth = width - 100;

    const clusterLayout = d3.cluster().size([treeWidth, treeHeight]);
    clusterLayout(hierarchyRoot);

    // Center the tree
    // Initial Transform
    const initialTransform = d3.zoomIdentity.translate(50, 50);
    svg.call(zoom.transform, initialTransform);

    // Invert Y to make Leaves at Bottom (Standard D3 cluster puts leaves at Max Y usually?)
    // D3 Cluster (vertical): Root x=mid, y=0. Leaves x=spread, y=height.
    // So this IS Top-to-Bottom. 
    // IF User wants "Bottom-to-Top", they might mean Root at Bottom, Leaves at Top?
    // OR Leaves at Bottom merging UP to root. (This IS standard D3 cluster: Root is top, Leaves are bottom).
    // Let's stick to standard vertical: Root Top, Leaves Bottom.
    // IF "Bottom-to-Top" means "Grow from bottom", then Root should be at Bottom.
    // Let's assume standard intuitive dendrogram: Leaves aligned at bottom axis, merging upwards. 
    // That means Root is at Top. Correct.

    // Drawing Links
    // Use curved step paths (stepAfter or stepBefore for rectilinear) or simple curves
    // Standard dendrogram uses Right-Angle links.

    const linkGenerator = (d) => {
      // Square links: (source x,y) -> (source x, target y) -> (target x, target y)
      return `M${d.source.x},${d.source.y}
                V${d.target.y}
                H${d.target.x}`;
    };

    g.selectAll(".link")
      .data(hierarchyRoot.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", (d) => {
        // Highlight if this link was just created in the current step?
        // In full tree view, hard to strictly say "just created" if we rebuild.
        // But we can check if the target node (child) was merged in this step.
        // Simpler: Just standard styling.
        return "var(--border-color)";
      })
      .attr("stroke-width", 2)
      .attr("d", linkGenerator)
      .attr("stroke-opacity", 0)
      .transition().duration(500)
      .attr("stroke-opacity", 0.6);

    // Drawing Nodes
    const nodes = g.selectAll(".node")
      .data(hierarchyRoot.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node Circles
    nodes.append("circle")
      .attr("r", d => d.children ? 4 : 6)
      .attr("fill", d => d.children ? "var(--text-muted)" : "var(--accent-primary)")
      .attr("stroke", "var(--bg-surface)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function () { d3.select(this).transition().attr("r", 8); })
      .on("mouseout", function () { d3.select(this).transition().attr("r", d => d.children ? 4 : 6); })
      .append("title")
      .text(d => d.data.name);

    // Labels (Leaves only or all?)
    nodes.filter(d => !d.children)
      .append("text")
      .attr("dy", "1.5em")
      .attr("text-anchor", "middle")
      .text(d => d.data.name)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "var(--text-secondary)")
      .style("opacity", 0)
      .transition().delay(300).duration(500)
      .style("opacity", 1);

    // Labels (Internal nodes - Cluster names?)
    nodes.filter(d => d.children)
      .append("text")
      .attr("dy", "-0.8em")
      .attr("dx", "0.5em")
      .attr("text-anchor", "start")
      .text(d => d.data.name.length > 10 ? "" : d.data.name) // Only show short names
      .attr("font-size", "10px")
      .attr("fill", "var(--text-muted)")
      .style("opacity", 0.5);

  }, [history, currentStep, points]);


  // --- Render ---
  const currentSnapshot = history[currentStep] || {};
  const { matrix, clusters, mergeIndices, description, iteration } = currentSnapshot;

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary transition-colors duration-300 font-sans">


      <main className="flex-grow pt-28 pb-12 px-4 max-w-7xl mx-auto w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">
              Hierarchical Clustering
            </h1>
            <p className="text-lg text-secondary max-w-2xl">
              Visualize how data points are grouped into a hierarchy from the bottom up.
            </p>
          </div>

          {/* Controls Card */}
          <div className="flex flex-wrap items-center gap-4 bg-surface p-4 rounded-xl shadow-sm border border-border">
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
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Points</span>
              <input
                type="number"
                min={2}
                max={15}
                value={numPoints}
                onChange={(e) => setNumPoints(Math.min(15, Math.max(2, Number(e.target.value))))}
                className="w-20 p-2 text-sm bg-background border border-border rounded-lg text-center focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              />
            </div>

            <div className="h-10 w-px bg-border mx-2"></div>

            <button
              onClick={handleRegenerate}
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-semibold text-sm transition-colors shadow-sm active:scale-95"
            >
              Regenerate
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Stats & Matrix (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Status Card */}
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" /></svg>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-2">Current Status</h3>
              <p className="text-xl font-medium text-primary mb-1">
                {description || "Ready"}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="px-2 py-1 bg-accent-highlight text-accent text-xs font-bold rounded-md">
                  Iteration {iteration !== undefined ? iteration : '-'}
                </span>
                <span className="text-xs text-secondary">
                  {clusters ? `${clusters.length} Clusters` : 'Initializing...'}
                </span>
              </div>
            </div>

            {/* Matrix */}
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex-grow overflow-hidden flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Distance Matrix</h3>
              <div className="overflow-auto flex-grow -mx-2 px-2 custom-scrollbar">
                {matrix ? (
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 sticky top-0 bg-surface z-10"></th>
                        {clusters.map((c, i) => (
                          <th key={i} className="p-2 sticky top-0 bg-surface z-10 border-b border-border font-bold text-secondary">
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row, i) => (
                        <tr key={i} className="hover:bg-background transition-colors">
                          <td className="p-2 border-r border-border font-bold text-secondary sticky left-0 bg-surface">
                            {clusters[i].name}
                          </td>
                          {row.map((val, j) => {
                            const isMergeTarget = mergeIndices && (
                              (i === mergeIndices[0] && j === mergeIndices[1]) ||
                              (i === mergeIndices[1] && j === mergeIndices[0])
                            );
                            return (
                              <td key={j} className={`p-2 border border-dashed border-border/50 ${isMergeTarget ? 'bg-accent-highlight text-accent font-bold ring-2 ring-inset ring-accent/50 rounded' : 'text-muted'}`}>
                                {val === null ? '—' : val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted italic">
                    Computation Complete
                  </div>
                )}
              </div>
            </div>

            <Controls
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onReset={() => setCurrentStep(0)}
              currentStep={currentStep}
              totalSteps={Math.max(0, history.length - 1)}
              canStepForward={currentStep < history.length - 1}
              canStepBackward={currentStep > 0}
            />
          </div>

          {/* Right Column: Dendrogram (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 h-[650px] flex flex-col relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Dendrogram Visualization</h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <span className="w-2 h-2 rounded-full bg-accent"></span> Node
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span> Cluster
                  </div>
                </div>
              </div>

              <div className="flex-grow bg-background rounded-xl border border-dashed border-border overflow-hidden relative cursor-move">
                <svg ref={svgRef} className="w-full h-full block"></svg>
                {history.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted">
                    No data available
                  </div>
                )}
              </div>

              <div className="absolute bottom-8 right-8 text-xs text-muted bg-surface/80 backdrop-blur px-2 py-1 rounded border border-border shadow-sm">
                Scroll to Zoom • Drag to Pan
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
