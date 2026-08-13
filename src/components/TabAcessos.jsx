const fmtData = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '')

export default function TabAcessos({
  solicitacoes, autorizados, aprovar, recusar, revogar, meuEmail,
}) {
  const pendentes = solicitacoes.filter((s) => s.status === 'pendente')
  const resolvidas = solicitacoes.filter((s) => s.status !== 'pendente')

  return (
    <section className="card">
      <h2>Acessos</h2>
      <p className="ajuda">
        Quem entra pelo link do app fica aqui até você liberar. Antes da
        liberação a pessoa não enxerga nenhum dado do grupo.
      </p>

      <h3 className="sub">
        Pedidos pendentes {pendentes.length > 0 && <span className="badge">{pendentes.length}</span>}
      </h3>
      {pendentes.length === 0 ? (
        <p className="vazio">Nenhum pedido esperando.</p>
      ) : (
        <ul className="lista-acessos">
          {pendentes.map((s) => (
            <li key={s.email}>
              <div>
                <strong>{s.nome || '(sem nome)'}</strong>
                <span className="email">{s.email}</span>
                <span className="quando">pediu em {fmtData(s.created_at)}</span>
              </div>
              <div className="acoes">
                <button className="btn-ok" onClick={() => aprovar(s.email, s.nome)}>
                  Liberar
                </button>
                <button
                  className="btn-no"
                  onClick={() => {
                    if (confirm(`Recusar o acesso de ${s.nome || s.email}?`)) recusar(s.email)
                  }}
                >
                  Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="sub">Com acesso ({autorizados.length})</h3>
      <ul className="lista-acessos">
        {autorizados.map((a) => (
          <li key={a.email}>
            <div>
              <strong>{a.nome || '(sem nome)'}</strong>
              {a.admin && <span className="tag-admin">admin</span>}
              <span className="email">{a.email}</span>
            </div>
            <div className="acoes">
              {a.email !== meuEmail && (
                <button
                  className="btn-no"
                  onClick={() => {
                    if (confirm(`Tirar o acesso de ${a.nome || a.email}?`)) revogar(a.email)
                  }}
                >
                  Tirar acesso
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {resolvidas.length > 0 && (
        <>
          <h3 className="sub">Já resolvidos</h3>
          <ul className="lista-acessos discreta">
            {resolvidas.map((s) => (
              <li key={s.email}>
                <div>
                  <strong>{s.nome || '(sem nome)'}</strong>
                  <span className="email">{s.email}</span>
                </div>
                <span className={s.status === 'aprovado' ? 'st-ok' : 'st-no'}>
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
