import { Component as ReactComponent, useSyncExternalStore } from 'react';
import { errorListeners, getState, subscribe } from './store';

class Boundary extends ReactComponent {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    errorListeners.forEach(listener => listener(error));
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Frame() {
  const { Component, props, key, wrapperStyle } = useSyncExternalStore(subscribe, getState);
  return (
    <div className="frame-stage" style={wrapperStyle || undefined}>
      {Component && (
        <Boundary key={key}>
          <Component {...props} />
        </Boundary>
      )}
    </div>
  );
}
