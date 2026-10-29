# Meu Treino

PWA pessoal de academia para Henrique, com React, TypeScript, Vite, Tailwind CSS e ícones Lucide. Sem login, backend ou banco de dados.

## Executar

Requer Node.js 22.12+ (ou 24 LTS) e npm.

```sh
npm install
npm run dev
```

Abra http://localhost:5173. O servidor de desenvolvimento aceita conexões da rede local pelo endereço exibido no terminal.

## Produção e PWA

```sh
npm run build
npm run preview
```

Abra http://localhost:4173. O build gera `dist/`, manifest, ícones PNG e service worker com precache dos arquivos locais. Para publicar, hospede `dist/` em um servidor estático com **HTTPS**, na raiz do domínio. O service worker é habilitado no build de produção; o modo de desenvolvimento usa os arquivos diretamente.

Após o primeiro carregamento completo online, o aplicativo de produção abre e funciona sem rede. Instalação e service worker exigem HTTPS (ou localhost). Um endereço HTTP de rede local não habilita instalação no iPhone. No Safari do iPhone: Compartilhar → Adicionar à Tela de Início. Nos navegadores compatíveis, há também a opção no Perfil.

## O que está disponível

- Entrada, dashboard com saudação dinâmica e sugestão sequencial de treinos A/B/C.
- Fichas com cards e ilustrações anatômicas PNG locais, imagens dos exercícios compatíveis, grupos musculares e duração estimada. Consulte [o inventário de assets](docs/assets-integracao.md) para associações e arquivos sem uso.
- Edição de nomes, séries, repetições, cargas e descanso do plano demonstrativo.
- Execução com um exercício por vez, ilustração anatômica, edição da série atual, confirmação protegida contra toques repetidos e avanço automático. Descanso circular inicia após concluir uma série, com pausar, retomar, pular e aviso visual/som/vibração quando disponíveis. Lista permite trocar livremente de exercício. Conclusão de todas as séries salva automaticamente no histórico.
- Retomada do treino em andamento após recarregar, incluindo séries, rascunhos de carga/repetições e descanso baseado no horário real.
- Refeições por horário, alimentos e quantidades editáveis, marcação diária opcional.
- Histórico de treinos e cargas, peso por data e gráfico das últimas 14 medições. Todos os registros de peso permanecem disponíveis na lista.
- Temas claro, escuro e automático; exportação JSON e redefinição dos dados com confirmação.
- Layout mobile-first, navegação inferior fixa, suporte a safe areas e desktop.

Os exercícios e alimentos são dados demonstrativos para personalização. Não há fotos de alimentos, controle de água ou notificações ativas.

## Persistência e organização

Todos os dados ficam no `localStorage` desta origem, sob `meu-treino:v1:henrique-local`. Outras portas, domínios, navegadores ou dispositivos têm armazenamento independente. Limpar os dados do site remove os registros. A exportação JSON é uma cópia para guardar; não há importação ou sincronização nesta versão.

```text
src/
  assets/      # PNGs locais de anatomia, cards, exercícios e interface
  components/  # anatomia, imagens dos exercícios, navegação, interface e formulários
  pages/       # início, fichas, execução, dieta, progresso e perfil
  App.tsx      # navegação por hash e coordenação dos fluxos
  data.ts      # plano e refeições demonstrativos
  store.ts     # persistência local, datas e identificadores
  types.ts     # modelos TypeScript
  styles.css   # tokens visuais, temas, componentes e responsividade
public/        # ícones locais, incluindo Apple Touch Icon e maskable
```

O estado possui versão e identidade de usuário; o armazenamento é isolado por usuário. Isso prepara uma futura camada de contas e migração de dados sem implementar múltiplos usuários agora. Os registros de treino guardam uma cópia da ficha executada, preservando o histórico quando o plano é editado. Os assets preservam proporções, com PNGs originais mantidos e ilustrações de execução em WebP no precache para uso offline. O Perfil reserva um espaço para notificações futuras.

## Validação

`npm test` executa os fluxos em Chromium e WebKit com viewport móvel. `npm run build` executa a checagem estrita do TypeScript e o build de produção. Os fluxos de séries, retomada após recarregar, descanso, histórico, refeições, peso e temas foram conferidos no navegador durante a implementação.
