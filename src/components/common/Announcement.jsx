import { useState, useEffect } from 'react';
import { FiX, FiShare2 } from 'react-icons/fi';

const ANNOUNCEMENT_MESSAGE = '';

const STORAGE_KEYS = {
  lastMessage: 'announcement-last-message',
  userClosed: 'announcement-user-closed'
};

const checkIfMobile = () => window.innerWidth < 768 || 'ontouchstart' in window;

const parseMessageWithLinks = message => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push(message.substring(lastIndex, match.index));
    }

    const [, linkText, linkUrl] = match;
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        className="announcement-link"
        target={linkUrl.startsWith('http') ? '_blank' : '_self'}
        rel={linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {linkText}
      </a>
    );

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < message.length) {
    parts.push(message.substring(lastIndex));
  }

  return parts.length > 0 ? parts : message;
};

const Announcement = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const lastStoredMessage = localStorage.getItem(STORAGE_KEYS.lastMessage);
    const userClosed = localStorage.getItem(STORAGE_KEYS.userClosed) === 'true';

    const shouldShow =
      lastStoredMessage !== ANNOUNCEMENT_MESSAGE ||
      !lastStoredMessage ||
      (lastStoredMessage === ANNOUNCEMENT_MESSAGE && !userClosed);

    if (shouldShow) {
      setIsVisible(true);
      localStorage.setItem(STORAGE_KEYS.lastMessage, ANNOUNCEMENT_MESSAGE);

      if (lastStoredMessage !== ANNOUNCEMENT_MESSAGE) {
        localStorage.removeItem(STORAGE_KEYS.userClosed);
      }
    }

    setIsMobile(checkIfMobile());
  }, []);

  const closeAnnouncement = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEYS.userClosed, 'true');
  };

  const shareToX = text => {
    const tweetText = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  const handleShare = async () => {
    const shareText = ANNOUNCEMENT_MESSAGE.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

    if (isMobile) {
      if (navigator.share) {
        try {
          const response = await fetch('/vue-bits.jpg');
          const blob = await response.blob();
          const file = new File([blob], 'vue-bits.jpg', { type: 'image/jpeg' });

          await navigator.share({
            title: 'Vue Bits - Official Vue Port of React Bits',
            text: shareText,
            files: [file]
          });
        } catch (error) {
          try {
            await navigator.share({
              title: 'Vue Bits - Official Vue Port of React Bits',
              text: shareText,
              url: window.location.origin
            });
          } catch (fallbackError) {
            console.log('Sharing failed:', fallbackError);
          }
        }
      }
    } else {
      const twitterText = ANNOUNCEMENT_MESSAGE.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$2');
      shareToX(twitterText);
    }
  };

  if (!ANNOUNCEMENT_MESSAGE || ANNOUNCEMENT_MESSAGE.trim() === '') {
    return null;
  }

  if (!isVisible) return null;

  return (
    <div className="announcement-bar">
      <div className="announcement-content">{parseMessageWithLinks(ANNOUNCEMENT_MESSAGE)}</div>
      <div className="announcement-actions">
        <button onClick={handleShare} className="announcement-share" aria-label={isMobile ? 'Share' : 'Share on X'}>
          <FiShare2 size={16} />
          <span className="announcement-share-text">{isMobile ? 'Share' : 'Share on X'}</span>
        </button>
        <button onClick={closeAnnouncement} className="announcement-close" aria-label="Close announcement">
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default Announcement;
