import React from "react";

function getSupport(itemset, transactions) {
  let count = 0;
  transactions.forEach((txn) => {
    if (itemset.every((item) => txn.includes(item))) count++;
  });
  return count;
}

export default function AssociationRulesTable({ data, transactions, minSupport }) {
  if (!data || data.length === 0) return null;

  // Generate all association rules from itemsets with size >= 2
  const rules = [];

  data.forEach(({ itemset, support }) => {
    if (itemset.length < 2 || support < minSupport) return; // Skip small or low support

    // For each itemset, find all non-empty proper subsets A to create rules A -> B
    function getNonEmptyProperSubsets(set) {
      const subsets = [];
      const total = 1 << set.length;
      for (let i = 1; i < total - 1; i++) {
        const subset = [];
        for (let j = 0; j < set.length; j++) {
          if (i & (1 << j)) subset.push(set[j]);
        }
        subsets.push(subset);
      }
      return subsets;
    }

    const subsets = getNonEmptyProperSubsets(itemset);

    subsets.forEach((antecedent) => {
      const consequent = itemset.filter((x) => !antecedent.includes(x));
      if (consequent.length === 0) return;

      const supportAntecedent = getSupport(antecedent, transactions);
      if (supportAntecedent === 0) return;

      const confidence = support / supportAntecedent;

      rules.push({
        antecedent,
        consequent,
        support,
        confidence,
      });
    });
  });

  if (rules.length === 0) return (
    <div className="p-4 bg-surface rounded-xl border border-border text-center text-muted">
      No strong association rules found (Confidence too low or single items).
    </div>
  );

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-background/50 flex justify-between items-center">
        <h3 className="font-bold text-primary text-lg">Association Rules</h3>
        <span className="text-xs text-muted font-medium bg-background px-2 py-1 rounded border border-border">Derived from Frequent Itemsets</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-surface">
            <tr>
              <th className="px-6 py-3 border-b border-border text-secondary font-semibold">Rule (Antecedent &rarr; Consequent)</th>
              <th className="px-6 py-3 border-b border-border text-secondary font-semibold w-24 text-center">Support</th>
              <th className="px-6 py-3 border-b border-border text-secondary font-semibold w-32 text-center">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(({ antecedent, consequent, support, confidence }, i) => {
              const isHighConfidence = confidence >= 0.7; // Arbitrary high aesthetic threshold for coloring
              return (
                <tr
                  key={i}
                  className="border-b border-border/50 last:border-0 hover:bg-background transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs flex items-center gap-2">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-primary">{antecedent.join(", ")}</span>
                    <span className="text-muted">&rarr;</span>
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-bold">{consequent.join(", ")}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-primary font-medium">{support}</td>
                  <td className="px-6 py-4 text-center font-bold">
                    <span className={isHighConfidence ? "text-success" : "text-warning"}>
                      {(confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
