import React from "react";

export default function ItemsetTable({ title, data, minSupport, highlightPruned }) {
  if (!data || data.length === 0) return null;

  // Check if all itemsets are rejected (support < minSupport) AND we are not supposed to show pruned ones explicitly for education
  // Actually, we usually want to show them if they are in the list.
  // The logic "allRejected" seems to be for suppressing empty tables.
  const allRejected = data.every(({ support }) => support < minSupport);
  if (allRejected && !highlightPruned) return null;

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border bg-background/50">
        <h3 className="font-bold text-primary text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="overflow-auto flex-grow max-h-[400px] custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-surface sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 border-b border-border text-secondary font-semibold">Itemset</th>
              <th className="px-5 py-3 border-b border-border text-secondary font-semibold w-24 text-center">Support</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ itemset, support }, idx) => {
              const accepted = support >= minSupport;
              // If highlightPruned is true, we show rejected items in red. If false, maybe they aren't in the list?
              // The parent component filters them usually, unless it's the "Pruning" phase where it passes all candidates.

              const rowClass = accepted
                ? "bg-surface text-primary"
                : highlightPruned
                  ? "bg-error/5 text-muted line-through opacity-70"
                  : "bg-surface text-primary"; // Should not happen if filtered, but fallback

              return (
                <tr
                  key={idx}
                  className={`border-b border-border/50 last:border-0 hover:bg-background transition-colors ${rowClass}`}
                >
                  <td className="px-5 py-3 font-mono text-xs">
                    {itemset.map(i => (
                      <span key={i} className={`inline-block px-1.5 py-0.5 rounded mr-1 ${accepted ? 'bg-accent-highlight text-accent' : 'bg-gray-200 text-gray-500'}`}>
                        {i}
                      </span>
                    ))}
                  </td>
                  <td className="px-5 py-3 text-center font-medium">
                    <span className={accepted ? "text-success" : "text-error"}>
                      {support}
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
