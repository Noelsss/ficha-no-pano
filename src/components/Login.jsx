import { useState } from 'react'

// Tela de entrada. Enquanto ninguém está logado e autorizado, é a única coisa
// que o app renderiza — nenhum dado do grupo chega ao navegador antes disso.
export default function Login({
  entrar, sair, solicitar, semAcesso, email: emailLogado, minhaSolicitacao,
}) {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [status, setStatus] = useState('') // '', 'enviando', 'enviado', 'erro'
  const [pedindo, setPedindo] = useState(false)

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

  async function pedir() {
    if (!nome.trim()) return
    setPedindo(true)
    try {
      await solicitar(nome.trim())
    } catch (e) {
      console.error(e)
    } finally {
      setPedindo(false)
    }
  }

  // Logado, mas ainda não liberado pelo admin.
  if (semAcesso) {
    const recusado = minhaSolicitacao?.status === 'recusado'
    const pendente = minhaSolicitacao?.status === 'pendente'

    return (
      <div className="portao">
        <h2>{pendente ? 'Aguardando liberação' : 'Solicitar acesso'}</h2>
        <p>
          Você entrou como <strong>{emailLogado}</strong>.
          {pendente
            ? ' Seu pedido foi registrado — o Glauber precisa liberar seu acesso. Assim que ele aprovar, é só recarregar a página.'
            : recusado
              ? ' Seu pedido não foi aprovado. Fale com o Glauber se achar que houve engano.'
              : ' O acesso é restrito aos jogadores do grupo. Diga seu nome para pedir liberação.'}
        </p>

        {!pendente && !recusado && (
          <div className="portao-form">
            <input
              type="text"
              placeholder="seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && pedir()}
            />
            <button className="btn-ghost" onClick={pedir} disabled={pedindo}>
              {pedindo ? 'Enviando…' : 'Pedir acesso'}
            </button>
          </div>
        )}

        {pendente && <p className="portao-ok">⏳ Pedido enviado como {minhaSolicitacao.nome}</p>}

        <p style={{ marginTop: 18, marginBottom: 0 }}>
          <button className="admin-link" onClick={sair}>Sair</button>
        </p>
      </div>
    )
  }

  return (
    <div className="portao">
      <h2>Entrar</h2>
      <p>
        O acesso é restrito aos jogadores do grupo. Informe seu e-mail e você
        receberá um link para entrar.
      </p>

      {status === 'enviado' ? (
        <p className="portao-ok">
          📧 Link enviado para <strong>{email}</strong>. Abra o e-mail neste
          mesmo aparelho para entrar.
        </p>
      ) : (
        <>
          <div className="portao-form">
            <input
              type="email"
              placeholder="seu e-mail"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviar()}
            />
            <button
              className="btn-ghost"
              onClick={enviar}
              disabled={status === 'enviando'}
            >
              {status === 'enviando' ? 'Enviando…' : 'Enviar link'}
            </button>
          </div>
          {status === 'erro' && (
            <p className="portao-erro">
              Não foi possível enviar o link. Tente de novo em instantes.
            </p>
          )}
        </>
      )}
    </div>
  )
}
