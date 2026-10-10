import '../../css/skeleton.css';

const CONTROLS = Array.from({ length: 9 });
const PROP_ROWS = [
  [70, 48, 30, 78],
  [88, 54, 26, 64],
  [62, 40, 34, 86],
  [94, 58, 22, 58],
  [76, 46, 30, 72],
  [68, 52, 26, 80]
];

const Line = ({ width, className = '' }) => (
  <span className={`skel-line skel-pulse ${className}`.trim()} style={{ width }} />
);

export const SkeletonLoader = () => (
  <div className="skel" aria-hidden="true">
    <div className="skel-toolbar">
      <span className="skel-block skel-pulse skel-tabs" />
      <div className="skel-actions">
        <span className="skel-block skel-pulse" style={{ width: 68 }} />
        <span className="skel-block skel-pulse" style={{ width: 68 }} />
        <span className="skel-block skel-pulse" style={{ width: 136 }} />
      </div>
      <span className="skel-block skel-pulse skel-more" />
    </div>

    <div className="skel-preview">
      <span className="skel-preview-fill skel-pulse" />
    </div>

    <div className="skel-frame">
      <div className="skel-frame-head">
        <Line width={72} />
        <Line width={56} />
      </div>
      <div className="skel-inset skel-controls">
        {CONTROLS.map((_, index) => (
          <span key={index} className="skel-control skel-pulse" />
        ))}
      </div>
    </div>

    <div className="skel-frame skel-frame--props">
      <div className="skel-frame-head">
        <Line width={44} />
        <Line width={72} />
      </div>
      <div className="skel-inset skel-table">
        <div className="skel-row skel-row--head">
          {[56, 36, 44, 76].map((width, index) => (
            <span key={index} className="skel-cell">
              <Line width={width} />
            </span>
          ))}
        </div>
        {PROP_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="skel-row">
            {row.map((percent, index) => (
              <span key={index} className="skel-cell">
                <Line width={`${percent}%`} className={index === 0 ? 'skel-line--chip' : ''} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DOC_SECTIONS = [
  { lines: [96, 100, 88, 62], code: 0 },
  { lines: [92, 84], code: 112 },
  { lines: [100, 94, 70], code: 0 },
  { lines: [88, 64], code: 84 }
];

export const GetStartedLoader = () => (
  <div className="skel skel--docs" aria-hidden="true">
    <Line width="42%" className="skel-line--title" />
    {DOC_SECTIONS.map((section, index) => (
      <div key={index} className="skel-section">
        {index > 0 && <Line width={`${28 + index * 6}%`} className="skel-line--heading" />}
        {section.lines.map((width, lineIndex) => (
          <Line key={lineIndex} width={`${width}%`} className="skel-line--text" />
        ))}
        {section.code > 0 && <span className="skel-code skel-pulse" style={{ height: section.code }} />}
      </div>
    ))}
  </div>
);
