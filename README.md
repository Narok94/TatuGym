# Meu Treino

PWA de academia FORJA com React, TypeScript, Vite e PostgreSQL Neon. Login real, sessões por cookie HttpOnly e persistência no servidor funcionam em desenvolvimento e na Vercel. A tela de login e a identidade visual aprovadas foram preservadas.

Consulte [a integração Neon, migrations, tabelas, preservação de dados e publicação](docs/neon-forja.md). As contas são provisionadas por script seguro; senhas não são documentadas nem fixadas no frontend.

## Executar

Requer Node.js 22.12+ (ou 24 LTS) e npm.

```sh
vercel env pull .env.development.local --environment=development
npm install
npm run dev
```

Abra http://localhost:5173. O servidor de desenvolvimento aceita conexões da rede local pelo endereço exibido no terminal.

## Produção e PWA

```sh
npm run build
npm run preview
```

Abra http://localhost:4173. O build gera `dist/`, manifest, ícones PNG e service worker com precache dos arquivos locais. Para publicar, envie o projeto completo à Vercel, incluindo `api/` e `server/`, com **HTTPS**. A API é necessária para autenticação e persistência. O service worker é habilitado no build de produção; o modo de desenvolvimento usa os arquivos diretamente.

O service worker preserva os assets para instalação como PWA e não armazena respostas da API. Login e carregamento inicial exigem rede. Alterações feitas com a tela aberta ficam em uma cópia pendente até confirmação do servidor. Para testar `npm run preview`, mantenha a API local ativa conforme [a documentação](docs/neon-forja.md).

## O que está disponível

- Entrada, dashboard com saudação dinâmica e sugestão sequencial de treinos A/B/C.
- Fichas com cards e ilustrações anatômicas PNG locais, imagens dos exercícios compatíveis, grupos musculares e duração estimada. Consulte [o inventário de assets](docs/assets-integracao.md) para associações e arquivos sem uso.
- Edição de nomes, séries, repetições, cargas e descanso do plano do aluno.
- Execução com um exercício por vez, ilustração anatômica, edição da série atual, confirmação protegida contra toques repetidos e avanço automático. Descanso circular inicia após concluir uma série, com pausar, retomar, pular e aviso visual/som/vibração quando disponíveis. Lista permite trocar livremente de exercício. Conclusão de todas as séries salva automaticamente no histórico.
- Retomada do treino em andamento após recarregar, incluindo séries, rascunhos de carga/repetições e descanso baseado no horário real.
- Refeições por horário, alimentos e quantidades editáveis, marcação diária opcional.
- Histórico de treinos e cargas, peso por data e gráfico das últimas 14 medições. Todos os registros de peso permanecem disponíveis na lista.
- Temas claro, escuro e automático; exportação JSON e redefinição dos dados com confirmação.
- Layout mobile-first, navegação inferior fixa, suporte a safe areas e desktop.

Novas contas não recebem treinos fictícios. Os registros locais anteriores são importados após autenticação, sem substituição por exemplos. Não há fotos de alimentos, controle de água ou notificações ativas.

## Persistência e organização

O Neon mantém os dados por conta. As chaves locais antigas ficam intactas como origem de migração, e alterações ainda não confirmadas têm cópia por usuário. Nenhum armazenamento é limpo durante a migração. Veja [o procedimento e o plano para conflitos](docs/neon-forja.md#preservação-e-migração-local).

```text
src/
  assets/      # PNGs locais de anatomia, cards, exercícios e interface
  components/  # anatomia, imagens dos exercícios, navegação, interface e formulários
  pages/       # início, fichas, execução, dieta, progresso e perfil
  App.tsx      # navegação por hash e coordenação dos fluxos
  data.ts      # plano e refeições demonstrativos
  store.ts     # estado sincronizado, datas e identificadores
  types.ts     # modelos TypeScript
  styles.css   # tokens visuais, temas, componentes e responsividade
public/        # ícones locais, incluindo Apple Touch Icon e maskable
```

O estado completo e as cópias históricas são preservados no servidor. A API valida permissões em todas as operações, e cada professor acessa somente seus alunos vinculados. Recuperação de senha e emissão de credenciais para novos cadastros de alunos continuam indisponíveis.

## Validação

`npm test` cria um schema Neon isolado e executa contratos de persistência e fluxos reais em Chromium e WebKit com viewport móvel. As tabelas de usuários reais não recebem fixtures. `npm run build` executa a checagem estrita do TypeScript e o build de produção. Os fluxos de séries, retomada após recarregar, descanso, histórico, refeições, peso e temas foram conferidos no navegador durante a implementação.
