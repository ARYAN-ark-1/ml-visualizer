import React, { useState, useEffect, useCallback, useRef } from "react";

import Footer from "../components/Footer";
import ItemsetTable from "../components/ItemsetTable";
import AssociationRulesTable from "../components/AssociationRulesTable";
import Controls from "../components/Controls";
import Random from "../utils/random";
import { runExperimentStream, getExperiment } from "../api/experiments";

// --- Logic Helpers ---

const ITEMS = ["A", "B", "C", "D", "E", "F", "G"];

function generateRandomTransactions(num, seed) {
  const rng = new Random(seed);
  const txns = [];
  const maxItems = 4;

  for (let i = 0; i < num; i++) {
    const size = rng.nextInt(1, maxItems + 1);
    const available = [...ITEMS];
    const txn = [];

    // Fisher-Yates shuffle logic on a small scale or just simple selection
    for (let j = 0; j < size; j++) {
      if (available.length === 0) break;
      const idx = rng.nextInt(0, available.length);
      txn.push(available[idx]);
      available.splice(idx, 1);
    }
    txns.push(txn.sort()); // Sort items for consistency
  }
  return txns;
}

function isSubset(candidate, txn) {
  return candidate.every((item) => txn.includes(item));
}

function getSubsets(set) {
  const subsets = [];
  const n = set.length;
  const total = 1 << n; // 2^n
  for (let i = 1; i < total; i++) {
    const subset = [];
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) subset.push(set[j]);
    }
    subsets.push(subset);
  }
  return subsets;
}

