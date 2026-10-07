const DocsStep = ({ index, title, children }) => (
  <li className="docs-step">
    <h3 className="docs-step-title">
      <span className="docs-step-marker" aria-hidden="true">
        {index}
      </span>
      {title}
    </h3>
    {children}
  </li>
);

export default DocsStep;
