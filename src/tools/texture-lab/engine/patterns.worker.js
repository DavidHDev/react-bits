import { BLUE_SIZE, POINT_SIZE, farthestPoints, voidAndCluster } from './patterns';

self.onmessage = event => {
  const blue = event.data?.blue ? voidAndCluster(BLUE_SIZE) : null;
  const points = event.data?.points ? farthestPoints(POINT_SIZE) : null;
  self.postMessage({ blue, points }, [blue?.buffer, points?.buffer].filter(Boolean));
};
