/**
 * Aplicação de Cadastro de Medicamentos Hospitalares
 * 
 * Gerencia o cadastro, edição e exclusão de medicamentos com persistência em localStorage.
 * Utiliza validação nativa do navegador e renderização dinâmica de tabelas.
 */

// ==================== CONSTANTES ====================

const STORAGE_KEY = 'medicamentosHospitalares';
const TIMEOUT_MENSAGEM = 4500; // ms
const VALOR_PADRAO = 'Não informado';

// Mensagens reutilizáveis
const MENSAGENS = {
  PREENCHIMENTO_OBRIGATORIO: 'Preencha corretamente os campos obrigatórios.',
  CADASTRO_SUCESSO: 'Medicamento cadastrado com sucesso!',
  ATUALIZACAO_SUCESSO: 'Medicamento atualizado com sucesso!',
  EXCLUSAO_SUCESSO: 'Medicamento excluído com sucesso.',
  EDICAO_ATIVA: 'Modo de edição ativado. Faça suas alterações e salve.',
  EDICAO_CANCELADA: 'Edição cancelada.',
  REGISTRO_NAO_ENCONTRADO: 'Registro não encontrado.',
  EXCLUIR_CONFIRMACAO: 'Tem certeza que deseja excluir este medicamento?',
  NENHUM_MEDICAMENTO: 'Nenhum medicamento cadastrado ainda.'
};

const TEXTOS_BOTAO = {
  CADASTRAR: 'Cadastrar medicamento',
  SALVAR: 'Salvar alterações'
};

// ==================== ELEMENTOS DO DOM ====================

/**
 * Cache de elementos do DOM para evitar múltiplas buscas
 */
const elementos = {
  // Formulário
  form: document.getElementById('formMedicamento'),
  msgFeedback: document.getElementById('mensagem'),
  btnCancelar: document.getElementById('btnCancelar'),
  
  // Resumo
  resumo: {
    nome: document.getElementById('resumoNome'),
    codigo: document.getElementById('resumoCodigo'),
    lote: document.getElementById('resumoLote'),
    fabricacao: document.getElementById('resumoFabricacao'),
    validade: document.getElementById('resumoValidade'),
    quantidade: document.getElementById('resumoQuantidade'),
    setor: document.getElementById('resumoSetor'),
    notaFiscal: document.getElementById('resumoNotaFiscal')
  },
  
  // Lista
  listaContainer: document.getElementById('listaContainer')
};

// ==================== ESTADO DA APLICAÇÃO ====================

/**
 * Estado global da aplicação
 */
let estado = {
  editandoId: null,
  timeoutMensagem: null
};

// ==================== INICIALIZAÇÃO ====================

/**
 * Inicializa a aplicação quando o DOM está pronto
 */
document.addEventListener('DOMContentLoaded', () => {
  inicializar();
});

/**
 * Realiza as inicializações necessárias
 */
function inicializar() {
  definirDataMinimaValidade();
  renderizarResumo();
  renderizarLista();
  configurarEventListeners();
}

/**
 * Configura os listeners de eventos
 */
function configurarEventListeners() {
  elementos.form.addEventListener('submit', handleSubmitFormulario);
  elementos.listaContainer.addEventListener('click', handleCliqueTabela);
}

// ==================== MANIPULAÇÃO DE FORMULÁRIO ====================

/**
 * Handler para o submit do formulário de cadastro/edição
 * @param {Event} evento - Evento do formulário
 */
function handleSubmitFormulario(evento) {
  evento.preventDefault();

  // Validação nativa do navegador
  if (!elementos.form.checkValidity()) {
    elementos.form.reportValidity();
    exibirMensagem(MENSAGENS.PREENCHIMENTO_OBRIGATORIO, 'erro');
    return;
  }

  // Coleta os dados do formulário
  const dadosMedicamento = coletarDadosFormulario();
  const medicamentos = carregarMedicamentos();

  // Verifica se está em modo de edição
  if (estado.editandoId) {
    atualizarMedicamento(dadosMedicamento, medicamentos);
  } else {
    criarNovoMedicamento(dadosMedicamento, medicamentos);
  }
}

/**
 * Coleta os dados do formulário em um objeto
 * @returns {Object} Objeto com os dados do medicamento
 */
function coletarDadosFormulario() {
  return {
    id: Date.now().toString(),
    nome: obterValorCampo('nome'),
    codigo: obterValorCampo('codigo'),
    lote: obterValorCampo('lote'),
    fabricante: obterValorCampo('fabricante'),
    fabricacao: obterValorCampo('fabricacao'),
    validade: obterValorCampo('validade'),
    quantidade: obterValorCampo('quantidade'),
    unidade: obterValorCampo('unidade'),
    setor: obterValorCampo('setor'),
    notaFiscal: obterValorCampo('notaFiscal'),
    observacoes: obterValorCampo('observacoes')
  };
}

/**
 * Obtém e trata o valor de um campo do formulário
 * @param {string} idCampo - ID do campo
 * @returns {string} Valor trimado do campo
 */
function obterValorCampo(idCampo) {
  const campo = document.getElementById(idCampo);
  return campo ? campo.value.trim() : '';
}

