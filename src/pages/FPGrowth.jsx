import React, { useState, useEffect, useCallback, useRef } from "react";

import Footer from "../components/Footer";
import FPtreeDiagram from "../components/FPtreediagram";
import Controls from "../components/Controls";
import Random from "../utils/random";
import { runExperimentStream, getExperiment } from "../api/experiments";

// --- Logic Helpers ---

const ALL_ITEMS = ["bread", "milk", "diaper", "beer", "coke", "egg", "butter", "jam", "chips", "yogurt", "sugar", "salt"];

function generateRandomTransactions(num, seed) {
  const rng = new Random(seed);
  const txns = [];
  const maxItemsPerTxn = 5;

  for (let i = 0; i < num; i++) {
    const size = rng.nextInt(2, maxItemsPerTxn + 1);
    const available = [...ALL_ITEMS];
    const txn = [];
    for (let j = 0; j < size; j++) {
      if (available.length === 0) break;
      const idx = rng.nextInt(0, available.length);
      txn.push(available[idx]);
      available.splice(idx, 1); // Remove used item
    }
    txns.push(txn);
  }
  return txns;
}

// Deep Clone Tree Helper
function cloneTree(node) {
  const newNode = {
    name: node.name,
    count: node.count,
    children: new Map(),
    // parent reference is tricky in deep clone.
    // For visualization, we often just need the structure.
    // If we need parent links for the algorithm, we rebuild them or handle carefully.
    // Here we mainly need the snapshot for the Diagram.
  };

  node.children.forEach((child, key) => {
    newNode.children.set(key, cloneTree(child));
  });

  return newNode;
}

// GraphNode Class
class GraphNode {
  constructor(name, parent = null) {
    this.name = name;
    this.count = 1;
    this.parent = parent;
    this.children = new Map();
  }
  increment() {
    this.count++;
  }
}

