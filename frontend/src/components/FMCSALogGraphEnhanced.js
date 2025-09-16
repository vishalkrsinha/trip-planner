import React, { useState } from 'react';

const ROWS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty'];
const STATUS_COLORS = {
  'Off Duty': '#aacbee',
  'Sleeper Berth': '#5f83b1',
  'Driving': '#f9d75a',
  'On Duty': '#f8cb87',
};
const BREAK_TYPE_COLORS = {
  '10-Hour Off-Duty Break': '#d1e7dd',
  Lunch: '#ffe5b4',
  Rest: '#cfe2ff',
  'Yard Move': '#f8d7da',
  Break: '#fff',
};

const SVG_WIDTH_TOTAL = 1500;
const LEFT_MARGIN = 110;
const SUMMARY_BOX_WIDTH = 110;
const GRAPH_WIDTH = SVG_WIDTH_TOTAL - LEFT_MARGIN - SUMMARY_BOX_WIDTH;
const SVG_HEIGHT = 130;
const ROW_HEIGHT = SVG_HEIGHT / ROWS.length;
const HOURS_IN_DAY = 24;
const REMARKS_HEIGHT = 150;

const minsToX = (mins) => LEFT_MARGIN + (mins / (HOURS_IN_DAY * 60)) * GRAPH_WIDTH;

const statusY = (status) => {
  const idx = ROWS.indexOf(status);
  return idx >= 0 ? (idx + 0.5) * ROW_HEIGHT : SVG_HEIGHT - ROW_HEIGHT / 2;
};

const createGraphData = (segments) => {
  let points = [];
  let coloredRects = [];

  if (!segments || segments.length === 0) return { points: '', coloredRects };

  segments.forEach((seg, idx) => {
    const xStart = minsToX(seg.startMins);
    const xEnd = minsToX(seg.endMins);
    const y = statusY(seg.status);

    // Add point for the start of the segment
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      points.push([lastPoint[0], y]); // Vertical line from previous status
    }
    points.push([xStart, y]); // Start of current status segment
    points.push([xEnd, y]); // End of current status segment

    coloredRects.push({
      x: xStart,
      y: y - ROW_HEIGHT / 2,
      width: xEnd - xStart,
      height: ROW_HEIGHT,
      fill: STATUS_COLORS[seg.status] || '#ccc',
    });
  });

  const polylinePoints = points.map(p => p.join(',')).join(' ');
  return { points: polylinePoints, coloredRects };
};

function secondsToHHMMSS(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const RemarksBar = React.memo(({ remarks, activeRemarkIndex, onRemarkClick }) => (
  <svg width={SVG_WIDTH_TOTAL} height={REMARKS_HEIGHT} style={{ userSelect: 'none' }}>
    <line x1={LEFT_MARGIN} y1={20} x2={SVG_WIDTH_TOTAL - SUMMARY_BOX_WIDTH} y2={20} stroke="#333" strokeWidth={1} />
    {remarks.map(({ startMins, label }, i) => {
      const x = minsToX(startMins);
      const isActive = activeRemarkIndex === i;
      return (
        <g key={`remark-${i}`}>
          <circle
            cx={x}
            cy={40}
            r={7}
            fill="#007bff"
            style={{ cursor: 'pointer' }}
            onClick={() => onRemarkClick(i)}
            title={label}
          />
          <text
            x={x}
            y={REMARKS_HEIGHT - 40}
            fontSize={13}
            fill="#333"
            transform={`rotate(-45, ${x}, ${REMARKS_HEIGHT - 40})`}
            textAnchor="end"
            style={{ userSelect: 'none' }}
          >
            {label}
          </text>
          {isActive && (
            <foreignObject x={x + 10} y={10} width={200} height={60}>
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 12,
                  boxShadow: '2px 2px 7px rgba(0,0,0,0.15)'
                }}
              >
                <strong>{label}</strong>
              </div>
            </foreignObject>
          )}
        </g>
      );
    })}
  </svg>
));