/**
 * Cria um novo medicamento
 * @param {Object} dadosMedicamento - Dados do medicamento
 * @param {Array} medicamentos - Lista atual de medicamentos
 */
function criarNovoMedicamento(dadosMedicamento, medicamentos) {
  medicamentos.unshift(dadosMedicamento);
  salvarMedicamentos(medicamentos);

  exibirMensagem(MENSAGENS.CADASTRO_SUCESSO, 'sucesso');
  atualizarResumo(dadosMedicamento);
  renderizarLista();
  limparFormulario();
}

/**
 * Atualiza um medicamento existente
 * @param {Object} dadosMedicamento - Dados do medicamento
 * @param {Array} medicamentos - Lista atual de medicamentos
 */
function atualizarMedicamento(dadosMedicamento, medicamentos) {
  const index = medicamentos.findIndex((item) => item.id === estado.editandoId);

  if (index === -1) {
    exibirMensagem(MENSAGENS.REGISTRO_NAO_ENCONTRADO, 'erro');
    return;
  }

  medicamentos[index] = { ...dadosMedicamento, id: estado.editandoId };
  salvarMedicamentos(medicamentos);

  exibirMensagem(MENSAGENS.ATUALIZACAO_SUCESSO, 'sucesso');
  atualizarResumo(medicamentos[index]);
  renderizarLista();
  finalizarEdicao();
  limparFormulario();
}

// ==================== PERSISTÊNCIA DE DADOS ====================

/**
 * Carrega medicamentos do localStorage
 * @returns {Array} Lista de medicamentos armazenados
 */
function carregarMedicamentos() {
  try {
    const registros = localStorage.getItem(STORAGE_KEY);
    return registros ? JSON.parse(registros) : [];
  } catch (erro) {
    console.error('Erro ao carregar medicamentos:', erro);
    return [];
  }
}

/**
 * Salva medicamentos no localStorage
 * @param {Array} medicamentos - Lista de medicamentos a salvar
 */
function salvarMedicamentos(medicamentos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(medicamentos));
  } catch (erro) {
    console.error('Erro ao salvar medicamentos:', erro);
    exibirMensagem('Erro ao salvar dados. Verifique o espaço disponível.', 'erro');
  }
}

// ==================== INTERFACE DE USUÁRIO ====================

/**
 * Exibe mensagem de feedback ao usuário
 * @param {string} texto - Texto da mensagem
 * @param {string} tipo - Tipo da mensagem ('sucesso' ou 'erro')
 */
function exibirMensagem(texto, tipo) {
  elementos.msgFeedback.className = `mensagem ${tipo}`;
  elementos.msgFeedback.textContent = texto;

  // Limpa timeout anterior
  if (estado.timeoutMensagem) {
    clearTimeout(estado.timeoutMensagem);
  }

  // Define novo timeout para limpar mensagem
  estado.timeoutMensagem = setTimeout(() => {
    elementos.msgFeedback.className = 'mensagem';
    elementos.msgFeedback.textContent = '';
  }, TIMEOUT_MENSAGEM);
}

/**
 * Atualiza o painel de resumo com dados do medicamento
 * @param {Object} medicamento - Dados do medicamento
 */
function atualizarResumo(medicamento) {
  const mapa = {
    nome: medicamento.nome,
    codigo: medicamento.codigo,
    lote: medicamento.lote,
    fabricacao: formatarData(medicamento.fabricacao),
    validade: formatarData(medicamento.validade),
    quantidade: medicamento.quantidade,
    setor: medicamento.setor,
    notaFiscal: medicamento.notaFiscal
  };

  Object.entries(mapa).forEach(([chave, valor]) => {
    if (elementos.resumo[chave]) {
      elementos.resumo[chave].textContent = valor || VALOR_PADRAO;
    }
  });
}

/**
 * Reseta o painel de resumo para valores padrão
 */
function resetResumo() {
  Object.values(elementos.resumo).forEach((elemento) => {
    elemento.textContent = VALOR_PADRAO;
  });
}

/**
 * Renderiza o painel de resumo com o medicamento mais recente
 */
function renderizarResumo() {
  const medicamentos = carregarMedicamentos();
  medicamentos.length > 0 ? atualizarResumo(medicamentos[0]) : resetResumo();
}

/**
 * Renderiza a tabela de medicamentos
 */
