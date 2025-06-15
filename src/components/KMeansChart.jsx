import React from "react";
import { Scatter } from "react-chartjs-2";
import { Chart, PointElement, LinearScale, Title, Tooltip, Legend } from "chart.js";

Chart.register(PointElement, LinearScale, Title, Tooltip, Legend);

const colors = [
  "rgba(255,99,132,1)", "rgba(54,162,235,1)", "rgba(255,206,86,1)",
  "rgba(75,192,192,1)", "rgba(153,102,255,1)", "rgba(255,159,64,1)",
  "rgba(0,200,83,1)", "rgba(233,30,99,1)", "rgba(255,87,34,1)", "rgba(63,81,181,1)",
];

export default function KMeansChart({ points, labels, centroids }) {
  const clusterData = centroids.map((_, clusterIdx) => {
    const clusterPoints = points
      .map((p, i) => (labels[i] === clusterIdx ? { x: p[0], y: p[1] } : null))
      .filter(Boolean);
    return {
      label: `Cluster ${clusterIdx}`,
      data: clusterPoints,
      backgroundColor: colors[clusterIdx],
    };
  });

  const centroidData = {
    label: "Centroids",
    data: centroids.map((c) => ({ x: c[0], y: c[1] })),
    backgroundColor: "black",
    pointStyle: "triangle",
    radius: 8,
  };

  return (
    <div className="w-full h-[400px] sm:h-[500px]">
      <Scatter
        data={{ datasets: [...clusterData, centroidData] }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "top" },
            title: {
              display: true,
              text: "Final K-Means Clustering Result",
              font: { size: 18 },
            },
          },
          scales: {
            x: { title: { display: true, text: "X" } },
            y: { title: { display: true, text: "Y" } },
          },
        }}
      />
    </div>
  );
}
