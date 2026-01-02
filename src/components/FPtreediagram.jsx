import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

function convertToD3Tree(node) {
  const convert = (n) => {
    const children = [...n.children.values()].map(convert);
    return {
      name: n.name,
      count: n.count,
      children,
    };
  };
  return convert(node);
}

const FPTreeDiagramD3 = ({ root }) => {
  const svgRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!root) return;

    const data = convertToD3Tree(root);

    const margin = isMobile
      ? { top: 40, right: 20, bottom: 40, left: 20 }
      : { top: 60, right: 50, bottom: 60, left: 50 };

    const width = isMobile ? 400 : 800; // Adjusted for container
    const height = isMobile ? 400 : 600;

    const treeData = d3.hierarchy(data);
    const treeLayout = d3.tree().size([width - margin.left - margin.right, height - margin.top - margin.bottom]);
    treeLayout(treeData);

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove(); // Clear svg

    const svg = svgElement
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left + (width - margin.left - margin.right) / 2 - (treeData.x ? 0 : 0)},${margin.top})`);
    // Centering logic roughly, though tree layout usually handles x/y. 
    // Actually standard tree layout x is within [0, width].

    // Reset transform to standard margin
    svg.attr("transform", `translate(${margin.left},${margin.top})`);


    // Define colors from CSS variables helper or hardcoded to match Paper Pro
    const linkColor = "#cbd5e1"; // Slate-300 (Light border) - could vary by dark mode
    const nodeColor = "#6366f1"; // Indigo-500 (Accent)
    const rootColor = "#94a3b8"; // Slate-400
    const strokeColor = "#e2e8f0"; // Slate-200

    // Draw links
    svg
      .selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "currentColor") // Use currentColor to inherit from parent/class
      .attr("class", "text-border") // TW class for stroke color adaptation? D3 doesn't parse TW classes on SVG props easily for stroke color unless used with currentColor
      // Fallback to explicit colors if we can't easily detect mode in JS without context
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 2)
      .attr("opacity", 0.6)
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d) => d.x)
          .y((d) => d.y)
      );

    // Draw nodes
    const node = svg
      .selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    const radius = isMobile ? 24 : 30;

    node
      .append("circle")
      .attr("r", radius)
      .attr("fill", (d) => (d.data.name === "null" ? rootColor : nodeColor))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))");

    node
      .append("text")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .style("font-size", isMobile ? "10px" : "12px")
      .style("font-weight", "bold")
      .style("pointer-events", "none") // Prevent text selection
      .text((d) =>
        d.data.name === "null" ? "Root" : `${d.data.name}:${d.data.count}`
      );

  }, [root, isMobile]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg ref={svgRef} className="w-full h-auto max-h-full" style={{ minHeight: '400px' }} />
    </div>
  );
};

export default FPTreeDiagramD3;
