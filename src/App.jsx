import { useEffect, useState } from 'react'
import { usePokerState } from './hooks/usePokerState'
import { CALENDARIO } from './data/seed'
import TabEtapa from './components/TabEtapa'
import TabRanking from './components/TabRanking'
import TabHistorico from './components/TabHistorico'
import TabCalendario from './components/TabCalendario'
import TabAcerto from './components/TabAcerto'
import AdminBar from './components/AdminBar'
import Login from './components/Login'
import TabAcessos from './components/TabAcessos'

function Topo() {
  return (
    <header className="topo">
      <div className="brand">
        <span className="suit">♠</span>
        <div>
          <h1>Ficha no Pano</h1>
          <p>30ª Temporada</p>
        </div>
        <span className="suit red">♥</span>
      </div>
    </header>
  )
}

export default function App() {
  const {
    etapas, players, ranking, proximoNum, pagamentos,
    addEtapa, deleteEtapa, addPlayer,
    setPagamento, aplicarPagamentos,
    solicitacoes, autorizados, minhaSolicitacao,
    aprovar, recusar, revogar, solicitar,
    session, me, autorizado, isAdmin, carregando, erroRede, entrar, sair,
  } = usePokerState()
  const [tab, setTab] = useState('ranking')

  const pendentes = solicitacoes.filter((s) => s.status === 'pendente').length

  const tabs = [
    { id: 'ranking', label: 'Ranking' },
    { id: 'calendario', label: 'Calendário' },
    ...(isAdmin ? [
      { id: 'etapa', label: 'Nova Etapa' },
      { id: 'acerto', label: 'Acerto' },
      { id: 'acessos', label: pendentes ? `Acessos (${pendentes})` : 'Acessos' },
    ] : []),
    { id: 'historico', label: 'Histórico' },
  ]

  // se o admin sair enquanto está numa aba restrita, volta para o ranking
  const ABAS_ADMIN = ['etapa', 'acerto', 'acessos']
  useEffect(() => {
    if (ABAS_ADMIN.includes(tab) && !isAdmin) setTab('ranking')
  }, [tab, isAdmin])

  if (carregando) {
    return (
      <div className="app">
        <Topo />
        <p className="portao-carregando">Carregando…</p>
      </div>
    )
  }

  // Portão: sem sessão, ou logado sem estar na lista de autorizados,
  // nada do grupo é renderizado.
  if (!session || !autorizado) {
    return (
      <div className="app">
        <Topo />
        <Login
          entrar={entrar}
          sair={sair}
          solicitar={solicitar}
          semAcesso={!!session && !autorizado}
          email={session?.user?.email}
          minhaSolicitacao={minhaSolicitacao}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <Topo />

      <AdminBar
        isAdmin={isAdmin}
        me={me}
        session={session}
        erroRede={erroRede}
        sair={sair}
      />

      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab on' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'ranking' && (
          <TabRanking ranking={ranking} totalEtapas={etapas.filter((e) => e.num !== 'MF').length} />
        )}
        {tab === 'calendario' && (
          <TabCalendario calendario={CALENDARIO} etapas={etapas} />
        )}
        {tab === 'etapa' && isAdmin && (
          <TabEtapa
            players={players}
            proximoNum={proximoNum}
            calendario={CALENDARIO}
            etapas={etapas}
            onSalvar={(e) => {
              addEtapa(e)
              setTab('historico')
            }}
            onAddPlayer={addPlayer}
          />
        )}
        {tab === 'acerto' && isAdmin && (
          <TabAcerto
            etapas={etapas}
            players={players}
            pagamentos={pagamentos}
            setPagamento={setPagamento}
            aplicarPagamentos={aplicarPagamentos}
          />
        )}
        {tab === 'acessos' && isAdmin && (
          <TabAcessos
            solicitacoes={solicitacoes}
            autorizados={autorizados}
            aprovar={aprovar}
            recusar={recusar}
            revogar={revogar}
            meuEmail={me?.email}
          />
        )}
        {tab === 'historico' && (
          <TabHistorico
            etapas={etapas}
            onExcluir={deleteEtapa}
            canEdit={isAdmin}
            pix={me?.pix}
          />
        )}
      </main>
    </div>
  )
}
