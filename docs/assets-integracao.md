# Assets do FORJA

O aplicativo usa 30 arquivos em src/assets, importados pelo código ou pelo CSS. O Vite inclui esses arquivos no build e o service worker mantém as imagens locais no precache.

| Grupo | Arquivos | Uso |
| --- | --- | --- |
| anatomia | 3 PNGs | Grupos musculares usados no início e nas boas-vindas. |
| cards | 3 PNGs | Capas dos treinos A, B e C. |
| exercicios/execucao | 20 WebPs | Imagens dos exercícios na ficha, execução e lista de navegação. |
| interface/anilha_checkin.png | 1 PNG | Check-in semanal. |
| logo_forja_transparente.png | 1 PNG | Marca FORJA no login, cabeçalhos e rodapés. |
| papeldeparede.png | 1 PNG | Fundo das telas do aplicativo. |
| tela_login_fundo.jpg | 1 JPEG | Fundo da tela de login. |

Os ícones da instalação e do navegador ficam em public, com versões PNG para Apple Touch Icon, 192 px, 512 px e maskable, além do SVG.

As imagens dos exercícios são associadas pelo nome normalizado em src/components/ExerciseImage.tsx. Um exercício sem imagem correspondente recebe o ícone neutro. As imagens usam object-fit: contain e o filtro exercise-matte, definido em index.html, para integrar o fundo escuro à interface.

As ilustrações em uso e sua origem estão documentadas em [ilustracoes-execucao.md](ilustracoes-execucao.md). Os pacotes provisórios, protótipos e imagens anteriores sem referência foram removidos na limpeza do projeto. O histórico Git preserva as versões anteriores.

Os testes de imagens em tests/neon/exercise-images.spec.ts conferem os 20 exercícios em 320, 390 e 1440 px, incluindo carregamento, proporção e associação entre a ficha e a execução.
