import { getLanguage } from "../../utils/utils";
import CodeHighlighter from "./CodeHighlighter";
import { CodeOptions, CSSTab, TailwindTab } from "./CodeOptions";

const CodeExample = ({ codeObject }) => {
  return (
    <>
      {Object.entries(codeObject).map((value) => {
        const key = value[0];
        const codeString = value[1];

        if (key === 'tailwind' || key === 'css') return;

        if (key === 'code') {
          return (
            <div key={codeString}>
              <h2 className="demo-title">{key}</h2>
              <CodeOptions key={codeString}>
                <TailwindTab>
                  <CodeHighlighter language='jsx' codeString={codeObject.tailwind} />
                </TailwindTab>

                <CSSTab>
                  <CodeHighlighter language='jsx' codeString={codeObject.code} />
                  <h2 className="demo-title">CSS</h2>
                  <CodeHighlighter language='css' codeString={codeObject.css} />
                </CSSTab>
              </CodeOptions>
            </div>

          )
        }

        return (
          <div key={codeString}>
            <h2 className="demo-title">{key}</h2>
            <CodeHighlighter language={getLanguage(key)} codeString={codeString} />
          </div>
        )
      })}
    </>
  );
}

export default CodeExample;