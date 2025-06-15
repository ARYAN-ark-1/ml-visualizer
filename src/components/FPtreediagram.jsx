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
      setIsMobile(window.innerWidth <= 768); // Adjust breakpoint as needed
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!root) return;

    const data = convertToD3Tree(root);

    const margin = isMobile
      ? { top: 40, right: 50, bottom: 40, left: 50 }
      : { top: 60, right: 100, bottom: 60, left: 100 };

    const width = isMobile ? 600 : 1000;
    const height = isMobile ? 400 : 600;

    const treeData = d3.hierarchy(data);
    const treeLayout = d3.tree().size([width, height]);
    treeLayout(treeData);

    d3.select(svgRef.current).selectAll("*").remove(); // Clear svg

    const svg = d3
      .select(svgRef.current)
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw links
    svg
      .selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
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

    const radius = isMobile ? 30 : 38;

    node
      .append("circle")
      .attr("r", radius)
      .attr("fill", (d) => (d.data.name === "null" ? "#e2e8f0" : "#34d399"))
      .attr("stroke", "#065f46")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#111827")
      .style("font-size", isMobile ? "12px" : "14px")
      .style("font-weight", "bold")
      .text((d) =>
        d.data.name === "null" ? "Root" : `${d.data.name} (${d.data.count})`
      );
  }, [root, isMobile]);

  return (
    <div className="my-10 w-full overflow-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">FP-Tree Diagram (D3)</h2>
      <div className="w-full border rounded-lg bg-white dark:bg-gray-900 p-4">
        <svg ref={svgRef} className="w-full h-auto" />
      </div>
    </div>
  );
};

export default FPTreeDiagramD3;
