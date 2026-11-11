# Biblioteca de exercícios FORJA

O painel do professor oferece 100 exercícios iniciais: 10 de cada grupo — Peito, Costas, Ombros, Bíceps, Tríceps, Quadríceps, Posteriores de coxa, Glúteos, Panturrilhas e Abdômen. São movimentos comuns e suas variações; a lista não representa um ranking estatístico.

A versão 1.2.1 amplia esse catálogo para 105 exercícios e 12 grupos. Inclui cadeira adutora (Adutores), rosca direta com barra W, stiff com halteres, búlgaro sem carga e encolhimento com halteres (Trapézio), cada um com imagem própria. As orientações do professor podem ser consultadas no roteiro e durante a execução do aluno.

Em **Biblioteca de exercícios**, o professor pode buscar por nome ou equipamento, filtrar por grupo e personalizar os registros da sua conta. Em **Treinos → Criar treino**, cada exercício pode ser selecionado dessa biblioteca, com prévia da imagem, orientações e alvo padrão. Pranchas usam segundos; os demais movimentos usam repetições. Séries, carga e descanso continuam ajustáveis.

O catálogo-base está em `shared/exercise-catalog.json`; as 105 imagens estão em `public/exercises`. As 100 imagens anteriores foram preservadas e as cinco novas ilustrações foram geradas com imagegen integrado, mantendo o estilo anatômico em cinza e destaque laranja. Não há dependência de hospedagem externa para essas imagens.

A leitura do catálogo não grava dados no banco. Edições e exclusões são particulares de cada professor. O plano recebe uma cópia da imagem e da unidade escolhidas; remover um item da biblioteca não apaga os exercícios nem suas imagens dos planos já salvos. Nenhuma migração ou limpeza de dados existentes é necessária para disponibilizar a biblioteca.

`npm run verify:catalog` confere IDs e nomes distintos, pelo menos 10 entradas em cada grupo original, metadados obrigatórios, formato WebP e uma imagem diferente para cada exercício. Permite novos grupos sem reduzir o catálogo original. Essa validação também faz parte de `npm run build`. Os testes de contrato e de navegador verificam isolamento entre professores, preservação dos planos, imagens e orientações recebidas pelo aluno.

Referências usadas para escolher movimentos comuns: [ACE Exercise Library](https://www.acefitness.org/resources/everyone/exercise-library/), [NASM Exercise Guidance](https://www.nasm.org/workout-exercise-guidance) e [Keele Exercise Library](https://www.keele.ac.uk/sportatkeele/activekeele/exerciselibrary/).
