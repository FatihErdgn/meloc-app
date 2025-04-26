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
    
    // SVG alanını temizle
    d3.select(svgRef.current).selectAll("*").remove();

    // SVG ayarları
    const svgWidth = width || 800;
    const svgHeight = height || 600;

    // SVG elementi oluştur
    const svg = d3.select(svgRef.current)
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("class", `graph-svg ${darkMode ? "dark" : "light"}`);

    // Zoom davranışı ekle
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Ana konteyner
    const container = svg.append("g");

    // İlk konumu ortala
    container.attr("transform", `translate(0, 0)`);
    
    // Bağlantılar için container
    const linkContainer = container.append("g")
      .attr("class", "links-container");
    
    // Düğümler için container
    const nodeContainer = container.append("g")
      .attr("class", "nodes-container");
    
    // Önce bağlantıları çiz
    const linkElements = linkContainer
      .selectAll<SVGLineElement, Link>(".link")
      .data(data.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", d => {
        // İlişki tipine göre renklendirme
        const relationType = d.type || d.relation;
        if (relationType && RELATION_TYPE_COLORS[relationType]) {
          return RELATION_TYPE_COLORS[relationType];
        }
        // İlişki gücüne göre renklendirme (yedek)
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
      .attr("data-relation-type", d => d.type || d.relation || "RELATED_TO")
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

    // İlişki etiketleri (isteğe bağlı)
    let linkLabels: d3.Selection<SVGTextElement, Link, SVGGElement, unknown> | undefined;
    if (showRelationTypes) {
      linkLabels = linkContainer
        .selectAll<SVGTextElement, Link>(".link-label")
        .data(data.links)
        .enter()
        .append("text")
        .attr("class", "link-label")
        .attr("dy", -5)
        .attr("text-anchor", "middle")
        .attr("fill", d => {
          const relationType = d.type || d.relation;
          if (relationType && RELATION_TYPE_COLORS[relationType]) {
            return RELATION_TYPE_COLORS[relationType];
          }
          return darkMode ? "#999" : "#666";
        })
        .attr("font-size", "10px")
        .attr("pointer-events", "none")
        .text(d => {
          const relationType = d.type || d.relation;
          if (relationType && RELATION_TYPE_LABELS[relationType]) {
            return RELATION_TYPE_LABELS[relationType];
          }
          return "İlişkilidir";
        });
    }
    
    // Düğümleri çiz
    const nodeElements = nodeContainer
      .selectAll<SVGGElement, Node>(".node")
      .data(data.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("data-id", d => d.id)
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any
      )
      .on("click", (event, d) => {
        if (onNodeClick) onNodeClick(d);
        event.stopPropagation();
      });

    // Simülasyon
    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force("link", d3.forceLink<Node, Link>(data.links)
        .id(d => (d as Node).id)
        .distance(d => {
          // İlişki türüne göre mesafe ayarı
          const relationType = d.type || d.relation;
          if (relationType) {
            switch (relationType) {
              case "CONTAINS": return 100;
              case "IS_PART_OF": return 100;
              case "IS_A": return 120;
              case "DEPENDS_ON": return 140;
              case "SIMILAR_TO": return 160;
              case "OPPOSITE_OF": return 200;
              case "RELATED_TO": return 180;
              default: return 150;
            }
          }
          // İlişki değerine göre mesafe (yedek)
          return 150 * (1 - (d.value || 0.5));
        })
      )
      .force("charge", d3.forceManyBody().strength(chargeStrength * 3))
      .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2))
      .force("x", d3.forceX(svgWidth / 2).strength(0.01))
      .force("y", d3.forceY(svgHeight / 2).strength(0.01));

    // Düğümlere çember ekle
    nodeElements.append("circle")
      .attr("r", d => d.value ? Math.max(5, Math.sqrt(d.value) * nodeSize) : nodeSize)
      .attr("fill", d => {
        if (d.type === "root") return "#ff6347";
        return darkMode ? "#fff" : "#333";
      })
      .attr("stroke", darkMode ? "#333" : "#eee")
      .attr("stroke-width", 2);

    // Düğümlere metin etiketi ekle (isteğe bağlı)
    if (showLabels) {
      nodeElements.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(d => d.id)
        .attr("fill", darkMode ? "#fff" : "#000")
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", "12px")
        .attr("pointer-events", "none");
    }

    // Drag işlevleri
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Her an güncelleme (tick) fonksiyonu
    function tickFunc() {
      // Bağlantı konumlarını güncelle
      linkElements
        .attr("x1", (d: Link) => (d.source && typeof d.source === 'object' && d.source.x ? d.source.x : svgWidth/2))
        .attr("y1", (d: Link) => (d.source && typeof d.source === 'object' && d.source.y ? d.source.y : svgHeight/2))
        .attr("x2", (d: Link) => (d.target && typeof d.target === 'object' && d.target.x ? d.target.x : svgWidth/2))
        .attr("y2", (d: Link) => (d.target && typeof d.target === 'object' && d.target.y ? d.target.y : svgHeight/2));
      
      // Düğüm konumlarını güncelle
      nodeElements.attr("transform", (d: Node) => `translate(${d.x || 0},${d.y || 0})`);
      
      // İlişki etiketlerini güncelle
      if (showRelationTypes && linkLabels) {
        linkLabels
          .attr("x", (d: Link) => {
            const source = d.source as Node;
            const target = d.target as Node;
            return (source.x! + target.x!) / 2;
          })
          .attr("y", (d: Link) => {
            const source = d.source as Node;
            const target = d.target as Node;
            return (source.y! + target.y!) / 2;
          });
      }
    }

    // Simülasyon başlat
    simulation.on("tick", tickFunc);

    // Temizlik işlevi
    return () => {
      simulation.stop();
    };
  }, [
    data,
    width,
    height,
    isClient,
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
    <div className={`graph-container ${darkMode ? 'dark' : 'light'}`}>
      <svg ref={svgRef} className="graph-svg" />
    </div>
  );
};

export default GraphVisualizer; 