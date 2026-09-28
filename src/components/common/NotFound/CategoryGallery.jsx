import { useEffect, useRef } from 'react';
import { createGalleryCanvas } from './galleryCanvas';

const CategoryGallery = ({ category, active, reducedMotion, theme, onFrame }) => {
  const canvasRef = useRef(null);
  const galleryRef = useRef(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    const gallery = createGalleryCanvas(canvasRef.current, canvas => onFrameRef.current?.(canvas));
    galleryRef.current = gallery;
    return () => {
      gallery.dispose();
      galleryRef.current = null;
    };
  }, []);

  useEffect(() => {
    galleryRef.current?.update({ category, active, reducedMotion, theme });
  }, [category, active, reducedMotion, theme]);

  return <canvas className="nf-gallery-canvas" ref={canvasRef} aria-hidden="true" />;
};

export default CategoryGallery;
