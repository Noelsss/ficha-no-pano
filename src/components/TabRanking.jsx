const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function TabRanking({ ranking, totalEtapas, fundoTemporada = 0 }) {
  // 50% do fundo acumulado vai para os 3 primeiros da temporada (60/30/10);
  // os outros 50% vão para a Mesa Final
  const premioTemporada = fundoTemporada / 2

  if (!ranking.length) {
    return (
      <div className="card">
        <h2>Ranking Geral</h2>
        <p className="hint">Nenhuma etapa registrada ainda.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Ranking Geral <span className="badge">{totalEtapas} etapas</span></h2>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>#</th>
              <th className="left">Jogador</th>
              <th>Pts</th>
              <th>Et.</th>
              <th title="1º lugar">🥇</th>
              <th title="2º lugar">🥈</th>
              <th title="3º lugar">🥉</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((j, i) => (
              <tr key={j.name} className={i < 3 ? `top top-${i + 1}` : ''}>
                <td className="rank">{i + 1}</td>
                <td className="left nome">{j.name}</td>
                <td><strong>{j.pontos}</strong></td>
                <td>{j.etapas}</td>
                <td>{j.vitorias || <span className="vazio">·</span>}</td>
                <td>{j.segundos || <span className="vazio">·</span>}</td>
                <td>{j.terceiros || <span className="vazio">·</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        🥇 1º · 🥈 2º · 🥉 3º lugares conquistados na temporada.
      </p>
      <p className="hint">
        💰 Premiação da temporada: 🥇 1º <strong>{fmt(premioTemporada * 0.6)}</strong>
        {' · '}🥈 2º <strong>{fmt(premioTemporada * 0.3)}</strong>
        {' · '}🥉 3º <strong>{fmt(premioTemporada * 0.1)}</strong>
        <br />
        <small>
          50% do fundo acumulado ({fmt(premioTemporada)}), dividido em 60% / 30% / 10%.
          O valor cresce a cada etapa jogada.
        </small>
      </p>
    </div>
  )
}
