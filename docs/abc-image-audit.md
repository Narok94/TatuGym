# Auditoria das imagens ABC

Os 40 arquivos PNG precisam de versões originais em maior resolução para uma execução grande e nítida, especialmente em telas de alta densidade. A tabela identifica os pares: cada linha corresponde aos arquivos `_inicial.png` e `_final.png` da pasta indicada em `src/assets/`.

| Pasta/exercício | Inicial (px) | Final (px) |
| --- | --- | --- |
| Treino_A/crucifixo | 191 × 141 | 191 × 141 |
| Treino_A/desenvolvimento | 187 × 141 | 188 × 141 |
| Treino_A/elevacao_lateral | 259 × 127 | 260 × 127 |
| Treino_A/supino_inclinado | 188 × 141 | 189 × 141 |
| Treino_A/supino_reto | 188 × 141 | 188 × 141 |
| Treino_A/triceps_frances | 257 × 127 | 258 × 127 |
| Treino_A/triceps_polia | 238 × 127 | 239 × 127 |
| Treino_B/pulldown | 187 × 126 | 188 × 126 |
| Treino_B/puxada_frontal | 188 × 126 | 188 × 126 |
| Treino_B/remada_baixa | 188 × 126 | 189 × 126 |
| Treino_B/remada_unilateral | 191 × 126 | 191 × 126 |
| Treino_B/rosca_direta | 377 × 115 | 377 × 115 |
| Treino_B/rosca_martelo | 379 × 115 | 379 × 115 |
| Treino_C/abdominal_solo | 260 × 118 | 260 × 118 |
| Treino_C/agachamento_livre | 190 × 130 | 190 × 130 |
| Treino_C/cadeira_extensora | 191 × 130 | 191 × 130 |
| Treino_C/elevacao_pelvica | 251 × 118 | 251 × 118 |
| Treino_C/leg_press | 186 × 130 | 187 × 130 |
| Treino_C/mesa_flexora | 187 × 130 | 188 × 130 |
| Treino_C/panturrilha_em_pe | 244 × 118 | 245 × 118 |

## Diagnóstico e limite da correção

- As fontes têm somente 115–141 px de altura. O CSS anterior esticava essas imagens para preencher a área de execução; a interpolação na ampliação prejudicava a nitidez.
- `object-fit: contain` já estava presente. Há recortes incorporados aos próprios PNGs: títulos truncados em diversos arquivos, pés/pernas fora do quadro em desenvolvimento, tríceps francês, tríceps na polia e puxada frontal; enquadramento parcial do corpo em panturrilha em pé. Essa inspeção não permite determinar se são recortes intencionais ou falhas da exportação. O CSS não recupera pixels ausentes.
- PNG usa compressão sem perdas. A configuração do Vite usada aqui copia esses arquivos, sem recompressão de imagem. Não é possível inferir o histórico anterior de compressão ou redimensionamento das fontes.
- A exibição agora mantém a proporção, centraliza, reduz quando necessário e não amplia além das dimensões nativas em pixels CSS. Nas telas de alta densidade, a nitidez continua limitada pela fonte.
- A área de execução reserva espaço lateral para as setas existentes de navegação entre exercícios. Toque/clique na imagem continua alternando a posição manualmente; a alternância automática permanece em 2 segundos.

Substituir os dois arquivos de cada uma das 20 linhas por exportações originais com enquadramento completo e sem títulos cortados. Para a área atual de até 460 × 320 pixels CSS, preferir fontes com cerca de 920 × 640 pixels ou mais, conforme a proporção, para densidade 2×. Não ampliar os PNGs atuais para produzir essas versões.

## Validação

Build TypeScript/Vite concluído. Dez testes essenciais aprovados: imagens ABC em 320, 390 e 1440 px, proporção, limites do contêiner, tamanho nativo, alternância automática/manual e regressão de séries/descanso. Capturas mobile e desktop inspecionadas. Os 40 PNGs publicados no build têm os mesmos hashes SHA-256 das fontes, confirmando ausência de recompressão nessa etapa.
