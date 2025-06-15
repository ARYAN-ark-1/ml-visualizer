import React from "react";

export default function ItemsetTable({ title, data, minSupport }) {
  if (!data || data.length === 0) return null;

  // Check if all itemsets are rejected (support < minSupport)
  const allRejected = data.every(({ support }) => support < minSupport);
  if (allRejected) return null;

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <table className="min-w-full text-left border-collapse border border-gray-300 dark:border-gray-600">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700">
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-1">Itemset</th>
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-1">Support</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ itemset, support }, idx) => {
            const accepted = support >= minSupport;
            return (
              <tr
                key={idx}
                className={accepted ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}
              >
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1 font-mono">
                  {itemset.join(", ")}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1">{support}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
