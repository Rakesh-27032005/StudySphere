import { useEffect, useState, type FormEvent } from 'react'
import { BookOpen, Users, MessageCircle, Video, LayoutDashboard, LogOut, Moon, Sun, Plus, FileText, ShieldCheck } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'
type User = { id:number; username:string; email:string; role:string; display_name:string; bio:string }
export default function App() {
  const [token,setToken] = useState(localStorage.getItem('ss_token') || '')
  const [user,setUser] = useState<User|null>(null)
  const [mode,setMode] = useState<'login'|'register'>('login')
  const [dark,setDark] = useState(false)
  const [error,setError] = useState('')
  const [username,setUsername] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [displayName,setDisplayName] = useState('')
  const [busy,setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${API}/auth/me/`, { headers:{Authorization:`Bearer ${token}`} })
      .then(async r => { if(!r.ok) throw new Error('Session expired'); return r.json() })
      .then(setUser).catch(() => { localStorage.removeItem('ss_token'); setToken(''); setUser(null) })
  }, [token])

  async function submit(e:FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      if(mode==='register') {
        const r=await fetch(`${API}/auth/register/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,email,password,display_name:displayName})})
        const d=await r.json(); if(!r.ok) throw new Error(JSON.stringify(d))
      }
      const r=await fetch(`${API}/token/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})})
      const d=await r.json(); if(!r.ok) throw new Error(d.detail || 'Unable to sign in')
      localStorage.setItem('ss_token',d.access); setToken(d.access)
    } catch(err:any) { setError(err.message || 'Something went wrong') }
    finally { setBusy(false) }
  }
  function logout(){localStorage.removeItem('ss_token');setToken('');setUser(null)}
  return <div className={dark?'app dark':'app'}>
    {!user ? <main className="auth-wrap">
      <div className="brand"><div className="brand-icon"><BookOpen/></div><span>Study<span className="brand-accent">Sphere</span></span></div>
      <section className="auth-card">
        <div className="eyebrow">YOUR SPACE TO LEARN TOGETHER</div>
        <h1>{mode==='login'?'Welcome back':'Create your account'}</h1>
        <p className="muted">Study smarter, share knowledge, and grow together.</p>
        <form onSubmit={submit}>
          {mode==='register' && <label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" /></label>}
          <label>Username<input required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" /></label>
          {mode==='register' && <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></label>}
          <label>Password<input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
          {error && <div className="error">{error}</div>}
          <button className="primary full" disabled={busy}>{busy?'Please wait...':mode==='login'?'Sign in':'Create account'}</button>
        </form>
        <p className="switch">{mode==='login'?"New to StudySphere?":"Already have an account?"} <button className="link" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Create an account':'Sign in'}</button></p>
      </section>
      <p className="tiny">By continuing, you agree to use StudySphere respectfully and safely.</p>
    </main> : <div className="layout">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><BookOpen/></div><span>Study<span className="brand-accent">Sphere</span></span></div>
        <div className="nav-label">WORKSPACE</div>
        <a className="nav active"><LayoutDashboard/> Overview</a><a className="nav"><Users/> Friends</a><a className="nav"><BookOpen/> Study rooms</a><a className="nav"><FileText/> PDF library</a><a className="nav"><MessageCircle/> Messages</a><a className="nav"><Video/> Calls</a>
        <div className="sidebar-bottom"><div className="profile-mini"><div className="avatar">{user.username[0]?.toUpperCase()}</div><div><b>{user.display_name||user.username}</b><small>@{user.username}</small></div></div><button className="nav" onClick={logout}><LogOut/> Sign out</button></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><span className="muted">Workspace /</span> Overview</div><div className="top-actions"><button className="icon-btn" onClick={()=>setDark(!dark)} title="Toggle theme">{dark?<Sun/>:<Moon/>}</button><div className="avatar">{user.username[0]?.toUpperCase()}</div></div></header>
        <div className="content">
          <div className="welcome"><div><div className="eyebrow">YOUR LEARNING SPACE</div><h1>Good to see you, {user.display_name||user.username} 👋</h1><p className="muted">Make today a great day to learn something new.</p></div><button className="primary"><Plus size={18}/> Create study room</button></div>
          <section className="stats"><div className="stat"><span>Study rooms</span><b>0</b><small>Ready for your first room</small></div><div className="stat"><span>Friends</span><b>0</b><small>Learn better together</small></div><div className="stat"><span>PDF documents</span><b>0</b><small>Your library starts here</small></div><div className="stat"><span>Study time</span><b>0h</b><small>Your progress will appear here</small></div></section>
          <section className="grid-main"><div className="panel"><div className="panel-head"><div><h2>Quick start</h2><p className="muted">Jump into your learning workspace.</p></div></div><div className="quick-grid"><div className="quick"><div className="quick-icon blue"><Users/></div><b>Find friends</b><p>Connect with classmates and study partners.</p></div><div className="quick"><div className="quick-icon purple"><BookOpen/></div><b>Create a room</b><p>Start a focused study session together.</p></div><div className="quick"><div className="quick-icon green"><FileText/></div><b>Upload a PDF</b><p>Keep your study materials in one place.</p></div></div></div>
          <div className="panel side-panel"><div className="panel-head"><div><h2>Getting started</h2><p className="muted">Your StudySphere checklist</p></div></div><div className="check-row"><span className="check">✓</span><div><b>Account created</b><small>Your account is ready.</small></div></div><div className="check-row"><span className="check pending">2</span><div><b>Set up your profile</b><small>Add a bio and profile photo.</small></div></div><div className="check-row"><span className="check pending">3</span><div><b>Invite a friend</b><small>Make learning collaborative.</small></div></div></div></section>
          {user.role==='admin' && <div className="admin-note"><ShieldCheck/> Administrator account detected. Admin tools will be enabled in a later stage.</div>}
          <footer>© 2026 StudySphere · Learn together, anywhere.</footer>
        </div>
      </main>
    </div>}
  </div>
}