function renderizarLista() {
  const medicamentos = carregarMedicamentos();

  if (medicamentos.length === 0) {
    elementos.listaContainer.innerHTML = 
      `<p class="sem-registros">${MENSAGENS.NENHUM_MEDICAMENTO}</p>`;
    return;
  }

  const linhas = medicamentos.map((medicamento) => gerarLinhaTabela(medicamento)).join('');

  elementos.listaContainer.innerHTML = `
    <div class="lista-container">
      <table class="lista-table">
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Código</th>
            <th>Lote</th>
            <th>Fabricação</th>
            <th>Validade</th>
            <th>Quantidade</th>
            <th>Unidade</th>
            <th>Setor</th>
            <th>Fabricante</th>
            <th>Nota fiscal</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Gera o HTML de uma linha da tabela de medicamentos
 * @param {Object} medicamento - Dados do medicamento
 * @returns {string} HTML da linha
 */
function gerarLinhaTabela(medicamento) {
  return `
    <tr data-id="${medicamento.id}">
      <td>${medicamento.nome}</td>
      <td>${medicamento.codigo}</td>
      <td>${medicamento.lote}</td>
      <td>${formatarData(medicamento.fabricacao)}</td>
      <td>${formatarData(medicamento.validade)}</td>
      <td>${medicamento.quantidade}</td>
      <td>${medicamento.unidade || '-'}</td>
      <td>${medicamento.setor}</td>
      <td>${medicamento.fabricante || '-'}</td>
      <td>${medicamento.notaFiscal || '-'}</td>
      <td>
        <button type="button" class="btn-editar" data-acao="editar">Editar</button>
        <button type="button" class="btn-excluir" data-acao="excluir">Excluir</button>
      </td>
    </tr>
  `;
}

/**
 * Handler para cliques na tabela (event delegation)
 * @param {Event} evento - Evento de clique
 */
function handleCliqueTabela(evento) {
  const botao = evento.target;

  if (!botao.classList.contains('btn-editar') && 
      !botao.classList.contains('btn-excluir')) {
    return;
  }

  const linha = botao.closest('tr');
  const id = linha?.dataset.id;

  if (!id) return;

  if (botao.classList.contains('btn-editar')) {
    editarMedicamento(id);
  } else if (botao.classList.contains('btn-excluir')) {
    deletarMedicamento(id);
  }
}

// ==================== OPERAÇÕES DE EDIÇÃO E EXCLUSÃO ====================

/**
 * Carrega os dados de um medicamento no formulário para edição
 * @param {string} id - ID do medicamento
 */
function editarMedicamento(id) {
  const medicamento = carregarMedicamentos().find((item) => item.id === id);

  if (!medicamento) {
    exibirMensagem(MENSAGENS.REGISTRO_NAO_ENCONTRADO, 'erro');
    return;
  }

  // Preenche o formulário com os dados
  preencherFormulario(medicamento);

  // Ativa o modo de edição
  estado.editandoId = id;
  document.querySelector('.btn-cadastrar').textContent = TEXTOS_BOTAO.SALVAR;
  elementos.btnCancelar.classList.remove('hidden');

  exibirMensagem(MENSAGENS.EDICAO_ATIVA, 'sucesso');
  document.getElementById('nome').focus();
}

/**
 * Preenche o formulário com dados de um medicamento
 * @param {Object} medicamento - Dados do medicamento
 */
function preencherFormulario(medicamento) {
  const campos = [
    'nome', 'codigo', 'lote', 'fabricante', 'fabricacao',
    'validade', 'quantidade', 'unidade', 'setor', 'notaFiscal', 'observacoes'
  ];

  campos.forEach((campo) => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      elemento.value = medicamento[campo] || '';
    }
  });
}

/**
 * Deleta um medicamento após confirmação do usuário
 * @param {string} id - ID do medicamento
 */
function deletarMedicamento(id) {
  if (!window.confirm(MENSAGENS.EXCLUIR_CONFIRMACAO)) {
    return;
  }

  const medicamentos = carregarMedicamentos().filter((item) => item.id !== id);
  salvarMedicamentos(medicamentos);

  // Se estava em edição, finaliza
  if (estado.editandoId === id) {
    finalizarEdicao();
  }

  renderizarLista();
  renderizarResumo();
  exibirMensagem(MENSAGENS.EXCLUSAO_SUCESSO, 'sucesso');
}

/**
 * Cancela o modo de edição
 */
function cancelarEdicao() {
  limparFormulario();
  finalizarEdicao();
  renderizarResumo();
  exibirMensagem(MENSAGENS.EDICAO_CANCELADA, 'erro');
}

/**
 * Finaliza o modo de edição e reseta o estado
 */
function finalizarEdicao() {
  estado.editandoId = null;
  document.querySelector('.btn-cadastrar').textContent = TEXTOS_BOTAO.CADASTRAR;
  elementos.btnCancelar.classList.add('hidden');
}

// ==================== UTILITÁRIOS ====================

/**
 * Formata uma data de YYYY-MM-DD para DD/MM/YYYY
 * @param {string} data - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada ou string vazia
 */
function formatarData(data) {
  if (!data) return '';
  
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Define a data mínima de validade como hoje e máxima de fabricação
 */
function definirDataMinimaValidade() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  const validadeInput = document.getElementById('validade');
  const fabricacaoInput = document.getElementById('fabricacao');

  if (validadeInput) validadeInput.min = dataFormatada;
  if (fabricacaoInput) fabricacaoInput.max = dataFormatada;
}

/**
 * Limpa o formulário e reseta o estado visual
 */
function limparFormulario() {
  elementos.form.reset();
  finalizarEdicao();
  elementos.msgFeedback.className = 'mensagem';
  elementos.msgFeedback.textContent = '';
  resetResumo();
  definirDataMinimaValidade();
}

