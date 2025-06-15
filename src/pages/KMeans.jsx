import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import KMeansChart from "../components/KMeansChart";

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
  const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

const centroidColors = [
  "bg-red-600", "bg-green-600", "bg-blue-600", "bg-yellow-500",
  "bg-purple-600", "bg-pink-600", "bg-cyan-600", "bg-orange-600",
  "bg-teal-600", "bg-lime-600",
];

export default function KMeans() {
  const [points, setPoints] = useState([]);
  const [k, setK] = useState(3);
  const [numPoints, setNumPoints] = useState(10);
  const [initialCentroids, setInitialCentroids] = useState([]);
  const [history, setHistory] = useState([]);

  const formatPoint = (p) => `(${p[0].toFixed(3)}, ${p[1].toFixed(3)})`;

  const init = () => {
    const pts = getRandomPoints(numPoints);
    setPoints(pts);
    setInitialCentroids(pts.slice(0, k));
    setHistory([]);
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

  const runKMeans = () => {
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

      newHistory.push({
        iteration,
        oldCentroids: centroids.map((c) => [...c]),
        labels,
        distances: distancesMatrix,
        newCentroids,
      });

      if (hasConverged(centroids, newCentroids)) break;
      centroids = newCentroids;
    }

    setHistory(newHistory);
  };

  useEffect(() => {
    init();
  }, [k]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Navbar />

      <main className="flex-grow pt-24 md:pt-32 lg:pt-44 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">K-Means Clustering</h1>

        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-base sm:text-lg">
            <span>No. of clusters (k):</span>
            <input
              type="number"
              min={2}
              max={10}
              value={k}
              onChange={(e) =>
                setK(Math.min(10, Math.max(2, Number(e.target.value))))
              }
              className="p-2 border rounded dark:bg-gray-700 w-20 text-center"
            />
          </label>

          <label className="flex items-center gap-2 text-base sm:text-lg">
            <span>No. of points:</span>
            <input
              type="number"
              min={5}
              max={50}
              value={numPoints}
              onChange={(e) =>
                setNumPoints(Math.min(50, Math.max(5, Number(e.target.value))))
              }
              className="p-2 border rounded dark:bg-gray-700 w-20 text-center"
            />
          </label>

          <button
            onClick={init}
            className="px-5 py-2 text-base sm:text-lg bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Generate Random Points
          </button>

          <button
            onClick={runKMeans}
            className="px-5 py-2 text-base sm:text-lg bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Run K-Means
          </button>
        </div>

        {points.length > 0 && (
          <>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Points:</h2>
            <div className="flex flex-wrap gap-3 mb-8">
              {points.map((p, i) => (
                <div
                  key={i}
                  className="px-3 py-1 rounded text-sm sm:text-base border border-gray-400 dark:border-gray-600"
                >
                  P{i}: {formatPoint(p)}
                </div>
              ))}
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold mb-6">Iterations:</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {history.map(({ iteration, oldCentroids, distances, labels }, i) => (
                <div
                  key={iteration}
                  className="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded p-4 bg-white dark:bg-gray-800 shadow-md"
                >
                  <h3 className="font-bold mb-3 text-lg sm:text-xl">Iteration {iteration}</h3>

                  <div className="mb-4 flex gap-2 flex-wrap">
                    {oldCentroids.map((c, ci) => (
                      <div
                        key={"old-" + ci}
                        className={`px-3 py-1 rounded text-white text-sm sm:text-base ${centroidColors[ci]}`}
                      >
                        C{ci}: {formatPoint(c)}
                      </div>
                    ))}
                  </div>

                  <table className="min-w-full text-left text-sm sm:text-base">
                    <thead>
                      <tr>
                        <th className="border-b px-3 py-2">Point</th>
                        {oldCentroids.map((_, ci) => (
                          <th key={ci} className="border-b px-3 py-2">
                            C{ci}
                          </th>
                        ))}
                        <th className="border-b px-3 py-2">Cluster</th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map((p, pi) => (
                        <tr
                          key={pi}
                          className="odd:bg-gray-100 dark:odd:bg-gray-700"
                        >
                          <td className="border-b px-3 py-2 font-mono">{formatPoint(p)}</td>
                          {oldCentroids.map((_, ci) => (
                            <td
                              key={ci}
                              className="border-b px-3 py-2 font-mono"
                            >
                              {distances[pi][ci].toFixed(3)}
                            </td>
                          ))}
                          <td className="border-b px-3 py-2 font-bold">
                            C{labels[pi]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <>
                <h2 className="text-xl sm:text-2xl font-semibold mt-10 mb-4">Final Result Visualization:</h2>
                <KMeansChart
                  points={points}
                  labels={history[history.length - 1].labels}
                  centroids={history[history.length - 1].newCentroids}
                />
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
