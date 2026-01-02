import React, { useMemo } from "react";
import { Scatter } from "react-chartjs-2";
import { Chart, PointElement, LinearScale, Title, Tooltip, Legend } from "chart.js";

Chart.register(PointElement, LinearScale, Title, Tooltip, Legend);

// Professional Palette (Paper Pro inspired)
const palette = [
  "rgba(99, 102, 241, 0.8)",   // Indigo (Accent)
  "rgba(16, 185, 129, 0.8)",   // Emerald
  "rgba(245, 158, 11, 0.8)",   // Amber
  "rgba(236, 72, 153, 0.8)",   // Pink
  "rgba(6, 182, 212, 0.8)",    // Cyan
  "rgba(139, 92, 246, 0.8)",   // Violet
  "rgba(244, 63, 94, 0.8)",    // Rose
  "rgba(132, 204, 22, 0.8)",   // Lime
  "rgba(14, 165, 233, 0.8)",   // Sky
  "rgba(234, 179, 8, 0.8)",    // Yellow
];

export default function KMeansChart({ points, labels, centroids }) {
  // Use useMemo to avoid re-calculating data on every render unless props change
  const data = useMemo(() => {
    const clusterData = centroids.map((_, clusterIdx) => {
      const clusterPoints = points
        .map((p, i) => (labels[i] === clusterIdx ? { x: p[0], y: p[1] } : null))
        .filter(Boolean);
      return {
        label: `Cluster ${clusterIdx}`,
        data: clusterPoints,
        backgroundColor: palette[clusterIdx % palette.length],
        pointRadius: 6,
        pointHoverRadius: 8,
      };
    });

    const centroidData = {
      label: "Centroids",
      data: centroids.map((c) => ({ x: c[0], y: c[1] })),
      backgroundColor: "black", // Keep black for strong contrast, or use a dark distinct color
      borderColor: "white",
      borderWidth: 2,
      pointStyle: "rectRot", // Diamond shape
      pointRadius: 10,
      pointHoverRadius: 12,
    };

    return { datasets: [...clusterData, centroidData] };
  }, [points, labels, centroids]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          font: { family: "Inter, system-ui, sans-serif", size: 12 }
        }
      },
      title: {
        display: false, // We have external title
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        cornerRadius: 8,
        titleFont: { family: "Inter, system-ui, sans-serif" },
        bodyFont: { family: "Inter, system-ui, sans-serif" },
      }
    },
    scales: {
      x: {
        title: { display: true, text: "X Axis", font: { weight: 'bold' }, color: '#94a3b8' },
        grid: { color: 'rgba(128, 128, 128, 0.2)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        title: { display: true, text: "Y Axis", font: { weight: 'bold' }, color: '#94a3b8' },
        grid: { color: 'rgba(128, 128, 128, 0.2)' },
        ticks: { color: '#94a3b8' }
      },
    },
  };

  return (
    <div className="w-full h-[400px] sm:h-[500px]">
      <Scatter data={data} options={options} />
    </div>
  );
}
