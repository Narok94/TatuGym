# Acesso dos alunos

Em **Alunos → Cadastrar aluno**, o professor define o perfil, um login único e uma senha temporária. A opção de criar acesso vem marcada; também é possível habilitá-la ao editar um perfil que ainda não tem conta.

O botão **Gerar senha temporária** usa o gerador criptográfico do navegador. **Copiar acesso** copia o login e a senha para que o professor os entregue ao aluno após salvar. A senha temporária deve ser copiada ou anotada antes de salvar: ela não aparece nas consultas seguintes. As credenciais nunca são incluídas no perfil, nas atividades ou nas exportações do professor.

Ao entrar, o aluno precisa confirmar a senha temporária e escolher uma senha diferente, com pelo menos 6 caracteres. Somente após essa troca os treinos ficam disponíveis. Alterar a rota, recarregar a página ou chamar a API diretamente não contorna a exigência. A senha própria do aluno não pode ser consultada pelo professor.

Para redefinir, entre em **Alunos → Editar → Acesso ao aplicativo → Definir nova senha temporária**. A conta permanece vinculada ao mesmo perfil; os dados, o histórico e os planos atribuídos são preservados. As sessões antigas são revogadas ao redefinir a senha. A troca pelo aluno também revoga as demais sessões e cria uma nova sessão para o acesso atual.

As senhas novas usam de 6 a 128 caracteres, permitem espaços e são armazenadas com o scrypt já usado no projeto. O mínimo de 6 caracteres é a política definida para o aplicativo. A renovação de sessão mantém o comportamento descrito acima. Não há exigência de trocar periodicamente a senha própria.

## Implantação

A migration `002_student_credentials.sql` apenas adiciona `must_change_password` à tabela de usuários, com valor padrão falso para contas existentes. Deve ser aplicada com `npm run db:migrate` antes de publicar o novo código. Ela não reescreve senhas nem dados dos alunos. O estado anterior do código foi preservado na branch local `backup/antes-acesso-alunos-c1897fd`.

As migrations SQL usam finais de linha LF para preservar os checksums entre Windows e Vercel.

Os testes usam schemas isolados: criação e vínculo de credenciais, rejeição de login duplicado, isolamento entre professores, ausência de senhas em consultas, primeiro acesso obrigatório, renovação/revogação de sessões e preservação dos registros após redefinição.
