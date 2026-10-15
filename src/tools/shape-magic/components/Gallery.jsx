import { MARK_GROUPS, MARKS } from '../presets/marks';
import { MATERIAL_GROUPS, MATERIALS } from '../presets/materials';

const matches = (query, ...fields) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fields.join(' ').toLowerCase();
  return words.every(word => text.includes(word));
};

const Empty = ({ query, kind }) => (
  <p className="lab-empty lab-empty--search">
    No {kind} match “{query.trim()}”.
  </p>
);

function Tile({ name, active, onClick, children }) {
  return (
    <button type="button" className="lab-tile smg-tile" aria-pressed={active} onClick={onClick} title={name}>
      <span className="lab-tile-media smg-tile-media">{children}</span>
      <span className="lab-tile-name">{name}</span>
    </button>
  );
}

export function MarksGrid({ thumbs, activeId, onApply, query = '' }) {
  const sections = MARK_GROUPS.map(group => {
    const items = MARKS.filter(
      mark => mark.group === group.id && matches(query, mark.name, group.label, mark.tags || '')
    );
    if (!items.length) return null;
    return (
      <section className="lab-group" key={group.id}>
        <h3 className="lab-group-title">{group.label}</h3>
        <div className="lab-grid">
          {items.map(mark => (
            <Tile key={mark.id} name={mark.name} active={activeId === mark.id} onClick={() => onApply(mark)}>
              {thumbs[`mark:${mark.id}`] ? (
                <img src={thumbs[`mark:${mark.id}`]} alt="" draggable={false} />
              ) : (
                <span className="lab-tile-wait" />
              )}
            </Tile>
          ))}
        </div>
      </section>
    );
  });
  return sections.some(Boolean) ? sections : <Empty query={query} kind="marks" />;
}

export function MaterialsGrid({ thumbs, activeId, light, onApply, query = '' }) {
  const silhouette = thumbs.silhouette;
  const masked = silhouette ? { WebkitMaskImage: `url(${silhouette})`, maskImage: `url(${silhouette})` } : null;
  const sections = MATERIAL_GROUPS.map(group => {
    const items = MATERIALS.filter(item => item.group === group.id && matches(query, item.name, group.label));
    if (!items.length) return null;
    return (
      <section className="lab-group" key={group.id}>
        <h3 className="lab-group-title">{group.label}</h3>
        <div className="lab-grid">
          {items.map(item => {
            let media;
            if (item.kind === 'procedural') {
              media = (
                <img src={`/assets/shape-magic/fx-${item.def.id}.webp`} alt="" loading="lazy" draggable={false} />
              );
            } else if (item.kind === 'metal') {
              media = (
                <img
                  className="smg-ball"
                  src={`/assets/shape-magic/metal-${item.id.slice(6)}.webp`}
                  alt=""
                  loading="lazy"
                  draggable={false}
                />
              );
            } else if (item.kind === 'flat') {
              media = thumbs[item.id] ? (
                <img src={thumbs[item.id]} alt="" draggable={false} />
              ) : (
                <span className="lab-tile-wait" />
              );
            } else if (!masked) {
              media = <span className="lab-tile-wait" />;
            } else {
              media = (
                <span
                  className="smg-swatch"
                  style={{
                    ...masked,
                    backgroundImage: `url(/assets/studio/${item.background}-${light ? 'light' : 'dark'}.webp)`
                  }}
                />
              );
            }
            return (
              <Tile key={item.id} name={item.name} active={activeId === item.id} onClick={() => onApply(item)}>
                {media}
              </Tile>
            );
          })}
        </div>
      </section>
    );
  });
  return sections.some(Boolean) ? sections : <Empty query={query} kind="materials" />;
}
