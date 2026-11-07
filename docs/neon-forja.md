# FORJA — autenticação e persistência Neon

## Conexão e ambientes

A integração do projeto Vercel `tatugym` criou `FORJA_DATABASE_URL`, `FORJA_POSTGRES_URL` e variáveis auxiliares nos ambientes Development, Preview e Production. `FORJA_URL` não foi criada; a conexão aceita essa variável como prioridade opcional e usa `FORJA_DATABASE_URL` como alternativa. Nenhuma variável deve receber o prefixo `VITE_`.

As três configurações consultadas apontam para o mesmo endpoint/banco. A migration `001_forja.sql` foi aplicada nesse banco. O schema `neon_auth` existente permanece intacto. O app usa sessões próprias de servidor e não depende do serviço Neon Auth.

`server/db.mjs` abre conexões PostgreSQL com TLS e verificação de certificado. Só a função `api/forja.mjs` e os scripts de administração importam essa conexão. A Vercel publica a API como função Node junto com os assets do Vite; hospedar apenas `dist/` não fornece autenticação.

## Desenvolvimento

```powershell
vercel env pull .env.development.local --environment=development
npm install
npm run db:inspect
npm run dev
```

`npm run dev` inicia a API em `127.0.0.1:3001` e o Vite com proxy na mesma origem. `FORJA_API_PORT` permite escolher outra porta da API. Para testar o build local, inicie `node --env-file=.env.development.local server/local.mjs` e `npm run preview` em terminais separados. Requer Node.js 22.12+ ou 24.

## Migrations e contas

`npm run db:migrate` aplica migrations versionadas em transação, com bloqueio e checksum. Não usa reset, drop ou truncate. O build não executa migrations ou seed automaticamente.

`npm run db:seed` cria as contas `henrique` e `professor` somente quando não existem. As senhas entram pelas variáveis de processo `FORJA_SEED_STUDENT_PASSWORD` e `FORJA_SEED_TEACHER_PASSWORD`. `FORJA_SEED_TEACHER2_PASSWORD` permite preservar a conta anterior `professor2`. Os valores não constam neste repositório e não devem ser incluídos no frontend, comandos registrados, arquivos versionados ou logs. As contas desta entrega já foram provisionadas; hashes existentes não são substituídos.

As senhas usam scrypt com salt aleatório, N=32768, r=8 e p=1. As sessões usam tokens aleatórios de 256 bits; o banco guarda apenas seu SHA-256. Cookies são HttpOnly e SameSite=Lax, com Secure e prefixo __Host- na Vercel. Logout revoga o token no banco. Há limite de tentativas de login persistido no PostgreSQL e proteção de origem nas operações de escrita.

## Tabelas no schema forja

| Tabela | Conteúdo |
| --- | --- |
| users | Contas, papel e hash de senha |
| teachers | Perfil do professor |
| students | Cadastro do aluno e associação opcional à conta |
| teacher_students | Vínculo exclusivo entre professor e aluno |
| student_data | Estado completo versionado: refeições, pesos, preferências, sessão em andamento e check-ins |
| workouts | Treinos próprios do aluno e planos vinculados pelo professor |
| exercises | Biblioteca e exercícios dos treinos |
| workout_history | Histórico com cópia integral da execução |
| physical_assessments | Avaliações físicas por professor/aluno |
| teacher_activities | Atividades do painel |
| sessions | Sessões com expiração de sete dias |
| login_attempts | Controle de tentativas |
| local_imports | Original da importação e checksum contra duplicação |
| schema_migrations | Versões aplicadas |

Os dados completos em JSONB preservam os campos atuais do aplicativo. Treinos, exercícios, histórico e avaliações também possuem tabelas próprias. Exclusões do professor arquivam registros; excluir aluno o inativa e preserva seus dados. Cadastros novos de alunos pelo professor ainda não emitem credenciais: criação de credenciais e recuperação de senha exigem um fluxo específico futuro.

## Preservação e migração local

Origem identificada no código anterior:

- Aluno: `meu-treino:v1:henrique-local`.
- Check-ins: `meu-treino:v1:henrique-local:weekly-checkins`.
- Professores: `tatugym:dev:teacher-workspace:v1`, particionado por teacherId.

Nenhuma dessas chaves é removida ou substituída. Após o login de Henrique, o cliente envia o original à API autenticada. A importação valida o formato e grava o estado completo e as tabelas correspondentes em uma transação. Uma releitura confirma a igualdade dos dados, normalizando somente o identificador da conta. O checksum torna a repetição idempotente. Uma importação já confirmada não substitui alterações posteriores do servidor.

