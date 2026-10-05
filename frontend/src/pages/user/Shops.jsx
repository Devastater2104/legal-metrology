import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Scale,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  Users,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { getMyShops } from '../../services/shopService'
import logo from '../../assets/legal-metrology-logo.png'

const API_BASE_URL = 'http://127.0.0.1:8000'

export default function Shops() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  async function loadShops() {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const data = await getMyShops(token)
      setShops(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Unable to load your shops.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShops()
  }, [token])

  const totals = useMemo(() => {
    return shops.reduce(
      (acc, shop) => {
        acc.instruments += Number(shop.instrument_count ?? shop.instruments?.length ?? 0)
        acc.pending += Number(shop.pending_verification_count ?? 0)
        acc.certificates += Number(shop.certificate_count ?? shop.valid_certificate_count ?? 0)
        return acc
      },
      { instruments: 0, pending: 0, certificates: 0 },
    )
  }, [shops])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  async function handleDelete(shop) {
    const instrumentCount = Number(
      shop.instrument_count ?? shop.instruments?.length ?? 0,
    )

    if (instrumentCount > 0) {
      window.alert(
        'This shop cannot be deleted because it has registered instruments. This protects verification and certificate history.',
      )
      return
    }

    const confirmed = window.confirm(
      `Delete “${shop.name}”?\n\nThis action cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingId(shop.id)

    try {
      const response = await fetch(`${API_BASE_URL}/user/shops/${shop.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.detail || 'Unable to delete this shop.')
      }

      await loadShops()
    } catch (err) {
      window.alert(err?.message || 'Unable to delete this shop.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <img
            src={logo}
            alt="Legal Metrology"
            style={styles.brandLogo}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
          <div>
            <div style={styles.brandTitle}>LEGAL METROLOGY</div>
            <div style={styles.brandSubtitle}>BUSINESS PORTAL</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavItem to="/user" icon={<LayoutDashboard size={19} />} label="Dashboard" />
          <NavItem to="/user/shops" icon={<Store size={19} />} label="My Shops" active />
          <NavItem to="/user/certificates" icon={<Award size={19} />} label="Certificates" />
          <NavItem to="/user/applications" icon={<FileCheck2 size={19} />} label="Applications" />
          <NavItem to="/user" icon={<Users size={19} />} label="Profile" />
        </nav>

        <div style={styles.helpCard}>
          <div style={styles.helpIcon}><HelpCircle size={19} /></div>
          <div style={styles.helpTitle}>Need Help?</div>
          <p style={styles.helpText}>
            For queries, contact the Legal Metrology Department.
          </p>
          <button type="button" style={styles.supportButton}>
            Contact Support
          </button>
        </div>
      </aside>

      <div style={styles.mainArea}>
        <header style={styles.topbar}>
          <div />
          <div style={styles.profileMenu}>
            <div style={styles.avatar}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={styles.profileCopy}>
              <strong>Welcome, {user?.name || 'User'}</strong>
              <span>Business User</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={styles.topLogout}
              title="Log out"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        <main style={styles.content}>
          <section style={styles.hero}>
            <div style={styles.heroCopy}>
              <div style={styles.eyebrow}>BUSINESS PORTAL</div>
              <h1 style={styles.heroTitle}>My Shops</h1>
              <p style={styles.heroText}>
                Manage your registered business locations and the measuring
                instruments associated with them.
              </p>
            </div>
            <div style={styles.heroArt} aria-hidden="true">
              <div style={styles.artPin}><MapPin size={31} /></div>
              <div style={styles.artStore}>
                <Store size={72} strokeWidth={1.5} />
              </div>
              <div style={styles.artTreeOne} />
              <div style={styles.artTreeTwo} />
              <div style={styles.artCloudOne} />
              <div style={styles.artCloudTwo} />
            </div>
          </section>

          <section style={styles.statsGrid}>
            <StatCard icon={<Store size={22} />} label="REGISTERED SHOPS" value={shops.length} tone="blue" />
            <StatCard icon={<Scale size={22} />} label="TOTAL INSTRUMENTS" value={totals.instruments} tone="purple" />
            <StatCard icon={<FileCheck2 size={22} />} label="PENDING APPLICATIONS" value={totals.pending} tone="orange" />
          </section>

          <section>
            <div style={styles.sectionHeading}>
              <h2 style={styles.sectionTitle}>Business Locations</h2>
              <p style={styles.sectionSubtitle}>
                Select a shop to manage its instruments and verification applications.
              </p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <ShieldCheck size={18} />
                <span>{error}</span>
                <button type="button" onClick={loadShops} style={styles.retryButton}>
                  Try again
                </button>
              </div>
            )}

            {loading ? (
              <div style={styles.loadingCard}>Loading your business locations…</div>
            ) : shops.length === 0 ? (
              <EmptyState onAdd={() => navigate('/user/shops/new')} />
            ) : (
              <div
                style={{
                  ...styles.shopGrid,
                  gridTemplateColumns:
                    shops.length === 1 ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
                }}
              >
                {shops.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    deleting={deletingId === shop.id}
                    onDelete={() => handleDelete(shop)}
                  />
                ))}
              </div>
            )}
          </section>

          {!loading && shops.length > 0 && (
            <section style={styles.addShopPanel}>
              <div style={styles.addShopIcon}>
                <Store size={25} />
              </div>
              <h3 style={styles.addShopTitle}>Want to add another business location?</h3>
              <p style={styles.addShopText}>
                Register a new shop to manage its measuring instruments and verification applications.
              </p>
              <button
                type="button"
                onClick={() => navigate('/user/shops/new')}
                style={styles.addShopButton}
              >
                <Plus size={18} />
                Add Shop
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function NavItem({ to, icon, label, active = false }) {
  return (
    <Link
      to={to}
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function StatCard({ icon, label, value, tone }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, ...styles[`statIcon_${tone}`] }}>{icon}</div>
      <div>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statValue}>{value}</div>
      </div>
    </div>
  )
}

