import { useState, useEffect } from 'react'
import { getAdminAnalyticsAPI, getAdminStudentsAPI, getAdminQuestionsAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Admin.css'

export default function Admin() {
  const [analytics, setAnalytics] = useState(null)
  const [students, setStudents] = useState([])
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // overview, students, questions

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const analyticRes = await getAdminAnalyticsAPI()
      setAnalytics(analyticRes.data.analytics)

      const studRes = await getAdminStudentsAPI()
      setStudents(studRes.data.students)

      const questRes = await getAdminQuestionsAPI()
      setQuestions(questRes.data.questions_summary)
    } catch (err) {
      setError('Admin access denied or backend server offline.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="page-loading"><div className="dash-loading-spinner" /></div>

  // Format Recharts data for question summary
  const chartData = questions ? Object.entries(questions).map(([key, val]) => ({
    name: key,
    Questions: val
  })) : []

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-content">
        <div className="admin-page fade-in">
          
          {/* Header */}
          <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 className="dash-title">Platform Administration</h1>
              <p className="dash-subtitle">
                Monitor student performance metrics, system analytics, and question banks.
              </p>
            </div>
            <span className="badge badge-purple" style={{ fontSize: 13, padding: '6px 16px' }}>
              🛡️ Admin Mode
            </span>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          {/* Navigation Tabs */}
          <div className="profile-tabs-header" style={{ marginBottom: 20 }}>
            <button className={`tab-btn ${activeTab === 'overview' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('overview')}>
              📊 System Analytics
            </button>
            <button className={`tab-btn ${activeTab === 'students' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('students')}>
              👤 Manage Students ({students.length})
            </button>
            <button className={`tab-btn ${activeTab === 'questions' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('questions')}>
              📁 Question Banks
            </button>
          </div>

          <div className="admin-tabs-content">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && analytics && (
              <div className="admin-pane fade-in">
                {/* Stats row */}
                <div className="grid-4" style={{ marginBottom: 24 }}>
                  <div className="card val-card" style={{ background: 'rgba(18,18,26,0.6)' }}>
                    <span className="val-title">Total Registered Students</span>
                    <span className="val-number">{analytics.total_students}</span>
                  </div>
                  <div className="card val-card" style={{ background: 'rgba(18,18,26,0.6)' }}>
                    <span className="val-title">Mock Interviews Conducted</span>
                    <span className="val-number">{analytics.total_interviews}</span>
                  </div>
                  <div className="card val-card" style={{ background: 'rgba(18,18,26,0.6)' }}>
                    <span className="val-title">Assessments Submitted</span>
                    <span className="val-number">{analytics.total_tests}</span>
                  </div>
                  <div className="card val-card" style={{ background: 'rgba(18,18,26,0.6)' }}>
                    <span className="val-title">Average Placement Readiness</span>
                    <span className="val-number" style={{ color: 'var(--accent-green)' }}>{analytics.avg_readiness_probability}%</span>
                  </div>
                </div>

                {/* Question Banks Chart */}
                <div className="card chart-card">
                  <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Question distribution across subjects</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }} />
                        <Bar dataKey="Questions" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="card admin-pane fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email Address</th>
                      <th>College</th>
                      <th>Branch</th>
                      <th>CGPA</th>
                      <th>Readiness Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data-text">No students registered yet.</td>
                      </tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.name}</strong></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.email}</td>
                          <td>{s.college}</td>
                          <td>{s.branch}</td>
                          <td>{s.cgpa}</td>
                          <td>
                            <span className={`badge ${s.readiness_probability >= 80 ? 'badge-green' : s.readiness_probability >= 65 ? 'badge-blue' : s.readiness_probability >= 50 ? 'badge-amber' : 'badge-red'}`}>
                              {s.readiness_probability}% ({s.readiness_label})
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="admin-pane fade-in">
                <div className="subjects-grid">
                  {questions && Object.entries(questions).map(([subj, count]) => (
                    <div key={subj} className="card val-card" style={{ background: 'rgba(18,18,26,0.6)', alignItems: 'flex-start', textAlign: 'left' }}>
                      <span className="val-title">{subj} Bank</span>
                      <span className="val-number" style={{ fontSize: 24 }}>{count}</span>
                      <span className="val-lbl" style={{ color: 'var(--accent-cyan)' }}>Questions loaded</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  )
}
