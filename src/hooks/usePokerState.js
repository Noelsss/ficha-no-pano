import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calcularRanking } from '../lib/scoring'
import { supabase } from '../lib/supabaseClient'
import {
  aprovarAcesso, fetchAutorizados, fetchMe, fetchPagamentos, fetchSolicitacoes,
  fetchTudo, pedirAcesso, recusarAcesso, removeEtapa, revogarAcesso,
  upsertEtapa, upsertPagamento, upsertPagamentos, upsertPlayer,
} from '../lib/db'

// Nada de cache em localStorage: etapas e pagamentos são dados privados e não
// devem sobrar no aparelho depois que a pessoa sai. O app sempre lê do banco.

export function usePokerState() {
  const [etapas, setEtapas] = useState([])
  const [players, setPlayers] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [autorizados, setAutorizados] = useState([])
  const [session, setSession] = useState(null)
  const [me, setMe] = useState(null)          // registro em `autorizados`
  const [minhaSolicitacao, setMinhaSolicitacao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroRede, setErroRede] = useState(false)
  const sessaoLida = useRef(false)

  const autorizado = !!me
  const isAdmin = !!me?.admin

  const limpar = useCallback(() => {
    setEtapas([])
    setPlayers([])
    setPagamentos([])
    setSolicitacoes([])
    setAutorizados([])
    setMe(null)
    setMinhaSolicitacao(null)
  }, [])

  const carregar = useCallback(async () => {
    // Sem sessão não há o que buscar: o RLS devolveria vazio de qualquer forma.
    const { data: s } = await supabase.auth.getSession()
    if (!s.session) {
      limpar()
      setCarregando(false)
      return
    }
    try {
      const eu = await fetchMe()
      setMe(eu)
      if (!eu) {
        // Logado, mas fora da lista de autorizados: não carrega nada além do
        // próprio pedido de acesso (o RLS só devolve esse).
        setEtapas([])
        setPlayers([])
        setPagamentos([])
        const pedidos = await fetchSolicitacoes()
        setMinhaSolicitacao(pedidos[0] || null)
        setErroRede(false)
        return
      }
      const [dados, pags] = await Promise.all([fetchTudo(), fetchPagamentos()])
      setEtapas(dados.etapas)
      setPlayers(dados.players)
      setPagamentos(pags)
      if (eu.admin) {
        const [pedidos, lista] = await Promise.all([fetchSolicitacoes(), fetchAutorizados()])
        setSolicitacoes(pedidos)
        setAutorizados(lista)
      }
      setErroRede(false)
    } catch (e) {
      console.warn('Falha ao carregar do Supabase.', e)
      setErroRede(true)
    } finally {
      setCarregando(false)
    }
  }, [limpar])

  // sessão + carga inicial + tempo real
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      sessaoLida.current = true
      setSession(data.session)
      carregar()
    })

    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSession(s)
      if (evento === 'SIGNED_OUT' || !s) {
        limpar()
        setCarregando(false)
      } else if (sessaoLida.current) {
        carregar()
      }
    })

    const canal = supabase
      .channel('ficha-no-pano')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'etapas' }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagamentos' }, carregar)
      .subscribe()

    return () => {
      sub.subscription.unsubscribe()
      supabase.removeChannel(canal)
    }
  }, [carregar, limpar])

  const proximoNum = useMemo(() => {
    const nums = etapas.map((e) => e.num).filter((n) => typeof n === 'number')
    return nums.length ? Math.max(...nums) + 1 : 1
  }, [etapas])

  const erroEscrita = (e) => {
    console.error(e)
    alert('Não foi possível salvar. Você precisa estar logado como admin.')
  }

  const addEtapa = useCallback(async (etapa) => {
    setEtapas((prev) => [...prev.filter((e) => e.num !== etapa.num), etapa])
    try {
      await upsertEtapa(etapa)
    } catch (e) {
      erroEscrita(e)
      carregar()
    }
  }, [carregar])

  const deleteEtapa = useCallback(async (num) => {
    setEtapas((prev) => prev.filter((e) => e.num !== num))
    try {
      await removeEtapa(num)
    } catch (e) {
      erroEscrita(e)
      carregar()
    }
  }, [carregar])

  const addPlayer = useCallback(async (nome) => {
    const name = (nome || '').trim()
    if (!name) return false
    if (players.some((p) => p.toLowerCase() === name.toLowerCase())) return false
    setPlayers((prev) => [...prev, name].sort((a, b) => a.localeCompare(b, 'pt-BR')))
    try {
      await upsertPlayer(name)
    } catch (e) {
      erroEscrita(e)
      carregar()
    }
    return true
  }, [players, carregar])

  const setPagamento = useCallback(async (p) => {
    setPagamentos((prev) => {
      const resto = prev.filter(
        (x) => !(x.etapaNum === p.etapaNum && x.player === p.player),
      )
      return [...resto, p]
    })
    try {
      await upsertPagamento(p)
    } catch (e) {
      erroEscrita(e)
      carregar()
    }
  }, [carregar])

  const aplicarPagamentos = useCallback(async (lista) => {
    try {
      await upsertPagamentos(lista)
      await carregar()
    } catch (e) {
      erroEscrita(e)
    }
  }, [carregar])

  // --- acessos (admin) ---

  const aprovar = useCallback(async (email, nome) => {
    try {
      await aprovarAcesso(email, nome)
      await carregar()
    } catch (e) { erroEscrita(e) }
  }, [carregar])

  const recusar = useCallback(async (email) => {
    try {
      await recusarAcesso(email)
      await carregar()
    } catch (e) { erroEscrita(e) }
  }, [carregar])

  const revogar = useCallback(async (email) => {
    try {
      await revogarAcesso(email)
      await carregar()
    } catch (e) { erroEscrita(e) }
  }, [carregar])

  // Pedido de acesso de quem entrou mas ainda não foi liberado.
  const solicitar = useCallback(async (nome) => {
    const email = session?.user?.email
    if (!email) return
    await pedirAcesso(email, nome)
    const pedidos = await fetchSolicitacoes()
    setMinhaSolicitacao(pedidos[0] || null)
  }, [session])

  // autenticação — o cadastro é aberto de propósito: qualquer um cria conta,
  // mas não enxerga nada enquanto o admin não colocar em `autorizados`.
  const entrar = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: (email || '').trim(),
      options: {
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
    if (error) throw error
  }, [])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
    limpar()
  }, [limpar])

  const ranking = useMemo(() => calcularRanking(etapas), [etapas])

  return {
    etapas, players, ranking, proximoNum, pagamentos,
    addEtapa, deleteEtapa, addPlayer,
    setPagamento, aplicarPagamentos,
    solicitacoes, autorizados, minhaSolicitacao,
    aprovar, recusar, revogar, solicitar,
    session, me, autorizado, isAdmin, carregando, erroRede, entrar, sair,
  }
}
