"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";

export type TopologyNode = {
  clusterId: number;
  rank: number;
  headline: string;
  category: string;
  score: number;
  freshRecords: number;
  freshSources: number;
  dominantType: string;
  hasNews: boolean;
  hasPrimary: boolean;
  x: number;
  y: number;
};

export type TopologyLink = {
  source: number;
  target: number;
  affinity: number;
  flow: number;
  direction: string;
  flowFrom: number | null;
  flowTo: number | null;
  lagDays: number | null;
  sameCategory: boolean;
  sharedSourceType: boolean;
  basis: string[];
};

type TopologyMapProps = {
  activeSignal: number;
  activeSectionTitle: string;
  selected: number[];
  signalLabels: Record<number, string>;
  visibleSignalIds: number[];
  topologyData: { nodes: TopologyNode[]; links: TopologyLink[] };
  onActivateSignal: (id: number) => void;
  onToggleSignal: (id: number) => void;
};

type PositionedNode = TopologyNode & {
  sx: number;
  sy: number;
  radius: number;
  connected: boolean;
};

const WIDTH = 1000;
const HEIGHT = 600;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };

const sourceColors: Record<string, string> = {
  arxiv: "#83d7f5",
  news: "#ffd166",
  sec: "#f6a6c6",
  ml_community: "#86dfc2",
  corpus: "#aeb8d4",
};

function nodeColor(node: TopologyNode) {
  return sourceColors[node.dominantType] || "#8ea4b8";
}

function connectionLabel(link: TopologyLink) {
  if (link.direction !== "directed" || link.flowFrom === null || link.flowTo === null) return "co-emergent";
  return `${link.flowFrom} → ${link.flowTo}`;
}

function shortHeadline(headline: string) {
  const first = headline.split(" activity")[0].split(" is useful")[0].split(" is showing")[0].split(" may be")[0];
  return first.length > 44 ? `${first.slice(0, 42)}…` : first;
}