export default function FPGrowth() {
  // --- State ---
  const [minSupport, setMinSupport] = useState(2);
  const [numTransactions, setNumTransactions] = useState(5);
  const [seed, setSeed] = useState(42);
  const [refreshCount, setRefreshCount] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playInterval = useRef(null);

  // --- Logic ---

  // --- Core Algorithm (Backend Connected) ---
  const [dataFetched, setDataFetched] = useState(false);

  const handleRegenerate = useCallback(() => {
    setRefreshCount(c => c + 1);
    const txns = generateRandomTransactions(numTransactions, seed + refreshCount + 1);
    setTransactions(txns);

    setHistory([{
      stepMsg: "Initial Transactions Generated",
      transactions: txns,
      frequency: {},
      orderedTxns: [],
      treeRoot: null
    }]);

    setDataFetched(false);
    setIsPlaying(false);
    setCurrentStep(0);
  }, [numTransactions, minSupport, seed, refreshCount]);




  // --- Persistence Logic ---
  const restoreExperiment = async (id) => {
    try {
      const data = await getExperiment(id);

      // 1. Extract Params
      const restoredMinSupport = data.params && data.params.minSupport ? data.params.minSupport : 2;
      const restoredSeed = data.params && data.params.seed ? data.params.seed : 42;
      const restoredNumTxns = data.dataset && data.dataset.pointCount ? data.dataset.pointCount : 5;

      // 2. Set UI State
      setMinSupport(restoredMinSupport);
      setSeed(restoredSeed);
      setNumTransactions(restoredNumTxns);

      // 3. Regenerate Transactions
      const restoredTxns = generateRandomTransactions(restoredNumTxns, restoredSeed);
      setTransactions(restoredTxns);

      // 4. Auto-Run Experiment using helper (need to replicate logic as we can't depend on stale state)
      if (!dataFetched) {
        try {
          setHistory([{
            stepMsg: "Initial Transactions Generated",
            transactions: restoredTxns,
            frequency: {},
            orderedTxns: [],
            treeRoot: null
          }]);

          await runExperimentStream('fpgrowth', { minSupport: restoredMinSupport, seed: restoredSeed }, restoredTxns, (step) => {
            if (step.type === 'meta') return;

            const state = step.state;

            setHistory(prev => {
              const last = prev[prev.length - 1];
              // Use restoredTxns explicitly
              const currentTxns = restoredTxns;
              let newFrequency = last.frequency;
              let newOrdered = last.orderedTxns;
              let newRoot = last.treeRoot;
              let msg = "";
              let highlightIdx = -1;

              if (state.phase === 'counting') {
                newFrequency = state.counts;
                msg = "Calculated Frequencies";
                const reorder = (txn) => txn
                  .filter(item => (state.counts[item] || 0) >= restoredMinSupport)
                  .sort((a, b) => state.counts[b] - state.counts[a]);
                newOrdered = currentTxns.map(reorder);
              }
              else if (state.phase === 'building') {
                newRoot = state.tree;
                msg = `Building Tree: Inserted [${state.transaction.join(', ')}]`;
                highlightIdx = step.stepNo - 2;
              }
              else if (state.phase === 'mining') {
                newRoot = state.tree;
                msg = "Mining Complete";
              }

              return [...prev, {
                stepMsg: msg,
                transactions: currentTxns,
                frequency: newFrequency,
                orderedTxns: newOrdered,
                treeRoot: newRoot,
                highlightTxnIdx: highlightIdx
              }];
            });

          }, (err) => console.error("Restore Stream Failed:", err));

          setDataFetched(true);

        } catch (err) {
          console.error("Experiment Auto-Run Failed:", err);
        }
      }

    } catch (err) {
      console.error("Failed to restore:", err);
      localStorage.removeItem("lastExperiment:fpgrowth");
    }
  };

  useEffect(() => {
    const lastId = localStorage.getItem("lastExperiment:fpgrowth");
    if (lastId) {
      restoreExperiment(lastId);
    } else {
      const txns = generateRandomTransactions(numTransactions, seed);
      setTransactions(txns);
      setHistory([{
        stepMsg: "Initial Transactions Generated",
        transactions: txns,
        frequency: {},
        orderedTxns: [],
        treeRoot: null
      }]);
    }
  }, []);

  // Save Step Position
  useEffect(() => {
    if (dataFetched) {
      localStorage.setItem("lastExperimentStep:fpgrowth", currentStep.toString());
    }
  }, [currentStep, dataFetched]);

  const fetchBackendData = async () => {
    if (dataFetched) return;

    try {
      // Pass seed in params
      await runExperimentStream('fpgrowth', { minSupport, seed }, transactions, (step) => {
        if (step.type === 'meta') {
          localStorage.setItem("lastExperiment:fpgrowth", step.experimentId);
          return;
        }

        const state = step.state;

        setHistory(prev => {
          const last = prev[prev.length - 1];
          const currentTxns = transactions;
          let newFrequency = last.frequency;
          let newOrdered = last.orderedTxns;
          let newRoot = last.treeRoot;
          let msg = "";
          let highlightIdx = -1;

          if (state.phase === 'counting') {
            newFrequency = state.counts;
            msg = "Calculated Frequencies";
            const reorder = (txn) => txn
              .filter(item => (state.counts[item] || 0) >= minSupport)
              .sort((a, b) => state.counts[b] - state.counts[a]);
            newOrdered = currentTxns.map(reorder);
          }
          else if (state.phase === 'building') {
            newRoot = state.tree;
            msg = `Building Tree: Inserted [${state.transaction.join(', ')}]`;
            highlightIdx = step.stepNo - 2;
          }
          else if (state.phase === 'mining') {
            newRoot = state.tree;
            msg = "Mining Complete";
          }

          return [...prev, {
            stepMsg: msg,
            transactions: currentTxns,
            frequency: newFrequency,
            orderedTxns: newOrdered,
            treeRoot: newRoot,
            highlightTxnIdx: highlightIdx
          }];
        });

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


  // --- Render ---
  const currentSnapshot = history[currentStep] || {};
  const { stepMsg, frequency, orderedTxns, treeRoot, highlightTxnIdx } = currentSnapshot;

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary transition-colors duration-300 font-sans">


      <main className="flex-grow pt-28 pb-12 px-4 max-w-7xl mx-auto w-full">

        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">FP-Growth Algorithm</h1>
            <p className="text-secondary text-lg">
              {stepMsg || "Initializing..."}
            </p>
          </div>

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
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Min Sup</span>
              <input
                type="number"
                min={1}
                max={numTransactions}
                value={minSupport}
                onChange={(e) => setMinSupport(Number(e.target.value))}
                className="w-20 p-2 text-sm bg-background border border-border rounded-lg text-center focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Txns</span>
              <input
                type="number"
                min={3}
                max={20}
                value={numTransactions}
                onChange={(e) => setNumTransactions(Math.min(20, Math.max(3, Number(e.target.value))))}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Data View (Transactions & Freqs) */}
          <div className="flex flex-col gap-6">

            {/* Frequencies */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Item Frequencies & Min Support Pruning</h3>
              <div className="flex flex-wrap gap-2">
                {frequency && Object.entries(frequency)
                  .sort((a, b) => b[1] - a[1]) // Sort by freq desc
                  .map(([item, count]) => {
                    const isAccepted = count >= minSupport;
                    return (
                      <div key={item}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all duration-300 ${isAccepted
                          ? 'bg-success/10 border-success/30 text-success-dark'
                          : 'bg-background border-border text-muted opacity-60 grayscale'
                          }`}
                      >
                        <span>{item}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${isAccepted ? 'bg-white/50' : 'bg-gray-200'}`}>{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col h-[500px]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Transactions Processing</h3>
              <div className="overflow-auto flex-grow -mx-2 px-2 custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-surface sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-b border-border text-secondary font-semibold w-16">ID</th>
                      <th className="px-4 py-3 border-b border-border text-secondary font-semibold">Original Items</th>
                      <th className="px-4 py-3 border-b border-border text-secondary font-semibold">Ordered (Filtered)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className={`border-b border-border/50 last:border-0 hover:bg-background transition-colors duration-300 ${i === highlightTxnIdx ? 'bg-accent/5 ring-1 ring-accent/20' : ''}`}>
                        <td className="px-4 py-3 font-mono text-muted">T{i + 1}</td>
                        <td className="px-4 py-3 opacity-70">{t.join(", ")}</td>
                        <td className="px-4 py-3 font-medium text-primary">
                          {orderedTxns && orderedTxns[i]
                            ? orderedTxns[i].length > 0
                              ? orderedTxns[i].join(", ")
                              : <span className="text-muted italic text-xs">pruned empty</span>
                            : <span className="text-muted">-</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

          {/* Right: Tree Visualization */}
          <div className="bg-surface p-1 rounded-2xl shadow-sm border border-border min-h-[600px] flex flex-col overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 bg-surface/90 backdrop-blur px-3 py-1 rounded-lg border border-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">FP-Tree Visualization</h3>
            </div>
            <div className="flex-grow rounded-xl bg-background overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              {treeRoot ? (
                <FPtreeDiagram root={treeRoot} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50 gap-4">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  <span className="font-medium">Tree will appear here...</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
