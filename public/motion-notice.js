// Shown only when the device prefers reduced motion (the inline motion script in the
// document head loads this file and sets window.__BITS_MOTION__ before doing so).
// Lets visitors opt in to animations on this site without changing their system setting.
(() => {
  const config = window.__BITS_MOTION__;
  if (!config) return;

  const { key, forced } = config;
  const noticeKey = `${key}-notice`;
  // Declining is remembered; an active override is re-announced once per visit so it is never silent.
  const dismissStore = () => (forced ? sessionStorage : localStorage);

  try {
    if (dismissStore().getItem(noticeKey) === '1') return;
  } catch {
    // Storage blocked: show the notice.
  }

  const mount = () => {
    const host = document.createElement('div');
    host.id = 'bits-motion-notice';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          position: fixed;
          left: 50%;
          bottom: 16px;
          z-index: 2147483000;
          transform: translateX(-50%);
          width: max-content;
          max-width: calc(100vw - 32px);
        }
        .notice {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          box-sizing: border-box;
          padding: 10px 10px 10px 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          background: #18181b;
          color: #fafafa;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
          font: 14px/1.4 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
        p {
          flex: 1 1 240px;
          margin: 0;
        }
        .actions {
          display: flex;
          gap: 4px;
          margin-left: auto;
        }
        button {
          font: inherit;
          font-weight: 600;
          color: inherit;
          border: 0;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.12);
        }
        button:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        button:focus-visible {
          outline: 2px solid #fafafa;
          outline-offset: 2px;
        }
        .close {
          padding: 6px 10px;
          background: transparent;
        }
      </style>
      <div class="notice" role="region" aria-label="Motion preference">
        <p></p>
        <div class="actions">
          <button type="button" class="toggle"></button>
          <button type="button" class="close" aria-label="Dismiss">&#x2715;</button>
        </div>
      </div>
    `;

    shadow.querySelector('p').textContent = forced
      ? 'Animations are on for this site, overriding your device’s reduced motion setting.'
      : 'Your device is set to reduce motion, so most demos here only show a still frame.';
    shadow.querySelector('.toggle').textContent = forced ? 'Use device setting' : 'Play animations';

    shadow.querySelector('.toggle').addEventListener('click', () => {
      try {
        if (forced) localStorage.removeItem(key);
        else localStorage.setItem(key, 'force');
        localStorage.removeItem(noticeKey);
        sessionStorage.removeItem(noticeKey);
      } catch {
        return;
      }
      // Components read the preference once on mount, so a reload is the only reliable way to apply it.
      location.reload();
    });

    shadow.querySelector('.close').addEventListener('click', () => {
      host.remove();
      try {
        dismissStore().setItem(noticeKey, '1');
      } catch {
        // Storage blocked: the notice just stays hidden for this page view.
      }
    });

    document.body.appendChild(host);
  };

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
