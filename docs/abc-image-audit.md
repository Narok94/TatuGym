# Auditoria do novo pacote provisório ABC

Os 40 PNGs extraídos substituem os anteriores nos mesmos caminhos. Todos os 20 pares foram conferidos contra os imports e os nomes dos exercícios; nenhum arquivo está ausente. A lista usa somente `_inicial.png`; a execução alterna a cada 2 segundos e oferece setas de posição, toque/clique e teclado. As setas preexistentes continuam navegando entre exercícios.

## Dimensões reais

Cada linha corresponde a dois arquivos em `src/assets/`, com sufixos `_inicial.png` e `_final.png`.

| Pasta/exercício | Inicial (px) | Final (px) |
| --- | --- | --- |
| Treino_A/crucifixo | 167 × 215 | 167 × 215 |
| Treino_A/desenvolvimento | 167 × 215 | 167 × 215 |
| Treino_A/elevacao_lateral | 189 × 215 | 189 × 215 |
| Treino_A/supino_inclinado | 167 × 215 | 167 × 215 |
| Treino_A/supino_reto | 167 × 215 | 167 × 215 |
| Treino_A/triceps_frances | 167 × 215 | 167 × 215 |
| Treino_A/triceps_polia | 167 × 215 | 167 × 215 |
| Treino_B/pulldown | 167 × 214 | 167 × 214 |
| Treino_B/puxada_frontal | 167 × 215 | 167 × 215 |
| Treino_B/remada_baixa | 167 × 215 | 167 × 215 |
| Treino_B/remada_unilateral | 189 × 215 | 189 × 215 |
| Treino_B/rosca_direta | 167 × 214 | 167 × 214 |
| Treino_B/rosca_martelo | 167 × 214 | 167 × 214 |
| Treino_C/abdominal_solo | 189 × 215 | 189 × 215 |
| Treino_C/agachamento_livre | 167 × 214 | 167 × 214 |
| Treino_C/cadeira_extensora | 167 × 215 | 167 × 215 |
| Treino_C/elevacao_pelvica | 167 × 215 | 167 × 215 |
| Treino_C/leg_press | 189 × 214 | 189 × 214 |
| Treino_C/mesa_flexora | 167 × 215 | 167 × 215 |
| Treino_C/panturrilha_em_pe | 167 × 215 | 167 × 215 |

## Arquivos que precisam de regeneração

Todos os 40 arquivos da tabela precisam de versões de maior resolução para uso definitivo: somente 167–189 × 214–215 px. A exibição provisória não amplia além das dimensões nativas em pixels CSS; em telas de alta densidade, ainda há perda de detalhe. Não foi aplicado filtro, upscale, recorte ou correção artificial.

Problemas visíveis incorporados aos recortes, nos dois arquivos de cada par abaixo, salvo indicação específica:

- `Treino_A/crucifixo_*`: personagem/equipamento cortados nas laterais e na parte inferior; fragmento de outra figura na borda esquerda.
- `Treino_A/supino_reto_*` e `supino_inclinado_*`: barra/anilhas e partes das pernas/pés chegam ao limite ou ficam fora do quadro.
- `Treino_A/desenvolvimento_inicial.png`: fragmento de outra figura na borda esquerda.
- `Treino_A/triceps_frances_*` e `triceps_polia_*`: enquadramento interrompe o corpo antes dos pés; bordas brancas do painel aparecem no arquivo.
- `Treino_B/puxada_frontal_*` e `pulldown_*`: corpo/aparelho parcialmente fora do quadro. `pulldown` mostra puxada sentada com barra, muito semelhante à outra puxada; precisa de revisão do conteúdo para corresponder ao exercício cadastrado.
- `Treino_B/remada_baixa_*`: pernas/pés fora do quadro à direita.
- `Treino_B/remada_unilateral_*`: cabeça e/ou equipamento chegam ao limite direito; fragmento de outra figura na borda esquerda.
- `Treino_C/abdominal_solo_*`: pés/pernas alcançam a borda direita e há resíduos do painel na borda esquerda.
- `Treino_C/cadeira_extensora_final.png`: extensão das pernas/equipamento cortada à direita.
- `Treino_C/elevacao_pelvica_*`: partes do corpo/equipamento fora do quadro e fragmentos de outra figura na borda esquerda.
- `Treino_C/leg_press_*`: cabeça/equipamento parcialmente fora do quadro.
- `Treino_C/mesa_flexora_*`: pés/equipamento chegam ao limite direito; bordas e fragmentos do painel à esquerda.
- `Treino_C/panturrilha_em_pe_*`: fragmento de outra figura à esquerda; não há uma plataforma de apoio claramente visível. Revisar a representação do movimento.

A resolução não permite avaliar com segurança dedos, pegadas e articulações; não se afirma deformação anatômica específica sem evidência suficiente. Regenerar os arquivos problemáticos com personagem, mãos e equipamentos completos e coerentes entre posições. Para uma área de execução de até 460 × 320 px CSS, preferir originais com aproximadamente 920 × 640 px ou mais, respeitando a proporção, para telas 2×. Não redimensionar os PNGs pequenos para simular essa resolução.

## Exibição

Cards aumentados de aproximadamente 98 para 113 px no mobile (+15,3%) e de 112 para 129 px no desktop (+15,2%), mantendo largura, textos e alinhamento. Contêineres grid usam trilhas que podem encolher para acomodar os novos recortes verticais. Imagens usam `contain`, centralização e limite ao tamanho nativo. Séries, cargas, repetições, descanso, cronômetro e dados não foram alterados.

## Validação

Build TypeScript/Vite concluído. Nove testes de imagens ABC aprovados em 320, 390 e 1440 px, incluindo proporção, limites do contêiner, tamanho nativo, altura dos cards, alternância de 2 segundos, setas de posição e navegação entre exercícios. O teste essencial existente de séries, cargas, descanso e persistência também passou. Capturas mobile e desktop inspecionadas.
