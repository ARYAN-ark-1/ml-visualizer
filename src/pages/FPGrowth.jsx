import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FPtreeDiagram from "../components/FPtreediagram";

function buildFPTree(transactions, minSupport) {
  const frequency = {};
  transactions.flat().forEach((item) => {
    frequency[item] = (frequency[item] || 0) + 1;
  });

  const filteredItems = Object.keys(frequency)
    .filter((item) => frequency[item] >= minSupport)
    .sort((a, b) => frequency[b] - frequency[a]);

  const reorderTransaction = (transaction) =>
    transaction
      .filter((item) => frequency[item] >= minSupport)
      .sort((a, b) => frequency[b] - frequency[a]);

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

  const root = new GraphNode("null");
  const headerTable = {};
  const updateHeader = (item, node) => {
    if (!headerTable[item]) headerTable[item] = [];
    headerTable[item].push(node);
  };

  for (const transaction of transactions.map(reorderTransaction)) {
    let current = root;
    for (const item of transaction) {
      if (!current.children.has(item)) {
        const newNode = new GraphNode(item, current);
        current.children.set(item, newNode);
        updateHeader(item, newNode);
      } else {
        current.children.get(item).increment();
      }
      current = current.children.get(item);
    }
  }

  return {
    root,
    headerTable,
    frequency,
    filteredItems,
    reordered: transactions.map(reorderTransaction),
  };
}

function getFrequentPatterns(headerTable, minSupport) {
  const patterns = {};
  const conditionalBases = {};

  for (const item in headerTable) {
    const paths = [];
    for (const node of headerTable[item]) {
      let path = [];
      let current = node.parent;
      while (current && current.name !== "null") {
        path.unshift(current.name);
        current = current.parent;
      }
      if (path.length > 0) {
        for (let i = 0; i < node.count; i++) paths.push(path);
      }
    }
    conditionalBases[item] = paths;

    const countMap = {};
    for (const path of paths) {
      for (let i = 1; i <= path.length; i++) {
        const combo = path.slice(-i).join(",");
        countMap[combo] = (countMap[combo] || 0) + 1;
      }
    }

    for (const combo in countMap) {
      if (countMap[combo] >= minSupport) {
        const fullPattern = combo.split(",").concat(item).sort().join(",");
        patterns[fullPattern] = countMap[combo];
      }
    }
  }

  return { patterns, conditionalBases };
}

export default function FPGrowthFullFlow() {
  const [minSupport, setMinSupport] = useState(2);
  const [transactions, setTransactions] = useState([
    ["bread", "milk"],
    ["bread", "diaper", "beer", "egg"],
    ["milk", "diaper", "beer", "coke"],
    ["bread", "milk", "diaper", "beer"],
    ["bread", "milk", "diaper", "coke"],
  ]);
  const [results, setResults] = useState(null);

  const allItems = ["bread", "milk", "diaper", "beer", "coke", "egg", "butter", "jam", "chips", "yogurt", "sugar", "salt"];

  const generateRandomTransactions = () => {
    const numTransactions = Math.floor(Math.random() * 6) + 5;
    const maxItemsPerTxn = 5;
    const newTxns = Array.from({ length: numTransactions }, () => {
      const size = Math.floor(Math.random() * maxItemsPerTxn) + 2;
      return [...new Set(Array.from({ length: size }, () => allItems[Math.floor(Math.random() * allItems.length)]))];
    });
    setTransactions(newTxns);
    setResults(null);
  };

  const handleRun = () => {
    const { root, headerTable, frequency, filteredItems, reordered } = buildFPTree(transactions, minSupport);
    const { patterns, conditionalBases } = getFrequentPatterns(headerTable, minSupport);
    setResults({ root, headerTable, frequency, filteredItems, reordered, conditionalBases, patterns });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Navbar />
      <main className="flex-grow pt-24 md:pt-32 lg:pt-40 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">FP-Growth Full Flow Visualization</h1>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center w-full max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <label className="text-lg w-full sm:w-auto">Min Support:</label>
            <input
              type="number"
              min={1}
              value={minSupport}
              onChange={(e) => setMinSupport(Number(e.target.value))}
              className="p-2 border rounded dark:bg-gray-700 text-center w-full sm:w-24"
            />
          </div>

          <button
            onClick={handleRun}
            className="w-full px-5 py-2 text-lg bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Run FP-Growth
          </button>

          <button
            onClick={generateRandomTransactions}
            className="w-full px-5 py-2 text-lg bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Generate Random Transactions
          </button>
        </div>

        <section className="mb-8 overflow-x-auto">
          <h2 className="text-2xl font-semibold mb-4">Transactions</h2>
          <table className="w-full text-sm border border-gray-400 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="p-2 border">TID</th>
                <th className="p-2 border">Items</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i}>
                  <td className="p-2 border">T{i + 1}</td>
                  <td className="p-2 border">{t.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {results && (
          <>
            <section className="mb-8 overflow-x-auto">
              <h2 className="text-2xl font-semibold mb-4">Item Frequency</h2>
              <table className="w-full text-sm border">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr><th className="p-2 border">Item</th><th className="p-2 border">Frequency</th></tr>
                </thead>
                <tbody>
                  {Object.entries(results.frequency).map(([item, freq], i) => (
                    <tr key={i}><td className="p-2 border">{item}</td><td className="p-2 border">{freq}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mb-8 overflow-x-auto">
              <h2 className="text-2xl font-semibold mb-4">Reordered Transactions</h2>
              <table className="w-full text-sm border">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr><th className="p-2 border">TID</th><th className="p-2 border">Ordered Itemset</th></tr>
                </thead>
                <tbody>
                  {results.reordered.map((t, i) => (
                    <tr key={i}><td className="p-2 border">T{i + 1}</td><td className="p-2 border">{t.join(", ")}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>

            <FPtreeDiagram root={results.root} />

            <section className="mb-8 overflow-x-auto">
              <h2 className="text-2xl font-semibold mb-4">Conditional Pattern Bases</h2>
              <table className="w-full text-sm border">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr><th className="p-2 border">Item</th><th className="p-2 border">Conditional Pattern Base</th></tr>
                </thead>
                <tbody>
                  {Object.entries(results.conditionalBases).map(([item, paths], i) => (
                    <tr key={i}>
                      <td className="p-2 border">{item}</td>
                      <td className="p-2 border">
                        {Object.entries(
                          paths.reduce((acc, path) => {
                            const key = path.join(", ");
                            acc[key] = (acc[key] || 0) + 1;
                            return acc;
                          }, {})
                        )
                          .map(([pathStr, count]) => `[${pathStr}:${count}]`)
                          .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mb-8 overflow-x-auto">
              <h2 className="text-2xl font-semibold mb-4">Frequent Patterns</h2>
              <table className="w-full text-sm border">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr><th className="p-2 border">Pattern</th><th className="p-2 border">Support</th></tr>
                </thead>
                <tbody>
                  {Object.entries(results.patterns).map(([pattern, support], i) => (
                    <tr key={i}><td className="p-2 border">{pattern}</td><td className="p-2 border">{support}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
