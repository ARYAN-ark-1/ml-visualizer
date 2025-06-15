import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import Footer from "../components/Footer";

function getRandomPoints(num, maxX = 10, maxY = 10) {
  const points = [];
  for (let i = 0; i < num; i++) {
    points.push([
      parseFloat((Math.random() * maxX).toFixed(2)),
      parseFloat((Math.random() * maxY).toFixed(2)),
    ]);
  }
  return points;
}

function distance(p1, p2) {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
}

function getCentroid(points) {
  const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function formatPoint(p) {
  return `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`;
}

function buildDendrogramTree(history, initialLabels) {
  if (history.length === 0) {
    return { name: initialLabels[0] };
  }

  const nodesMap = new Map();
  initialLabels.forEach((label) => {
    nodesMap.set(label, { name: label, children: [] });
  });

  history.forEach(({ merge, labels }) => {
    const [i, j] = merge;
    const nameI = labels[i];
    const nameJ = labels[j];
    const mergedName = `${nameI},${nameJ}`;
    const newNode = {
      name: mergedName,
      children: [nodesMap.get(nameI), nodesMap.get(nameJ)],
    };
    nodesMap.set(mergedName, newNode);
    nodesMap.delete(nameI);
    nodesMap.delete(nameJ);
  });

  return Array.from(nodesMap.values())[0];
}

export default function Hierarchical() {
  const [points, setPoints] = useState([]);
  const [matrixHistory, setMatrixHistory] = useState([]);
  const [numPoints, setNumPoints] = useState(6);
  const [rootNode, setRootNode] = useState(null);
  const [showClustering, setShowClustering] = useState(false);
  const svgRef = useRef(null);

  const generatePoints = () => {
    const pts = getRandomPoints(numPoints);
    setPoints(pts);
    setMatrixHistory([]);
    setRootNode(null);
    setShowClustering(false);
  };

  const runClustering = () => {
    let clusters = points.map((p, i) => ({
      name: `C${i}`,
      points: [p],
    }));

    const history = [];

    while (clusters.length > 1) {
      const distMatrix = [];
      for (let i = 0; i < clusters.length; i++) {
        const row = [];
        for (let j = 0; j < clusters.length; j++) {
          if (i === j) {
            row.push(null);
          } else {
            const centroidA = getCentroid(clusters[i].points);
            const centroidB = getCentroid(clusters[j].points);
            row.push(distance(centroidA, centroidB));
          }
        }
        distMatrix.push(row);
      }

      let min = Infinity;
      let minI = -1;
      let minJ = -1;
      for (let i = 0; i < distMatrix.length; i++) {
        for (let j = 0; j < distMatrix.length; j++) {
          if (distMatrix[i][j] !== null && distMatrix[i][j] < min) {
            min = distMatrix[i][j];
            minI = i;
            minJ = j;
          }
        }
      }

      const newCluster = {
        name: `${clusters[minI].name},${clusters[minJ].name}`,
        points: [...clusters[minI].points, ...clusters[minJ].points],
      };

      const newClusters = clusters.filter(
        (_, idx) => idx !== minI && idx !== minJ
      );
      newClusters.push(newCluster);

      history.push({
        matrix: distMatrix,
        merge: [minI, minJ],
        labels: clusters.map((c) => c.name),
      });

      clusters = newClusters;
    }

    setMatrixHistory(history);
    const treeRoot = buildDendrogramTree(history, points.map((_, i) => `C${i}`));
    setRootNode(treeRoot);
    setShowClustering(true);
  };

  useEffect(() => {
    if (!rootNode) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 900;
    const height = 700;
    const margin = 50;

    const root = d3.hierarchy(rootNode);
    const clusterLayout = d3.cluster().size([width - 2 * margin, height - 2 * margin]);
    clusterLayout(root);

    root.descendants().forEach(d => (d.y = height - 2 * margin - d.y));

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "100%");

    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d) => d.x + margin)
          .y((d) => d.y + margin)
      );

    const nodeGroup = svg
      .append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.x + margin},${d.y + margin})`);

    nodeGroup
      .append("circle")
      .attr("fill", (d) => (d.children ? "#555" : "#999"))
      .attr("r", 6);

    nodeGroup
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => (d.children ? -10 : 10))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .attr("font-size", "0.8rem")
      .text((d) => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke", "white");
  }, [rootNode]);

  useEffect(() => {
    generatePoints();
  }, [numPoints]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="min-h-screen p-4 max-w-7xl mx-auto mt-20">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Hierarchical Clustering (Agglomerative)
        </h1>

        <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <label className="text-lg flex items-center gap-2">
            Number of points (2-10):
            <input
              type="number"
              min={2}
              max={10}
              value={numPoints}
              onChange={(e) =>
                setNumPoints(Math.min(10, Math.max(2, Number(e.target.value))))
              }
              className="ml-2 p-1 rounded border dark:bg-gray-700 dark:text-white w-20 text-center"
            />
          </label>
          <button
            onClick={runClustering}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition w-full sm:w-auto"
          >
            Generate & Run
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-2">Initial Points:</h2>
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {points.map((p, i) => (
            <div
              key={i}
              className="px-3 py-1 rounded text-sm sm:text-base border border-gray-400 dark:border-gray-600"
            >
              P{i}: {formatPoint(p)}
            </div>
          ))}
        </div>

        {showClustering && (
          <>
            <h2 className="text-xl font-semibold mb-4">Merge Steps:</h2>
            <div className="overflow-x-auto max-w-full mb-10">
              {matrixHistory.map(({ matrix, merge, labels }, idx) => (
                <div
                  key={idx}
                  className="mb-6 border rounded p-4 bg-white dark:bg-gray-800 shadow-md"
                >
                  <h3 className="text-lg font-bold mb-3">Iteration {idx + 1}</h3>
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="border-b px-2 py-1"> </th>
                        {labels.map((label, j) => (
                          <th
                            key={j}
                            className={`border-b px-2 py-1 ${merge.includes(j)
                                ? "bg-yellow-200 dark:bg-yellow-700"
                                : ""
                              }`}
                          >
                            {labels[j]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row, i) => (
                        <tr key={i}>
                          <td
                            className={`border px-2 py-1 ${merge.includes(i)
                                ? "bg-yellow-200 dark:bg-yellow-700"
                                : ""
                              }`}
                          >
                            {labels[i]}
                          </td>
                          {row.map((val, j) => (
                            <td
                              key={j}
                              className={`border px-2 py-1 text-center ${merge.includes(i) || merge.includes(j)
                                  ? "bg-yellow-100 dark:bg-yellow-800"
                                  : ""
                                }`}
                            >
                              {val === null ? "-" : val.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-sm italic">
                    Merging clusters: {labels[merge[0]]} &amp; {labels[merge[1]]}
                  </p>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-semibold mb-4">Dendrogram:</h2>
            <div className="w-full h-[400px] sm:h-[550px] md:h-[650px] lg:h-[750px] border rounded bg-white dark:bg-gray-800 overflow-auto">
              <svg ref={svgRef} style={{ width: "110%", height: "110%" }}></svg>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