export default function TopologyMap({
  activeSignal,
  activeSectionTitle,
  selected,
  signalLabels,
  visibleSignalIds,
  topologyData,
  onActivateSignal,
  onToggleSignal,
}: TopologyMapProps) {
  const [focusedId, setFocusedId] = useState(activeSignal);
  const [layout, setLayout] = useState<"corpus" | "ego">("corpus");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    setFocusedId(activeSignal);
  }, [activeSignal]);

  const nodeById = useMemo(() => new Map(topologyData.nodes.map((node) => [node.clusterId, node])), [topologyData]);
  const EMPTY_NODE: TopologyNode = { clusterId: 0, rank: 0, headline: "", category: "", score: 0, freshRecords: 0, freshSources: 0, dominantType: "corpus", hasNews: false, hasPrimary: false, x: 500, y: 300 };
  const focusedNode = nodeById.get(focusedId) || topologyData.nodes[0] || EMPTY_NODE;
  const focusedLinks = useMemo(
    () => topologyData.links
      .filter((link) => link.source === focusedId || link.target === focusedId)
      .sort((a, b) => b.flow - a.flow || b.affinity - a.affinity),
    [focusedId],
  );

  const positionedNodes = useMemo<PositionedNode[]>(() => {
    const nodes = topologyData.nodes;
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const maxFresh = Math.max(...nodes.map((node) => node.freshRecords), 1);
    const linkMap = new Map<number, TopologyLink>();

    focusedLinks.forEach((link) => {
      const neighborId = link.source === focusedId ? link.target : link.source;
      linkMap.set(neighborId, link);
    });

    return nodes.map((node, index) => {
      const radius = 8 + Math.sqrt(node.freshRecords / maxFresh) * 25;
      const link = linkMap.get(node.clusterId);
      const connected = Boolean(link);

      if (layout === "ego") {
        if (node.clusterId === focusedId) {
          return { ...node, sx: CENTER.x, sy: CENTER.y, radius, connected: true };
        }

        const dx = node.x - focusedNode.x;
        const dy = node.y - focusedNode.y;
        const fallbackAngle = index * 2.399963;
        const angle = Math.abs(dx) + Math.abs(dy) > 0.001 ? Math.atan2(dy, dx) : fallbackAngle;
        const pull = link ? Math.max(link.flow, link.affinity) / 100 : 0;
        const radial = connected ? 118 + (1 - pull) * 205 : 370 + (index % 5) * 31;
        return {
          ...node,
          sx: CENTER.x + Math.cos(angle) * radial,
          sy: CENTER.y + Math.sin(angle) * radial * 0.72,
          radius,
          connected,
        };
      }

      return {
        ...node,
        sx: 56 + ((node.x - minX) / (maxX - minX || 1)) * (WIDTH - 112),
        sy: 52 + ((node.y - minY) / (maxY - minY || 1)) * (HEIGHT - 104),
        radius,
        connected,
      };
    });
  }, [focusedId, focusedLinks, focusedNode.x, focusedNode.y, layout]);

  const positionedById = useMemo(
    () => new Map(positionedNodes.map((node) => [node.clusterId, node])),
    [positionedNodes],
  );

  function focusCluster(id: number) {
    setFocusedId(id);
    setLayout("ego");
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (signalLabels[id]) onActivateSignal(id);
  }

  function resetMap() {
    setFocusedId(activeSignal);
    setLayout("corpus");
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    setZoom((value) => Math.min(1.8, Math.max(0.68, value * (event.deltaY > 0 ? 0.92 : 1.08))));
  }

  function startPan(event: PointerEvent<SVGSVGElement>) {
    if ((event.target as Element).closest(".topology-node")) return;
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePan(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    const scale = WIDTH / Math.max(event.currentTarget.clientWidth, 1);
    setPan({
      x: drag.current.panX + (event.clientX - drag.current.x) * scale,
      y: drag.current.panY + (event.clientY - drag.current.y) * scale,
    });
  }

  function stopPan(event: PointerEvent<SVGSVGElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section className={`topology-workspace ${layout === "ego" ? "is-ego" : "is-corpus"}`} aria-label="Ostrich cluster topology">
      <div className="topology-map">
        <div className="topology-hud">
          <span><b>{layout === "ego" ? "Ego garden" : "Research garden"}</b> · {topologyData.nodes.length} clusters · {topologyData.links.length} paths</span>
          <div className="topology-controls" aria-label="Topology navigation controls">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.68, value / 1.16))} aria-label="Zoom out">−</button>
            <button type="button" onClick={() => setZoom((value) => Math.min(1.8, value * 1.16))} aria-label="Zoom in">+</button>
            <button type="button" className={layout === "ego" ? "active" : ""} onClick={() => setLayout((value) => value === "ego" ? "corpus" : "ego")}>Ego</button>
            <button type="button" onClick={resetMap}>Reset</button>
          </div>
        </div>

        {layout === "ego" && <div className="focus-lock">Flow focus · cluster {focusedId}</div>}

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Weekly research cluster topology map"
          onWheel={handleWheel}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={stopPan}
          onPointerCancel={stopPan}
        >
          <defs>
            <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffd166" />
            </marker>
          </defs>
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {layout === "ego" && (
              <g className="ego-rings" aria-hidden="true">
                <circle className="primary" cx={CENTER.x} cy={CENTER.y} r="128" />
                <circle cx={CENTER.x} cy={CENTER.y} r="230" />
                <circle cx={CENTER.x} cy={CENTER.y} r="360" />
              </g>
            )}

            <g className="topology-links">
              {topologyData.links.map((link) => {
                const source = positionedById.get(link.source);
                const target = positionedById.get(link.target);
                if (!source || !target) return null;
                const touchesFocus = link.source === focusedId || link.target === focusedId;
                const hiddenInEgo = layout === "ego" && !touchesFocus;
                const directed = link.direction === "directed";
                const markerEnd = directed && link.flowFrom === link.source ? "url(#flow-arrow)" : undefined;
                const markerStart = directed && link.flowFrom === link.target ? "url(#flow-arrow)" : undefined;
                return (
                  <g key={`${link.source}-${link.target}`} className={touchesFocus ? "focused-link" : ""}>
                    <line
                      x1={source.sx}
                      y1={source.sy}
                      x2={target.sx}
                      y2={target.sy}
                      className={`topology-link ${link.sharedSourceType ? "shared-source" : ""}`}
                      style={{
                        opacity: hiddenInEgo ? 0.05 : touchesFocus ? 0.94 : 0.25,
                        strokeWidth: 0.8 + link.affinity / 35 + (touchesFocus ? 1.4 : 0),
                      }}
                      markerEnd={touchesFocus || layout === "corpus" ? markerEnd : undefined}
                      markerStart={touchesFocus || layout === "corpus" ? markerStart : undefined}
                    />
                    {layout === "ego" && touchesFocus && (
                      <text className="edge-label" x={(source.sx + target.sx) / 2} y={(source.sy + target.sy) / 2 - 8}>
                        F{Math.round(link.flow)} · A{Math.round(link.affinity)}{directed ? ` · ${connectionLabel(link)}` : ""}
                      </text>
                    )}
                    <title>{`Cluster ${link.source} to ${link.target}. Affinity ${Math.round(link.affinity)}. Flow ${Math.round(link.flow)}. ${connectionLabel(link)}.`}</title>
                  </g>
                );
              })}
            </g>

            <g className="topology-nodes">
              {positionedNodes.map((node) => {
                const isFocused = node.clusterId === focusedId;
                const isSelected = selected.includes(node.clusterId);
                const isStudioSignal = Boolean(signalLabels[node.clusterId]);
                const isFilteredStudioSignal = isStudioSignal && !visibleSignalIds.includes(node.clusterId);
                const muted = layout === "ego" && !isFocused && !node.connected;
                return (
                  <g
                    key={node.clusterId}
                    className={`topology-node ${isFocused ? "focused" : ""} ${node.connected ? "connected" : ""} ${isSelected ? "selected" : ""} ${isFilteredStudioSignal ? "filtered" : ""}`}
                    transform={`translate(${node.sx} ${node.sy})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Cluster ${node.clusterId}, rank ${node.rank}. ${node.headline}`}
                    onClick={(event) => { event.stopPropagation(); focusCluster(node.clusterId); }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        focusCluster(node.clusterId);
                      }
                    }}
                    style={{ opacity: muted ? 0.2 : isFilteredStudioSignal ? 0.3 : 1 }}
                  >
                    {isFocused && <circle className="node-halo outer" r={node.radius + 20} />}
                    {isFocused && <circle className="node-halo" r={node.radius + 10} />}
                    <circle
                      className={`node-circle ${node.hasNews ? "" : "evidence-gap"}`}
                      r={node.radius}
                      fill={nodeColor(node)}
                    />
                    {isSelected && <circle className="selected-ring" r={node.radius + 5} />}
                    {isSelected && <text className="selected-check" x={node.radius - 1} y={-node.radius + 5}>✓</text>}
                    {(node.rank <= 16 || isFocused || node.connected || isStudioSignal) && (
                      <text className="node-label" x={node.radius + 5} y="4">#{node.rank}</text>
                    )}
                    <title>{`#${node.rank} · cluster ${node.clusterId} · ${node.headline}`}</title>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        <div className="topology-legend">
          {Object.entries(sourceColors).map(([type, color]) => <span key={type}><i style={{ background: color }} />{type.replace("_", " ")}</span>)}
        </div>
        <p className="topology-nav-help">Drag to pan · wheel to zoom · click a cluster to follow its paths</p>
      </div>

      <aside className="topology-inspector" aria-live="polite">
        <div className="inspector-label">Selected cluster · #{focusedNode.rank} · cluster {focusedNode.clusterId}</div>
        <h3>{signalLabels[focusedNode.clusterId] || shortHeadline(focusedNode.headline)}</h3>
        <p className="inspector-headline">{focusedNode.headline}</p>

        <div className="topology-stat-grid">
          <div><b>{focusedNode.freshRecords}</b><span>fresh records</span></div>
          <div><b>{focusedNode.freshSources}</b><span>weekly sources</span></div>
          <div><b>{focusedNode.score.toFixed(1)}</b><span>cluster score</span></div>
          <div><b>{focusedLinks.length}</b><span>direct paths</span></div>
        </div>

        {signalLabels[focusedNode.clusterId] ? (
          <button
            className={selected.includes(focusedNode.clusterId) ? "topology-issue-action is-selected" : "topology-issue-action"}
            type="button"
            onClick={() => onToggleSignal(focusedNode.clusterId)}
          >
            {selected.includes(focusedNode.clusterId) ? "✓ In satchel · return to map" : `+ Collect for ${activeSectionTitle}`}
          </button>
        ) : (
          <p className="context-note">Context cluster. Follow its paths, then return to a ranked editorial signal to add it to the issue.</p>
        )}

        <div className="path-explain">
          <b>How to read the paths</b>
          <p><strong>A</strong> is structural affinity. <strong>F</strong> is experimental flow speed based on timing and shared evidence. Arrows indicate a candidate direction, not causality.</p>
        </div>

        <div className="inspector-label paths-label">Relationship paths</div>
        <div className="relationship-list">
          {focusedLinks.slice(0, 6).map((link) => {
            const neighborId = link.source === focusedId ? link.target : link.source;
            const neighbor = nodeById.get(neighborId);
            if (!neighbor) return null;
            return (
              <button type="button" key={`${link.source}-${link.target}`} onClick={() => focusCluster(neighborId)}>
                <span><b>#{neighbor.rank} · cluster {neighborId}</b><em>F{Math.round(link.flow)} · A{Math.round(link.affinity)}</em></span>
                <strong>{signalLabels[neighborId] || shortHeadline(neighbor.headline)}</strong>
                <small>{connectionLabel(link)}{link.lagDays !== null ? ` · ${Math.round(link.lagDays)}d lag` : ""}</small>
              </button>
            );
          })}
        </div>
      </aside>
    </section>
  );
}
