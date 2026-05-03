import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, parseISO } from 'date-fns'

function CommentSection({ postId, user, isAdmin }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    supabase.from('comments').select('count', {count:'exact',head:true}).eq('post_id', postId)
      .then(({count: c}) => setCount(c || 0))
  }, [postId])

  async function loadComments() {
    if (showComments) { setShowComments(false); return }
    const { data } = await supabase.from('comments').select('*, profiles(display_name,full_name)').eq('post_id', postId).order('created_at')
    setComments(data || [])
    setShowComments(true)
  }

  async function addComment(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    const { data } = await supabase.from('comments').insert({ post_id: postId, author_id: user.id, body: text.trim() }).select('*, profiles(display_name,full_name)').single()
    if (data) { setComments(c => [...c, data]); setCount(n => n+1); setText('') }
    setLoading(false)
  }

  async function deleteComment(id) {
    await supabase.from('comments').delete().eq('id', id)
    setComments(c => c.filter(x => x.id !== id))
    setCount(n => n-1)
  }

  return (
    <div className="comment-area">
      <button className="btn btn-ghost btn-sm" onClick={loadComments} style={{marginBottom: showComments ? 10 : 0}}>
        💬 {count} comment{count!==1?'s':''} {showComments?'▲':'▼'}
      </button>

      {showComments && (
        <>
          {comments.length === 0 && <p style={{color:'var(--text-dim)',fontSize:'0.8rem',padding:'4px 0',textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>No comments yet.</p>}
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="avatar avatar-sm">{(c.profiles?.display_name||'?').slice(0,2).toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                  <span style={{fontFamily:'Oswald',fontSize:'0.8rem'}}>{c.profiles?.display_name}</span>
                  <span className="text-xs text-muted">{format(parseISO(c.created_at),'MMM d, h:mm a')}</span>
                </div>
                <p style={{fontSize:'0.85rem',color:'var(--text-muted)',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400}}>{c.body}</p>
              </div>
              {(c.author_id === user?.id || isAdmin) && (
                <button className="btn btn-ghost btn-sm" style={{color:'var(--text-dim)',padding:'2px 6px'}} onClick={()=>deleteComment(c.id)}>✕</button>
              )}
            </div>
          ))}
          <form onSubmit={addComment} style={{display:'flex',gap:8,marginTop:8}}>
            <input className="form-input" style={{flex:1,padding:'7px 12px',fontSize:'0.85rem'}} placeholder="Write a comment..." value={text} onChange={e=>setText(e.target.value)} />
            <button className="btn btn-primary btn-sm" type="submit" disabled={loading||!text.trim()}>Post</button>
          </form>
        </>
      )}
    </div>
  )
}

export default function Board() {
  const { user, profile, isAdmin } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(display_name,full_name)')
      .order('pinned', {ascending:false})
      .order('created_at', {ascending:false})
    setPosts(data || [])
    setLoading(false)
  }

  async function submitPost(e) {
    e.preventDefault()
    if (!newPost.trim()) return
    setPosting(true)
    setError(null)
    const { error } = await supabase.from('posts').insert({ author_id: user.id, body: newPost.trim() })
    if (error) setError(error.message)
    else { setNewPost(''); loadPosts() }
    setPosting(false)
  }

  async function deletePost(id) {
    await supabase.from('posts').delete().eq('id', id)
    setPosts(p => p.filter(x => x.id !== id))
  }

  async function togglePin(id, pinned) {
    await supabase.from('posts').update({ pinned: !pinned }).eq('id', id)
    setPosts(p => p.map(x => x.id === id ? {...x, pinned: !pinned} : x))
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="container" style={{maxWidth:760}}>
        <div className="page-header">
          <h1 className="page-title">Community Board</h1>
          <p className="page-subtitle">Share updates, ideas, sign suggestions, and coordinate with fellow members.</p>
        </div>

        {/* New post form */}
        <div className="card" style={{marginBottom:24}}>
          <form onSubmit={submitPost}>
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <div className="avatar" style={{marginTop:2}}>{(profile?.display_name||'?').slice(0,2).toUpperCase()}</div>
              <div style={{flex:1}}>
                <textarea
                  className="form-textarea"
                  placeholder="Share something with the brigade..."
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  style={{minHeight:80}}
                />
                {error && <div className="form-error mt-1">{error}</div>}
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                  <button className="btn btn-primary btn-sm" type="submit" disabled={posting || !newPost.trim()}>
                    {posting ? 'Posting...' : 'Post to Board'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>Be the first to post something to the board!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="card post-card" style={{marginBottom:12}}>
              {post.pinned && <div className="pinned-bar">📌 Pinned by admin</div>}
              <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                <div className="avatar">{(post.profiles?.display_name||'?').slice(0,2).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                    <span style={{fontFamily:'Oswald',fontSize:'0.9rem',fontWeight:600}}>{post.profiles?.display_name || post.profiles?.full_name}</span>
                    <span className="text-xs text-muted">{format(parseISO(post.created_at),'MMM d, yyyy · h:mm a')}</span>
                  </div>
                  <p style={{color:'var(--text)',fontSize:'0.95rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400,lineHeight:1.7,whiteSpace:'pre-wrap'}}>
                    {post.body}
                  </p>

                  {/* Actions */}
                  <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap'}}>
                    {(post.author_id === user?.id || isAdmin) && (
                      <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)',fontSize:'0.75rem'}} onClick={()=>deletePost(post.id)}>
                        🗑 Delete
                      </button>
                    )}
                    {isAdmin && (
                      <button className="btn btn-ghost btn-sm" style={{fontSize:'0.75rem'}} onClick={()=>togglePin(post.id, post.pinned)}>
                        {post.pinned ? '📌 Unpin' : '📌 Pin'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <CommentSection postId={post.id} user={user} isAdmin={isAdmin} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
