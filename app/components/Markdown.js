"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// rehype-raw 미사용 → raw HTML 미렌더(저장형 XSS 차단).
// react-markdown v9는 위험 URL 프로토콜(javascript: 등)도 기본 차단.
export default function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ""}</ReactMarkdown>
  );
}
