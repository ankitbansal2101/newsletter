"use client";

import type { Flourish } from "../lib/flourishes";

export const CHART_INK = ["#c2497a", "#3d5a80", "#c45c26", "#1f6f5b", "#7a4d8d", "#b08d3a"];

type Chart = NonNullable<Flourish["chart"]>;
type ChartProps = { chart: Chart; title: string };

export function formatChartValue(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(0)}K`;
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toFixed(1);
}

function BarChart({ chart, title }: ChartProps) {
  const width = 520;
  const barHeight = 22;
  const gap = 10;
  const labelWidth = 150;
  const height = chart.series.length * (barHeight + gap) + 8;
  const max = Math.max(...chart.series.map((point) => point.value), 0.0001);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="flourish-chart">
      {chart.series.map((point, index) => {
        const y = index * (barHeight + gap) + 4;
        const barLength = Math.max(6, (point.value / max) * (width - labelWidth - 64));
        const valueLabel = formatChartValue(point.value);
        const fitsInside = barLength > valueLabel.length * 8 + 20;
        return (
          <g key={`${point.label}-${index}`}>
            <text x={labelWidth - 10} y={y + barHeight / 2} textAnchor="end" dominantBaseline="central" className="chart-label">{point.label.length > 22 ? `${point.label.slice(0, 21)}…` : point.label}</text>
            <rect className="chart-grow-bar" x={labelWidth} y={y} width={barLength} height={barHeight} rx={4} fill={CHART_INK[index % CHART_INK.length]} />
            {fitsInside ? (
              <text x={labelWidth + barLength - 8} y={y + barHeight / 2} textAnchor="end" dominantBaseline="central" className="chart-value-inverse">{valueLabel}</text>
            ) : (
              <text x={labelWidth + barLength + 8} y={y + barHeight / 2} dominantBaseline="central" className="chart-value">{valueLabel}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ColumnChart({ chart, title }: ChartProps) {
  const width = 520;
  const height = 220;
  const pad = { top: 18, right: 16, bottom: 42, left: 16 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...chart.series.map((point) => point.value), 0.0001);
  const gap = 10;
  const barW = Math.max(18, (innerW - gap * chart.series.length) / chart.series.length);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="flourish-chart">
      <line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} className="chart-axis" />
      {chart.series.map((point, index) => {
        const h = Math.max(4, (point.value / max) * innerH);
        const x = pad.left + index * (barW + gap);
        const y = pad.top + innerH - h;
        return (
          <g key={`${point.label}-${index}`}>
            <rect className="chart-grow-col" x={x} y={y} width={barW} height={h} rx={5} fill={CHART_INK[index % CHART_INK.length]} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="chart-value">{formatChartValue(point.value)}</text>
            <text x={x + barW / 2} y={height - 12} textAnchor="middle" className="chart-label">{point.label.length > 10 ? `${point.label.slice(0, 9)}…` : point.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ chart, title, filled }: ChartProps & { filled?: boolean }) {
  const width = 520;
  const height = 190;
  const pad = { top: 16, right: 24, bottom: 34, left: 46 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = chart.series.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const x = (index: number) => pad.left + (index / Math.max(chart.series.length - 1, 1)) * innerW;
  const y = (value: number) => pad.top + innerH - ((value - min) / range) * innerH;
  const path = chart.series.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(chart.series.length - 1).toFixed(1)},${pad.top + innerH} L${x(0).toFixed(1)},${pad.top + innerH} Z`;
  const last = chart.series[chart.series.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="flourish-chart">
      <line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} className="chart-axis" />
      {filled && <path d={area} fill="rgba(194, 73, 122, 0.16)" className="chart-draw-path" />}
      <path d={path} fill="none" stroke={CHART_INK[0]} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="chart-draw-path" />
      {chart.series.map((point, index) => (
        <circle key={`${point.label}-${index}`} cx={x(index)} cy={y(point.value)} r={index === chart.series.length - 1 ? 5 : 3.5} fill={CHART_INK[0]} stroke="#faf6f1" strokeWidth={2} />
      ))}
      <text x={x(chart.series.length - 1)} y={y(last.value) - 10} textAnchor="end" className="chart-value">{formatChartValue(last.value)}{chart.unit ? ` ${chart.unit}` : ""}</text>
      {chart.series.map((point, index) => {
        const step = Math.ceil(chart.series.length / 6);
        if (index % step !== 0 && index !== chart.series.length - 1) return null;
        return (
          <text key={`x-${point.label}`} x={x(index)} y={height - 10} textAnchor="middle" className="chart-label">{point.label.length > 9 ? `${point.label.slice(0, 8)}…` : point.label}</text>
        );
      })}
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function DonutChart({ chart, title }: ChartProps) {
  const total = chart.series.reduce((sum, point) => sum + Math.abs(point.value), 0) || 1;
  const cx = 118;
  const cy = 118;
  const r = 78;
  const stroke = 22;
  let cursor = 0;

  return (
    <div className="chart-donut-wrap">
      <svg viewBox="0 0 236 236" role="img" aria-label={title} className="flourish-chart chart-donut">
        {chart.series.map((point, index) => {
          const portion = (Math.abs(point.value) / total) * 360;
          const start = polar(cx, cy, r, cursor);
          const end = polar(cx, cy, r, cursor + portion);
          const large = portion > 180 ? 1 : 0;
          cursor += portion;
          return (
            <path
              key={`${point.label}-${index}`}
              className="chart-draw-path"
              d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
              fill="none"
              stroke={CHART_INK[index % CHART_INK.length]}
              strokeWidth={stroke}
              strokeLinecap="butt"
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="chart-value">{formatChartValue(total)}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="chart-label">{chart.unit || "total"}</text>
      </svg>
      <ul className="chart-legend">
        {chart.series.map((point, index) => (
          <li key={`${point.label}-${index}`}>
            <i style={{ background: CHART_INK[index % CHART_INK.length] }} />
            <span>{point.label}</span>
            <b>{formatChartValue(point.value)}{chart.unit ? ` ${chart.unit}` : ""}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GaugeChart({ chart, title }: ChartProps) {
  const raw = chart.series[0]?.value ?? 0;
  const max = Math.max(...chart.series.map((point) => point.value), 100);
  const pct = Math.max(0, Math.min(100, (raw / (max > 100 ? max : 100)) * 100));
  const angle = -120 + (pct / 100) * 240;
  const needle = polar(110, 118, 68, angle);

  return (
    <div className="chart-gauge-wrap">
      <svg viewBox="0 0 220 150" role="img" aria-label={title} className="flourish-chart">
        <path d="M 28 118 A 82 82 0 1 1 192 118" fill="none" stroke="rgba(44,35,52,0.12)" strokeWidth="16" strokeLinecap="round" />
        <path d="M 28 118 A 82 82 0 1 1 192 118" fill="none" stroke={CHART_INK[0]} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 258} 258`} />
        <circle cx="110" cy="118" r="7" fill={CHART_INK[0]} />
        <line x1="110" y1="118" x2={needle.x} y2={needle.y} stroke="#2c2334" strokeWidth="3" strokeLinecap="round" />
        <text x="110" y="78" textAnchor="middle" className="chart-value">{formatChartValue(raw)}{chart.unit || "%"}</text>
        <text x="110" y="96" textAnchor="middle" className="chart-label">{chart.series[0]?.label || "signal"}</text>
      </svg>
    </div>
  );
}

export function FlourishChart({ chart, title }: ChartProps) {
  if (chart.kind === "line") return <LineChart chart={chart} title={title} />;
  if (chart.kind === "area") return <LineChart chart={chart} title={title} filled />;
  if (chart.kind === "column") return <ColumnChart chart={chart} title={title} />;
  if (chart.kind === "donut") return <DonutChart chart={chart} title={title} />;
  if (chart.kind === "gauge") return <GaugeChart chart={chart} title={title} />;
  return <BarChart chart={chart} title={title} />;
}
