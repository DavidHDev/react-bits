import { Link } from 'react-router-dom';
import ReactBitsLogo from '../../../assets/logos/react-bits-logo.svg';
import { proLinkProps } from '../../../utils/pro';
import FooterWaves from './FooterWaves';
import './Footer.css';

const Footer = () => (
  <footer className="ln-footer">
    <div className="ln-footer-inner">
      <div className="ln-footer-top">
        <div className="ln-footer-brand">
          <Link to="/" aria-label="React Bits home">
            <img className="ln-footer-logo" src={ReactBitsLogo} alt="React Bits" width="180" height="36" />
          </Link>
          <p>
            Animated React components.
            <br />
            Open source. Fully customizable.
          </p>
        </div>

        <nav className="ln-footer-nav" aria-label="Footer">
          <div className="ln-footer-col">
            <span className="ln-footer-col-title">Community</span>
            <a href="https://github.com/DavidHDev/react-bits" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://vue-bits.dev/" target="_blank" rel="noopener noreferrer">
              Vue Bits
            </a>
            <a href="https://sveltebits.xyz/" target="_blank" rel="noopener noreferrer">
              Svelte Bits
            </a>
          </div>
          <div className="ln-footer-col">
            <span className="ln-footer-col-title">Product</span>
            <Link to="/get-started/introduction">Docs</Link>
            <Link to="/tools">Tools</Link>
            <Link to="/showcase">Showcase</Link>
            <Link to="/sponsors">Sponsors</Link>
          </div>
          <div className="ln-footer-col">
            <span className="ln-footer-col-title">Pro</span>
            <Link to="/pro">What&apos;s in Pro</Link>
            <a {...proLinkProps('/docs/components', 'footer', { params: { section: 'components' }, sameTab: true })}>
              Components
            </a>
            <a {...proLinkProps('/docs/blocks', 'footer', { params: { section: 'blocks' }, sameTab: true })}>Blocks</a>
            <a {...proLinkProps('/docs/templates', 'footer', { params: { section: 'templates' }, sameTab: true })}>
              Templates
            </a>
          </div>
        </nav>
      </div>

      <FooterWaves />

      <div className="ln-footer-bottom">
        <span>© {new Date().getFullYear()} React Bits</span>
        <div className="ln-footer-credits">
          <span>
            Built with love by{' '}
            <a href="https://x.com/davidhaz" target="_blank" rel="noopener noreferrer">
              @davidhaz
            </a>
          </span>
          <a
            href="https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            License
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
