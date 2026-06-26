import { useState } from 'react'

export default function AdminBar({ isAdmin, session, online, entrar, sair }) {
  const [aberto, setAberto] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('') // '', 'enviando', 'enviado', 'erro'

  async function enviar() {
    if (!email.trim()) return
    setStatus('enviando')
    try {
      await entrar(email)
      setStatus('enviado')
    } catch (e) {
      console.error(e)
      setStatus('erro')
    }
  }

  if (isAdmin) {
    return (
      <div className="admin-bar">
        <span className="admin-ok">✓ Admin · {session?.user?.email}</span>
        <button className="admin-link" onClick={sair}>Sair</button>
      </div>
    )
  }

  return (
    <div className="admin-bar">
      <span className="admin-ro">
        {online ? '👁️ Modo visualização' : '⚠️ Offline (dados em cache)'}
      </span>
      {!aberto ? (
        <button className="admin-link" onClick={() => setAberto(true)}>Entrar (admin)</button>
      ) : status === 'enviado' ? (
        <span className="admin-ok">📧 Link enviado! Confira seu e-mail.</span>
      ) : (
        <div className="admin-login">
          <input
            type="email"
            placeholder="seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
          />
          <button className="btn-ghost" onClick={enviar} disabled={status === 'enviando'}>
            {status === 'enviando' ? 'Enviando…' : 'Enviar link'}
          </button>
          {status === 'erro' && <span className="admin-erro">Erro ao enviar</span>}
        </div>
      )}
    </div>
  )
}
