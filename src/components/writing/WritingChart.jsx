// Task 1 visuals drawn from data. Colours are categorical slots defined as CSS
// variables on .writing-chart (globals.css) with separate light/dark steps.

const SERIES_VARS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];
const W = 640;
const H = 320;
const PAD = { top: 16, right: 16, bottom: 44, left: 48 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

const formatValue = (value, unit) => (unit === "%" ? `${value}%` : `${value}${unit ? ` ${unit}` : ""}`);

function Legend({ names, unit }) {
  return (
    <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-hidden="true">
      {names.map((name, index) => (
        <li key={name} className="inline-flex items-center gap-2 text-[color:var(--chart-text)]">
          <span className="h-3 w-3 rounded-sm" style={{ background: SERIES_VARS[index] }} />
          {name}
        </li>
      ))}
      {unit && unit !== "%" && <li className="ml-auto text-xs text-[color:var(--chart-muted)]">Values in {unit}s</li>}
    </ul>
  );
}

function Axes({ max, steps = 5, unit, categories, bandWidth }) {
  const ticks = Array.from({ length: steps + 1 }, (_, index) => (max / steps) * index);
  return (
    <g>
      {ticks.map((tick) => {
        const y = PAD.top + plotH - (tick / max) * plotH;
        return (
          <g key={tick}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y} dy="0.32em" textAnchor="end" fontSize="12" fill="var(--chart-muted)">
              {Number.isInteger(tick) ? tick : tick.toFixed(1)}{unit === "%" ? "%" : ""}
            </text>
          </g>
        );
      })}
      {categories.map((category, index) => (
        <text key={category} x={PAD.left + bandWidth * (index + 0.5)} y={H - PAD.bottom + 22} textAnchor="middle" fontSize="13" fill="var(--chart-text)">
          {category}
        </text>
      ))}
    </g>
  );
}

// A bar with 4px rounded top corners anchored to the baseline.
function barPath(x, y, width, height) {
  const r = Math.min(4, width / 2, height);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}

function BarChart({ chart }) {
  const bandWidth = plotW / chart.categories.length;
  const groupWidth = bandWidth * 0.72;
  const gap = 2;
  const barWidth = (groupWidth - gap * (chart.series.length - 1)) / chart.series.length;
  return (
    <>
      <Legend names={chart.series.map((series) => series.name)} />
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[480px]" role="img" aria-label="Bar chart. A data table follows.">
        <Axes max={chart.max} unit={chart.unit} categories={chart.categories} bandWidth={bandWidth} />
        {chart.categories.map((category, categoryIndex) => chart.series.map((series, seriesIndex) => {
          const value = series.values[categoryIndex];
          const height = (value / chart.max) * plotH;
          const x = PAD.left + bandWidth * categoryIndex + (bandWidth - groupWidth) / 2 + seriesIndex * (barWidth + gap);
          return (
            <path key={`${category}-${series.name}`} d={barPath(x, PAD.top + plotH - height, barWidth, height)} fill={SERIES_VARS[seriesIndex]}>
              <title>{`${category}, ${series.name}: ${formatValue(value, chart.unit)}`}</title>
            </path>
          );
        }))}
      </svg>
    </>
  );
}

