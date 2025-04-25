"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { GraphData, Link, Node, RELATION_TYPE_COLORS, RELATION_TYPE_LABELS, STRENGTH_CLASS_COLORS } from "../types/graph";

interface GraphVisualizerProps {
  data: GraphData;
  width?: number;
  height?: number;
  darkMode?: boolean;
  showLabels?: boolean;
  showRelationTypes?: boolean;
  nodeSize?: number;
  linkStrength?: number;
  chargeStrength?: number;
  onNodeClick?: (node: Node) => void;
  onLinkClick?: (link: Link) => void;
}

/**
 * D3.js kullanarak grafik görselleştirme bileşeni
 */
const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  data,
  width = 800,
  height = 600,
  darkMode = true,
  showLabels = true,
  showRelationTypes = true,
  nodeSize = 15,
  linkStrength = 100,
  chargeStrength = -300,
  onNodeClick,
  onLinkClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Render öncesi kontroller
  useEffect(() => {
    // Veri kontrolleri - konsola yazdır
    console.log("Grafik veri kontrolü:", {
      nodes: data.nodes.length,
      links: data.links.length,
      nodesSample: data.nodes.slice(0, 2),
      linksSample: data.links.slice(0, 2)
    });
    
    setIsClient(true);
  }, [data]);

  useEffect(() => {
    if (!isClient || !svgRef.current) return;
    
    // SVG temizle ve baştan oluştur
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // SVG boyutlarını al
    const svgWidth = width;
    const svgHeight = height;
    
    // Renk paleti
    const colorScheme = darkMode
      ? ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5']
      : d3.schemeCategory10;
    const color = d3.scaleOrdinal(colorScheme);
    
    // Ana container
    const container = svg.append("g")
      .attr("class", "graph-container");
    
    // Arkaplan ekle ve çift tıklama olayını dinle
    container.append("rect")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all");
    
    // Özel zoom davranışı
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 8])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Bağlantılar için container - ÖNEMLİ: Düğümlerden ÖNCE çizilmelidir
    const linkContainer = container.append("g")
      .attr("class", "links-container");
    
    // Düğümler için container
    const nodeContainer = container.append("g")
      .attr("class", "nodes-container");
    
    // Önce bağlantıları çiz
    const links = linkContainer
      .selectAll<SVGLineElement, Link>(".link")
      .data(data.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", d => {
        if (d.type && RELATION_TYPE_COLORS[d.type]) {
          return RELATION_TYPE_COLORS[d.type];
        }
        if (d.strengthClass && typeof d.strengthClass === 'string') {
          switch (d.strengthClass) {
            case 'weak': return STRENGTH_CLASS_COLORS.weak;
            case 'moderate': return STRENGTH_CLASS_COLORS.moderate;
            case 'strong': return STRENGTH_CLASS_COLORS.strong;
            case 'very-strong': return STRENGTH_CLASS_COLORS['very-strong'];
            default: return darkMode ? "#666" : "#999";
          }
        }
        return darkMode ? "#666" : "#999";
      })
      .attr("stroke-width", d => {
        const value = d.value || 0.5;
        return Math.max(Math.sqrt(value) * 4, 2); // En az 2px kalınlık
      })
      .attr("stroke-opacity", 0.9) // Çok yüksek opaklık
      .attr("stroke-linecap", "round")
      .style("pointer-events", "all")
      .on("click", (event, d) => {
        if (onLinkClick) onLinkClick(d);
      })
      .on("mouseover", function() {
        d3.select(this)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", function() {
            const d = d3.select(this).datum() as Link;
            const value = d.value || 0.5;
            return Math.max(Math.sqrt(value) * 6, 4); // Hover'da daha kalın
          });
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke-opacity", 0.9)
          .attr("stroke-width", function() {
            const d = d3.select(this).datum() as Link;
            const value = d.value || 0.5;
            return Math.max(Math.sqrt(value) * 4, 2);
          });
      });

    // İlişki etiketleri (optional)
    if (showRelationTypes) {
      linkContainer
        .selectAll<SVGTextElement, Link>(".link-label")
        .data(data.links)
        .enter()
        .append("text")
        .attr("class", "link-label")
        .attr("font-size", "9px")
        .attr("fill", darkMode ? "#ddd" : "#555")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("dy", -5)
        .text(d => {
          if (d.type && RELATION_TYPE_LABELS[d.type]) {
            return RELATION_TYPE_LABELS[d.type];
          }
          return d.label || "";
        });
    }
    
    // Sonra düğümleri çiz
    const nodes = nodeContainer
      .selectAll<SVGGElement, Node>(".node")
      .data(data.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .on("click", (event, d) => {
        if (onNodeClick) onNodeClick(d);
      });
    
    // Düğüm çemberleri
    nodes.append("circle")
      .attr("r", nodeSize)
      .attr("fill", (d, i) => d.color || color(i.toString()))
      .attr("stroke", darkMode ? "#fff" : "#333")
      .attr("stroke-width", 2)
      .style("filter", darkMode ? "drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))" : "none");
    
    // Düğüm etiketleri
    if (showLabels) {
      nodes.append("text")
        .text(d => d.label || d.id)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("dy", nodeSize + 12)
        .attr("fill", darkMode ? "#fff" : "#333")
        .attr("pointer-events", "none");
    }
    
    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "absolute hidden p-2 bg-black/80 text-white text-xs rounded shadow-lg z-50")
      .style("pointer-events", "none");
    
    // Etkileşim efektleri
    nodes.on("mouseover", function(event, d: Node) {
      // Tooltip göster
      tooltip.classed("hidden", false)
        .html(`<strong>${d.label || d.id}</strong>${d.title ? `<br/>${d.title}` : ''}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
      
      // Bu düğümü vurgula
      d3.select(this).select("circle")
        .attr("stroke", "#ffcc00")
        .attr("stroke-width", 3)
        .style("filter", "drop-shadow(0 0 5px rgba(255, 204, 0, 0.7))");
      
      // Bağlantılı düğümleri bul
      const connectedNodes = new Set<string>();
      const nodeId = d.id;
      
      data.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (sourceId === nodeId) {
          connectedNodes.add(targetId);
        } else if (targetId === nodeId) {
          connectedNodes.add(sourceId);
        }
      });
      
      // Bağlantılı düğümleri vurgula
      nodeContainer.selectAll<SVGGElement, Node>(".node").each(function() {
        const nodeData = d3.select(this).datum() as Node;
        const isConnected = nodeData.id === nodeId || connectedNodes.has(nodeData.id);
        d3.select(this).select("circle")
          .style("opacity", isConnected ? 1 : 0.3);
      });
      
      // İlgili bağlantıları vurgula
      linkContainer.selectAll<SVGLineElement, Link>(".link").each(function() {
        const linkData = d3.select(this).datum() as Link;
        const sourceId = typeof linkData.source === 'object' ? linkData.source.id : linkData.source;
        const targetId = typeof linkData.target === 'object' ? linkData.target.id : linkData.target;
        const isRelated = sourceId === nodeId || targetId === nodeId;
        
        d3.select(this)
          .style("opacity", isRelated ? 1 : 0.1)
          .style("stroke-width", function() {
            if (isRelated) {
              const value = linkData.value || 0.5;
              return Math.max(Math.sqrt(value) * 6, 4);
            }
            return d3.select(this).attr("stroke-width");
          });
      });
    }).on("mouseout", function() {
      // Tooltip gizle
      tooltip.classed("hidden", true);
      
      // Düğüm stilini geri yükle
      d3.select(this).select("circle")
        .attr("stroke", darkMode ? "#fff" : "#333")
        .attr("stroke-width", 2)
        .style("filter", darkMode ? "drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))" : "none");
      
      // Tüm düğümlerin ve bağlantıların stilini geri yükle
      nodeContainer.selectAll(".node circle").style("opacity", 1);
      linkContainer.selectAll<SVGLineElement, Link>(".link")
        .style("opacity", 0.9)
        .style("stroke-width", function() {
          const d = d3.select(this).datum() as Link;
          const value = d.value || 0.5;
          return Math.max(Math.sqrt(value) * 4, 2);
        });
    });
    
    // Düğümleri sürüklemek için davranış
    const drag = d3.drag<SVGGElement, Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
    
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, unknown>, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: d3.D3DragEvent<SVGGElement, Node, unknown>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: d3.D3DragEvent<SVGGElement, Node, unknown>, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    nodes.call(drag);
    
    // Simülasyon
    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force("link", d3.forceLink<Node, Link>(data.links).id(d => d.id).distance(linkStrength * 2))
      .force("charge", d3.forceManyBody().strength(chargeStrength * 3))
      .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2))
      .force("x", d3.forceX(svgWidth / 2).strength(0.05))
      .force("y", d3.forceY(svgHeight / 2).strength(0.05))
      .force("collision", d3.forceCollide().radius(nodeSize * 3));
    
    // Her an güncelleme (tick)
    simulation.on("tick", () => {
      // Bağlantı konumlarını güncelle
      links
        .attr("x1", (d: Link) => (d.source && typeof d.source === 'object' && d.source.x ? d.source.x : svgWidth/2).toString())
        .attr("y1", (d: Link) => (d.source && typeof d.source === 'object' && d.source.y ? d.source.y : svgHeight/2).toString())
        .attr("x2", (d: Link) => (d.target && typeof d.target === 'object' && d.target.x ? d.target.x : svgWidth/2).toString())
        .attr("y2", (d: Link) => (d.target && typeof d.target === 'object' && d.target.y ? d.target.y : svgHeight/2).toString());
      
      // Düğüm konumlarını güncelle
      nodes.attr("transform", (d: Node) => `translate(${d.x || 0},${d.y || 0})`);
      
      // Etiket konumlarını güncelle (eğer görünürlerse)
      if (showRelationTypes) {
        linkContainer.selectAll<SVGTextElement, Link>(".link-label")
          .attr("x", (d: Link) => {
            const sourceX = typeof d.source === 'object' ? d.source.x || 0 : 0;
            const targetX = typeof d.target === 'object' ? d.target.x || 0 : 0;
            return ((sourceX + targetX) / 2).toString();
          })
          .attr("y", (d: Link) => {
            const sourceY = typeof d.source === 'object' ? d.source.y || 0 : 0;
            const targetY = typeof d.target === 'object' ? d.target.y || 0 : 0;
            return ((sourceY + targetY) / 2).toString();
          });
      }
    });

    // Temizlik işlevi
    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [
    data, 
    isClient, 
    width, 
    height, 
    darkMode, 
    showLabels, 
    showRelationTypes, 
    nodeSize, 
    linkStrength, 
    chargeStrength, 
    onNodeClick, 
    onLinkClick
  ]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="w-full h-full border-0 rounded-md"
      style={{ cursor: "grab", background: darkMode ? "#111" : "#fff" }}
    />
  );
};

export default GraphVisualizer; 