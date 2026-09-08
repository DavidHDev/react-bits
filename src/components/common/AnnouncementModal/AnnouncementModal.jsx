import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { LuX, LuVolume2, LuVolumeX } from 'react-icons/lu';
import { FiArrowRight } from 'react-icons/fi';
import { proUrl, trackProClick } from '../../../utils/pro';
import './AnnouncementModal.css';

// Bumped for each release so people who dismissed the previous announcement
// still see the new one.
const STORAGE_KEY = 'rb-pro-september-2026-release-seen';
const SHOW_DELAY = 1500;
const PROMO_VIDEO = 'https://cdn.reactbits.dev/SEPTEMBERUPDATE.mp4';

const DISABLED = false;

const AnnouncementModal = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem(STORAGE_KEY);

    if (hasSeenModal || DISABLED || isLandingPage) return;

    const timer = setTimeout(() => {
      previouslyFocusedElement.current = document.activeElement;
      setIsVisible(true);
    }, SHOW_DELAY);

    return () => clearTimeout(timer);
  }, [isLandingPage]);

  useEffect(() => {
    if (isVisible && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isVisible]);

  const handleDismiss = useCallback(() => {
    setIsClosing(true);
    localStorage.setItem(STORAGE_KEY, 'true');

    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }, 200);
  }, []);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isVisible && !isClosing) {
        handleDismiss();
      }

      if (e.key === 'Tab' && isVisible && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isClosing, handleDismiss]);

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          className="announcement-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            className="announcement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-modal-title"
            aria-describedby="announcement-modal-description"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="announcement-modal-border" aria-hidden="true" />

            <div className="announcement-modal-card">
              <button className="announcement-modal-close" onClick={handleDismiss} aria-label="Close announcement">
                <LuX size={16} />
              </button>

              <div className="announcement-modal-image">
                <video
                  src={PROMO_VIDEO}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  width={1920}
                  height={1080}
                  aria-label="React Bits Pro September update: new components, templates, bento blocks and Bento Builder"
                />
                <button
                  className="announcement-modal-sound"
                  onClick={() => setIsMuted(m => !m)}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <LuVolumeX size={15} /> : <LuVolume2 size={15} />}
                </button>
              </div>

              <div className="announcement-modal-content">
                <h2 id="announcement-modal-title" className="announcement-modal-title">
                  React Bits Pro September Update
                </h2>

                <div id="announcement-modal-description" className="announcement-modal-description">
                  <p>
                    <strong>16 new components</strong>, <strong>4 new templates</strong> and{' '}
                    <strong>42 new bento blocks</strong> just landed, along with the new <strong>Bento Builder</strong>.
                  </p>
                  <p>
                    Drag, resize and arrange your next bento layout. More ways to build, all included in the update.
                  </p>
                </div>

                <a
                  href={proUrl('/', 'announcement-modal')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="announcement-modal-btn announcement-modal-btn--primary"
                  onClick={() => {
                    trackProClick('announcement-modal');
                    handleDismiss();
                  }}
                >
                  Explore React Bits Pro <FiArrowRight size={14} />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementModal;
