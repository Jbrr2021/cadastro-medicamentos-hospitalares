# Cadastro de Medicamentos Hospitalares

Este projeto é uma aplicação simples em HTML, CSS e JavaScript para cadastrar medicamentos hospitalares.

## O que foi feito

- **Validação de formulário melhorada**
  - Campos obrigatórios marcados com `required`
  - Validação nativa do navegador ativada
  - `quantidade` passa a aceitar apenas valores maiores que 0
  - `codigo` e `lote` usam `pattern` para permitir apenas letras, números e hífen

- **Acessibilidade e usabilidade**
  - `role="status"` e `aria-live="polite"` para feedback de mensagens
  - Estrutura semântica com `<main>` e seções identificadas por `aria-labelledby`
  - Botão de limpar formulário preserva o comportamento esperado

- **Persistência local**
  - Os medicamentos cadastrados são salvos em `localStorage`
  - Os dados permanecem após recarregar a página

- **Resumo e lista de registros**
  - Exibição do último medicamento cadastrado no painel de resumo
  - Tabela com todos os medicamentos cadastrados
  - Botões de edição e exclusão para registros individuais

- **Campos adicionais adicionados**
  - `Data de fabricação` para registrar quando o medicamento foi produzido
  - `Número da nota fiscal` para controle documental

- **Organização de arquivos**
  - CSS separado em `styles.css`
  - JavaScript separado em `script.js`

## Como usar

1. Abra `index.html` em um navegador ou execute um servidor local na pasta do projeto.
2. Preencha os campos do formulário.
3. Clique em `Cadastrar medicamento`.
4. O cadastro será salvo e exibido na lista abaixo.

## Arquivos do projeto

- `index.html` - estrutura da página e formulário
- `styles.css` - estilos visuais e responsivos
- `script.js` - lógica de validação, persistência e renderização de dados

## GitHub

Repositório remoto: https://github.com/Jbrr2021/cadastro-medicamentos-hospitalares

## Como contribuir

1. Faça um fork do repositório no GitHub.
2. Clone seu fork localmente.
3. Crie uma branch para a melhoria: `git checkout -b minha-melhoria`.
4. Faça suas alterações em `index.html`, `styles.css` ou `script.js`.
5. Teste localmente abrindo `index.html` ou usando um servidor local.
6. Adicione e commit suas mudanças:
   - `git add .`
   - `git commit -m "Descrição da melhoria"`
7. Envie para seu fork: `git push origin minha-melhoria`.
8. Abra um pull request no repositório original.

## Próximas melhorias

- Implementar busca e filtro por nome, código ou setor.
- Criar um controle de estoque por validade e alerta de produtos vencidos.
- Salvar registros em backend ou banco de dados em vez de `localStorage`.
- Melhorar o design visual com tema escuro ou animações sutis.
- Adicionar validação extra para número de nota fiscal e lote.
