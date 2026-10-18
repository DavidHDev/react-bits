import { useEffect, useState } from 'react';
import {
  Cancel01Icon,
  CircleDotIcon,
  LinkSquare02Icon,
  MouseScroll01Icon,
  StopCircleIcon,
  Tick02Icon
} from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../background-studio/components/ui';
import { RECORD_LIMIT, surfaceLabel } from '../capture';

const clock = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const scrollNote = forwarding => {
  if (forwarding === true) return 'Scroll here to move down the page';
  if (forwarding === false) return 'Scroll the page in its own window';
  return 'Allow scrolling in Chrome’s prompt to scroll from here';
};

function Elapsed({ since }) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(timer);
  }, []);
  return clock(Math.min(RECORD_LIMIT, Math.max(0, Math.floor((now - since) / 1000))));
}

function Action({ icon, label, tip, primary, onClick }) {
  const button = (
    <button type="button" className={primary ? 'bs-export cst-hud-primary' : 'cst-hud-button'} onClick={onClick}>
      {icon && <Icon icon={icon} />}
      <span>{label}</span>
    </button>
  );
  return tip ? (
    <Tip label={tip} placement="top">
      {button}
    </Tip>
  ) : (
    button
  );
}

function ShowPage({ onShowPage }) {
  return (
    <Tip label="Show the page window" placement="top">
      <button
        type="button"
        className="cst-hud-button cst-hud-icon"
        aria-label="Show the page window"
        onClick={onShowPage}
      >
        <Icon icon={LinkSquare02Icon} />
      </button>
    </Tip>
  );
}

export default function CaptureHud({
  capture,
  screens,
  canRecord,
  onFullPage,
  onRecord,
  onDone,
  onFinishPage,
  onCancelPage,
  onStopRecording,
  onAutoScroll,
  onShowPage
}) {
  const { status, media } = capture;
  const name = media.host || `Live ${surfaceLabel(media).toLowerCase()}`;
  const windowed = Boolean(media.page && !media.page.closed);

  if (status === 'saving' || status === 'building' || (status === 'live' && capture.opening)) {
    const label =
      status === 'saving' ? 'Saving the clip' : status === 'building' ? 'Building the page' : `Opening ${name}`;
    return (
      <div className="cst-hud" role="status">
        <span className="cst-hud-state">
          <span className="bs-spinner cst-capture-spinner" aria-hidden="true" />
          <span>{label}</span>
        </span>
      </div>
    );
  }

  if (status === 'paging') {
    return (
      <div className="cst-hud" role="group" aria-label="Full page" data-busy="">
        <span className="cst-hud-state">
          <i className="cst-capture-dot" aria-hidden="true" />
          <span className="cst-hud-count">{`${Math.max(1, screens).toFixed(1)} screens`}</span>
        </span>
        <span className="cst-hud-note">
          {capture.auto ? 'Scrolling through the page for you' : `${scrollNote(capture.forwarding)}, to the end`}
        </span>
        {windowed && capture.forwarding === false && <ShowPage onShowPage={onShowPage} />}
        <Action icon={Tick02Icon} label="Done" primary onClick={onFinishPage} />
        <Tip label="Cancel" placement="top">
          <button type="button" className="cst-hud-button cst-hud-icon" aria-label="Cancel" onClick={onCancelPage}>
            <Icon icon={Cancel01Icon} />
          </button>
        </Tip>
      </div>
    );
  }

  if (status === 'recording') {
    return (
      <div className="cst-hud" role="group" aria-label="Recording" data-busy="">
        <span className="cst-hud-state">
          <i className="cst-capture-dot" aria-hidden="true" />
          <span className="cst-hud-count">
            <Elapsed since={capture.startedAt} />
          </span>
        </span>
        <span className="cst-hud-note">
          {capture.scrolling
            ? 'Scrolling the page for you'
            : capture.forwarding === true
              ? 'Scroll here, or click around in the page window'
              : 'Use the page in its own window'}
        </span>
        {windowed && !capture.scrolling && capture.forwarding !== null && <ShowPage onShowPage={onShowPage} />}
        {capture.canScroll && !capture.scrolling && (
          <Action icon={MouseScroll01Icon} label="Scroll for me" onClick={onAutoScroll} />
        )}
        <Action icon={StopCircleIcon} label="Stop" primary onClick={onStopRecording} />
      </div>
    );
  }

  return (
    <div className="cst-hud" role="group" aria-label="Live capture">
      <span className="cst-hud-state">
        <i className="cst-capture-dot" aria-hidden="true" />
        <span className="cst-hud-name">{name}</span>
      </span>
      {windowed && <ShowPage onShowPage={onShowPage} />}
      <Action
        icon={MouseScroll01Icon}
        label="Full page"
        tip={capture.canScroll ? 'Capture the whole page, scrolled for you' : 'Capture the whole page as you scroll it'}
        onClick={onFullPage}
      />
      {canRecord && (
        <Action
          icon={CircleDotIcon}
          label="Record"
          tip={`Record a clip, up to ${RECORD_LIMIT} seconds`}
          onClick={onRecord}
        />
      )}
      <Action icon={Tick02Icon} label="Done" tip="Keep this view and stop sharing" primary onClick={onDone} />
    </div>
  );
}
