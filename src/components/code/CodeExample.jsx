import { getLanguage } from "../../utils/utils";
import CodeHighlighter from "./CodeHighlighter";
import { CodeOptions, CSSTab, TailwindTab } from "./CodeOptions";

const CodeExample = ({ codeObject }) => {
  return (
    <>
      {Object.entries(codeObject).map(([key, codeString]) => {
        if (key === 'tailwind' || key === 'css') return null;

        const hasNoCss = !codeObject.tailwind && !codeObject.css;

        return key === 'code' ? (
          <div key={codeString}>
            <h2 className="demo-title">{key}</h2>
            <CodeOptions key={codeString} hasNoCss={hasNoCss}>
              <TailwindTab>
                <CodeHighlighter language="jsx" codeString={codeObject.tailwind} />
              </TailwindTab>
              <CSSTab>
                <CodeHighlighter language="jsx" codeString={codeObject.code} />
                {codeObject.css && (
                  <>
                    <h2 className="demo-title">CSS</h2>
                    <CodeHighlighter language="css" codeString={codeObject.css} />
                  </>
                )}
              </CSSTab>
            </CodeOptions>
          </div>
        ) : (
          <div key={codeString}>
            <h2 className="demo-title">{key}</h2>
            <CodeHighlighter language={getLanguage(key)} codeString={codeString} />
          </div>
        );
      })}
    </>
  );
};

export default CodeExample;
