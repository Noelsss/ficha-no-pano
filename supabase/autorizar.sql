-- ============================================================
-- Liberar acesso para um jogador
--
-- São DOIS passos — o segundo é no painel, não aqui:
--
--   1) Rode o insert abaixo com o e-mail da pessoa.
--   2) No painel: Authentication → Users → "Add user" → "Send invite".
--      Sem isso a pessoa não consegue nem pedir o link de acesso,
--      porque o cadastro aberto está desligado.
-- ============================================================

insert into autorizados (email, nome, admin) values
  ('fulano@gmail.com', 'Fulano', false)
on conflict (email) do nothing;

-- Tirar o acesso de alguém:
-- delete from autorizados where email = 'fulano@gmail.com';
-- (remova também em Authentication → Users, senão a conta continua existindo)

-- Ver quem tem acesso hoje:
select email, nome, admin, created_at from autorizados order by admin desc, nome;