function LineChart({ chart }) {
  const bandWidth = plotW / chart.categories.length;
  const x = (index) => PAD.left + bandWidth * (index + 0.5);
  const y = (value) => PAD.top + plotH - (value / chart.max) * plotH;
  return (
    <>
      <Legend names={chart.series.map((series) => series.name)} unit={chart.unit} />
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[480px]" role="img" aria-label="Line graph. A data table follows.">
        <Axes max={chart.max} unit={chart.unit} categories={chart.categories} bandWidth={bandWidth} />
        {chart.series.map((series, seriesIndex) => (
          <g key={series.name}>
            <polyline
              points={series.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")}
              fill="none"
              stroke={SERIES_VARS[seriesIndex]}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {series.values.map((value, index) => (
              <circle key={index} cx={x(index)} cy={y(value)} r="4.5" fill={SERIES_VARS[seriesIndex]} stroke="var(--chart-surface)" strokeWidth="2">
                <title>{`${series.name}, ${chart.categories[index]}: ${formatValue(value, chart.unit)}`}</title>
              </circle>
            ))}
            <text x={x(series.values.length - 1) + 8} y={y(series.values.at(-1))} dy="0.32em" fontSize="12" fill="var(--chart-text)" className="hidden sm:block">
              {series.name.split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
    </>
  );
}

function PieCharts({ chart }) {
  const r = 92;
  const slice = (cx, cy, start, end) => {
    const large = end - start > Math.PI ? 1 : 0;
    const p = (angle) => [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
    const [x1, y1] = p(start);
    const [x2, y2] = p(end);
    return `M${cx},${cy}L${x1},${y1}A${r},${r} 0 ${large} 1 ${x2},${y2}Z`;
  };
  return (
    <>
      <Legend names={chart.labels} />
      <svg viewBox={`0 0 ${W} 290`} className="h-auto w-full min-w-[480px]" role="img" aria-label="Pie charts. A data table follows.">
        {chart.pies.map((pie, pieIndex) => {
          const cx = W / 4 + (W / 2) * pieIndex;
          const cy = 140;
          const total = pie.values.reduce((sum, value) => sum + value, 0);
          let angle = 0;
          return (
            <g key={pie.name}>
              {pie.values.map((value, index) => {
                const start = angle;
                angle += (value / total) * Math.PI * 2;
                const middle = (start + angle) / 2;
                return (
                  <g key={chart.labels[index]}>
                    <path d={slice(cx, cy, start, angle)} fill={SERIES_VARS[index]} stroke="var(--chart-surface)" strokeWidth="2">
                      <title>{`${pie.name}, ${chart.labels[index]}: ${value}%`}</title>
                    </path>
                    <text x={cx + (r + 18) * Math.sin(middle)} y={cy - (r + 18) * Math.cos(middle)} dy="0.32em" textAnchor="middle" fontSize="12" fill="var(--chart-text)">
                      {value}%
                    </text>
                  </g>
                );
              })}
              <text x={cx} y={cy + r + 40} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--chart-text)">{pie.name}</text>
            </g>
          );
        })}
      </svg>
    </>
  );
}

function DataTable({ chart }) {
  let columns;
  let rows;
  if (chart.kind === "bar" || chart.kind === "line") {
    columns = ["", ...chart.series.map((series) => series.name)];
    rows = chart.categories.map((category, index) => [category, ...chart.series.map((series) => formatValue(series.values[index], chart.unit))]);
  } else if (chart.kind === "pie") {
    columns = ["", ...chart.pies.map((pie) => pie.name)];
    rows = chart.labels.map((label, index) => [label, ...chart.pies.map((pie) => `${pie.values[index]}%`)]);
  } else {
    columns = chart.columns;
    rows = chart.rows;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse text-sm">
        {chart.kind === "table" && <caption className="mb-2 text-left text-xs text-slate-400">Figures in {chart.unit}</caption>}
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={`${column}-${index}`} scope="col" className={`border-b border-white/15 px-3 py-2 font-semibold text-slate-200 ${index ? "text-right" : "text-left"}`}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => index === 0
                ? <th key={index} scope="row" className="border-b border-white/10 px-3 py-2 text-left font-medium text-slate-200">{cell}</th>
                : <td key={index} className="border-b border-white/10 px-3 py-2 text-right tabular-nums text-slate-300">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProcessDiagram({ chart }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {chart.steps.map((step, index) => (
        <li key={step} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--series-1)" }}>{index + 1}</span>
          <span className="pt-1">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function WritingChart({ chart }) {
  if (!chart) return null;
  return (
    <figure className="writing-chart rounded-2xl border border-white/10 p-4 sm:p-5">
      {["bar", "line", "pie"].includes(chart.kind) && (
        <div className="-mx-1 overflow-x-auto px-1">
          {chart.kind === "bar" && <BarChart chart={chart} />}
          {chart.kind === "line" && <LineChart chart={chart} />}
          {chart.kind === "pie" && <PieCharts chart={chart} />}
        </div>
      )}
      {chart.kind === "table" && <DataTable chart={chart} />}
      {chart.kind === "process" && <ProcessDiagram chart={chart} />}
      {["bar", "line", "pie"].includes(chart.kind) && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-brand-300">View the data as a table</summary>
          <div className="mt-3"><DataTable chart={chart} /></div>
        </details>
      )}
    </figure>
  );
}
