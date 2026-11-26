import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as jsxRuntime from 'react/jsx-runtime';

const pad = day => String(day).padStart(2, '0');

const mounted = new Map();

export class GiftLocked extends Error {
  constructor(opens) {
    super('locked');
    this.opens = opens;
  }
}

export const fetchGift = async (day, part = 'gift') => {
  const url = import.meta.env.DEV ? `/advent/dist/${pad(day)}.${part}.json` : `/api/advent/${day}/${part}`;
  const response = await fetch(url, { cache: import.meta.env.DEV ? 'no-store' : 'default' });
  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    throw new GiftLocked(body.opens);
  }
  if (!response.ok) throw new Error(`gift ${day} unavailable`);
  return response.json();
};

const runScript = (code, day) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    const script = document.createElement('script');
    script.src = url;
    script.dataset.advGift = String(day);
    script.onload = () => {
      URL.revokeObjectURL(url);
      const exported = window.__rbAdventGift;
      window.__rbAdventGift = undefined;
      resolve(exported?.default ?? exported);
    };
    script.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`gift ${day} failed to run`));
    };
    document.head.appendChild(script);
  });

export const mountGift = async payload => {
  if (mounted.has(payload.day)) return mounted.get(payload.day);
  window.__rbAdvent = { React, ReactDOM, jsxRuntime };
  if (payload.css && !document.querySelector(`style[data-adv-gift="${payload.day}"]`)) {
    const style = document.createElement('style');
    style.dataset.advGift = String(payload.day);
    style.textContent = payload.css;
    document.head.appendChild(style);
  }
  const pending = runScript(payload.js, payload.day);
  mounted.set(payload.day, pending);
  return pending;
};
