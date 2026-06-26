// Dados da 30ª Temporada — "Ficha no Pano" (extraídos da planilha oficial)
//
// Buy-in: R$80 | Rebuy: R$70
// De cada buy-in, R$60 vão para o bolão da etapa e R$20 para o fundo da Mesa Final.
// De cada rebuy, R$60 vão para o bolão da etapa e R$10 para a Mesa Final.
// Premiação da etapa: 60% / 30% / 10% sobre o bolão da etapa.
//
// Pontuação por posição: 1º=10, 2º=8, 3º=6, 4º=5, 5º=4, 6º=3, 7º=2, demais=1.

import {
  calcularFundoFT,
  calcularPoolEtapa,
  calcularPremios,
  calcularTotal,
} from '../lib/scoring'

export const BUYIN = 80
export const REBUY = 70

export const SEED_PLAYERS = [
  'Bruno', 'Cícero', 'Davi', 'Fernando', 'Fonseca', 'Glauber', 'Guarezi',
  'Jean', 'Jorginho', 'Leonardo', 'Luiz', 'Maicon', 'Márcio', 'Prudente',
  'Rafael', 'Rogério', 'Rui',
]

// Calendário completo da temporada (datas, sede/responsável e Mesa Final).
export const CALENDARIO = [
  { num: 1, data: '2026-02-26', sede: 'Glauber' },
  { num: 2, data: '2026-03-26', sede: 'Davi' },
  { num: 3, data: '2026-04-23', sede: 'Rui' },
  { num: 4, data: '2026-05-28', sede: 'Cícero' },
  { num: 5, data: '2026-06-25', sede: 'Luiz' },
  { num: 6, data: '2026-07-30', sede: 'Jorginho' },
  { num: 7, data: '2026-08-27', sede: 'Maicon' },
  { num: 8, data: '2026-09-24', sede: 'Bruno' },
  { num: 9, data: '2026-10-29', sede: 'Rafael' },
  { num: 'MF', label: 'Mesa Final', data: '2026-11-26', sede: 'Márcio' },
]

// participantes: [nome, pontos, rebuys?]. pontos 1 = participou; rebuys default 0.
// Os rebuys por jogador (E1–E4) foram inferidos do extrato do PicPay e batem
// com o total de rebuys de cada etapa.
const etapa = (num, data, sede, buyins, rebuys, participantes) => {
  const total = calcularTotal(buyins, rebuys, BUYIN, REBUY)
  const fundoFT = calcularFundoFT(buyins, rebuys)
  const poolEtapa = calcularPoolEtapa(buyins, rebuys, BUYIN, REBUY)
  const prizes = calcularPremios(poolEtapa)
  const resultados = participantes.map(([name, pts, rb = 0]) => ({ name, pts, rebuys: rb }))
  return {
    num, data, sede, buyin: BUYIN, rebuy: REBUY,
    buyins, rebuys, total, fundoFT, poolEtapa, prizes, resultados,
    detalhado: true,
  }
}

// 3º valor de cada par = rebuys do jogador (inferidos do extrato).
export const SEED_ETAPAS = [
  etapa(1, '2026-02-26', 'Glauber', 8, 2, [
    ['Cícero', 10, 1], ['Jorginho', 8], ['Luiz', 6], ['Jean', 5],
    ['Rafael', 4], ['Guarezi', 3], ['Bruno', 2, 1], ['Márcio', 1],
  ]),
  etapa(2, '2026-03-26', 'Davi', 10, 4, [
    ['Davi', 10], ['Glauber', 8], ['Bruno', 6], ['Fernando', 5],
    ['Márcio', 4, 1], ['Rui', 3], ['Rafael', 2, 2],
    ['Cícero', 1], ['Luiz', 1, 1], ['Rogério', 1],
  ]),
  etapa(3, '2026-04-23', 'Rui', 11, 6, [
    ['Davi', 10], ['Cícero', 8], ['Jean', 6], ['Rafael', 5, 3],
    ['Rui', 4], ['Bruno', 3, 1], ['Maicon', 2],
    ['Márcio', 1, 1], ['Glauber', 1], ['Rogério', 1], ['Guarezi', 1, 1],
  ]),
  etapa(4, '2026-05-28', 'Cícero', 11, 5, [
    ['Luiz', 10], ['Márcio', 8], ['Cícero', 6], ['Jean', 5, 1],
    ['Davi', 4], ['Rui', 3], ['Jorginho', 2, 1],
    ['Bruno', 1], ['Glauber', 1, 1], ['Rogério', 1, 1], ['Fernando', 1, 1],
  ]),
  etapa(5, '2026-06-25', 'Luiz', 9, 2, [
    ['Glauber', 10], ['Bruno', 8], ['Jorginho', 6], ['Luiz', 5, 2],
    ['Márcio', 4], ['Cícero', 3], ['Rui', 2],
    ['Maicon', 1], ['Rafael', 1],
  ]),
]
