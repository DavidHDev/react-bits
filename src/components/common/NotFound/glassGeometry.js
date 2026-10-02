import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape, Vector2 } from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

const DEPTH = 2.6;
export const createShardGeometry = shard => {
  const cx = shard.x + shard.width / 2;
  const cy = shard.y + shard.height / 2;
  const bevelThickness = shard.bevelThickness ?? 0.4;
  const shape = new Shape(shard.vertices.map(point => new Vector2(point.x - cx, cy - point.y)));
  const geometry = new ExtrudeGeometry(shape, {
    depth: DEPTH,
    steps: 1,
    bevelEnabled: true,
    bevelThickness,
    bevelSize: shard.bevelSize ?? 0.75,
    bevelSegments: 8,
    curveSegments: 1
  });
  geometry.translate(0, 0, -DEPTH / 2);

  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const sides = geometry.groups.find(group => group.materialIndex === 1);
  const edgeVertices = sides.count / shard.vertices.length;
  // Smooth each bevel strip independently so fracture corners stay sharp
  // without introducing normal discontinuities inside a straight edge.
  for (let start = sides.start; start < sides.start + sides.count; start += edgeVertices) {
    const strip = new BufferGeometry();
    strip.setAttribute(
      'position',
      new Float32BufferAttribute(position.array.slice(start * 3, (start + edgeVertices) * 3), 3)
    );
    toCreasedNormals(strip, Math.PI / 2);
    normal.array.set(strip.getAttribute('normal').array, start * 3);
    strip.dispose();
  }

  const faceZ = DEPTH / 2 + bevelThickness;
  for (let index = 0; index < position.count; index++) {
    const z = position.getZ(index);
    if (Math.abs(Math.abs(z) - faceZ) < 1e-5) normal.setXYZ(index, 0, 0, Math.sign(z));
  }

  normal.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
};
