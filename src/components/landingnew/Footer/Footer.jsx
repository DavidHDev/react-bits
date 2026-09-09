import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { AiFillHeart } from 'react-icons/ai';
import ReactBitsLogo from '../../../assets/logos/react-bits-logo.svg';
import { proLinkProps } from '../../../utils/pro';
import './Footer.css';

const Footer = () => (
  <footer className="ln-footer">
    <div className="ln-footer-glow" />

    <div className="ln-footer-separator" />

    <motion.div
      className="ln-footer-inner"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div className="ln-footer-top">
        <div className="ln-footer-brand">
          <img src={ReactBitsLogo} alt="React Bits" className="ln-footer-logo" />
          <p className="ln-footer-tagline">Animated UI components for React.</p>
        </div>

        <nav className="ln-footer-nav">
          <div className="ln-footer-col">
            <span className="ln-footer-col-title">Product</span>
            <Link to="/get-started/introduction" className="ln-footer-link">
              Docs
            </Link>
            <Link to="/showcase" className="ln-footer-link">
              Showcase
            </Link>
            <Link to="/sponsors" className="ln-footer-link">
              Sponsors
            </Link>
          </div>

          <div className="ln-footer-col">
            <span className="ln-footer-col-title">Community</span>
            <a
              href="https://github.com/DavidHDev/react-bits"
              target="_blank"
              rel="noopener noreferrer"
              className="ln-footer-link"
            >
              GitHub
            </a>
            <a href="https://vue-bits.dev/" target="_blank" rel="noopener noreferrer" className="ln-footer-link">
              Vue Bits
            </a>
            <a href="https://sveltebits.xyz/" target="_blank" rel="noopener noreferrer" className="ln-footer-link">
              Svelte Bits
            </a>
          </div>

          <div className="ln-footer-col">
            <span className="ln-footer-col-title">Pro</span>
            <Link to="/pro" className="ln-footer-link">
              What&apos;s in Pro
            </Link>
            <Link to="/pro/components" className="ln-footer-link">
              Pro Components
            </Link>
            <Link to="/pro/blocks" className="ln-footer-link">
              Pro Blocks
            </Link>
            <Link to="/pro/templates" className="ln-footer-link">
              Pro Templates
            </Link>
            <a {...proLinkProps('/#pricing', 'footer', { sameTab: true })} className="ln-footer-link">
              Get React Bits Pro
            </a>
          </div>
        </nav>
      </div>

      <div className="ln-footer-bottom">
        <p className="ln-footer-attribution">
          Created with <AiFillHeart className="ln-footer-heart" /> by{' '}
          <a href="https://x.com/davidhaz" target="_blank" rel="noopener noreferrer" className="ln-footer-creator">
            davidhaz
          </a>
        </p>
        <p className="ln-footer-copy">
          © {new Date().getFullYear()} React Bits ·{' '}
          <a
            href="https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="ln-footer-creator"
          >
            License
          </a>
        </p>
      </div>
    </motion.div>
  </footer>
);

export default Footer;
