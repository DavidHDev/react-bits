import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rss } from 'lucide-react';
import CopyPageButton from './CopyPageButton';
import useScrollToTop from '../hooks/useScrollToTop';
import { CHANGELOG_DESCRIPTION, getChangelogEntries } from '../utils/changelog';

const INITIAL_MONTHS = 6;
const KIND_LABELS = { launch: 'New category', added: 'New', updated: 'Update' };

const toDate = date => new Date(`${date}T00:00:00Z`);
const monthLabel = date =>
  toDate(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayLabel = date => toDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const groupByMonth = entries => {
  const months = [];
  entries.forEach(entry => {
    const month = entry.date.slice(0, 7);
    let group = months[months.length - 1];
    if (!group || group.month !== month) {
      group = { month, label: monthLabel(entry.date), days: [] };
      months.push(group);
    }
    let day = group.days[group.days.length - 1];
    if (!day || day.date !== entry.date) {
      day = { date: entry.date, entries: [] };
      group.days.push(day);
    }
    day.entries.push(entry);
  });
  return months;
};

const Entry = ({ entry }) => (
  <li className="changelog-entry">
    <div className="changelog-entry-head">
      <Link className="changelog-name" to={entry.path}>
        {entry.name}
      </Link>
      <span className="changelog-meta">
        <span className={`changelog-kind is-${entry.type}`}>{KIND_LABELS[entry.type]}</span>
        <span aria-hidden="true"> · </span>
        {entry.type === 'launch' ? `${entry.components.length} components` : entry.category}
      </span>
    </div>
    <p className="changelog-note">{entry.note}</p>
    {entry.type === 'launch' ? (
      <p className="changelog-includes">
        {entry.components.map((component, index) => (
          <Fragment key={component.path}>
            {index > 0 ? ', ' : null}
            <Link to={component.path}>{component.name}</Link>
          </Fragment>
        ))}
      </p>
    ) : null}
  </li>
);

const Changelog = () => {
  const [showAll, setShowAll] = useState(false);
  const months = useMemo(() => groupByMonth(getChangelogEntries()), []);
  const visibleMonths = showAll ? months : months.slice(0, INITIAL_MONTHS);

  useScrollToTop();

  return (
    <section className="docs-section changelog">
      <div className="docs-page-header">
        <h1 className="docs-title">Changelog</h1>
        <CopyPageButton />
      </div>

      <p className="docs-lead">{CHANGELOG_DESCRIPTION}</p>

      <a className="changelog-rss" href="/rss.xml" target="_blank" rel="noreferrer">
        <Rss size={14} aria-hidden="true" />
        RSS feed
      </a>

      {visibleMonths.map(month => (
        <section key={month.month} className="changelog-month" aria-label={month.label}>
          <h2 className="changelog-month-title">{month.label}</h2>
          <ol className="changelog-days">
            {month.days.map(day => (
              <li key={day.date} className="changelog-day">
                <time className="changelog-date" dateTime={day.date}>
                  {dayLabel(day.date)}
                </time>
                <ul className="changelog-entries">
                  {day.entries.map(entry => (
                    <Entry key={entry.id} entry={entry} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {!showAll && months.length > INITIAL_MONTHS ? (
        <button type="button" className="changelog-older" onClick={() => setShowAll(true)}>
          Show earlier months
        </button>
      ) : null}
    </section>
  );
};

export default Changelog;
