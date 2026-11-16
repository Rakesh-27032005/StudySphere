import { useEffect, useState, useRef, type FormEvent } from 'react'
import { BookOpen, Users, MessageCircle, Video, LayoutDashboard, LogOut, Moon, Sun, Plus, FileText, ShieldCheck, UserPlus, Check, X, Hash, LogIn, ArrowLeft, Maximize, Minimize, Send, Download } from 'lucide-react'

const API = 'http://127.0.0.1:8001/api'
type User = { id:number; username:string; email:string; role:string; display_name:string; bio:string }

const getMediaUrl = (path: string) => path.startsWith('http') ? path : `http://127.0.0.1:8001${path}`

// --- Stage 2: Friends Component ---
function FriendsTab({ token, setCurrentTab }: { token: string, setCurrentTab: (t: any) => void }) {
  const [requests, setRequests] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  function fetchFriendsData() {
    fetch(`${API}/auth/friends/requests/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { if (r.ok) setRequests(await r.json()) })
    fetch(`${API}/auth/friends/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { if (r.ok) setFriends(await r.json()) })
  }

  useEffect(() => { fetchFriendsData() }, [token])

  async function sendRequest(e: FormEvent) {
    e.preventDefault()
    setMsg('Sending...')
    try {
      const r = await fetch(`${API}/auth/friends/request/send/${search}/`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to send request.')
      setMsg(d.message || 'Request sent successfully!'); setSearch(''); fetchFriendsData()
    } catch(err: any) { setMsg(err.message) }
  }

  async function respond(id: number, action: 'accept' | 'reject') {
    await fetch(`${API}/auth/friends/request/${id}/${action}/`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    })
    fetchFriendsData()
  }

  return (
    <>
      <div className="welcome">
        <div><div className="eyebrow">CONNECTIONS</div><h1>Friends</h1><p className="muted">Connect with study partners and classmates.</p></div>
      </div>
      <section className="grid-main">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel">
            <div className="panel-head"><div><h2>Add a Friend</h2><p className="muted">Search for classmates by their exact username.</p></div></div>
            <form onSubmit={sendRequest} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <input required value={search} onChange={e=>setSearch(e.target.value)} placeholder="Enter username..." style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border, #ccc)', background: 'transparent', color: 'inherit' }} />
              <button className="primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UserPlus size={18} /> Send Request</button>
            </form>
            {msg && <p style={{ marginTop: '15px', color: msg.includes('sent') ? '#22C55E' : '#EF4444', fontWeight: '500' }}>{msg}</p>}
          </div>

          <div className="panel">
            <div className="panel-head"><div><h2>My Friends</h2><p className="muted">{friends.length} connections</p></div></div>
            {friends.length === 0 ? <p className="muted" style={{marginTop:'15px'}}>Add some friends to see them here.</p> : (
              <div style={{ marginTop: '15px', display:'flex', flexDirection:'column', gap:'10px' }}>
                {friends.map(f => (
                  <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', background:'var(--bg-card, #f0f0f0)', borderRadius:'8px' }}>
                    <div><b>{f.display_name || f.username}</b><br/><small className="muted">@{f.username}</small></div>
                    <button onClick={() => setCurrentTab('messages')} style={{ padding:'6px 12px', background:'#3B82F6', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={14}/> Message</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel side-panel">
          <div className="panel-head"><div><h2>Pending Requests</h2><p className="muted">{requests.length} waiting</p></div></div>
          {requests.length === 0 ? <p className="muted" style={{marginTop:'15px'}}>No pending requests right now.</p> : (
            <div style={{ marginTop: '15px', display:'flex', flexDirection:'column', gap:'10px' }}>
              {requests.map(req => (
                <div key={req.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', background:'rgba(124, 58, 237, 0.05)', borderRadius:'8px' }}>
                  <div><b>{req.sender.display_name || req.sender.username}</b><br/><small className="muted">@{req.sender.username}</small></div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={()=>respond(req.id, 'accept')} style={{ padding:'8px', background:'#22C55E', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}><Check size={16}/></button>
                    <button onClick={()=>respond(req.id, 'reject')} style={{ padding:'8px', background:'transparent', border:'1px solid var(--border, #ccc)', color:'inherit', borderRadius:'6px', cursor:'pointer' }}><X size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
// --- Stage 3: Study Rooms Component ---
function StudyRoomsTab({ token, currentUser }: { token: string, currentUser: any }) {
  const [rooms, setRooms] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [joinCode, setJoinCode] = useState('') // Added back!
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  function fetchData() {
    fetch(`${API}/auth/rooms/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { 
        if (r.ok) {
          setRooms(await r.json())
        } else {
          const errData = await r.json().catch(() => ({error: "Unknown Server Error"}))
          setMsg("Backend Error: " + (errData.error || errData.detail || "Failed to load rooms"))
        }
      })

    fetch(`${API}/auth/rooms/requests/pending/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { if(r.ok) setRequests(await r.json()) })
  }

  useEffect(() => { fetchData() }, [token])

  async function createRoom(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('Creating...')
    try {
      const r = await fetch(`${API}/auth/rooms/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description: desc, is_public: false })
      })
      if (!r.ok) throw new Error('Failed to create room')
      setMsg('Room created!'); setName(''); setDesc(''); fetchData()
    } catch(err:any) { setMsg(err.message) }
    finally { setBusy(false) }
  }

  async function requestToJoin(code: string) {
    setBusy(true); setMsg('Sending request...')
    try {
      const r = await fetch(`${API}/auth/rooms/join/request/${code}/`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to send request')
      setMsg(d.message);
    } catch(err:any) { setMsg(err.message) }
    finally { setBusy(false) }
  }

  // Handle the form submission for typing in a code
  async function submitJoinCode(e: FormEvent) {
    e.preventDefault();
    requestToJoin(joinCode);
    setJoinCode('');
  }

  async function respondReq(reqId: number, action: 'accept'|'reject') {
    setBusy(true); setMsg(`Processing ${action}...`)
    try {
      const r = await fetch(`${API}/auth/rooms/requests/respond/${reqId}/${action}/`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json().catch(() => ({}))
      
      if (!r.ok) {
        throw new Error(d.error || d.detail || `Server returned ${r.status}`)
      }
      
      setMsg(d.message || `Request ${action}ed successfully!`)
      fetchData() 
    } catch(err:any) {
      setMsg("Backend Error: " + err.message)
    } finally {
      setBusy(false)
    }
  }

  // Filter rooms safely
  const myRooms = rooms.filter(r => {
    const isCreator = r.creator?.username === currentUser.username || r.creator === currentUser.id;
    const isMember = r.members?.some((m: any) => m?.username === currentUser.username || m === currentUser.id);
    return isCreator || isMember;
  })

  const friendsRooms = rooms.filter(r => {
    const isCreator = r.creator?.username === currentUser.username || r.creator === currentUser.id;
    const isMember = r.members?.some((m: any) => m?.username === currentUser.username || m === currentUser.id);
    return !isCreator && !isMember; 
  })

  return (
    <>
      <div className="welcome">
        <div><div className="eyebrow">COLLABORATE</div><h1>Study Rooms</h1><p className="muted">Create a room or ask to join a friend's room.</p></div>
      </div>
      <section className="grid-main">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {msg && <div style={{ padding: '12px', background: msg.includes('Error') || msg.includes('Failed') ? '#fee2e2' : '#dcfce7', color: msg.includes('Error') || msg.includes('Failed') ? '#991b1b' : '#166534', borderRadius: '8px', fontWeight: 'bold' }}>{msg}</div>}

          {/* Panel 1: Join Room (Renamed and Form Added) */}
          <div className="panel">
            <div className="panel-head"><div><h2>Join Room</h2><p className="muted">Enter a code or join a friend's room.</p></div></div>
            
            {/* The Input box for manual codes */}
            <form onSubmit={submitJoinCode} style={{ display: 'flex', gap: '10px', marginTop: '15px', marginBottom: '20px' }}>
              <input required value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="Enter 6-character code" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }} />
              <button className="primary" type="submit" disabled={busy}>Ask to Join</button>
            </form>

            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {friendsRooms.length === 0 ? <p className="muted">Your friends haven't created any open rooms yet.</p> : friendsRooms.map(room => (
                <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding:'12px', background:'rgba(59, 130, 246, 0.05)', borderRadius:'8px' }}>
                  <div>
                    <b>{room.name}</b>
                    <br/><small className="muted">Created by @{room.creator?.username} • {room.members?.length || 0} member(s)</small>
                  </div>
                  <button className="primary" onClick={() => requestToJoin(room.room_code)} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}>
                     Ask to Join
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: My Rooms */}
          <div className="panel">
            <div className="panel-head"><div><h2>My Rooms</h2></div></div>
            <div style={{ marginTop: '15px', display:'flex', flexDirection:'column', gap:'10px' }}>
              {myRooms.length === 0 ? <p className="muted">You haven't joined any rooms yet.</p> : myRooms.map(room => (
                <div key={room.id} style={{ padding:'12px', background:'var(--bg-card, #f0f0f0)', borderRadius:'8px', borderLeft: '4px solid var(--brand)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <b>{room.name}</b>
                    <span style={{ fontFamily: 'monospace', background: '#e5e7eb', color: '#374151', padding: '2px 6px', borderRadius: '4px' }}>{room.room_code}</span>
                  </div>
                  <small className="muted">Created by @{room.creator?.username} • {room.members?.length || 0} member(s)</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel side-panel">
            <div className="panel-head"><div><h2>Join Requests</h2></div></div>
            {requests.length === 0 ? <p className="muted" style={{marginTop:'15px'}}>No pending requests.</p> : (
              <div style={{ marginTop: '15px', display:'flex', flexDirection:'column', gap:'10px' }}>
                {requests.map(req => (
                  <div key={req.id} style={{ padding:'12px', background:'rgba(59, 130, 246, 0.05)', borderRadius:'8px' }}>
                    <div><b>{req.user.display_name || req.user.username}</b> wants to join</div>
                    <div className="muted" style={{ marginBottom: '8px', fontSize: '0.85rem' }}>Room: {req.room.name}</div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button onClick={()=>respondReq(req.id, 'accept')} style={{ padding:'6px 12px', background:'#22C55E', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>Accept</button>
                      <button onClick={()=>respondReq(req.id, 'reject')} style={{ padding:'6px 12px', background:'transparent', border:'1px solid var(--border)', color:'inherit', borderRadius:'6px', cursor:'pointer' }}>Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel side-panel">
            <div className="panel-head"><div><h2>Create Room</h2></div></div>
            <form onSubmit={createRoom} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Room Name" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }} />
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', resize: 'vertical' }} />
              <button className="primary" type="submit" disabled={busy}> Create</button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

// --- Stage 3: PDF Library Component ---
function PDFLibraryTab({ token }: { token: string }) {
  const [pdfs, setPdfs] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [activePdf, setActivePdf] = useState<any | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  function fetchPDFs() {
    fetch(`${API}/auth/pdfs/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setPdfs).catch(err => console.error(err))
  }

  useEffect(() => { fetchPDFs() }, [token])

  async function uploadPDF(e: FormEvent) {
    e.preventDefault()
    if (!file) { setMsg('Please select a file.'); return }
    setBusy(true); setMsg('Uploading...')
    
    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)

    try {
      const r = await fetch(`${API}/auth/pdfs/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to upload PDF.')
      setMsg('PDF uploaded successfully!'); setTitle(''); setFile(null); fetchPDFs()
    } catch (err: any) { setMsg(err.message) } 
    finally { setBusy(false) }
  }

  if (activePdf) {
    if (isFullscreen) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#fff', borderBottom: '1px solid #ccc' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{activePdf.title}</h2>
            <button onClick={() => setIsFullscreen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border, #ccc)', background: 'transparent', cursor: 'pointer' }}>
              <Minimize size={18} /> Exit Full Screen
            </button>
          </div>
          <iframe src={`${getMediaUrl(activePdf.file)}#view=FitH`} width="100%" style={{ flex: 1, border: 'none', display: 'block' }} title={activePdf.title} />
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--border, #eee)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => { setActivePdf(null); setIsFullscreen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border, #ccc)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Back to Library
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{activePdf.title}</h2>
          </div>
          <button onClick={() => setIsFullscreen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border, #ccc)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
            <Maximize size={16} /> Maximize
          </button>
        </div>
        <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', overflow: 'hidden', minHeight: '85vh' }}>
          <iframe src={`${getMediaUrl(activePdf.file)}#view=FitH`} width="100%" style={{ border: 'none', minHeight: '85vh', display: 'block' }} title={activePdf.title} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="welcome">
        <div><div className="eyebrow">RESOURCES</div><h1>PDF Library</h1><p className="muted">Upload and manage your study materials.</p></div>
      </div>
      <section className="grid-main">
        <div className="panel">
          <div className="panel-head"><div><h2>Upload Document</h2></div></div>
          <form onSubmit={uploadPDF} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Document Title (e.g. Chapter 1 Notes)" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border, #ccc)', background: 'transparent', color: 'inherit' }} />
            <input required type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0] || null)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border, #ccc)', background: 'transparent', color: 'inherit' }} />
            <button className="primary" type="submit" disabled={busy} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} /> {busy ? 'Uploading...' : 'Upload PDF'}
            </button>
          </form>
          {msg && <p style={{ marginTop: '15px', color: msg.includes('success') ? '#22C55E' : '#EF4444', fontWeight: '500' }}>{msg}</p>}
        </div>
        <div className="panel side-panel">
          <div className="panel-head"><div><h2>Your Library</h2><p className="muted">{pdfs.length} documents saved</p></div></div>
          {pdfs.length === 0 ? <p className="muted" style={{marginTop:'15px'}}>No PDFs uploaded yet.</p> : (
            <div style={{ marginTop: '15px', display:'flex', flexDirection:'column', gap:'10px' }}>
              {pdfs.map(pdf => (
                <div key={pdf.id} style={{ padding:'16px', background:'rgba(16, 185, 129, 0.05)', borderRadius:'8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ color: '#10B981', marginTop: '3px' }}><FileText size={20}/></div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.05rem' }}>{pdf.title}</h3>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={() => setActivePdf(pdf)} style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Read in App</button>
                        <a href={getMediaUrl(pdf.file)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Open in new tab</a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

// --- Stage 4: Messages Component ---
function MessagesTab({ token, currentUser }: { token: string, currentUser: User }) {
  const [rooms, setRooms] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<{ type: 'room' | 'dm', id: string, name: string } | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [dmUser, setDmUser] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API}/auth/rooms/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setRooms).catch(err => console.error(err))
  }, [token])

  useEffect(() => {
    if (!activeChat) return
    const url = activeChat.type === 'room' ? `${API}/auth/messages/room/${activeChat.id}/` : `${API}/auth/messages/direct/${activeChat.id}/`
    
    const fetchMessages = () => {
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(setMessages)
        .catch(err => console.error(err))
    }

    fetchMessages() 
    const pollInterval = setInterval(fetchMessages, 3000)
    return () => clearInterval(pollInterval)
  }, [activeChat, token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMsg(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || !activeChat) return
    const url = activeChat.type === 'room' ? `${API}/auth/messages/room/${activeChat.id}/` : `${API}/auth/messages/direct/${activeChat.id}/`
    
    await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: text })
    })
    setText('')
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    setMessages(await r.json())
  }

  function startDM(e: FormEvent) {
    e.preventDefault()
    if(dmUser.trim()) {
      setActiveChat({ type: 'dm', id: dmUser.trim(), name: `@${dmUser.trim()}` })
      setDmUser('')
    }
  }

  return (
    <>
      <div className="welcome">
        <div><div className="eyebrow">COMMUNICATION</div><h1>Messages</h1><p className="muted">Chat with your study groups and friends.</p></div>
      </div>
      
      <section className="grid-main" style={{ gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div className="panel side-panel" style={{ margin: 0 }}>
          <div className="panel-head"><div><h2>Start a Direct Message</h2></div></div>
          <form onSubmit={startDM} style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '20px' }}>
            <input required value={dmUser} onChange={e=>setDmUser(e.target.value)} placeholder="Enter username..." style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border, #ccc)', background: 'transparent', color: 'inherit' }} />
            <button className="primary" type="submit" style={{ padding: '10px 15px' }}><Plus size={18}/></button>
          </form>

          <div className="panel-head"><div><h2>Study Room Chats</h2><p className="muted">Group messages</p></div></div>
          {rooms.length === 0 ? <p className="muted" style={{marginTop:'10px'}}>Join a room to chat.</p> : (
            <div style={{ marginTop: '10px', display:'flex', flexDirection:'column', gap:'8px' }}>
              {rooms.map(room => (
                <button 
                  key={room.id} 
                  onClick={() => setActiveChat({ type: 'room', id: room.room_code, name: room.name })}
                  style={{ textAlign: 'left', padding: '12px', borderRadius: '8px', border: 'none', background: activeChat?.id === room.room_code ? 'var(--brand)' : 'transparent', color: activeChat?.id === room.room_code ? 'white' : 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Hash size={14} style={{ display: 'inline', marginRight: '6px' }}/> {room.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '65vh', padding: '20px' }}>
          {!activeChat ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray' }}>
              <p>Select a chat on the left to start messaging.</p>
            </div>
          ) : (
            <>
              <div style={{ borderBottom: '1px solid var(--border, #eee)', paddingBottom: '15px', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}>{activeChat.name}</h2>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '10px' }}>
                {messages.length === 0 ? <p className="muted" style={{textAlign:'center', marginTop:'20px'}}>No messages yet. Say hello!</p> : null}
                {messages.map(m => {
                  const isMe = m.sender.username === currentUser.username;
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', background: isMe ? 'var(--brand)' : 'var(--bg-card, #f0f0f0)', color: isMe ? '#fff' : 'inherit', padding: '10px 14px', borderRadius: '12px', maxWidth: '75%', borderBottomRightRadius: isMe ? '2px' : '12px', borderBottomLeftRadius: !isMe ? '2px' : '12px' }}>
                      {!isMe && <small style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px', fontWeight: 'bold' }}>{m.sender.display_name || m.sender.username}</small>}
                      <div style={{ lineHeight: '1.4' }}>{m.content}</div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMsg} style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border, #eee)' }}>
                <input required value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border, #ccc)', background: 'transparent', color: 'inherit' }} />
                <button className="primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}><Send size={18} /> Send</button>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  )
}

// --- Stage 5: Video Calls Setup Component ---
function VideoCallsTab({ token, setActiveCall, currentUser }: { token: string, setActiveCall: (c: string) => void, currentUser: User }) {
  const [rooms, setRooms] = useState<any[]>([])

  useEffect(() => {
    fetch(`${API}/auth/rooms/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        // SECURITY FILTER: Only show video calls for rooms you are actively a member of
        const myRooms = data.filter((r: any) => 
          r.creator.username === currentUser.username || 
          r.members.some((m: any) => m.username === currentUser.username)
        )
        setRooms(myRooms)
      })
      .catch(err => console.error(err))
  }, [token, currentUser])

  return (
    <>
      <div className="welcome">
        <div><div className="eyebrow">LIVE SESSIONS</div><h1>Video Calls</h1><p className="muted">Join a live study session with your rooms.</p></div>
      </div>
      <section className="grid-main">
        <div className="panel">
          <div className="panel-head"><div><h2>Your Study Rooms</h2><p className="muted">Select a room to join its video channel.</p></div></div>
          {rooms.length === 0 ? <p className="muted" style={{marginTop:'15px'}}>You must join a room first to access its video call.</p> : (
            <div style={{ marginTop: '15px', display:'flex', flexDirection:'column', gap:'10px' }}>
              {rooms.map(room => (
                <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding:'16px', background:'rgba(239, 68, 68, 0.05)', borderRadius:'8px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{room.name}</h3>
                    <span className="muted" style={{ fontSize: '0.85rem' }}>{room.members.length} member(s)</span>
                  </div>
                  <button onClick={() => setActiveCall(room.room_code)} className="primary" style={{ background: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}><Video size={16} /> Join Call</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
// --- Stage 6: Admin Dashboard Component ---
function AdminDashboardTab({ token }: { token: string }) {
  const [data, setData] = useState<{stats: any, recent_users: any[]}>({ stats: {}, recent_users: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/auth/admin/stats/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) throw new Error('Not authorized to view admin dashboard.')
        return r.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
  }, [token])

  if (error) return <div className="welcome" style={{ color: '#EF4444' }}><h2>{error}</h2></div>

  return (
    <>
      <div className="welcome">
        <div><div className="eyebrow">SYSTEM MANAGEMENT</div><h1>Admin Dashboard</h1><p className="muted">Platform analytics and user management.</p></div>
      </div>
      
      <section className="stats" style={{ marginBottom: '20px' }}>
        <div className="stat" style={{ borderTop: '3px solid #3B82F6' }}><span>Total Users</span><b>{data.stats.users || 0}</b></div>
        <div className="stat" style={{ borderTop: '3px solid #8B5CF6' }}><span>Active Rooms</span><b>{data.stats.rooms || 0}</b></div>
        <div className="stat" style={{ borderTop: '3px solid #10B981' }}><span>Hosted PDFs</span><b>{data.stats.pdfs || 0}</b></div>
      </section>

      <section className="grid-main">
        <div className="panel">
          <div className="panel-head"><div><h2>Recent Registrations</h2><p className="muted">The newest accounts on StudySphere.</p></div></div>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.recent_users.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-card, #f0f0f0)', borderRadius: '8px' }}>
                <div><b>@{u.username}</b><br/><small className="muted">{u.email}</small></div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: u.role === 'admin' ? '#3B82F6' : '#ccc', color: u.role === 'admin' ? '#fff' : '#000' }}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

// --- Main App Component ---
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
  
  const [currentTab, setCurrentTab] = useState<'overview' | 'friends' | 'rooms' | 'pdfs' | 'messages' | 'video' | 'admin'>('overview')
  const [activeCall, setActiveCall] = useState<string | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setDeferredPrompt(null)
    }
  }

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

  const isVideoTab = currentTab === 'video'
  const videoContainerStyle: React.CSSProperties = isVideoTab
    ? { width: '100%', height: '75vh', borderRadius: '8px', position: 'relative', marginTop: '10px' }
    : { position: 'fixed', bottom: '20px', right: '20px', width: '380px', height: '260px', zIndex: 9999, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', border: '2px solid var(--brand)' }
  
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
        
        <a className={`nav ${currentTab === 'overview' ? 'active' : ''}`} onClick={() => setCurrentTab('overview')} style={{cursor:'pointer'}}><LayoutDashboard/> Overview</a>
        <a className={`nav ${currentTab === 'friends' ? 'active' : ''}`} onClick={() => setCurrentTab('friends')} style={{cursor:'pointer'}}><Users/> Friends</a>
        <a className={`nav ${currentTab === 'rooms' ? 'active' : ''}`} onClick={() => setCurrentTab('rooms')} style={{cursor:'pointer'}}><BookOpen/> Study rooms</a>
        <a className={`nav ${currentTab === 'pdfs' ? 'active' : ''}`} onClick={() => setCurrentTab('pdfs')} style={{cursor:'pointer'}}><FileText/> PDF library</a>
        <a className={`nav ${currentTab === 'messages' ? 'active' : ''}`} onClick={() => setCurrentTab('messages')} style={{cursor:'pointer'}}><MessageCircle/> Messages</a>
        <a className={`nav ${currentTab === 'video' ? 'active' : ''}`} onClick={() => setCurrentTab('video')} style={{cursor:'pointer'}}><Video/> Video Calls</a>
        
        {user.role === 'admin' && (
          <a className={`nav ${currentTab === 'admin' ? 'active' : ''}`} onClick={() => setCurrentTab('admin')} style={{cursor:'pointer', color: '#3B82F6'}}><ShieldCheck/> Admin Panel</a>
        )}
        
        {deferredPrompt && (
          <button onClick={handleInstallClick} style={{ margin: '15px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid #10B981', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Download size={18} /> Install App
          </button>
        )}

        <div className="sidebar-bottom"><div className="profile-mini"><div className="avatar">{user.username[0]?.toUpperCase()}</div><div><b>{user.display_name||user.username}</b><small>@{user.username}</small></div></div><button className="nav" onClick={logout} style={{cursor:'pointer'}}><LogOut/> Sign out</button></div>
      </aside>
      <main className="main">
        <header className="topbar">
            <div><span className="muted">Workspace /</span> {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}</div>
            <div className="top-actions"><button className="icon-btn" onClick={()=>setDark(!dark)} title="Toggle theme" style={{cursor:'pointer'}}>{dark?<Sun/>:<Moon/>}</button><div className="avatar">{user.username[0]?.toUpperCase()}</div></div>
        </header>
        
        <div className="content">
          {currentTab === 'overview' && (
            <>
              <div className="welcome"><div><div className="eyebrow">YOUR LEARNING SPACE</div><h1>Good to see you, {user.display_name||user.username} 👋</h1><p className="muted">Make today a great day to learn something new.</p></div><button className="primary" onClick={() => setCurrentTab('rooms')} style={{cursor:'pointer'}}><Plus size={18}/> Create study room</button></div>
              <section className="stats"><div className="stat"><span>Study rooms</span><b>0</b><small>Ready for your first room</small></div><div className="stat"><span>Friends</span><b>0</b><small>Learn better together</small></div><div className="stat"><span>PDF documents</span><b>0</b><small>Your library starts here</small></div><div className="stat"><span>Study time</span><b>0h</b><small>Your progress will appear here</small></div></section>
              <section className="grid-main"><div className="panel"><div className="panel-head"><div><h2>Quick start</h2><p className="muted">Jump into your learning workspace.</p></div></div><div className="quick-grid"><div className="quick" onClick={() => setCurrentTab('friends')} style={{cursor:'pointer'}}><div className="quick-icon blue"><Users/></div><b>Find friends</b><p>Connect with classmates and study partners.</p></div><div className="quick" onClick={() => setCurrentTab('rooms')} style={{cursor:'pointer'}}><div className="quick-icon purple"><BookOpen/></div><b>Create a room</b><p>Start a focused study session together.</p></div><div className="quick" onClick={() => setCurrentTab('pdfs')} style={{cursor:'pointer'}}><div className="quick-icon green"><FileText/></div><b>Upload a PDF</b><p>Keep your study materials in one place.</p></div></div></div>
              <div className="panel side-panel"><div className="panel-head"><div><h2>Getting started</h2><p className="muted">Your StudySphere checklist</p></div></div><div className="check-row"><span className="check">✓</span><div><b>Account created</b><small>Your account is ready.</small></div></div><div className="check-row"><span className="check pending">2</span><div><b>Set up your profile</b><small>Add a bio and profile photo.</small></div></div><div className="check-row"><span className="check pending">3</span><div><b>Invite a friend</b><small>Make learning collaborative.</small></div></div></div></section>
              <footer>© 2026 StudySphere · Learn together, anywhere.</footer>
            </>
          )}

{currentTab === 'friends' && <FriendsTab token={token} setCurrentTab={setCurrentTab} />}
          {currentTab === 'rooms' && <StudyRoomsTab token={token} currentUser={user!} />}
          {currentTab === 'pdfs' && <PDFLibraryTab token={token} />}
          {currentTab === 'messages' && <MessagesTab token={token} currentUser={user!} />}
          {currentTab === 'video' && !activeCall && <VideoCallsTab token={token} setActiveCall={setActiveCall} currentUser={user!} />}
          {currentTab === 'admin' && <AdminDashboardTab token={token} />}

          {activeCall && (
            <div style={{ ...videoContainerStyle, backgroundColor: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#111', color: '#fff', padding: '8px 12px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Video size={14}/> {isVideoTab ? 'Live Study Session' : 'Call in Background'}</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {!isVideoTab && <button onClick={() => setCurrentTab('video')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>Expand</button>}
                  <button onClick={() => setActiveCall(null)} style={{ background: '#EF4444', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>End Call</button>
                </div>
              </div>
              <iframe
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                src={`https://p2p.mirotalk.com/join/StudySphere_${activeCall}`}
                style={{ flex: 1, border: 'none', width: '100%' }}
              />
            </div>
          )}

        </div>
      </main>
    </div>}
  </div>
}