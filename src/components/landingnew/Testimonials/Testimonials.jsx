import { useState } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import './Testimonials.css';

const TWEETS = [
  {
    handle: '@shadcn',
    avatar: 'https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg',
    text: 'Everything about this is next level: the components, the registry, dynamic items.',
    url: 'https://x.com/shadcn/status/1962854085587275932'
  },
  {
    handle: '@gregberge_',
    avatar: 'https://pbs.twimg.com/profile_images/1722358890807861248/75S7CB3G_400x400.jpg',
    text: 'React Bits: A stellar collection of React components to make your landing pages shine ✨',
    url: 'https://x.com/gregberge_/status/1896425347866059041'
  },
  {
    handle: '@GibsonSMurray',
    avatar: null,
    text: 'React Bits has got to be the most artistic ui component lib I have seen in a while 🤌',
    url: 'https://x.com/GibsonSMurray/status/1889909058838339626'
  },
  {
    handle: '@orcdev',
    avatar: 'https://pbs.twimg.com/profile_images/1756766826736893952/6Gvg6jha_400x400.jpg',
    text: "React Bits has become the ultimate visual animation library for React. This level of flexibility doesn't exist anywhere else.",
    url: 'https://x.com/orcdev/status/2005627805938422123'
  },
  {
    handle: '@Logreg_n_coffee',
    avatar: 'https://pbs.twimg.com/profile_images/1554006663853592576/Gxtolzbo_400x400.jpg',
    text: 'Literally the coolest react library in react —',
    url: 'https://x.com/Logreg_n_coffee/status/1889573533425991992'
  },
  {
    handle: '@syskey_dmg',
    avatar: 'https://pbs.twimg.com/profile_images/1918646280223608832/nqBF4zh__400x400.jpg',
    text: 'Just discovered reactbits.dev — a sleek, minimal, and super dev-friendly React component library. Clean UI, easy to use, and perfect for modern projects.',
    url: 'https://x.com/syskey_dmg/status/1929762648922398754'
  },
  {
    handle: '@DIYDevs',
    avatar: 'https://pbs.twimg.com/profile_images/1880284612062056448/4Y2C8Xnv_400x400.jpg',
    text: 'Have you heard of react bits? David Haz has lovingly put together a collection of animated and fully customizable React components.',
    url: 'https://x.com/DIYDevs/status/1892964440900763761'
  },
  {
    handle: '@irohandev',
    avatar: null,
    text: 'Got to know about React Bits and its just wow, the components are incredibly well designed! Really loved the overall feel and quality.',
    url: 'https://x.com/irohandev/status/1934877463064268822'
  },
  {
    handle: '@makwanadeepam',
    avatar: 'https://pbs.twimg.com/profile_images/1794450494686932992/wqRqF4dt_400x400.jpg',
    text: 'Really impressed by reactbits.dev. Check it out. The Splash Cursor effect is amazing.',
    url: 'https://x.com/makwanadeepam/status/1879416558461890864'
  }
];

/** Deals the list into three columns round-robin so each one stays evenly filled. */
const toColumns = tweets => [0, 1, 2].map(offset => tweets.filter((_, i) => i % 3 === offset));

const TweetAvatar = ({ tweet }) => {
  const [failed, setFailed] = useState(false);
  if (tweet.avatar && !failed) {
    return <img src={tweet.avatar} alt="" className="ln-test-avatar" loading="lazy" onError={() => setFailed(true)} />;
  }
  return (
    <span className="ln-test-avatar ln-test-avatar-fallback" aria-hidden="true">
      {tweet.handle.replace(/^@/, '').slice(0, 2).toUpperCase()}
    </span>
  );
};

const TweetCard = ({ tweet }) => (
  <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="ln-test-card">
    <div className="ln-test-card-inner">
      <p className="ln-test-text">{tweet.text}</p>
      <div className="ln-test-card-head">
        <div className="ln-test-card-head-left">
          <TweetAvatar key={tweet.avatar || tweet.handle} tweet={tweet} />
          <span className="ln-test-handle">{tweet.handle}</span>
        </div>
        <FaXTwitter className="ln-test-x-icon" />
      </div>
    </div>
  </a>
);

const Column = ({ tweets, direction = 'up' }) => (
  <div className="ln-test-col">
    <div className={`ln-test-col-scroll ln-test-col-scroll--${direction}`}>
      {['a', 'b', 'c'].map(prefix => (
        <div className="ln-test-col-set" key={prefix}>
          {tweets.map(t => (
            <TweetCard key={`${prefix}-${t.handle}`} tweet={t} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const Testimonials = ({ tweets = TWEETS, title = 'Loved by developers', className = '' }) => {
  const [col1, col2, col3] = toColumns(tweets);

  return (
    <section className={`ln-test-section${className ? ` ${className}` : ''}`}>
      <div className="ln-test-inner">
        <h2 className="ln-test-title">{title}</h2>
        <div className="ln-test-grid">
          <Column tweets={col1} direction="up" />
          <Column tweets={col2} direction="down" />
          <Column tweets={col3} direction="up" />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
