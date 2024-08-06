import { getLanguage } from "../utils/utils";
import CodeHighlighter from "./CodeHighlighter";

const CodeExample = ({ codeObject }) => {
  return (
    <>
      {Object.entries(codeObject).map((value) => {
        const key = value[0];
        const codeString = value[1];
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