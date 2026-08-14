-- ============================================================
-- Pagamentos passa a ser legível só pelo admin (2026-08-14)
--
-- Correção aplicada ao banco que já está no ar. Cole no SQL Editor
-- do Supabase e clique em "Run". Pode rodar mais de uma vez.
--
-- Pré-requisito: o `fix-seguranca.sql` já ter rodado, porque é ele que
-- cria a função `is_admin()`. Se der "function public.is_admin() does
-- not exist", rode aquele antes — na versão de hoje ele já deixa
-- pagamentos como admin-only e este arquivo vira desnecessário.
--
-- Histórico, porque as duas máquinas divergiram:
--
--   1) No começo havia "leitura publica pagamentos" (using true).
--      Como a anon key vai no bundle público do site, a tabela inteira
--      — nome, valor devido, status e data de pagamento de cada
--      jogador — era baixável sem login. Esconder a aba no front não
--      resolvia: o dado continuava saindo pela API REST.
--
--   2) O `fix-seguranca.sql` matou a leitura pública, mas pôs no lugar
--      "autorizado le pagamentos": qualquer um dos 17 do grupo passava
--      a ler a situação financeira dos outros.
--
--   3) Agora: nenhuma das duas. Só o admin.
--
-- Não é preciso criar policy de leitura: "admin escreve pagamentos" é
-- "for all", então já cobre o SELECT dele.
--
-- Não quebra a tela de ninguém — `pagamentos` só alimenta a aba Acerto,
-- que o App.jsx renderiza sob `isAdmin`. Para os demais o RLS devolve
-- lista vazia, sem erro.
-- ============================================================

drop policy if exists "leitura publica pagamentos" on pagamentos;
drop policy if exists "autorizado le pagamentos"   on pagamentos;

-- Garante que a policy do admin existe e está na forma nova, com
-- is_admin() em vez do e-mail escrito na policy.
drop policy if exists "admin escreve pagamentos" on pagamentos;
create policy "admin escreve pagamentos" on pagamentos
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table pagamentos enable row level security;

-- Conferência: deve sobrar exatamente uma linha,
-- "admin escreve pagamentos" / ALL / {authenticated}.
select policyname, cmd, roles
from pg_policies
where tablename = 'pagamentos';
