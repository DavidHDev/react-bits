import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import Navbar from '../components/landingnew/Navbar/Navbar';
import Footer from '../components/landingnew/Footer/Footer';
import GiftView from '../components/advent/GiftView';
import { GiftLocked, fetchGift, mountGift } from '../components/advent/runtime';
import { DAYS, currentDay, dateLabel } from '../components/common/AdventCalendar/days';

import '../css/site-page.css';

const readTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

const useTheme = () => {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
};

const AdventGiftPage = () => {
  useScrollToTop();
  const { day: param } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const day = Number(param);
  const valid = Number.isInteger(day) && day >= 1 && day <= DAYS;
  const open = valid && day <= currentDay();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    document.title = valid ? `Day ${day} | React Bits Advent Calendar` : 'React Bits Advent Calendar';
  }, [day, valid]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setState({ status: 'loading' });
    fetchGift(day)
      .then(async payload => {
        const Demo = await mountGift(payload);
        if (active) setState({ status: 'ready', day, payload, Demo });
      })
      .catch(error => {
        if (active) setState({ status: error instanceof GiftLocked ? 'locked' : 'missing' });
      });
    return () => {
      active = false;
    };
  }, [day, open]);

  const toCalendar = useCallback(
    () => navigate({ search: window.location.search, hash: 'advent' }, { replace: true, preventScrollReset: true }),
    [navigate]
  );

  const locked = valid && (!open || state.status === 'locked');
  const ready = open && state.status === 'ready' && state.day === day;

  return (
    <>
      <Navbar />
      <main className="pg">
        <div className="pg-inner">
          {ready ? (
            <GiftView
              day={day}
              meta={state.payload.meta}
              Demo={state.Demo}
              files={state.payload.files}
              deps={state.payload.deps}
              theme={theme}
              onCalendar={toCalendar}
            />
          ) : (
            <div className="agv agv-locked">
              <p className="agv-eyebrow">{valid ? `Day ${day}` : 'Advent calendar'}</p>
              <h1 className="agv-title">
                {locked ? 'Not open yet' : state.status === 'loading' && valid ? 'Opening…' : 'Nothing here'}
              </h1>
              <p className="agv-sub">
                {locked
                  ? `This door opens on ${dateLabel(day)}.`
                  : state.status === 'loading' && valid
                    ? 'Unwrapping today’s gift.'
                    : 'This door doesn’t exist.'}
              </p>
              <button type="button" className="pg-btn pg-btn-secondary" onClick={toCalendar}>
                Open the calendar
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AdventGiftPage;
