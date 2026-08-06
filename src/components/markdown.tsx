import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** 비개발자도 편하게 읽히도록 기본 마크다운을 절제된 스타일로 렌더. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-slate-800 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h2 className="text-xl font-bold mt-4 mb-2" {...p} />,
          h2: (p) => <h3 className="text-lg font-bold mt-4 mb-2" {...p} />,
          h3: (p) => <h4 className="text-base font-semibold mt-3 mb-1" {...p} />,
          p: (p) => <p className="my-2" {...p} />,
          ul: (p) => <ul className="list-disc pl-5 my-2 space-y-1" {...p} />,
          ol: (p) => <ol className="list-decimal pl-5 my-2 space-y-1" {...p} />,
          a: (p) => <a className="text-blue-600 underline" target="_blank" rel="noreferrer" {...p} />,
          code: (p) => (
            <code className="rounded bg-slate-100 px-1 py-0.5 text-sm font-mono" {...p} />
          ),
          pre: (p) => (
            <pre className="rounded-lg bg-slate-900 text-slate-50 p-3 overflow-x-auto my-3 text-sm" {...p} />
          ),
          blockquote: (p) => (
            <blockquote className="border-l-4 border-slate-200 pl-3 text-slate-600 my-2" {...p} />
          ),
          table: (p) => <table className="border-collapse my-3 text-sm" {...p} />,
          th: (p) => <th className="border border-slate-200 px-2 py-1 bg-slate-50" {...p} />,
          td: (p) => <td className="border border-slate-200 px-2 py-1" {...p} />,
          // eslint-disable-next-line @next/next/no-img-element
          img: (p) => <img alt="" className="max-w-full rounded-lg my-2" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
