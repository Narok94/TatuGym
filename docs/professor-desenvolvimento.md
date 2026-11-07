# Ambiente do professor

O painel usa autenticação real e PostgreSQL Neon em todos os ambientes. A documentação de configuração, tabelas, preservação dos registros locais, permissões e testes está em [neon-forja.md](neon-forja.md).

A interface existente foi mantida. O repositório do professor agora chama a API autenticada; não usa senhas ou sessão simuladas. Alunos, treinos, biblioteca, avaliações, gráficos, relatórios e perfil usam os dados da conta. Excluir treinos ou avaliações os arquiva; excluir aluno o inativa e preserva os registros. Excluir exercício da biblioteca preserva as instruções copiadas nos planos.

O botão Sair revoga a sessão no servidor e retorna ao login. O vínculo entre professor e aluno é validado no servidor em todas as operações. Professor2 mantém um espaço separado. A demonstração local deixou de inserir dados no aplicativo real; fixtures ficam somente no schema de testes.

Os cadastros novos de alunos ainda não emitem credenciais de acesso automaticamente. Recuperação de senha continua indisponível. Nenhuma senha deve ser registrada neste documento.
