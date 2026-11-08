# Biblioteca de exercícios FORJA

O painel do professor oferece 100 exercícios iniciais: 10 de cada grupo — Peito, Costas, Ombros, Bíceps, Tríceps, Quadríceps, Posteriores de coxa, Glúteos, Panturrilhas e Abdômen. São movimentos comuns e suas variações; a lista não representa um ranking estatístico.

Em **Biblioteca de exercícios**, o professor pode buscar por nome ou equipamento, filtrar por grupo e personalizar os registros da sua conta. Em **Treinos → Criar treino**, cada exercício pode ser selecionado dessa biblioteca, com prévia da imagem, orientações e alvo padrão. Pranchas usam segundos; os demais movimentos usam repetições. Séries, carga e descanso continuam ajustáveis.

O catálogo-base está em `shared/exercise-catalog.json`; as 100 imagens estão em `public/exercises`. As 20 imagens anteriores foram preservadas byte a byte e 80 novas ilustrações foram geradas com imagegen integrado, mantendo o estilo anatômico em cinza e destaque laranja. Não há dependência de hospedagem externa para essas imagens.

A leitura do catálogo não grava dados no banco. Edições e exclusões são particulares de cada professor. O plano recebe uma cópia da imagem e da unidade escolhidas; remover um item da biblioteca não apaga os exercícios nem suas imagens dos planos já salvos. Nenhuma migração ou limpeza de dados existentes é necessária para disponibilizar a biblioteca.

`npm run verify:catalog` confere 100 IDs e nomes distintos, 10 entradas por grupo, metadados obrigatórios, formato WebP e 100 arquivos de imagem diferentes. Essa validação também faz parte de `npm run build`. Os testes de contrato e de navegador verificam isolamento entre professores, preservação dos planos e a imagem recebida pelo aluno.

Referências usadas para escolher movimentos comuns: [ACE Exercise Library](https://www.acefitness.org/resources/everyone/exercise-library/), [NASM Exercise Guidance](https://www.nasm.org/workout-exercise-guidance) e [Keele Exercise Library](https://www.keele.ac.uk/sportatkeele/activekeele/exerciselibrary/).
