import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SEED_ETAPAS, SEED_PLAYERS } from '../data/seed'
import { calcularRanking } from '../lib/scoring'
import { supabase, ADMIN_EMAIL } from '../lib/supabaseClient'
import {
  fetchPagamentos, fetchTudo, removeEtapa, restaurar, semear,
  upsertEtapa, upsertPagamento, upsertPagamentos, upsertPlayer,
} from '../lib/db'

// Cache local: deixa o app abrir instantâneo e funcionar offline para leitura.
const CACHE_KEY = 'ficha-no-pano-cache'

function lerCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (Array.isArray(d.etapas) && Array.isArray(d.players)) return d
    }
  } catch { /* ignora */ }
  return { etapas: SEED_ETAPAS, players: SEED_PLAYERS }
}

export function usePokerState() {
  const cache = useRef(lerCache())
  const [etapas, setEtapas] = useState(cache.current.etapas)
  const [players, setPlayers] = useState(cache.current.players)
  const [pagamentos, setPagamentos] = useState([])
  const [session, setSession] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [online, setOnline] = useState(true)
  const semeou = useRef(false)

  const isAdmin = !!session && session.user?.email === ADMIN_EMAIL

  const carregar = useCallback(async () => {
    try {
      const [dados, pags] = await Promise.all([fetchTudo(), fetchPagamentos()])
      setEtapas(dados.etapas)
      setPlayers(dados.players)
      setPagamentos(pags)
      setOnline(true)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(dados))
      } catch { /* ignora */ }
      return dados
    } catch (e) {
      console.warn('Falha ao carregar do Supabase; usando cache local.', e)
      setOnline(false)
      return null
    } finally {
      setCarregando(false)
    }
  }, [])

  // carga inicial + sessão + tempo real
  useEffect(() => {
    carregar()

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))

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
  }, [carregar])

  // semeia o banco na primeira vez que o admin entra e encontra tudo vazio
  useEffect(() => {
    if (!isAdmin || semeou.current) return
    if (etapas.length === 0 && players.length === 0 && online) {
      semeou.current = true
      semear(SEED_ETAPAS, SEED_PLAYERS)
        .then(carregar)
        .catch((e) => console.warn('Falha ao semear o banco.', e))
    }
  }, [isAdmin, etapas.length, players.length, online, carregar])

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

  const resetTudo = useCallback(async () => {
    try {
      await restaurar(SEED_ETAPAS, SEED_PLAYERS)
      await carregar()
    } catch (e) {
      erroEscrita(e)
    }
  }, [carregar])

  // autenticação
  const entrar = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: (email || '').trim(),
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    if (error) throw error
  }, [])

  const sair = useCallback(() => supabase.auth.signOut(), [])

  const ranking = useMemo(() => calcularRanking(etapas), [etapas])

  return {
    etapas, players, ranking, proximoNum, pagamentos,
    addEtapa, deleteEtapa, addPlayer, resetTudo,
    setPagamento, aplicarPagamentos,
    session, isAdmin, carregando, online, entrar, sair,
  }
}
