import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API = 'http://127.0.0.1:8000'

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.detail || 'Request failed.')
  return data
}

function tone(score) {
  if (score >= 85) return { color: '#15803d', bg: '#dcfce7', border: '#86efac', label: 'Excellent' }
  if (score >= 70) return { color: '#a16207', bg: '#fef9c3', border: '#fde047', label: 'Good' }
  if (score >= 55) return { color: '#c2410c', bg: '#ffedd5', border: '#fdba74', label: 'Moderate' }
  return { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5', label: 'Weak' }
}

function availability(value) {
  const v = (value || 'AVAILABLE').toUpperCase()
  if (v === 'AVAILABLE') return { label: 'Available', color: '#15803d', bg: '#dcfce7' }
  if (v === 'BUSY') return { label: 'Busy', color: '#a16207', bg: '#fef9c3' }
  return { label: 'Unavailable', color: '#b91c1c', bg: '#fee2e2' }
}

function distance(value) {
  return value == null ? '—' : `${Number(value).toFixed(1)} km`
}

export default function SmartAssignment({ onBack }) {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [officers, setOfficers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [selectedOfficerId, setSelectedOfficerId] = useState(null)
  const [search, setSearch] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [step, setStep] = useState(0)
  const [assigning, setAssigning] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [apps, people] = await Promise.all([
        request('/admin/applications', token),
        request('/admin/officers', token),
      ])
      setApplications(Array.isArray(apps) ? apps : [])
      setOfficers(Array.isArray(people) ? people : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  const calculate = async (id) => {
    setSelectedId(id)
    setRecommendation(null)
    setSelectedOfficerId(null)
    setCalculating(true)
    setStep(0)
    setError('')
    setMessage('')

    try {
      const phases = [0, 1, 2, 3]
      phases.forEach((value, index) => {
        window.setTimeout(() => setStep(value), index * 450)
      })
      const data = await request(`/admin/scheduling/recommendations/${id}`, token)
      setRecommendation(data)
      setSelectedOfficerId(data.best_officer_id || data.recommendations?.[0]?.officer_id || null)
      setStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      window.setTimeout(() => setCalculating(false), 500)
    }
  }

  const unassigned = useMemo(
    () => applications.filter(a =>
      !a.assigned_officer_id &&
      !['PASSED', 'FAILED', 'CERTIFICATE_ISSUED', 'REJECTED'].includes(a.status)
    ),
    [applications],
  )

  const queue = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) {
      return unassigned
    }

    return unassigned.filter((a) =>
      `${a.id} ${a.status} ${a.priority}`.toLowerCase().includes(q)
    )
  }, [search, unassigned])

  const selectedApplication = applications.find(a => a.id === selectedId)
  const recommendations = recommendation?.recommendations || []
  const best = recommendations.find(r => r.officer_id === recommendation?.best_officer_id) || recommendations[0]
  const chosen = recommendations.find(r => r.officer_id === Number(selectedOfficerId)) || best
  const ctx = recommendation?.application_context || {}

  const assign = async () => {
    if (!selectedApplication || !chosen) return
    setAssigning(true)
    setError('')
    try {
      await request(`/admin/applications/${selectedApplication.id}/assign`, token, {
        method: 'PATCH',
        body: JSON.stringify({ officer_id: Number(chosen.officer_id) }),
      })
      if (scheduleDate) {
        await request(`/admin/applications/${selectedApplication.id}/schedule`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            officer_id: Number(chosen.officer_id),
            scheduled_at: new Date(scheduleDate).toISOString(),
          }),
        })
      }
      setMessage(scheduleDate
        ? `${chosen.officer_name} assigned and inspection scheduled.`
        : `${chosen.officer_name} assigned successfully.`)
      await load()
      setSelectedId(null)
      setSelectedOfficerId(null)
      setRecommendation(null)
      setScheduleDate('')
    } catch (e) {
      setError(e.message)
    } finally {
      setAssigning(false)
    }
  }

  const phases = [
    'Analyzing application priority and age…',
    'Checking officer workload and availability…',
    'Searching nearby officers and comparing travel distance…',
    'Best match calculated.',
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fc', padding: '28px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', color: '#172033' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <button onClick={onBack} style={{ border: 0, background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              <ArrowLeft size={15} style={{ verticalAlign: '-3px' }} /> Back to Admin Dashboard
            </button>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 9 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
                <Sparkles size={23} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 850 }}>Smart Assignment Center</h1>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
                  Compare field officers using location, workload, availability and priority.
                </p>
              </div>
            </div>
          </div>
          <button onClick={load} style={{ border: '1px solid #dbe3ef', background: '#fff', borderRadius: 10, padding: '10px 14px', fontWeight: 750, cursor: 'pointer' }}>
            <RefreshCw size={15} style={{ verticalAlign: '-3px' }} /> Refresh
          </button>
        </div>

        {error && <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</div>}
        {message && <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
          {[
            ['Awaiting assignment', unassigned.length, Users],
            ['Assigned / scheduled', applications.filter(a =>
              Boolean(a.assigned_officer_id) ||
              ['ASSIGNED', 'SCHEDULED', 'INSPECTION_PENDING'].includes(a.status)
            ).length, CheckCircle2],
            ['Available officers', officers.filter(o => (o.availability_status || 'AVAILABLE') === 'AVAILABLE').length, UserRound],
            ['Decision model', 'MULTI-FACTOR', Sparkles],
          ].map(([label, value, Icon]) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e1e8f1', borderRadius: 15, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7b8799', fontSize: 10, fontWeight: 850, textTransform: 'uppercase' }}>
                <span>{label}</span><Icon size={16} />
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 850 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '315px minmax(0,1fr)', gap: 16 }}>
          <section style={{ background: '#fff', border: '1px solid #e1e8f1', borderRadius: 16, overflow: 'hidden', minHeight: 620 }}>
            <div style={{ padding: 15, borderBottom: '1px solid #edf1f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16 }}>Assignment Queue</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7b8799' }}>Select an application</p>
                </div>
                <strong style={{ background: '#eff6ff', color: '#2563eb', padding: '5px 9px', borderRadius: 999 }}>{unassigned.length}</strong>
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: '9px 11px',
                  borderRadius: 9,
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 11,
                  fontWeight: 750,
                }}
              >
                Showing only applications awaiting officer assignment
              </div>
              <div style={{ position: 'relative', marginTop: 10 }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applications..." style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px 9px 32px', border: '1px solid #dbe3ef', borderRadius: 9 }} />
              </div>
            </div>

            {loading ? <div style={{ padding: 30, color: '#64748b', textAlign: 'center' }}>Loading…</div> :
              queue.length === 0 ? <div style={{ padding: 35, color: '#64748b', textAlign: 'center' }}><CheckCircle2 color="#16a34a" /><p>No applications in this queue.</p></div> :
              <div style={{ maxHeight: 535, overflowY: 'auto' }}>
                {queue.map(a => (
                  <button key={a.id} onClick={() => calculate(a.id)} style={{ width: '100%', textAlign: 'left', border: 0, borderBottom: '1px solid #edf1f6', borderLeft: selectedId === a.id ? '3px solid #2563eb' : '3px solid transparent', background: selectedId === a.id ? '#f8fbff' : '#fff', padding: 14, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Application #{a.id}</strong>
                      <span style={{ fontSize: 9, fontWeight: 850, padding: '4px 7px', borderRadius: 999, background: a.priority === 'URGENT' ? '#fee2e2' : a.priority === 'HIGH' ? '#ffedd5' : '#f1f5f9' }}>{a.priority || 'NORMAL'}</span>
                    </div>
                    <div style={{ marginTop: 7, fontSize: 11, color: '#64748b' }}>
                      {a.status?.replaceAll('_',' ')}
                    </div>
                    {a.assigned_officer_id && <div style={{ marginTop: 5, fontSize: 11, color: '#2563eb', fontWeight: 700 }}>Assigned officer #{a.assigned_officer_id}</div>}
                  </button>
                ))}
              </div>}
          </section>

          <section style={{ background: '#fff', border: '1px solid #e1e8f1', borderRadius: 16, padding: 22, minHeight: 620 }}>
            {!selectedApplication && (
              <div style={{ minHeight: 560, display: 'grid', placeItems: 'center', textAlign: 'center', color: '#64748b' }}>
                <div><Sparkles size={32} color="#2563eb" /><h2 style={{ color: '#172033' }}>Select an application</h2><p>We will search nearby officers and compare their workload, availability and distance.</p></div>
              </div>
            )}

            {selectedApplication && calculating && (
              <div style={{ minHeight: 560, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 470, maxWidth: '100%' }}>
                  <Search size={32} color="#2563eb" />
                  <h2>Finding the best field officer</h2>
                  <p style={{ color: '#64748b' }}>{phases[step]}</p>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(step + 1) * 25}%`, height: '100%', background: '#2563eb', transition: 'width .4s' }} />
                  </div>
                  <div style={{ marginTop: 14, color: '#64748b', fontSize: 11, fontWeight: 700 }}>✓ Priority &nbsp; ✓ Workload &nbsp; ✓ Availability &nbsp; ✓ Location</div>
                </div>
              </div>
            )}

            {selectedApplication && recommendation && !calculating && (
              <>
                <div style={{ marginBottom: 17 }}>
                  <span style={{ fontSize: 10, fontWeight: 850, padding: '5px 8px', borderRadius: 7, background: selectedApplication.priority === 'HIGH' ? '#ffedd5' : '#f1f5f9' }}>
                    {selectedApplication.priority || 'NORMAL'} PRIORITY
                  </span>
                  <h2 style={{ margin: '9px 0 3px' }}>Officer comparison</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>
                    {ctx.shop_name || `Instrument #${selectedApplication.instrument_id}`}
                    {ctx.shop_address ? ` • ${ctx.shop_address}` : ''}
                  </p>
                </div>

                {best && (() => {
                  const t = tone(best.score)
                  const av = availability(best.availability)
                  return (
                    <div style={{ border: `1px solid ${t.border}`, background: `linear-gradient(135deg,${t.bg},#fff)`, borderRadius: 15, padding: 18, marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15 }}>
                        <div>
                          <span style={{ background: t.bg, color: t.color, padding: '5px 8px', borderRadius: 999, fontSize: 10, fontWeight: 850 }}>★ BEST MATCH • RANK #1</span>
                          <h3 style={{ margin: '10px 0 2px', fontSize: 21 }}>{best.officer_name}</h3>
                          <span style={{ color: t.color, fontSize: 12, fontWeight: 800 }}>{t.label} match</span>
                        </div>
                        <div style={{ fontSize: 27, fontWeight: 900, color: t.color }}>{best.score}<small style={{ fontSize: 11 }}>/100</small></div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9, marginTop: 16 }}>
                        {[
                          ['Distance', distance(best.distance_km), best.distance_km != null && best.distance_km <= 10 ? '#dcfce7' : '#fef9c3'],
                          ['Workload', `${best.workload} active`, best.workload <= 1 ? '#dcfce7' : best.workload <= 3 ? '#fef9c3' : '#fee2e2'],
                          ['Availability', av.label, av.bg],
                        ].map(([l,v,b]) => <div key={l} style={{ background: b, border: '1px solid #e2e8f0', borderRadius: 11, padding: 12 }}><div style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>{l}</div><strong>{v}</strong></div>)}
                      </div>

                      <div style={{ marginTop: 15, borderTop: '1px solid #e2e8f0', paddingTop: 13 }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 850, marginBottom: 8 }}>MATCH SCORE BREAKDOWN</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 13 }}>
                          {[
                            ['Location', best.score_breakdown?.location ?? '—'],
                            ['Workload', best.score_breakdown?.workload ?? '—'],
                            ['Availability', best.score_breakdown?.availability ?? '—'],
                            ['Priority', best.score_breakdown?.priority ?? '—'],
                            ['Age', best.score_breakdown?.application_age ?? '—'],
                            ['Expiry', best.score_breakdown?.expiry ?? '—'],
                          ].map(([label, value]) => (
                            <div key={label} style={{ background: '#fff', border: '1px solid #e5eaf1', borderRadius: 8, padding: '7px 8px' }}>
                              <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 850, textTransform: 'uppercase' }}>{label}</div>
                              <strong style={{ fontSize: 12 }}>{value} pts</strong>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 850, marginBottom: 8 }}>WHY THIS OFFICER?</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                          {(best.reasons || []).slice(0,6).map(reason => <div key={reason} style={{ fontSize: 11, color: '#475569' }}><CheckCircle2 size={12} color="#16a34a" style={{ verticalAlign: '-2px', marginRight: 5 }} />{reason}</div>)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                        <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 9, padding: 10 }} />
                        <button disabled={assigning || !chosen} onClick={assign} style={{ flex: 1, border: 0, borderRadius: 9, background: '#2563eb', color: '#fff', fontWeight: 850, cursor: 'pointer' }}>
                          {assigning ? 'Assigning…' : scheduleDate ? 'Assign & Schedule' : 'Assign Officer'}
                        </button>
                      </div>
                    </div>
                  )
                })()}

                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 18,
                    borderTop: '1px solid #e8edf4',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17 }}>Officer comparison</h3>
                      <p style={{ color: '#64748b', fontSize: 11, margin: '4px 0 0' }}>
                        Higher score means a stronger overall assignment fit.
                      </p>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', textAlign: 'right' }}>
                      <span style={{ color: '#15803d', fontWeight: 800 }}>● Strong</span>
                      {'  '}
                      <span style={{ color: '#a16207', fontWeight: 800 }}>● Good</span>
                      {'  '}
                      <span style={{ color: '#c2410c', fontWeight: 800 }}>● Weak</span>
                      {'  '}
                      <span style={{ color: '#b91c1c', fontWeight: 800 }}>● Poor</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(170px,1.4fr) 90px 110px 110px 120px',
                      gap: 10,
                      padding: '8px 12px',
                      color: '#94a3b8',
                      fontSize: 9,
                      fontWeight: 850,
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                    }}
                  >
                    <span>Officer</span>
                    <span>Match</span>
                    <span>Distance</span>
                    <span>Workload</span>
                    <span>Availability</span>
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {recommendations.map((item) => {
                      const t = tone(item.score)
                      const av = availability(item.availability)
                      const selected = Number(selectedOfficerId) === Number(item.officer_id)
                      const maxScore = Math.max(...recommendations.map((r) => Number(r.score) || 0), 1)
                      const relative = Math.max(4, Math.round((Number(item.score) / maxScore) * 100))
                      const locationPoints = item.score_breakdown?.location
                      const workloadPoints = item.score_breakdown?.workload
                      const availabilityPoints = item.score_breakdown?.availability

                      return (
                        <button
                          key={item.officer_id}
                          onClick={() => setSelectedOfficerId(item.officer_id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            border: selected ? `2px solid ${t.color}` : '1px solid #e2e8f0',
                            background: selected ? '#fbfdff' : '#fff',
                            borderRadius: 13,
                            padding: '12px 13px',
                            cursor: 'pointer',
                            boxShadow: selected ? '0 5px 16px rgba(15,23,42,.07)' : 'none',
                          }}
                        >
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(170px,1.4fr) 90px 110px 110px 120px',
                              gap: 10,
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, flex: '0 0 auto' }} />
                                <strong style={{ fontSize: 13 }}>{item.officer_name}</strong>
                                {item.rank === 1 && (
                                  <span style={{ fontSize: 8, fontWeight: 850, color: '#2563eb', background: '#eff6ff', padding: '3px 6px', borderRadius: 999 }}>
                                    TOP MATCH
                                  </span>
                                )}
                              </div>
                              <div style={{ marginTop: 7, height: 5, background: '#eef2f7', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${relative}%`, height: '100%', background: t.color, borderRadius: 999 }} />
                              </div>
                            </div>

                            <div>
                              <strong style={{ color: t.color, fontSize: 16 }}>{item.score}</strong>
                              <span style={{ color: '#94a3b8', fontSize: 10 }}>/100</span>
                              <div style={{ fontSize: 9, color: t.color, fontWeight: 750 }}>{t.label}</div>
                            </div>

                            <div>
                              <div style={{ fontWeight: 750, fontSize: 12 }}>{distance(item.distance_km)}</div>
                              <div style={{ fontSize: 9, color: '#64748b' }}>
                                {locationPoints != null ? `${locationPoints} location pts` : 'Location unavailable'}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontWeight: 750, fontSize: 12 }}>{item.workload} active</div>
                              <div style={{ fontSize: 9, color: '#64748b' }}>
                                {workloadPoints != null ? `${workloadPoints} workload pts` : ''}
                              </div>
                            </div>

                            <div>
                              <span style={{ display: 'inline-block', background: av.bg, color: av.color, padding: '5px 8px', borderRadius: 999, fontSize: 9, fontWeight: 850 }}>
                                {av.label}
                              </span>
                              <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>
                                {availabilityPoints != null ? `${availabilityPoints} availability pts` : ''}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 6,
                              marginTop: 10,
                              paddingTop: 9,
                              borderTop: '1px solid #f0f3f7',
                            }}
                          >
                            {(item.reasons || []).slice(0, 4).map((reason) => (
                              <span
                                key={reason}
                                style={{
                                  fontSize: 9,
                                  color: '#64748b',
                                  background: '#f8fafc',
                                  border: '1px solid #edf1f5',
                                  borderRadius: 999,
                                  padding: '4px 7px',
                                }}
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

              </>
            )}
          </section>
        </div>

        <div style={{ marginTop: 14, padding: 12, border: '1px solid #e1e8f1', borderRadius: 10, background:'#fff', color:'#64748b', fontSize:11 }}>
          <strong style={{ color:'#334155' }}>Smart scheduling:</strong> recommendations compare travel distance, workload, availability, application priority and age. The administrator retains final assignment authority.
        </div>
      </div>
    </div>
  )
}
