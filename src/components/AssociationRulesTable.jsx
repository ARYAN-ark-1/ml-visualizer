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

  if (rules.length === 0) return <p>No association rules available.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left border-collapse border border-gray-300 dark:border-gray-600">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700">
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-1">Rule</th>
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-1">Support</th>
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-1">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(({ antecedent, consequent, support, confidence }, i) => {
            const accepted = support >= minSupport;
            return (
              <tr
                key={i}
                className={accepted ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}
              >
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1 font-mono">
                  {antecedent.join(", ")} → {consequent.join(", ")}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1">{support}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1">
                  {(confidence * 100).toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