function ShopCard({ shop, deleting, onDelete }) {
  const instrumentCount = Number(
    shop.instrument_count ?? shop.instruments?.length ?? 0,
  )
  const pending = Number(shop.pending_verification_count ?? 0)
  const certificates = Number(
    shop.certificate_count ?? shop.valid_certificate_count ?? 0,
  )

  return (
    <article style={styles.shopCard}>
      <div style={styles.shopTop}>
        <div style={styles.shopIdentity}>
          <div style={styles.shopIcon}>
            <Store size={25} />
          </div>
          <div style={styles.shopNameBlock}>
            <div style={styles.shopNameRow}>
              <h3 style={styles.shopName}>{shop.name}</h3>
              <span style={styles.activeBadge}>
                <CheckCircle2 size={14} /> Active
              </span>
            </div>
            <div style={styles.addressRow}>
              <MapPin size={16} />
              <span>{shop.address || 'Registered business location'}</span>
            </div>
          </div>
        </div>

        <div style={styles.gstBlock}>
          <span>GST Number</span>
          <strong>{shop.gst_number || 'Not provided'}</strong>
        </div>
      </div>

      <div style={styles.shopDivider} />

      <div style={styles.shopBottom}>
        <div style={styles.metricsGrid}>
          <Metric icon={<Scale size={20} />} label="Instruments" value={instrumentCount} tone="blue" />
          <Metric icon={<FileCheck2 size={20} />} label="Pending Applications" value={pending} tone="purple" />
          <Metric icon={<CheckCircle2 size={20} />} label="Approved Certificates" value={certificates} tone="green" />
        </div>

        <div style={styles.shopActions}>
          <Link to={`/user/shops/${shop.id}`} style={styles.openButton}>
            Open Shop <ArrowRight size={18} />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            style={{
              ...styles.deleteButton,
              ...(instrumentCount > 0 ? styles.deleteDisabled : {}),
            }}
            title={
              instrumentCount > 0
                ? 'A shop with instruments cannot be deleted.'
                : 'Delete shop'
            }
          >
            <Trash2 size={17} />
            {deleting ? 'Deleting…' : 'Delete Shop'}
          </button>
        </div>
      </div>
    </article>
  )
}

