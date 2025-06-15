import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ItemsetTable from "../components/ItemsetTable";
import AssociationRulesTable from "../components/AssociationRulesTable";

const ITEMS = ["A", "B", "C", "D", "E", "F", "G"];

function getRandomTransaction(maxItems = 4) {
  const size = 1 + Math.floor(Math.random() * maxItems);
  const shuffled = [...ITEMS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function generateTransactions(num = 6) {
  const txns = [];
  for (let i = 0; i < num; i++) {
    txns.push(getRandomTransaction());
  }
  return txns;
}

function isSubset(a, b) {
  return a.every((item) => b.includes(item));
}

function apriori(transactions, minSupportCount) {
  let freqItemsets = [];
  let k = 1;

  const itemCount = {};
  transactions.forEach((txn) => {
    txn.forEach((item) => {
      itemCount[item] = (itemCount[item] || 0) + 1;
    });
  });

  let frequentKItemsets = Object.entries(itemCount)
    .filter(([, count]) => count >= minSupportCount)
    .map(([item, count]) => ({ itemset: [item], support: count }));

  freqItemsets = [...frequentKItemsets];

  while (frequentKItemsets.length > 0) {
    k++;
    const candidates = [];
    const prevSets = frequentKItemsets.map((x) => x.itemset);

    for (let i = 0; i < prevSets.length; i++) {
      for (let j = i + 1; j < prevSets.length; j++) {
        const set1 = prevSets[i];
        const set2 = prevSets[j];

        if (set1.slice(0, k - 2).join() === set2.slice(0, k - 2).join()) {
          const unionSet = Array.from(new Set([...set1, ...set2])).sort();
          if (
            unionSet.length === k &&
            !candidates.some((c) => c.join() === unionSet.join())
          ) {
            candidates.push(unionSet);
          }
        }
      }
    }

    const candidateCounts = candidates.map((candidate) => {
      let count = 0;
      transactions.forEach((txn) => {
        if (isSubset(candidate, txn)) count++;
      });
      return { itemset: candidate, support: count };
    });

    frequentKItemsets = candidateCounts.filter(
      (c) => c.support >= minSupportCount
    );

    freqItemsets = [...freqItemsets, ...frequentKItemsets];
  }

  return freqItemsets;
}

function getSubsets(set) {
  const subsets = [];
  const n = set.length;
  const total = 1 << n;
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
  const [numTransactions, setNumTransactions] = useState(6);
  const [transactions, setTransactions] = useState(() => generateTransactions(6));
  const [minSupport, setMinSupport] = useState(2);
  const [frequentItemsets, setFrequentItemsets] = useState([]);
  const [allSubsets, setAllSubsets] = useState([]);
  const [aprioriRun, setAprioriRun] = useState(false);

  useEffect(() => {
    const subsetsCount = {};
    transactions.forEach((txn) => {
      getSubsets(txn).forEach((subset) => {
        const key = subset.slice().sort().join(",");
        subsetsCount[key] = (subsetsCount[key] || 0) + 1;
      });
    });

    const subsetsArr = Object.entries(subsetsCount).map(([key, count]) => ({
      itemset: key.split(","),
      support: count,
    }));

    setAllSubsets(subsetsArr.sort((a, b) => b.support - a.support));
  }, [transactions]);

  const handleGenerate = () => {
    setTransactions(generateTransactions(numTransactions));
    setFrequentItemsets([]);
    setAprioriRun(false);
  };

  const handleRunApriori = () => {
    const minSupportCount = Math.max(1, Math.floor(minSupport));
    const freqSets = apriori(transactions, minSupportCount);
    setFrequentItemsets(freqSets);
    setAprioriRun(true);
  };

  useEffect(() => {
    setTransactions(generateTransactions(numTransactions));
    setFrequentItemsets([]);
    setAprioriRun(false);
  }, [numTransactions]);

  const groupedSubsets = allSubsets.reduce((acc, { itemset, support }) => {
    const size = itemset.length;
    if (!acc[size]) acc[size] = [];
    acc[size].push({ itemset, support });
    return acc;
  }, {});

  const maxSize = Math.max(...allSubsets.map((s) => s.itemset.length), 1);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Navbar />

      <main className="flex-grow pt-24 md:pt-32 lg:pt-44 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Apriori Algorithm</h1>

        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-base sm:text-lg">
            <span>No. of Transactions:</span>
            <input
              type="number"
              min={1}
              max={50}
              value={numTransactions}
              onChange={(e) =>
                setNumTransactions(Math.min(50, Math.max(1, Number(e.target.value))))
              }
              className="p-2 border rounded dark:bg-gray-700 w-20 text-center"
            />
          </label>

          <label className="flex items-center gap-2 text-base sm:text-lg">
            <span>Min Support (count):</span>
            <input
              type="number"
              min={1}
              max={numTransactions}
              value={minSupport}
              onChange={(e) =>
                setMinSupport(Math.min(numTransactions, Math.max(1, Number(e.target.value))))
              }
              className="p-2 border rounded dark:bg-gray-700 w-20 text-center"
            />
          </label>

          <button
            onClick={handleGenerate}
            className="px-5 py-2 text-base sm:text-lg bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Generate Transactions
          </button>

          <button
            onClick={handleRunApriori}
            className="px-5 py-2 text-base sm:text-lg bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Run Apriori
          </button>
        </div>

        {/* Transactions Table */}
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">Transactions:</h2>
          <div className="border border-gray-300 dark:border-gray-600 rounded p-3 bg-white dark:bg-gray-800 shadow-md">
            <table className="min-w-full text-left text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border-b px-3 py-2">Transaction</th>
                  <th className="border-b px-3 py-2">Items</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, i) => (
                  <tr key={i} className="odd:bg-gray-100 dark:odd:bg-gray-700">
                    <td className="border-b px-3 py-2 font-mono">T{i + 1}</td>
                    <td className="border-b px-3 py-2">{txn.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* All Subsets */}
        {aprioriRun && (
          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">All Subsets by Size:</h2>
            {(() => {
              let stop = false;
              return Array.from({ length: maxSize }, (_, i) => i + 1).map((size) => {
                if (stop) return null;
                const data = groupedSubsets[size] || [];
                if (data.length === 0) return null;
                const allRejected = data.every(({ support }) => support < minSupport);
                if (allRejected) {
                  stop = true;
                  return null;
                }
                return (
                  <ItemsetTable
                    key={size}
                    title={`Itemsets of size ${size}`}
                    data={data}
                    minSupport={minSupport}
                  />
                );
              });
            })()}
          </section>
        )}

        {/* Frequent Itemsets */}
        {aprioriRun && (
          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              Frequent Itemsets (support ≥ {minSupport}):
            </h2>
            {frequentItemsets.length === 0 ? (
              <p>No frequent itemsets found. Run the algorithm.</p>
            ) : (
              <ItemsetTable title="Frequent Itemsets" data={frequentItemsets} minSupport={minSupport} />
            )}
          </section>
        )}

        {/* Association Rules */}
        {aprioriRun && (
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              Association Rules for All Itemsets:
            </h2>
            <AssociationRulesTable data={allSubsets} transactions={transactions} minSupport={minSupport} />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
