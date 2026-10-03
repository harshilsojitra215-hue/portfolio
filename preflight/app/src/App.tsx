import { useState } from "react";
import type { Results, Book, Verdict } from "./types";
import { Readiness, Evidence, Impact, Customer } from "./components/Screens";
import { Logo, IconShield, IconChart, IconEuro, IconUser } from "./components/Icons";
import { num, pct } from "./lib/format";
import raw from "./data/results.json";

const results = raw as unknown as Results;

const VERDICT_DOT: Record<Verdict, string> = {
  GREEN: "#047857",
  AMBER: "#CA8A04",
  RED: "#DC2626",
};

const PAGES = [
  {
    key: "readiness", name: "Readiness", Icon: IconShield,
    title: "Can this history answer a causal question?",
    sub: "Seven checks that run before any estimate",
  },
  {
    key: "evidence", name: "Evidence", Icon: IconChart,
    title: "Was there anybody to compare against?",
    sub: "The two measurements behind the verdict",
  },
  {
    key: "impact", name: "Impact", Icon: IconEuro,
    title: "What does running it anyway cost?",
    sub: "The same estimate, held against the truth",
  },
  {
    key: "customer", name: "One customer", Icon: IconUser,
    title: "Checked by hand",
    sub: "Two probabilities, one subtraction, one threshold",
  },
] as const;

type PageKey = (typeof PAGES)[number]["key"];

export default function App() {
  const [bookId, setBookId] = useState(results.books[0].book_id);
  const [page, setPage] = useState<PageKey>("readiness");
  const book = results.books.find((b) => b.book_id === bookId) as Book;
  const meta = PAGES.find((p) => p.key === page)!;
  const r = book.readiness;

  // One meaning, always: checks passed out of the total. The old badge showed a
  // fraction, then a warning count, then a failure count, in the same slot.
  const badge = {
    cls: r.verdict === "GREEN" ? "ok" : r.verdict === "AMBER" ? "warn" : "bad",
    text: `${r.n_pass}/${r.checks.length}`,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo />
          <span>
            <div className="brand-name">Preflight</div>
            <div className="brand-sub">causal readiness</div>
          </span>
        </div>

        <div className="nav-label">Report</div>
        <nav className="nav">
          {PAGES.map((p) => (
            <button
              key={p.key}
              className="nav-item"
              aria-current={page === p.key}
              onClick={() => { setPage(p.key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              <p.Icon />
              <span className="n">{p.name}</span>
              {p.key === "readiness" && <span className={`nav-badge ${badge.cls}`}>{badge.text}</span>}
            </button>
          ))}
        </nav>

        <div className="side-foot">
          <div className="side-rule" />
          <div className="sf-line">
            <b>Synthetic data.</b> Three generated books, fixed seed. No Presage data and no customer data.
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{meta.title}</h1>
            <div className="sub">{meta.sub}</div>
          </div>
          <div className="spacer" />
          <span className="tag">Independent prototype</span>
        </header>

        <div className="page">
          <div className="books">
            {results.books.map((b) => (
              <button
                key={b.book_id}
                className="book"
                aria-pressed={b.book_id === bookId}
                onClick={() => { setBookId(b.book_id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                <span className="dot" style={{ background: VERDICT_DOT[b.readiness.verdict] }} />
                <span>
                  <div className="bn">{b.display_name}</div>
                  <div className="bm">{num(b.n_customers)} customers · {pct(b.treated_share)} contacted</div>
                </span>
              </button>
            ))}
          </div>

          <div key={`${bookId}-${page}`}>
            {page === "readiness" && <Readiness book={book} thresholds={results.thresholds} />}
            {page === "evidence" && <Evidence book={book} />}
            {page === "impact" && <Impact book={book} />}
            {page === "customer" && <Customer book={book} />}
          </div>

          <div className="footnote">
            Built by Harshil Sojitra as an independent prototype. Not affiliated with Presage.
            Synthetic data, seed 20260914.
          </div>
        </div>
      </main>
    </div>
  );
}
