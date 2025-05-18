import React, { useState, useEffect, useRef } from "react";

function getRandomPoints(num, maxX = 10, maxY = 10) {
  const points = [];
  for (let i = 0; i < num; i++) {
    points.push([
      parseFloat((Math.random() * maxX).toFixed(3)),
      parseFloat((Math.random() * maxY).toFixed(3)),
    ]);
  }
  return points;
}

function distance(p1, p2) {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
}

function mean(points) {
  if (points.length === 0) return [0, 0];
  const sum = points.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
    [0, 0]
  );
  return [sum[0] / points.length, sum[1] / points.length];
}

const centroidColors = [
  "bg-red-600",
  "bg-green-600",
  "bg-blue-600",
  "bg-yellow-500",
  "bg-purple-600",
  "bg-pink-600",
  "bg-cyan-600",
  "bg-orange-600",
  "bg-teal-600",
  "bg-lime-600",
];

export default function KMeans() {
  const [points, setPoints] = useState([]);
  const [k, setK] = useState(3);
  const [initialCentroids, setInitialCentroids] = useState([]);
  const [history, setHistory] = useState([]);
  const [animating, setAnimating] = useState(false);
  const [currentIterationIndex, setCurrentIterationIndex] = useState(-1);
  const [typedDistances, setTypedDistances] = useState([]);
  const typingTimeout = useRef(null);

  const formatPoint = (p) => `(${p[0].toFixed(3)}, ${p[1].toFixed(3)})`;

  const init = () => {
    if (animating) return;
    const pts = getRandomPoints(10);
    setPoints(pts);
    const initCent = pts.slice(0, k);
    setInitialCentroids(initCent);
    setHistory([]);
    setCurrentIterationIndex(-1);
    setTypedDistances([]);
  };

  const assignLabels = (points, centroids) => {
    return points.map((p) => {
      let minDist = Infinity;
      let label = null;
      centroids.forEach((c, i) => {
        const dist = distance(p, c);
        if (dist < minDist) {
          minDist = dist;
          label = i;
        }
      });
      return label;
    });
  };

  const computeCentroids = (points, labels, k) => {
    const newCentroids = [];
    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, idx) => labels[idx] === i);
      newCentroids.push(mean(clusterPoints));
    }
    return newCentroids;
  };

  const hasConverged = (oldC, newC) => {
    for (let i = 0; i < oldC.length; i++) {
      if (distance(oldC[i], newC[i]) > 0.0001) return false;
    }
    return true;
  };

  // Prepare history data (all iterations) before animation
  const prepareHistory = () => {
    let centroids = [...initialCentroids];
    const newHistory = [];
    let iteration = 0;

    while (true) {
      iteration++;
      const distancesMatrix = points.map((p) =>
        centroids.map((c) => distance(p, c))
      );

      const labels = assignLabels(points, centroids);

      const newCentroids = computeCentroids(points, labels, k);

      // Collect points for each cluster for display
      const clustersPoints = [];
      for (let i = 0; i < k; i++) {
        clustersPoints.push(points.filter((_, idx) => labels[idx] === i));
      }

      newHistory.push({
        iteration,
        oldCentroids: centroids.map((c) => [...c]),
        labels,
        distances: distancesMatrix,
        newCentroids,
        clustersPoints,
      });

      if (hasConverged(centroids, newCentroids)) break;

      centroids = newCentroids;
    }

    return newHistory;
  };

  // Animate the typing of distances in each iteration
  const animateIterations = async (fullHistory) => {
    setAnimating(true);
    setHistory(fullHistory);
    setTypedDistances([]);
    setCurrentIterationIndex(-1);

    for (let i = 0; i < fullHistory.length; i++) {
      setCurrentIterationIndex(i);
      const { distances } = fullHistory[i];

      // Flatten all distances in iteration to a single array of strings to animate typing
      const flatDistances = distances.flat().map((d) => d.toFixed(3));
      const typed = Array(flatDistances.length).fill("");

      // Animate typing each value with delay
      for (let j = 0; j < flatDistances.length; j++) {
        await new Promise((res) => setTimeout(res, 50)); // typing speed per value
        typed[j] = flatDistances[j];
        setTypedDistances([...typed]);
      }
      // Wait a bit after finishing this iteration before next
      await new Promise((res) => setTimeout(res, 300));
    }

    setAnimating(false);
  };

  // Start the full process and animate
  const runAndAnimate = async () => {
    if (animating || points.length === 0) return;
    const fullHistory = prepareHistory();
    await animateIterations(fullHistory);
  };

  useEffect(() => {
    init();
  }, [k]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">K-Means Clustering</h1>

      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <label className="text-gray-700 dark:text-gray-300">
          Number of clusters (k):
          <input
            type="number"
            min={2}
            max={10}
            value={k}
            onChange={(e) =>
              setK(Math.min(10, Math.max(2, Number(e.target.value))))
            }
            className="ml-2 p-1 border rounded dark:bg-gray-700 dark:text-white"
            disabled={animating}
          />
        </label>

        <button
          onClick={init}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={animating}
        >
          Generate Random Points
        </button>

        <button
          onClick={runAndAnimate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          disabled={animating || points.length === 0}
        >
          {animating ? "Calculating..." : "Start Until Convergence"}
        </button>
      </div>

      {points.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Points:</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {points.map((p, i) => (
              <div
                key={i}
                className="px-3 py-1 rounded text-sm border border-gray-400 text-gray-800 dark:border-gray-600 dark:text-gray-200"
                title={`Point ${formatPoint(p)}`}
              >
                P{i}: {formatPoint(p)}
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4 dark:text-white">History (Distance Tables):</h2>

          <div className="space-y-8">
            {history.map(
              (
                { iteration, oldCentroids, distances, newCentroids, labels, clustersPoints },
                i
              ) => {
                // Typed distances for this iteration (flat)
                const typed = typedDistances.length
                  ? typedDistances
                  : Array(distances.flat().length).fill("");
                // Show typed values only for current iteration
                const isCurrent = currentIterationIndex === i;

                // We will show typed distances only for the current iteration, else show full values
                const displayedDistances = isCurrent
                  ? typed
                  : distances.flat().map((d) => d.toFixed(3));

                // Render distances per row & col from flat displayedDistances
                let index = 0;

                return (
                  <div
                    key={iteration}
                    className="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <h3 className="font-bold mb-2 dark:text-white">Iteration {iteration}</h3>

                    {/* Old (used) centroids above */}
                    <div className="mb-4 flex gap-4 flex-wrap">
                      {oldCentroids.map((c, ci) => (
                        <div
                          key={"old-" + ci}
                          className={`px-3 py-2 rounded text-white text-sm font-semibold ${centroidColors[ci]}`}
                          title={`Used Centroid ${ci}`}
                        >
                          Used C{ci}: {formatPoint(c)}
                        </div>
                      ))}
                    </div>

                    {/* Distance Table */}
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-400 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-gray-200">
                            Point
                          </th>
                          {oldCentroids.map((_, ci) => (
                            <th
                              key={ci}
                              className="border-b border-gray-400 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-gray-200"
                            >
                              C{ci}
                            </th>
                          ))}
                          <th className="border-b border-gray-400 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-gray-200">
                            Cluster Assignment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {points.map((p, pi) => (
                          <tr
                            key={pi}
                            className={`${
                              pi % 2 === 0
                                ? "bg-gray-100 dark:bg-gray-700"
                                : "bg-white dark:bg-gray-900"
                            }`}
                          >
                            <td className="border-b border-gray-300 dark:border-gray-700 px-4 py-2 font-mono text-gray-900 dark:text-gray-200">
                              {formatPoint(p)}
                            </td>
                            {oldCentroids.map((_, ci) => {
                              const val = displayedDistances[index] || "";
                              index++;
                              return (
                                <td
                                  key={ci}
                                  className="border-b border-gray-300 dark:border-gray-700 px-4 py-2 font-mono text-gray-900 dark:text-gray-200"
                                >
                                  {val}
                                </td>
                              );
                            })}
                            <td className="border-b border-gray-300 dark:border-gray-700 px-4 py-2 font-mono text-gray-900 dark:text-gray-200 font-semibold">
                              C{labels[pi]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* New (found) centroids below */}
                    <div className="mt-4 flex gap-4 flex-wrap">
                      {newCentroids.map((c, ci) => (
                        <div
                          key={"new-" + ci}
                          className={`px-3 py-2 rounded text-white text-sm font-semibold ${centroidColors[ci]}`}
                          title={`New Centroid ${ci}`}
                        >
                                                   New C{ci}: {formatPoint(c)}
                        </div>
                      ))}
                    </div>

                    {/* Show points assigned to each cluster */}
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2 dark:text-white">Points in each cluster:</h4>
                      <div className="flex flex-wrap gap-6">
                        {clustersPoints.map((clusterPts, ci) => (
                          <div
                            key={"cluster-points-" + ci}
                            className={`p-3 rounded border ${centroidColors[ci]} bg-opacity-20 dark:bg-opacity-30`}
                          >
                            <div className={`font-semibold mb-1 text-sm ${centroidColors[ci]}`}>
                              Cluster {ci}
                            </div>
                            <ul className="text-xs font-mono max-w-xs max-h-32 overflow-auto">
                              {clusterPts.length > 0 ? (
                                clusterPts.map((pt, idx) => (
                                  <li key={idx}>{formatPoint(pt)}</li>
                                ))
                              ) : (
                                <li className="italic text-gray-500 dark:text-gray-400">No points</li>
                              )}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}

