# Ambiente do professor — desenvolvimento local

## Acesso e limites desta versão

Execute `npm run dev` e abra `http://localhost:5173/#professor` (use a porta exibida pelo Vite).

| Usuário | Senha | Perfil |
| --- | --- | --- |
| professor | 123 | PROFESSOR, espaço local 1 |
| professor2 | 123 | PROFESSOR, espaço local 2 |

O segundo usuário permite verificar o isolamento dos registros. Credenciais e sessão são **simuladas**, sem servidor, e não representam autenticação segura. Os módulos do professor são carregados apenas quando `import.meta.env.DEV` é verdadeiro. `npm run build` e `npm run preview` não disponibilizam esse acesso nem incluem suas credenciais ou interface.

O aplicativo do aluno continua sendo o mesmo `App.tsx`, com seu armazenamento preservado. No menu do professor, **Ambiente do aluno** encerra a sessão de teste e retorna ao ambiente existente. Não foi implementado login real para os alunos cadastrados: as contas locais possuem identificador, perfil ALUNO e professor responsável, mas convites, credenciais e associação ao portal autenticado dependem da futura integração.

Não foram encontrados protótipos específicos do professor neste checkout. A interface foi construída com a identidade e as referências disponíveis: papel de parede, paleta, componentes, ilustração anatômica e padrões do aplicativo. A comparação com protótipos específicos permanece dependente do fornecimento dessas referências.

## Etapas implementadas e como validar

| Etapa | Implementação e teste manual | Principais arquivos |
| --- | --- | --- |
| 1. Perfil e dashboard | Entrar com professor/123; conferir indicadores, gráfico, atividades, menu lateral desktop e menu mobile. Recarregar preserva a sessão da aba. Sair volta ao login. | `src/main.tsx`, `src/teacher/DevelopmentRoot.tsx`, `devAuth.ts`, `models.ts`, `repository.ts`, `TeacherApp.tsx`, `Charts.tsx`, `metrics.ts`, `teacher.css` |
| 2. Alunos | Cadastrar nome/e-mail, editar dados, buscar, filtrar, inativar e excluir com confirmação. Entrar como professor2: não deve listar os alunos do primeiro professor nem aceitar o mesmo e-mail para outro vínculo. | `src/teacher/Forms.tsx`, `Pages.tsx`, `repository.ts`, `TeacherApp.tsx` |
| 3. Treinos | Criar um modelo ou vincular um treino a um aluno; adicionar, remover e reordenar exercícios; salvar, editar, duplicar e excluir. Séries, repetições, carga e descanso são editáveis. | `src/teacher/Forms.tsx`, `Pages.tsx`, `repository.ts`, `TeacherApp.tsx` |
| 4. Avaliações e evolução | Registrar pelo menos duas avaliações com datas distintas; editar/excluir uma medição; conferir peso, cintura e gordura no gráfico do aluno. Campos opcionais vazios não viram zero. | `src/teacher/Forms.tsx`, `Pages.tsx`, `Charts.tsx`, `metrics.ts`, `repository.ts` |
| 5. Relatórios e biblioteca | Filtrar relatórios por aluno/período e exportar CSV ou imprimir. Cadastrar um exercício na biblioteca, reutilizá-lo em um plano e editar/excluir. Excluir da biblioteca preserva as cópias nos planos. Configurações salva o perfil e exporta uma cópia JSON apenas deste professor. | `src/teacher/Forms.tsx`, `Pages.tsx`, `metrics.ts`, `repository.ts`, `TeacherApp.tsx` |

Os testes automatizados estão em `tests/teacher.spec.ts`. A regressão do aluno permanece em `tests/workout.spec.ts`, `tests/checkin.spec.ts` e `tests/persistence.spec.ts`.

Arquivos de integração e entrega: `src/main.tsx`, `package.json`, `scripts/verify-teacher-production.mjs`, `README.md`, este documento e `tests/teacher.spec.ts`. Os demais arquivos novos ficam em `src/teacher/`; nenhum arquivo de imagem ou funcionalidade interna do aluno foi substituído.

## Persistência provisória e dados demonstrativos

- Os cadastros são salvos em `localStorage`, na chave exclusiva `tatugym:dev:teacher-workspace:v1`. A sessão de teste usa `sessionStorage` (`tatugym:dev:teacher-session:v1`).
- Os dados originais do aluno em `meu-treino:v1:henrique-local` e o check-in não são migrados, apagados ou usados como dados dos professores.
- Cada registro possui `teacherId`. Os repositórios filtram as leituras e verificam propriedade antes de editar, excluir ou vincular registros. A unicidade do e-mail dos alunos impede vínculo simultâneo a dois professores neste armazenamento local.
- Essa separação permite testar regras de negócio, mas **não impede manipulação pelo usuário do navegador**. O controle de acesso real deverá existir no servidor.
- Outros navegadores, dispositivos, portas e domínios possuem dados separados. Não existe sincronização. Limpar o armazenamento remove os cadastros. Use **Configurações → Exportar meus dados** para guardar uma cópia.
- A base inicia vazia. **Carregar demonstração** é opcional e só funciona em um espaço sem alunos, treinos ou avaliações. Cria dois alunos fictícios, um treino de exemplo e três medições. A biblioteca permanece vazia.
- Nenhuma imagem foi gerada. A biblioteca aceita uma URL HTTP/HTTPS opcional para uma imagem real e apresenta um símbolo neutro quando não há imagem ou ela não carrega. Upload/hospedagem ficam para a integração futura.
- Indicadores, atividades e gráficos são derivados dos cadastros locais; não simulam presença nem conclusão de treinos do aluno. Os relatórios não afirmam sincronização com o aplicativo do aluno.
- Dados locais inválidos e falhas de gravação geram erro; o repositório não substitui silenciosamente o conteúdo existente.

## Preparação para backend

`TeacherRepository` em `models.ts` define as operações de leitura e CRUD. `repository.ts` é o adaptador local e concentra validação, propriedade, vínculos e persistência; as telas não escrevem diretamente no armazenamento. `metrics.ts` concentra cálculos e exportação de relatórios. Para integração, substituir o adaptador por serviços de API e uma identidade autenticada. As operações locais síncronas precisarão se tornar assíncronas, com estados de carregamento e tratamento de falhas da API; os modelos e as telas poderão ser reaproveitados.

Permanecem pendentes: autenticação e autorização no servidor, cadastro e credenciais reais, convites e acesso individual dos alunos, banco de dados, migração dos dados locais, sincronização, upload de imagens, publicação do ambiente autenticado e comparação com os protótipos específicos.

## Validação

```sh
npm test -- --grep teacher
npm test
npm run build
npm run verify:teacher-production
```

Além dos testes em Chromium e WebKit, conferir o dashboard em desktop e celular. O acesso de desenvolvimento não exige qualquer alteração em banco de dados ou configuração de credenciais de produção.
