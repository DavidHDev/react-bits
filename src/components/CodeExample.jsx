import { getLanguage } from "../utils/utils";
import CodeHighlighter from "./CodeHighlighter";

const CodeExample = ({ codeObject }) => {
  return (
    <>
      {Object.entries(codeObject).map((value) => {
        const key = value[0];
        const codeString = value[1];
        return (
          <>
            <h2 className="demo-title">{key}</h2>
            <CodeHighlighter key={codeString} language={getLanguage(key)} codeString={codeString} />
          </>
        )
      })}
    </>
  );
}

export default CodeExample;