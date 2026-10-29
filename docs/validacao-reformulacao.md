# Validação da reformulação

- 12 verificações automatizadas aprovadas em Chromium e WebKit com emulação de iPhone 13.
- Dashboard sem sol, acesso rápido ou progresso do dia; próxima refeição mantida.
- Cards A/B/C apenas com imagens, sem duplicação de texto. Miniaturas carregadas para os 20 movimentos cadastrados.
- Registro de carga/repetições por série; toques repetidos sem duplicação; navegação livre, rascunhos e retomada após recarregar.
- Descanso inicialmente zerado; início por confirmação, pausa, retomada, pulo e término com aviso visual. Chamada de vibração verificada por instrumentação. Sinal de áudio verificado no Chromium; o WebKit deste ambiente não disponibiliza AudioContext, validando a alternativa visual.
- Treino A inteiro: 22 séries registradas uma única vez, histórico persistido; ficha, perfil e alimentação mantidos.
- Área segura superior simulada em 59 px; controles acima da navegação inferior em 320×568, 375×667 e 390×844. Sem rolagem horizontal.
- Revisão visual das 20 novas ilustrações e da execução, com capturas em `execution-chromium-mobile.png` e `execution-webkit-mobile.png`.
- Build TypeScript/Vite/PWA aprovado; 42 entradas em precache incluindo WebP.

Limites: sem iPhone físico disponível. Instalação real do PWA, vibração física e reprodução audível no iOS precisam de conferência no dispositivo. Alertas usam as capacidades do navegador enquanto o app está ativo; não foram implementadas notificações de alimentação nem alarmes em segundo plano.

Reprodução: `npm ci`, `npx playwright install chromium webkit`, `npm test`, `npm run build`.
