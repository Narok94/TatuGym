# Integração de assets locais

34 PNGs inspecionados visualmente: 16 utilizados e 18 sem uso. Arquivos originais preservados, com canal alpha e sem conversão, recorte ou geração de novas imagens. Importações estáticas pelo Vite; apenas assets utilizados entram no bundle e no precache existente do Workbox.

## Utilizados

| Arquivo em `src/assets/` | Aplicação |
| --- | --- |
| `anatomia/peito_ombros_triceps.png` | Grupo de peito, ombros e tríceps: início, boas-vindas e detalhes do treino A. |
| `anatomia/costas_biceps.png` | Grupo de costas e bíceps: início e detalhes do treino B. |
| `anatomia/pernas.png` | Grupo de pernas: início e detalhes do treino C. |
| `cards/treino_a.png` | Card do treino A, inteiro, sem texto sobreposto. |
| `cards/treino_b.png` | Card do treino B, inteiro, sem texto sobreposto. |
| `cards/treino_c.png` | Card do treino C, inteiro, sem texto sobreposto. |
| `exercicios/supino_barra.png` | Supino reto. |
| `exercicios/desenvolvimento.png` | Desenvolvimento. |
| `exercicios/elevacao_lateral.png` | Elevação lateral. |
| `exercicios/triceps_polia.png` | Tríceps na polia. |
| `exercicios/puxada_alta.png` | Puxada frontal. |
| `exercicios/rosca_direta.png` | Rosca direta. |
| `exercicios/leg_press.png` | Leg press. |
| `exercicios/cadeira_extensora.png` | Cadeira extensora. |
| `exercicios/mesa_flexora.png` | Mesa flexora. |
| `interface/botao_laranja.png` | Botão funcional Iniciar treino nos detalhes; nome acessível no botão, sem duplicar o texto embutido. |

As nove imagens de exercícios aparecem na lista do treino e na sessão ativa, inclusive no celular. Associação pelo nome atual normalizado, sem depender de IDs que possam continuar iguais após renomear um exercício. Exercícios sem imagem compatível mantêm o ícone neutro. Nenhum cadastro foi alterado.

## Sem uso

| Arquivo em `src/assets/` | Motivo |
| --- | --- |
| `anatomia/braco.png` | Recorte lateral de braço/tronco com fragmento na margem; sem componente específico adequado. |
| `anatomia/ombro_lateral.png` | Detalhe lateral do deltoide; sem componente isolado de grupo muscular. |
| `anatomia/ombro_posterior.png` | Detalhe posterior do deltoide com fragmento na margem; sem componente específico. |
| `anatomia/quadriceps.png` | Detalhe da coxa/quadríceps; a visão de pernas já representa o grupo no treino C. |
| `exercicios/abdominal_polia.png` | Abdominal ajoelhado no cabo; o cadastro usa abdominal no solo. |
| `exercicios/crucifixo_inverso.png` | Abertura posterior em máquina; crucifixo cadastrado não é inverso. |
| `exercicios/panturrilha_leg_press.png` | Apesar do nome, mostra remada sentada em máquina; também não corresponde à panturrilha em pé cadastrada. |
| `exercicios/puxada_unilateral.png` | Puxada vertical unilateral no cabo; não corresponde à remada unilateral cadastrada. |
| `exercicios/remada_maquina.png` | Remada sentada em máquina com apoio; não representa com fidelidade remada baixa ou unilateral do cadastro. |
| `exercicios/rosca_martelo.png` | Mostra flexão de cotovelos no cabo; não representa claramente a rosca martelo cadastrada. |
| `exercicios/supino_halteres.png` | Supino em banco horizontal; não corresponde ao supino inclinado cadastrado. |
| `exercicios/terra_romeno.png` | Movimento de terra romeno; não há exercício correspondente cadastrado. |
| `exercicios/triceps_corda.png` | Extensão no cabo com corda; sem cadastro específico, já há imagem correspondente ao tríceps na polia; não corresponde ao tríceps francês. |
| `interface/botao_claro.png` | Variante clara com texto embutido; preservados os demais botões e o contraste do tema. |
| `interface/botao_escuro.png` | Variante escura com texto embutido; preservados os demais botões e o contraste do tema. |
| `interface/cronometro.png` | Contém tempo 01:30 e anel estáticos; incompatível com contagem e progresso dinâmicos. |
| `interface/icones_navegacao.png` | Faixa de sete ícones com estados/cores fixos; navegação atual tem quatro itens e estados dinâmicos. |
| `interface/icones_refeicoes.png` | Faixa de cinco ícones em blocos; sem correspondência individual segura aos componentes atuais. |

## Textos incorporados aos cards

Os cards contêm títulos, grupos, quantidades, durações e ícone de play. São exibidos integralmente com `object-fit: contain`, sem sobrepor texto ou botões. O card inteiro continua abrindo os detalhes, como antes. Os dados atuais aparecem abaixo da arte, em área separada. O treino B impresso informa 7 exercícios/~50 min e posterior de ombro; o cadastro tem 6 exercícios/45 min e grupos Costas/Bíceps. O treino C impresso informa ~50 min e Pernas/Abdômen; o cadastro tem 55 min e Pernas/Glúteos/Core. As diferenças pertencem aos PNGs fornecidos e foram preservadas sem alterar dados ou imagens.

## Validação

- `npm run build`: TypeScript e build de produção aprovados.
- PWA gerado: 31 entradas de precache; os 16 PNGs utilizados constam no build e no cache.
- Navegador Edge via Playwright, contexto de teste separado: início, treinos e detalhes A/B/C em 320, 375, 760, 1000 e 1440 px; imagens decodificadas e sem rolagem horizontal.
- Sessão de treino em desktop e celular; recarga offline e navegação offline pelas telas.
- Todos os 16 PNGs decodificados com rede desativada, inclusive antes de visitar telas específicas. Zero erros JavaScript.
- Inspeção visual das telas renderizadas em celular e desktop. O offline exige uma primeira visita online para instalar o service worker e completar o precache.