export default function Apriori() {
  // --- State ---
  const [numTransactions, setNumTransactions] = useState(6);
  const [minSupport, setMinSupport] = useState(2);
  const [seed, setSeed] = useState(1);
  const [refreshCount, setRefreshCount] = useState(0);
  const [transactions, setTransactions] = useState([]);

  // Playback State
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playInterval = useRef(null);

  // Results for Analysis (Rules) - Computed at the end
  const [finalFreqItemsets, setFinalFreqItemsets] = useState([]);

  // --- Logic ---

  // --- Core Algorithm (Backend Connected) ---
  const [dataFetched, setDataFetched] = useState(false);

  const countSupport = (itemset, txns) => {
    let count = 0;
    txns.forEach((txn) => {
      if (itemset.every(item => txn.includes(item))) count++;
    });
    return count;
  };

  const handleRegenerate = useCallback(() => {
    setRefreshCount(c => c + 1);
    const txns = generateRandomTransactions(numTransactions, seed + refreshCount + 1);

    // Initial State
    setTransactions(txns);
    setHistory([{
      stepMsg: "Transactions Generated",
      k: 0,
      candidates: [],
      frequent: [],
      pruned: [],
      phase: "Init"
    }]);

    setDataFetched(false);
    setIsPlaying(false);
    setCurrentStep(0);
    setFinalFreqItemsets([]);
  }, [numTransactions, minSupport, seed, refreshCount]);



  // --- Persistence Logic ---
  const restoreExperiment = async (id) => {
    try {
      const data = await getExperiment(id);

      // 1. Extract Params
      const restoredMinSupport = data.params && data.params.minSupport ? data.params.minSupport : 2;
      const restoredSeed = data.params && data.params.seed ? data.params.seed : 1;
      const restoredNumTxns = data.dataset && data.dataset.pointCount ? data.dataset.pointCount : 6;

      // 2. Set UI State
      setMinSupport(restoredMinSupport);
      setSeed(restoredSeed);
      setNumTransactions(restoredNumTxns);

      // 3. Regenerate Transactions
      const restoredTxns = generateRandomTransactions(restoredNumTxns, restoredSeed);
      setTransactions(restoredTxns);

      // 4. Auto-Run Experiment
      if (!dataFetched) {
        try {
          // Reset History
          setHistory([{
            stepMsg: "Transactions Generated",
            k: 0,
            candidates: [],
            frequent: [],
            pruned: [],
            phase: "Init"
          }]);
          setFinalFreqItemsets([]);

          await runExperimentStream('apriori', { minSupport: restoredMinSupport, seed: restoredSeed }, restoredTxns, (step) => {
            if (step.type === 'meta') return;

            const { level, candidates, frequent } = step.state;

            const uiCandidates = (candidates || []).map(c => ({
              itemset: c,
              support: countSupport(c, restoredTxns)
            }));

            const uiFrequent = (frequent || []).map(f => ({
              itemset: f,
              support: countSupport(f, restoredTxns)
            }));

            const uiPruned = uiCandidates.filter(c => c.support < restoredMinSupport);

            const historyItem = {
              stepMsg: `Analysis for K=${level}`,
              k: level,
              candidates: uiCandidates,
              frequent: uiFrequent,
              pruned: uiPruned,
              phase: "Counting"
            };

            setHistory(prev => [...prev, historyItem]);
            setFinalFreqItemsets(prev => [...prev, ...uiFrequent]);

          }, (err) => console.error("Restore Stream Failed:", err));

          setDataFetched(true);
          setHistory(prev => [...prev, {
            stepMsg: "Apriori Completed",
            k: 0,
            candidates: [],
            frequent: [],
            pruned: [],
            phase: "Complete"
          }]);

        } catch (err) {
          console.error("Experiment Auto-Run Failed:", err);
        }
      }

    } catch (err) {
      console.error("Failed to restore:", err);
      localStorage.removeItem("lastExperiment:apriori");
    }
  };

  useEffect(() => {
    const lastId = localStorage.getItem("lastExperiment:apriori");
    if (lastId) {
      restoreExperiment(lastId);
    } else {
      const txns = generateRandomTransactions(numTransactions, seed);
      setTransactions(txns);
      setHistory([{
        stepMsg: "Transactions Generated",
        k: 0,
        candidates: [],
        frequent: [],
        pruned: [],
        phase: "Init"
      }]);
    }
  }, []);

  // Save Step Position
  useEffect(() => {
    if (dataFetched) {
      localStorage.setItem("lastExperimentStep:apriori", currentStep.toString());
    }
  }, [currentStep, dataFetched]);

  const fetchBackendData = async () => {
    if (dataFetched) return;

    try {
      // Pass seed in params
      await runExperimentStream('apriori', { minSupport, seed }, transactions, (step) => {
        if (step.type === 'meta') {
          localStorage.setItem("lastExperiment:apriori", step.experimentId);
          return;
        }

        const { level, candidates, frequent } = step.state;

        const uiCandidates = (candidates || []).map(c => ({
          itemset: c,
          support: countSupport(c, transactions)
        }));

        const uiFrequent = (frequent || []).map(f => ({
          itemset: f,
          support: countSupport(f, transactions)
        }));

        const uiPruned = uiCandidates.filter(c => c.support < minSupport);

        const historyItem = {
          stepMsg: `Analysis for K=${level}`,
          k: level,
          candidates: uiCandidates,
          frequent: uiFrequent,
          pruned: uiPruned,
          phase: "Counting"
        };

        setHistory(prev => [...prev, historyItem]);
        setFinalFreqItemsets(prev => [...prev, ...uiFrequent]);

      }, (err) => console.error("Stream Failed:", err));

      setDataFetched(true);
      setIsPlaying(true);

      setHistory(prev => [...prev, {
        stepMsg: "Apriori Completed",
        k: 0,
        candidates: [],
        frequent: [],
        pruned: [],
        phase: "Complete"
      }]);

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
  const { stepMsg, k, candidates, frequent, pruned, phase } = currentSnapshot;

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary transition-colors duration-300 font-sans">


      <main className="flex-grow pt-28 pb-12 px-4 max-w-7xl mx-auto w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">
              Apriori Algorithm
            </h1>
            <p className="text-lg text-secondary h-8">
              {stepMsg} <span className="text-accent font-semibold">{phase !== "Init" && phase !== "Complete" && `(K=${k})`}</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Transactions & Controls (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Status Box */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-24 h-24 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M9 3v13.553C8.413 16.218 7.243 16 6 16c-3.314 0-6 2.015-6 4.5S2.686 25 6 25s6-2.015 6-4.5V9h6V3H9z" /></svg>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-2">Algorithm Status</h3>
              <h2 className="text-2xl font-bold text-primary mb-1">
                {phase === "Complete" ? "Analysis Complete" : `Phase: ${phase}`}
              </h2>
              {phase === "Counting" && <p className="text-sm text-secondary">Generating candidates and counting support...</p>}
              {phase === "Pruning" && <p className="text-sm text-error/80 font-medium">Pruning itemsets with support &lt; {minSupport}</p>}
              {phase === "Complete" && <p className="text-sm text-success font-medium">Rules generated successfully.</p>}
            </div>

            {/* Transactions Table */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col max-h-[400px]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Transactions Database</h3>
              <div className="overflow-auto flex-grow -mx-2 px-2 custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 bg-surface z-10">
                    <tr>
                      <th className="p-2 border-b-2 border-border text-secondary font-bold w-16">ID</th>
                      <th className="p-2 border-b-2 border-border text-secondary font-bold">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className="group hover:bg-background transition-colors border-b border-border/50 last:border-0">
                        <td className="p-3 font-mono text-muted group-hover:text-primary">T{i + 1}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {t.map((item, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-highlight text-accent">
                                {item}
                              </span>
                            ))}
                          </div>
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

          {/* Right Column: Visualization & Results (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Middle Section: Candidates vs Frequent */}
            {(phase === "Counting" || phase === "Pruning") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Candidates Table */}
                <div className="h-full">
                  <ItemsetTable
                    title={`Candidates (Size ${k})`}
                    data={candidates}
                    minSupport={minSupport}
                    highlightPruned={phase === "Pruning"} // Pass this prop to style rows red if < minSupport
                  />
                </div>

                {/* Frequent Table (Only show if Pruning done) */}
                {phase === "Pruning" && (
                  <div className="h-full animate-in fade-in zoom-in duration-300">
                    <ItemsetTable
                      title={`Frequent Itemsets (Size ${k})`}
                      data={frequent}
                      minSupport={minSupport}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Final Section: Results */}
            {phase === "Complete" && (
              <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500">
                <ItemsetTable
                  title="All Frequent Itemsets Found"
                  data={finalFreqItemsets}
                  minSupport={minSupport}
                />
                <AssociationRulesTable
                  data={finalFreqItemsets.map(f => ({ itemset: f.itemset, support: f.support }))}
                  transactions={transactions}
                  minSupport={minSupport}
                />
              </div>
            )}

            {/* Empty State / Initial */}
            {phase === "Init" && (
              <div className="flex flex-col items-center justify-center h-64 bg-surface rounded-2xl border border-border border-dashed text-center p-8">
                <div className="text-muted mb-4 opacity-50">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-lg font-semibold text-primary">Ready to Start</h3>
                <p className="text-secondary max-w-sm">Press Play or Step Forward to begin the Apriori algorithm simulation.</p>
              </div>
            )}

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
