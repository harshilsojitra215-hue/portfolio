import { useEffect, useMemo, useRef, useState } from 'react'
import {
  IconCrossLab,
  IconMark,
  IconLabs,
  IconMatrix,
  IconMethod,
  IconOverview,
  IconSponsors,
  IconSearch,
  IconFilter,
} from './components/Icons'
import Overview from './views/Overview'
import Sponsors from './views/Sponsors'
import CrossLab from './views/CrossLab'
import Labs from './views/Labs'
import Coverage from './views/Coverage'
import Method from './views/Method'
import PartnerDrawer from './components/PartnerDrawer'
import { partners } from './data/partners'
import { opportunities, totals } from './derive'

export type ViewId = 'overview' | 'sponsors' | 'crosslab' | 'labs' | 'coverage' | 'method'

const nav: { id: ViewId; label: string; icon: () => JSX.Element; count?: number }[] = [
  { id: 'overview', label: 'Overview', icon: IconOverview },
  { id: 'sponsors', label: 'Sponsors', icon: IconSponsors, count: partners.length },
  { id: 'crosslab', label: 'Cross-lab', icon: IconCrossLab, count: opportunities.length },
  { id: 'labs', label: 'Labs', icon: IconLabs, count: totals.labs },
  { id: 'coverage', label: 'Coverage', icon: IconMatrix },
  { id: 'method', label: 'Method', icon: IconMethod },
]

const searchable = new Set<ViewId>(['sponsors', 'crosslab', 'labs'])

const viewIds = new Set<string>(nav.map((n) => n.id))

interface Route {
  view: ViewId
  partner: string | null
}

/**
 * State lives in the URL: `#/sponsors`, `#/crosslab/bmw`.
 *
 * Not for its own sake. This gets sent as a link, and the first thing anyone does with a
 * finding is show it to someone else, which is impossible if every screen has the same
 * address. It also means the back button closes a drawer instead of leaving the site, which
 * is the behaviour a browser has already promised the reader on our behalf.
 */
function parseHash(): Route {
  const [rawView, rawPartner] = window.location.hash.replace(/^#\/?/, '').split('/')
  return {
    view: viewIds.has(rawView) ? (rawView as ViewId) : 'overview',
    partner: rawPartner && partners.some((p) => p.id === rawPartner) ? rawPartner : null,
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  /**
   * Whether this session was the thing that opened the drawer.
   *
   * Closing used to call history.back() whenever history.length was above one, which reads as
   * a safe guard and is not: history.length counts the whole tab, not the entries this app
   * created. Open the site on a deep link, as anyone following a link in an email does, and
   * the first entry behind the drawer is wherever they came from. Clicking the close button
   * then left the site. Only a drawer this session pushed is safe to pop.
   */
  const pushedDrawer = useRef(false)

  useEffect(() => {
    const onHash = () => {
      const next = parseHash()
      // Navigating away from a record by any route, including the back button, means the
      // entry this session pushed is gone and must not be popped again.
      if (!next.partner) pushedDrawer.current = false
      setRoute(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const { view, partner: openPartner } = route

  const go = (v: ViewId) => {
    window.location.hash = `#/${v}`
    setQuery('')
    setFiltersOpen(false)
  }

  const setOpenPartner = (id: string) => {
    pushedDrawer.current = true
    window.location.hash = `#/${view}/${id}`
  }

  const closePartner = () => {
    if (pushedDrawer.current) {
      pushedDrawer.current = false
      window.history.back()
    } else {
      window.location.hash = `#/${view}`
    }
  }

  const title = useMemo(() => nav.find((n) => n.id === view)!.label, [view])

  // A shared link should say what it points at in the tab and the bookmark, not just on screen.
  useEffect(() => {
    const name = openPartner ? partners.find((p) => p.id === openPartner)?.name : null
    document.title = `${name ?? title} · Lab Bridge`
  }, [title, openPartner])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <IconMark />
          </span>
          <span className="brand-text">
            <strong>Lab Bridge</strong>
            <span>Sponsor relations</span>
          </span>
        </div>

        <nav className="nav" aria-label="Sections">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className="nav-item"
                aria-current={view === item.id}
                onClick={() => go(item.id)}
              >
                <Icon />
                <span className="nav-label">{item.label}</span>
                {item.count !== undefined && <span className="nav-count">{item.count}</span>}
              </button>
            )
          })}
        </nav>

        <p className="sidebar-foot">
          Independent prototype. Built from public information on tum-venture-labs.de. Not
          affiliated with TUM Venture Labs.
        </p>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{title}</h1>
            <span className="crumb">Cross-lab sponsor map · public data</span>
          </div>

          <div className="topbar-tools">
            {searchable.has(view) && (
              <label className="search">
                <IconSearch />
                <input
                  type="search"
                  value={query}
                  placeholder={
                    view === 'sponsors'
                      ? 'Search sponsor or sector'
                      : view === 'crosslab'
                        ? 'Search sponsor or lab'
                        : 'Search lab or technology'
                  }
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            )}
            {view === 'sponsors' && (
              <button
                className="btn"
                aria-pressed={filtersOpen}
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <IconFilter />
                Filters
              </button>
            )}
          </div>
        </header>

        {/* Keyed on the view so React remounts this region and the entrance animation
            reruns. Without the key the node persists and the new view simply appears. */}
        <div className="content" key={view}>
          {view === 'overview' && <Overview onOpenPartner={setOpenPartner} onGo={go} />}
          {view === 'sponsors' && (
            <Sponsors
              query={query}
              filtersOpen={filtersOpen}
              onOpenPartner={setOpenPartner}
            />
          )}
          {view === 'crosslab' && <CrossLab query={query} onOpenPartner={setOpenPartner} />}
          {view === 'labs' && <Labs query={query} onOpenPartner={setOpenPartner} />}
          {view === 'coverage' && <Coverage onOpenPartner={setOpenPartner} />}
          {view === 'method' && <Method />}
        </div>
      </div>

      {/*
        The disclaimer normally lives in the sidebar, and print hides the sidebar. A PDF of this
        page is exactly the artefact that gets forwarded to someone who never saw the site, so it
        is the last place the "independent, not affiliated" line can afford to go missing.
      */}
      <footer className="print-note">
        Lab Bridge. An independent prototype by Harshil Sojitra, built from information published
        on tum-venture-labs.de. Not affiliated with, endorsed by, or requested by TUM Venture Labs,
        TUM, or UnternehmerTUM. Lab associations shown here are read from public pages and are
        indicative, not authoritative.
      </footer>

      {openPartner && (
        <PartnerDrawer id={openPartner} onClose={closePartner} />
      )}
    </div>
  )
}