O professor importa somente a sua partição local. A API valida novamente a identidade, os vínculos e conflitos; IDs, datas e cópia original ficam preservados. A conta professor2 continua separada.

Dados locais diferentes de registros já presentes no servidor interrompem a migração com erro, sem sobrepor nenhum lado. Formatos inválidos também interrompem a importação. O plano de conciliação é: exportar a cópia preservada após autenticação, obter a cópia atual do servidor, comparar por IDs e conteúdo, apresentar os conflitos e aplicar somente alterações aprovadas em uma transação. Nunca resolver conflitos limpando o localStorage.

As alterações seguintes do aluno recebem uma cópia pendente em `forja:pending:<userId>` até confirmação do banco. Revisões impedem sobrescrever uma versão mais recente de outro dispositivo. O app sinaliza falhas de gravação. A autenticação e o carregamento inicial exigem rede; uma tela já aberta conserva alterações pendentes quando perde a conexão.

O localStorage depende de origem, navegador e dispositivo. Uma versão de Preview não enxerga dados do domínio de produção ou de localhost. A transferência dos registros reais exige abrir a nova versão **no mesmo domínio e navegador/PWA onde os dados foram cadastrados**, entrar como Henrique e conferir a confirmação. O acesso automatizado ao navegador do usuário estava desativado nesta sessão; seus treinos reais não foram lidos nem declarados como transferidos.

## Validação segura

```powershell
npm run build
npm run verify:teacher-production
npm test
```

`npm test` cria um schema `forja_test_<timestamp>_<id>` no mesmo Neon, com senhas de teste aleatórias, aplica migrations e executa contratos de persistência e fluxos reais em Chromium/WebKit. O schema não pode ser selecionado na Vercel. Testes nunca usam as tabelas `forja` de usuários reais. Os schemas de teste desta entrega foram mantidos, pois nenhuma operação destrutiva foi autorizada.

Os contratos verificam preservação de sessões em andamento, rascunhos, histórico, refeições, pesos, IDs, datas, importação idempotente, conflitos, isolamento e arquivamento. Os testes de navegador verificam login inválido/válido, cookies, recarga, check-ins persistidos, logout, URLs diretas, origem estrangeira, planos vinculados, imagens dos exercícios, cronômetro e navegação móvel. O runner usa `tests/neon` e `tests/server-contract.test.mjs`.

`scripts/verify-vercel.mjs <URL>` permite verificar login/sessão/logout e permissões na hospedagem, usando senhas fornecidas exclusivamente por variáveis `FORJA_VERIFY_*_PASSWORD`. Não escreve treinos ou avaliações. Os arquivos temporários de cookies criados pelo próprio processo são removidos ao terminar.

Com `FORJA_VERIFY_DIRECT=1`, a verificação usa HTTPS diretamente e mantém cookies apenas na memória, sem depender da proteção de Preview da CLI.

Validação desta entrega (05/11/2026): build local e build Vercel aprovados; dois contratos e quatro fluxos em Chromium/WebKit aprovados; auditoria das dependências de produção sem vulnerabilidades reportadas. Login, cookies seguros, permissões e logout de Henrique, professor e professor2 foram verificados no endereço de produção. As telas publicadas de aluno e professor também foram verificadas em Chromium e WebKit móveis, sem gravar dados pessoais. O script de produção não importa fixtures.

## Publicação

As variáveis Neon já estão nos três ambientes e não exigem um segredo adicional de sessão. A publicação final deve incluir a API e os arquivos atuais com `vercel deploy --prod`, ou pelo fluxo Git da Vercel. Antes da importação real, abrir a versão atualizada na origem dos registros e exportar uma cópia pelo Perfil, quando disponível. A confirmação dos registros pessoais de Henrique permanece uma etapa operacional, pois os dados só estão no navegador/PWA dele.

Versão desta entrega publicada em **https://tatugym-eta.vercel.app**. A publicação não limpou nem migrou antecipadamente o armazenamento dos dispositivos. Para transferir os treinos reais, entrar como Henrique no mesmo navegador/PWA e endereço onde eles foram cadastrados. Se a origem for localhost, manter a API local ativa e entrar nessa origem primeiro; depois da confirmação os dados estarão disponíveis também na PWA publicada.