const FMCSALogGraphEnhanced = ({
  segments = [],
  breaks = [],
  remarks = [],
  dayLabel = 'Day 1',
}) => {
  const [tooltip, setTooltip] = useState(null);
  const [activeRemarkIndex, setActiveRemarkIndex] = useState(null);

  const { points, coloredRects } = createGraphData(segments);

  const totals = {};
  segments.forEach(seg => {
    const durationSecs = (seg.endMins - seg.startMins) * 60;
    totals[seg.status] = (totals[seg.status] || 0) + durationSecs;
  });

  const handleMouseEnter = (event, label, durationMins) => {
    setTooltip({
      x: event.clientX,
      y: event.clientY,
      text: `${label} (${durationMins} mins)`
    });
  };
  const handleMouseLeave = () => setTooltip(null);

  const handleRemarkClick = (index) => {
    setActiveRemarkIndex(prevIndex => (prevIndex === index ? null : index));
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: SVG_WIDTH_TOTAL, margin: 'auto', userSelect: 'none' }}>
      <div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: '1.3rem', paddingLeft: LEFT_MARGIN }}>{dayLabel}</div>
      <svg width={SVG_WIDTH_TOTAL} height={SVG_HEIGHT} style={{ backgroundColor: 'white', border: '1px solid black' }}>
        {coloredRects.map((rect, i) => (
          <rect key={`bar-${i}`} {...rect} opacity={0.7} />
        ))}

        {ROWS.map((_, i) => (
          <line
            key={`hline-${i}`}
            x1={LEFT_MARGIN}
            y1={(i + 1) * ROW_HEIGHT}
            x2={SVG_WIDTH_TOTAL - SUMMARY_BOX_WIDTH}
            y2={(i + 1) * ROW_HEIGHT}
            stroke="#666"
            strokeWidth={1}
          />
        ))}

        {[...Array(HOURS_IN_DAY * 4 + 1)].map((_, i) => {
          const x = LEFT_MARGIN + (i / (HOURS_IN_DAY * 4)) * GRAPH_WIDTH;
          const isHour = i % 4 === 0;
          return (
            <line
              key={`vline-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={SVG_HEIGHT}
              stroke="#aaa"
              strokeWidth={isHour ? 1.2 : 0.6}
            />
          );
        })}

        {[...Array(HOURS_IN_DAY + 1)].map((_, hour) => {
          const x = LEFT_MARGIN + (hour / HOURS_IN_DAY) * GRAPH_WIDTH;
          return (
            <text
              key={`hourLabel-${hour}`}
              x={x}
              y={12}
              fontSize={11}
              fill="#000"
              textAnchor="middle"
              fontWeight="bold"
            >
              {hour === 0 ? 'Midnight' : hour === 12 ? 'Noon' : hour}
            </text>
          );
        })}

        {ROWS.map((status, idx) => (
          <text
            key={`statusLabel-${idx}`}
            x={LEFT_MARGIN - 12}
            y={statusY(status)}
            fontSize={13}
            fontWeight="bold"
            fill="#000"
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {status}
          </text>
        ))}

        {breaks.map(({ from, to, label, row }, i) => {
          const y = (row + 0.1) * ROW_HEIGHT;
          const height = ROW_HEIGHT * 0.8;
          const durationMins = Math.round(to - from);

          const color = BREAK_TYPE_COLORS[Object.keys(BREAK_TYPE_COLORS).find(key => label.toLowerCase().includes(key.toLowerCase()))] || BREAK_TYPE_COLORS.Break;

          return (
            <g
              key={`break-${i}`}
              onMouseEnter={(e) => handleMouseEnter(e, label, durationMins)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={minsToX(from)}
                y={y}
                width={minsToX(to) - minsToX(from)}
                height={height}
                fill={color}
                stroke="#444"
                strokeDasharray="4 2"
                rx={6}
                ry={6}
              />
              <text
                x={(minsToX(from) + minsToX(to)) / 2}
                y={y + height / 2}
                fontSize={11}
                fill="#000"
                alignmentBaseline="middle"
                textAnchor="middle"
                fontWeight="600"
                pointerEvents="none"
              >
                {label}
              </text>
            </g>
          );
        })}

        <polyline
          points={points}
          fill="none"
          stroke="#000"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {ROWS.map((status, idx) => {
          const totalSecs = totals[status] || 0;
          return (
            <g key={`summaryBox-${idx}`}>
              <rect
                x={SVG_WIDTH_TOTAL - SUMMARY_BOX_WIDTH + 4}
                y={(idx + 0.1) * ROW_HEIGHT}
                width={SUMMARY_BOX_WIDTH - 8}
                height={ROW_HEIGHT * 0.8}
                fill="#f0f0f0"
                stroke="#000"
                rx={6}
                ry={6}
              />
              <text
                x={SVG_WIDTH_TOTAL - SUMMARY_BOX_WIDTH / 2}
                y={(idx + 0.5) * ROW_HEIGHT}
                fontSize={13}
                fill="#000"
                fontWeight="600"
                alignmentBaseline="middle"
                textAnchor="middle"
              >
                {secondsToHHMMSS(totalSecs)}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: 10, paddingLeft: LEFT_MARGIN, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {Object.entries(BREAK_TYPE_COLORS).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 18, height: 18, backgroundColor: color, border: '1px solid #444', borderRadius: 4 }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <RemarksBar remarks={remarks} activeRemarkIndex={activeRemarkIndex} onRemarkClick={handleRemarkClick} />

      {tooltip && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            backgroundColor: '#fff',
            border: '1px solid #aaa',
            padding: '5px 10px',
            borderRadius: 4,
            boxShadow: '0 1px 8px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontSize: 12,
            zIndex: 1000,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default FMCSALogGraphEnhanced;