function Metric({ icon, label, value, tone }) {
  return (
    <div style={styles.metric}>
      <div style={{ ...styles.metricIcon, ...styles[`metricIcon_${tone}`] }}>{icon}</div>
      <div>
        <div style={styles.metricLabel}>{label}</div>
        <div style={styles.metricValue}>{value}</div>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}><Store size={26} /></div>
      <h3 style={styles.emptyTitle}>No business locations yet</h3>
      <p style={styles.emptyText}>Register your first shop to start managing measuring instruments.</p>
      <button type="button" onClick={onAdd} style={styles.addShopButton}>
        <Plus size={18} /> Add Shop
      </button>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    background: '#f7faff',
    color: '#0f172a',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  sidebar: {
    width: 258,
    minHeight: '100vh',
    position: 'sticky',
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    borderRight: '1px solid #e5edf7',
    padding: '22px 16px',
    boxSizing: 'border-box',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '2px 10px 24px',
  },
  brandLogo: {
    width: 35,
    height: 45,
    objectFit: 'contain',
  },
  brandTitle: {
    color: '#16427d',
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: '.03em',
  },
  brandSubtitle: {
    color: '#5d7da7',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.08em',
    marginTop: 2,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  navItem: {
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    gap: 15,
    padding: '0 18px',
    borderRadius: 10,
    color: '#334e73',
    textDecoration: 'none',
    fontSize: 14.5,
    fontWeight: 600,
    boxSizing: 'border-box',
  },
  navItemActive: {
    color: '#1769ff',
    background: '#eaf2ff',
    boxShadow: 'inset 3px 0 0 #1769ff',
  },
  helpCard: {
    marginTop: 'auto',
    background: '#f3f7fd',
    borderRadius: 12,
    padding: 18,
    color: '#334e73',
  },
  helpIcon: { marginBottom: 8 },
  helpTitle: { fontSize: 14, fontWeight: 750, color: '#162d4f' },
  helpText: { margin: '8px 0 14px', fontSize: 12.5, lineHeight: 1.55, color: '#58718f' },
  supportButton: {
    width: '100%',
    height: 39,
    background: '#fff',
    border: '1px solid #b7cce8',
    borderRadius: 8,
    color: '#334e73',
    fontWeight: 700,
    cursor: 'pointer',
  },
  mainArea: { flex: 1, minWidth: 0 },
  topbar: {
    height: 76,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 36px',
    background: '#fff',
    borderBottom: '1px solid #e7eef7',
    boxSizing: 'border-box',
  },
  profileMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#f4f8fd',
    borderRadius: 11,
    padding: '8px 10px 8px 9px',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: '#dcecff',
    color: '#1769ff',
    fontSize: 17,
    fontWeight: 800,
  },
  profileCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 145,
    fontSize: 13,
    color: '#12284b',
  },
  topLogout: {
    height: 34,
    padding: '0 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid #d5dfeb',
    borderRadius: 8,
    background: '#fff',
    color: '#49617f',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  content: {
    width: '100%',
    maxWidth: 1320,
    margin: '0 auto',
    padding: '24px 28px 52px',
    boxSizing: 'border-box',
  },
  hero: {
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 9,
    background: 'linear-gradient(110deg, #e9f3ff 0%, #dcecff 56%, #cfe3ff 100%)',
    padding: '30px 34px',
    boxSizing: 'border-box',
  },
  heroCopy: { position: 'relative', zIndex: 2, maxWidth: 650 },
  eyebrow: { color: '#1769d9', fontSize: 13, fontWeight: 800, letterSpacing: '.16em' },
  heroTitle: { margin: '9px 0 7px', fontSize: 42, lineHeight: 1.05, letterSpacing: '-.035em', color: '#071a36' },
  heroText: { margin: 0, maxWidth: 590, color: '#355579', fontSize: 17, lineHeight: 1.55 },
  heroArt: { position: 'absolute', right: 28, bottom: 0, width: 450, height: 170, opacity: .9 },
  artPin: { position: 'absolute', top: 7, right: 205, color: '#1472df', zIndex: 4 },
  artStore: { position: 'absolute', right: 80, bottom: 19, color: '#1f78d9', zIndex: 3, background: '#fff', borderRadius: '22px 22px 8px 8px', padding: '23px 42px 13px', boxShadow: '0 10px 24px rgba(40,94,160,.12)' },
  artTreeOne: { position: 'absolute', right: 12, bottom: 0, width: 58, height: 90, borderRadius: '55% 55% 10% 10%', background: '#8bc5b2' },
  artTreeTwo: { position: 'absolute', right: 265, bottom: 0, width: 48, height: 68, borderRadius: '55% 55% 10% 10%', background: '#9fcdbd' },
  artCloudOne: { position: 'absolute', top: 27, right: 320, width: 62, height: 19, borderRadius: 20, background: 'rgba(255,255,255,.65)' },
  artCloudTwo: { position: 'absolute', top: 48, right: 10, width: 75, height: 20, borderRadius: 20, background: 'rgba(255,255,255,.65)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 18, margin: '24px 0 28px' },
  statCard: { minHeight: 103, display: 'flex', alignItems: 'center', gap: 18, padding: '20px 21px', background: '#fff', border: '1px solid #e4ecf5', borderRadius: 11, boxShadow: '0 5px 18px rgba(20,53,92,.05)', boxSizing: 'border-box' },
  statIcon: { width: 51, height: 51, borderRadius: 13, display: 'grid', placeItems: 'center', flexShrink: 0 },
  statIcon_blue: { color: '#1769ff', background: '#e8f1ff' },
  statIcon_purple: { color: '#7c45e8', background: '#f0eaff' },
  statIcon_orange: { color: '#f28a00', background: '#fff2df' },
  statLabel: { color: '#607c9e', fontSize: 12, fontWeight: 800, letterSpacing: '.09em' },
  statValue: { marginTop: 4, fontSize: 31, lineHeight: 1, fontWeight: 800, color: '#0b1730' },
  sectionHeading: { marginBottom: 16 },
  sectionTitle: { margin: 0, fontSize: 23, letterSpacing: '-.02em', color: '#0d1d35' },
  sectionSubtitle: { margin: '6px 0 0', color: '#5e7695', fontSize: 14.5 },
  shopGrid: { display: 'grid', gap: 18 },
  shopCard: { background: '#fff', border: '1px solid #dfe8f2', borderRadius: 13, padding: '25px 26px 19px', boxShadow: '0 6px 20px rgba(22,52,87,.055)' },
  shopTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 30 },
  shopIdentity: { display: 'flex', alignItems: 'center', gap: 17, minWidth: 0, flex: 1 },
  shopIcon: { width: 72, height: 72, borderRadius: 14, display: 'grid', placeItems: 'center', color: '#1769ff', background: '#edf5ff', flexShrink: 0 },
  shopNameBlock: { minWidth: 0 },
  shopNameRow: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  shopName: { margin: 0, fontSize: 19, color: '#0b1730', letterSpacing: '-.02em' },
  activeBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, color: '#0a9c63', background: '#dcf9eb', fontSize: 12, fontWeight: 800 },
  addressRow: { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 9, color: '#607c9e', fontSize: 14, lineHeight: 1.45, maxWidth: 760 },
  gstBlock: { minWidth: 220, paddingLeft: 33, borderLeft: '1px solid #dfe7f0', display: 'flex', flexDirection: 'column', gap: 7 },
  shopDivider: { height: 1, background: '#e5ebf2', margin: '22px 0 19px' },
  shopBottom: { display: 'grid', gridTemplateColumns: '1fr', gap: 16 },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0, width: '100%' },
  metric: { minHeight: 58, minWidth: 0, display: 'flex', alignItems: 'center', gap: 11, padding: '0 18px', borderRight: '1px solid #e5ebf2', boxSizing: 'border-box' },
  metricIcon: { width: 44, height: 44, borderRadius: 11, display: 'grid', placeItems: 'center', flexShrink: 0 },
  metricIcon_blue: { color: '#1769ff', background: '#e8f1ff' },
  metricIcon_purple: { color: '#7c45e8', background: '#f0eaff' },
  metricIcon_green: { color: '#0aa267', background: '#ddf9ec' },
  metricLabel: { color: '#617c9d', fontSize: 12, lineHeight: 1.25, whiteSpace: 'normal' },
  metricValue: { marginTop: 2, color: '#0c1930', fontSize: 22, fontWeight: 800 },
  shopActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', paddingTop: 14, borderTop: '1px solid #e5ebf2' },
  openButton: { height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#1769ff', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 13.5, fontWeight: 750, boxSizing: 'border-box' },
  deleteButton: { height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px solid #ffb4b4', background: '#fff', color: '#dc2626', borderRadius: 9, fontSize: 13, fontWeight: 750, cursor: 'pointer', boxSizing: 'border-box' },
  deleteDisabled: { opacity: .48, cursor: 'not-allowed' },
  addShopPanel: { marginTop: 24, minHeight: 190, border: '1.5px dashed #b8d1ee', borderRadius: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.7)', textAlign: 'center', padding: 26, boxSizing: 'border-box' },
  addShopIcon: { width: 55, height: 55, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#e8f2ff', color: '#1769ff' },
  addShopTitle: { margin: '13px 0 4px', fontSize: 18, color: '#0b1730' },
  addShopText: { margin: 0, color: '#607c9e', fontSize: 14 },
  addShopButton: { marginTop: 16, height: 42, padding: '0 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0, borderRadius: 9, background: '#1769ff', color: '#fff', fontSize: 13.5, fontWeight: 750, cursor: 'pointer' },
  loadingCard: { padding: 45, background: '#fff', border: '1px solid #e3ebf4', borderRadius: 13, textAlign: 'center', color: '#607c9e' },
  errorBox: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 14px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 9, color: '#b42318', fontSize: 13 },
  retryButton: { marginLeft: 'auto', border: 0, background: 'transparent', color: '#1769ff', fontWeight: 750, cursor: 'pointer' },
  emptyState: { minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px dashed #b8d1ee', borderRadius: 13, textAlign: 'center' },
  emptyIcon: { width: 55, height: 55, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#e8f2ff', color: '#1769ff' },
  emptyTitle: { margin: '14px 0 5px', fontSize: 18 },
  emptyText: { margin: 0, color: '#607c9e', fontSize: 14 },
}
