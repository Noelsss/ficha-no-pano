-- ============================================================
-- Ficha no Pano — solicitações de acesso
--
-- Quem entra pelo link e ainda não foi liberado registra aqui um pedido.
-- Nada disto dá acesso a nada: o que libera é a tabela `autorizados`.
-- Esta tabela só existe para você saber quem está esperando.
-- ============================================================

create table if not exists solicitacoes (
  email      text primary key,
  nome       text,
  status     text not null default 'pendente',  -- pendente | aprovado | recusado
  created_at timestamptz not null default now()
);

alter table solicitacoes enable row level security;

-- Remove versões anteriores, para o arquivo poder rodar de novo sem erro.
drop policy if exists "cria propria solicitacao"    on solicitacoes;
drop policy if exists "atualiza propria solicitacao" on solicitacoes;
drop policy if exists "ve propria solicitacao"      on solicitacoes;
drop policy if exists "admin gerencia solicitacoes" on solicitacoes;

-- A pessoa logada só cria pedido para o PRÓPRIO e-mail, e só como
-- 'pendente' — não adianta forjar status: quem aprova é o admin, e mesmo
-- 'aprovado' aqui não dá acesso nenhum sem estar em `autorizados`.
create policy "cria propria solicitacao" on solicitacoes
  for insert to authenticated
  with check (
    email = (auth.jwt() ->> 'email')
    and status = 'pendente'
  );

-- Pode corrigir o próprio nome enquanto está pendente.
create policy "atualiza propria solicitacao" on solicitacoes
  for update to authenticated
  using (email = (auth.jwt() ->> 'email') and status = 'pendente')
  with check (email = (auth.jwt() ->> 'email') and status = 'pendente');

-- Cada um vê só o próprio pedido; o admin vê todos.
create policy "ve propria solicitacao" on solicitacoes
  for select to authenticated
  using (email = (auth.jwt() ->> 'email') or public.is_admin());

-- O admin aprova, recusa e apaga.
create policy "admin gerencia solicitacoes" on solicitacoes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Conferência: nenhuma linha pode ter roles = {public}
select policyname, cmd, roles from pg_policies
where tablename = 'solicitacoes' order by policyname;
