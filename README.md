# Cadastro de Medicamentos Hospitalares

Projeto finalizado em HTML, CSS e JavaScript puro, sem frameworks, bibliotecas externas ou backend.

## Descrição

Uma aplicação web profissional para gerenciar o cadastro de medicamentos hospitalares com interface moderna, filtros, ordenação, edição, exclusão e persistência no navegador.

## Funcionalidades implementadas

- Cadastro de medicamentos com campos completos:
  - Nome
  - Código
  - Lote
  - Fabricante
  - Data de fabricação
  - Validade
  - Quantidade
  - Unidade
  - Setor responsável
  - Fornecedor
  - Preço unitário
  - Nota fiscal
  - Observações
  - Categoria
- Validação de formulário com campos obrigatórios e `required`.
- Cálculo automático de valor total no formulário.
- Persistência usando `localStorage` com chave `medicamentosHospitalares`.
- Interface responsiva e acessível com painel lateral, dashboard e filtros.
- Busca em tempo real com debounce.
- Filtros por setor, unidade, itens vencidos e vencimento próximo.
- Ordenação por nome, quantidade, validade e fabricação.
- Tabela de listagem com edição e exclusão de registros.
- Modal de confirmação personalizado para exclusão.
- Painel de resumo com o último cadastro exibido.
- Dashboard com contagem total, próximos a vencer, vencidos, estoque e valor total.
- Seed de demonstração via query string `?seed=1`.
- Auto-test de contagem via query string `?autotest=1`.

## Como usar

1. Abra `index.html` no navegador.
2. Preencha o formulário e clique em `Cadastrar medicamento`.
3. Use a busca, filtros e ordenação para encontrar dados.
4. Edite ou exclua registros usando os botões na tabela.

### Testes rápidos

- `file:///C:/Users/User/Desktop/cadastro-medicamentos/index.html?seed=1`
  - Insere dados de demonstração para ver a lista pronta.
- `file:///C:/Users/User/Desktop/cadastro-medicamentos/index.html?autotest=1`
  - Executa validações simples e mostra um resumo de teste.

## Arquivos principais

- `index.html` - estrutura da página, formulário e modal.
- `styles.css` - tema visual, layout responsivo e estilos da tabela.
- `script.js` - lógica de formulário, persistência, filtros, ordenação, dashboard e modal.

## Observações

- Não utiliza React, Bootstrap, Tailwind, Node, PHP ou banco de dados externo.
- Todos os dados são armazenados localmente no navegador.
- O projeto foi aprimorado para parecer uma pequena aplicação web profissional.

## Como ver no navegador

- Sem dados: `file:///C:/Users/User/Desktop/cadastro-medicamentos/index.html`
- Com dados de demo: `file:///C:/Users/User/Desktop/cadastro-medicamentos/index.html?seed=1`

## Possíveis melhorias futuras

- Exportar/importar registros em CSV.
- Mostrar avisos automáticos para lotes próximos ao vencimento.
- Adicionar filtros combinados avançados (por categoria, fornecedor e setor).
- Melhorar acessibilidade com navegação por teclado completa.
