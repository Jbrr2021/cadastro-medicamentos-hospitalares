/**
 * Aplicação de Cadastro de Medicamentos Hospitalares
 * Versão evoluída: busca, filtros, ordenação, dashboard e novos campos
 */

// ==================== CONSTANTES ====================

const STORAGE_KEY = 'medicamentosHospitalares';
const TIMEOUT_MENSAGEM = 4500; // ms
const VALOR_PADRAO = 'Não informado';
const DIAS_PROXIMOS = 30; // janela para próximos do vencimento

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

const TEXTOS_BOTAO = { CADASTRAR: 'Cadastrar medicamento', SALVAR: 'Salvar alterações' };

// ==================== ELEMENTOS DO DOM ====================

const elementos = {
  form: document.getElementById('formMedicamento'),
  msgFeedback: document.getElementById('mensagem'),
  btnCancelar: document.getElementById('btnCancelar'),
  listaContainer: document.getElementById('listaContainer'),
  pesquisa: document.getElementById('pesquisa'),
  filtroSetor: document.getElementById('filtroSetor'),
  filtroUnidade: document.getElementById('filtroUnidade'),
  filtroVencidos: document.getElementById('filtroVencidos'),
  filtroProximos: document.getElementById('filtroProximos'),
  ordenarPor: document.getElementById('ordenarPor'),
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
  dashboard: {
    total: document.getElementById('cardTotal'),
    proximos: document.getElementById('cardProximos'),
    vencidos: document.getElementById('cardVencidos'),
    estoque: document.getElementById('cardEstoque'),
    totalCadastrados: document.getElementById('totalCadastrados'),
    totalProximos: document.getElementById('totalProximos'),
    totalVencidos: document.getElementById('totalVencidos'),
    totalEstoque: document.getElementById('totalEstoque'),
    ultimos: document.getElementById('ultimosCadastrados'),
    valorTotalEstoque: document.getElementById('valorTotalEstoque')
  }
};

let estado = { editandoId: null, timeoutMensagem: null };

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', inicializar);

/**
 * Inicializa a aplicação: define restrições de datas,
 * registra event listeners e atualiza a interface
 * (dashboard, lista e resumo).
 */
function inicializar() {
  definirDataMinimaValidade();
  configurarEventListeners();
  atualizarInterface();
}

/**
 * Registra os event listeners principais da aplicação.
 * - Submissão do formulário
 * - Cliques na tabela (delegation)
 * - Input da busca (debounced)
 * - Mudanças nos filtros e ordenação
 * - Atualização do cálculo de valor total ao alterar quantidade/preço
 */
function configurarEventListeners() {
  elementos.form.addEventListener('submit', handleSubmitFormulario);
  elementos.listaContainer.addEventListener('click', handleCliqueTabela);
  elementos.pesquisa?.addEventListener('input', aplicarFiltrosPesquisaOrdenacaoDebounced);
  elementos.filtroSetor?.addEventListener('change', aplicarFiltrosPesquisaOrdenacao);
  elementos.filtroUnidade?.addEventListener('change', aplicarFiltrosPesquisaOrdenacao);
  elementos.filtroVencidos?.addEventListener('change', aplicarFiltrosPesquisaOrdenacao);
  elementos.filtroProximos?.addEventListener('change', aplicarFiltrosPesquisaOrdenacao);
  elementos.ordenarPor?.addEventListener('change', aplicarFiltrosPesquisaOrdenacao);
  document.getElementById('precoUnitario')?.addEventListener('input', calcularValorTotal);
  document.getElementById('quantidade')?.addEventListener('input', calcularValorTotal);
}

// debounce simples para busca em tempo real
let debounceTimer = null;
function aplicarFiltrosPesquisaOrdenacaoDebounced() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(aplicarFiltrosPesquisaOrdenacao, 180);
}

// Atualiza toda a interface (dashboard + lista)
function atualizarInterface() {
  const medicamentos = carregarMedicamentos();
  atualizarDashboard(medicamentos);
  aplicarFiltrosPesquisaOrdenacao();
  renderizarResumo();
}

/**
 * Atualiza o painel de resumo com o último medicamento cadastrado.
 * Caso não haja registros, reseta os valores para o padrão.
 */
function renderizarResumo() {
  const medicamentos = carregarMedicamentos();
  if (medicamentos.length > 0) {
    atualizarResumo(medicamentos[0]);
  } else {
    resetResumo();
  }
}

/**
 * Atualiza o painel de resumo com os dados do medicamento mais recente.
 * @param {Object} medicamento
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
 * Reseta o painel de resumo para os valores padrão.
 */
function resetResumo() {
  Object.values(elementos.resumo).forEach((elemento) => {
    elemento.textContent = VALOR_PADRAO;
  });
}

// ==================== FORMULÁRIO ====================

/**
 * Handler do submit do formulário.
 * Valida, coleta dados e encaminha para criar ou atualizar registro.
 * @param {Event} evento
 */
function handleSubmitFormulario(evento) {
  evento.preventDefault();
  if (!elementos.form.checkValidity()) {
    elementos.form.reportValidity();
    exibirMensagem(MENSAGENS.PREENCHIMENTO_OBRIGATORIO, 'erro');
    return;
  }

  const dados = coletarDadosFormulario();
  const medicamentos = carregarMedicamentos();

  if (estado.editandoId) {
    atualizarMedicamento(dados, medicamentos);
  } else {
    criarNovoMedicamento(dados, medicamentos);
  }
}

/**
 * Lê os valores do formulário, faz parsing numérico seguro
 * e retorna um objeto pronto para persistência.
 * Mantém nomes de campos em português conforme requisito.
 * @returns {Object}
 */
function coletarDadosFormulario() {
  const preco = parseFloat(obterValorCampo('precoUnitario')) || 0;
  const quantidade = parseInt(obterValorCampo('quantidade')) || 0;

  return {
    id: Date.now().toString(),
    nome: obterValorCampo('nome'),
    codigo: obterValorCampo('codigo'),
    lote: obterValorCampo('lote'),
    fabricante: obterValorCampo('fabricante'),
    fabricacao: obterValorCampo('fabricacao'),
    validade: obterValorCampo('validade'),
    quantidade: quantidade,
    unidade: obterValorCampo('unidade'),
    setor: obterValorCampo('setor'),
    notaFiscal: obterValorCampo('notaFiscal'),
    observacoes: obterValorCampo('observacoes'),
    categoria: obterValorCampo('categoria'),
    fornecedor: obterValorCampo('fornecedor'),
    precoUnitario: preco,
    valorTotal: Number((preco * quantidade).toFixed(2))
  };
}

function obterValorCampo(idCampo) {
  const campo = document.getElementById(idCampo);
  return campo ? campo.value.trim() : '';
}

/**
 * Calcula o valor total mostrado no formulário (preço * quantidade)
 * e atualiza o campo `valorTotal` com formatação local.
 */
function calcularValorTotal() {
  const preco = parseFloat(document.getElementById('precoUnitario').value || 0);
  const quantidade = parseInt(document.getElementById('quantidade').value || 0);
  const total = preco && quantidade ? (preco * quantidade).toFixed(2) : '0.00';
  document.getElementById('valorTotal').value = total.replace('.', ',');
}

/**
 * Insere um novo medicamento no início da lista, salva em
 * localStorage e atualiza a interface.
 */
function criarNovoMedicamento(dados, medicamentos) {
  medicamentos.unshift(dados);
  salvarMedicamentos(medicamentos);
  exibirMensagem(MENSAGENS.CADASTRO_SUCESSO, 'sucesso');
  limparFormulario();
  atualizarInterface();
}

/**
 * Substitui o medicamento em edição pelos novos dados
 * e persiste a lista atualizada.
 */
function atualizarMedicamento(dados, medicamentos) {
  const idx = medicamentos.findIndex((m) => m.id === estado.editandoId);
  if (idx === -1) { exibirMensagem(MENSAGENS.REGISTRO_NAO_ENCONTRADO, 'erro'); return; }
  medicamentos[idx] = { ...dados, id: estado.editandoId };
  salvarMedicamentos(medicamentos);
  exibirMensagem(MENSAGENS.ATUALIZACAO_SUCESSO, 'sucesso');
  finalizarEdicao();
  limparFormulario();
  atualizarInterface();
}

// ==================== ARMAZENAMENTO ====================

/**
 * Carrega a lista de medicamentos do localStorage.
 * Retorna um array vazio em caso de erro ou ausência de dados.
 * @returns {Array}
 */
function carregarMedicamentos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { console.error(e); return []; }
}

/**
 * Persiste a lista de medicamentos no localStorage.
 * Em caso de falha (ex.: storage cheio) registra no console
 * e informa o usuário via toast.
 */
function salvarMedicamentos(medicamentos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(medicamentos)); }
  catch (e) { console.error(e); exibirMensagem('Erro ao salvar dados.', 'erro'); }
}

// ==================== LISTA / FILTROS / ORDENAÇÃO ====================

function aplicarFiltrosPesquisaOrdenacao() {
  const todos = carregarMedicamentos();
  const termo = elementos.pesquisa?.value.trim().toLowerCase() || '';
  const setor = elementos.filtroSetor?.value || '';
  const unidade = elementos.filtroUnidade?.value || '';
  const apenasVencidos = elementos.filtroVencidos?.checked;
  const apenasProximos = elementos.filtroProximos?.checked;
  const ordenar = elementos.ordenarPor?.value || 'nome';

  let lista = todos.filter((m) => {
    // busca por nome, código, fabricante
    const combinado = `${m.nome} ${m.codigo} ${m.fabricante}`.toLowerCase();
    if (termo && !combinado.includes(termo)) return false;
    if (setor && m.setor !== setor) return false;
    if (unidade && m.unidade !== unidade) return false;

    const hoje = new Date();
    const validade = m.validade ? new Date(m.validade) : null;
    if (apenasVencidos && validade && validade >= hoje) return false;
    if (apenasProximos && validade) {
      const diff = (validade - hoje) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff > DIAS_PROXIMOS) return false;
    }

    return true;
  });

  // ordenação
  lista.sort((a, b) => {
    if (ordenar === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');
    if (ordenar === 'quantidade') return (b.quantidade || 0) - (a.quantidade || 0);
    if (ordenar === 'validade') return new Date(a.validade || 0) - new Date(b.validade || 0);
    if (ordenar === 'fabricacao') return new Date(b.fabricacao || 0) - new Date(a.fabricacao || 0);
    return 0;
  });

  renderizarLista(lista);
  atualizarDashboard(todos);
}

/**
 * Renderiza a lista de medicamentos em tabela HTML.
 * Recebe uma lista filtrada/ordenada para exibição.
 * @param {Array} lista
 */
function renderizarLista(lista) {
  const medicamentos = lista || carregarMedicamentos();
  if (!medicamentos || medicamentos.length === 0) {
    elementos.listaContainer.innerHTML = `<p class="sem-registros">${MENSAGENS.NENHUM_MEDICAMENTO}</p>`;
    return;
  }

  const linhas = medicamentos.map(gerarLinhaTabela).join('');
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
            <th>Fornecedor</th>
            <th>Preço (R$)</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    </div>`;
}

function gerarLinhaTabela(m) {
  const preco = m.precoUnitario ? Number(m.precoUnitario).toFixed(2).replace('.', ',') : '-';
  return `
    <tr data-id="${m.id}">
      <td>${m.nome}</td>
      <td>${m.codigo}</td>
      <td>${m.lote}</td>
      <td>${formatarData(m.fabricacao)}</td>
      <td>${formatarData(m.validade)}</td>
      <td>${m.quantidade || 0}</td>
      <td>${m.unidade || '-'}</td>
      <td>${m.setor || '-'}</td>
      <td>${m.fornecedor || '-'}</td>
      <td>${preco}</td>
      <td class="acoes">
        <button type="button" class="btn-editar" data-acao="editar">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828zM6 12.586V16h3.414l8.293-8.293-3.414-3.414L6 12.586z"/></svg>
          Editar
        </button>
        <button type="button" class="btn-excluir" data-acao="excluir">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8.257 3.099c.366-.446.957-.558 1.442-.28l.094.083L10 3.836l.207-.234a1.007 1.007 0 0 1 1.536 0l.094.083 5 5a1 1 0 0 1-1.32 1.497l-.094-.083L11 5.414V15a1 1 0 1 1-2 0V5.414L4.965 9.365a1 1 0 0 1-1.497-1.32l.083-.094 5-5z" clip-rule="evenodd"/></svg>
          Excluir
        </button>
      </td>
    </tr>`;
}

function handleCliqueTabela(evento) {
  const botao = evento.target;
  if (!botao.matches('.btn-editar') && !botao.matches('.btn-excluir')) return;
  const linha = botao.closest('tr');
  const id = linha?.dataset.id;
  if (!id) return;
  if (botao.matches('.btn-editar')) return editarMedicamento(id);
  if (botao.matches('.btn-excluir')) return deletarMedicamento(id);
}

// ==================== EDIÇÃO / EXCLUSÃO ====================

function editarMedicamento(id) {
  const medicamento = carregarMedicamentos().find((m) => m.id === id);
  if (!medicamento) { exibirMensagem(MENSAGENS.REGISTRO_NAO_ENCONTRADO, 'erro'); return; }
  preencherFormulario(medicamento);
  estado.editandoId = id;
  document.querySelector('.btn-cadastrar').textContent = TEXTOS_BOTAO.SALVAR;
  elementos.btnCancelar.classList.remove('hidden');
  exibirMensagem(MENSAGENS.EDICAO_ATIVA, 'sucesso');
}

function deletarMedicamento(id) {
  // confirmação antes de excluir usando modal customizado
  pedirConfirmacao(MENSAGENS.EXCLUIR_CONFIRMACAO).then((confirmou) => {
    if (!confirmou) return;
    const lista = carregarMedicamentos().filter((m) => m.id !== id);
    salvarMedicamentos(lista);
    if (estado.editandoId === id) finalizarEdicao();
    exibirMensagem(MENSAGENS.EXCLUSAO_SUCESSO, 'sucesso');
    atualizarInterface();
  });
}

function cancelarEdicao() {
  limparFormulario();
  finalizarEdicao();
  exibirMensagem(MENSAGENS.EDICAO_CANCELADA, 'erro');
}

function finalizarEdicao() {
  estado.editandoId = null;
  document.querySelector('.btn-cadastrar').textContent = TEXTOS_BOTAO.CADASTRAR;
  elementos.btnCancelar.classList.add('hidden');
}

function preencherFormulario(m) {
  const campos = ['nome','codigo','lote','fabricante','fabricacao','validade','quantidade','unidade','setor','notaFiscal','observacoes','categoria','fornecedor','precoUnitario'];
  campos.forEach((c) => { const el = document.getElementById(c); if (el) el.value = m[c] ?? ''; });
  document.getElementById('valorTotal').value = (m.valorTotal ? Number(m.valorTotal).toFixed(2).replace('.', ',') : '0,00');
}

// ==================== UTILITÁRIOS ====================

function formatarData(data) {
  if (!data) return '';
  const [a,m,d] = data.split('-');
  return `${d}/${m}/${a}`;
}

function definirDataMinimaValidade() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth()+1).padStart(2,'0');
  const dia = String(hoje.getDate()).padStart(2,'0');
  const dataFormatada = `${ano}-${mes}-${dia}`;
  const validadeInput = document.getElementById('validade');
  const fabricacaoInput = document.getElementById('fabricacao');
  if (validadeInput) validadeInput.min = dataFormatada;
  if (fabricacaoInput) fabricacaoInput.max = dataFormatada;
}

function limparFormulario() {
  elementos.form.reset();
  document.getElementById('valorTotal').value = '';
  definirDataMinimaValidade();
}

function exibirMensagem(texto, tipo) {
  elementos.msgFeedback.className = `mensagem ${tipo}`;
  elementos.msgFeedback.textContent = texto;
  if (estado.timeoutMensagem) clearTimeout(estado.timeoutMensagem);
  estado.timeoutMensagem = setTimeout(() => { elementos.msgFeedback.className = 'mensagem'; elementos.msgFeedback.textContent = ''; }, TIMEOUT_MENSAGEM);
}

// ==================== DASHBOARD / ESTATÍSTICAS ====================

function atualizarDashboard(medicamentos) {
  const total = medicamentos.length;
  const hoje = new Date();
  let proximos = 0, vencidos = 0, totalEstoque = 0, valorTotal = 0;

  medicamentos.forEach((m) => {
    const qtd = Number(m.quantidade) || 0; totalEstoque += qtd;
    const preco = Number(m.precoUnitario) || 0; valorTotal += preco * qtd;
    if (m.validade) {
      const v = new Date(m.validade);
      const diff = (v - hoje) / (1000*60*60*24);
      if (diff < 0) vencidos++;
      else if (diff <= DIAS_PROXIMOS) proximos++;
    }
  });

  elementos.dashboard.total.textContent = total;
  elementos.dashboard.proximos.textContent = proximos;
  elementos.dashboard.vencidos.textContent = vencidos;
  elementos.dashboard.estoque.textContent = totalEstoque;
  elementos.dashboard.totalCadastrados.textContent = total;
  elementos.dashboard.totalProximos.textContent = proximos;
  elementos.dashboard.totalVencidos.textContent = vencidos;
  elementos.dashboard.totalEstoque.textContent = totalEstoque;
  elementos.dashboard.valorTotalEstoque.textContent = formatarMoeda(valorTotal);

  // últimos 5
  const ultimos = medicamentos.slice(0,5);
  elementos.dashboard.ultimos.innerHTML = ultimos.length ? ultimos.map(u=>`<li>${u.nome} <small>(${u.codigo})</small></li>`).join('') : '<li>—</li>';
}

function formatarMoeda(valor){
  return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}

// ==================== MODAL DE CONFIRMAÇÃO CUSTOMIZADO ====================

const modalConfirmEl = document.getElementById('modalConfirm');
const modalMessageEl = document.getElementById('modalMessage');
const modalOkBtn = document.getElementById('modalOk');
const modalCancelBtn = document.getElementById('modalCancel');

/**
 * Exibe modal customizado e retorna Promise<boolean>
 * @param {string} mensagem
 * @returns {Promise<boolean>}
 */
function pedirConfirmacao(mensagem) {
  return new Promise((resolve) => {
    if (!modalConfirmEl) {
      // fallback para confirm nativo
      return resolve(window.confirm(mensagem));
    }

    modalMessageEl.textContent = mensagem;
    modalConfirmEl.classList.remove('hidden');

    const onOk = () => {
      cleanup();
      resolve(true);
    };
    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    function cleanup() {
      modalConfirmEl.classList.add('hidden');
      modalOkBtn.removeEventListener('click', onOk);
      modalCancelBtn.removeEventListener('click', onCancel);
    }

    modalOkBtn.addEventListener('click', onOk, { once: true });
    modalCancelBtn.addEventListener('click', onCancel, { once: true });
  });
}

// ==================== UTILITÁRIOS DE DESENVOLVIMENTO / TESTES ====================

function obterQueryParam(nome) {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(nome);
  } catch (e) {
    return null;
  }
}

function seedDemoData(force = false) {
  const atual = carregarMedicamentos();
  if (atual.length > 0 && !force) {
    console.info('LocalStorage já contém dados. Use ?seed=1 para forçar.');
    return;
  }

  const hoje = new Date();
  const format = (d) => d.toISOString().slice(0,10);

  const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1);
  const daqui20 = new Date(hoje); daqui20.setDate(hoje.getDate() + 20);
  const daqui40 = new Date(hoje); daqui40.setDate(hoje.getDate() + 40);
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 5);

  const demo = [
    { id: 'd1', nome: 'Dipirona 500mg', codigo: 'MED-001', lote: 'L2026A', fabricante: 'Cristália', fabricacao: format(ontem), validade: format(daqui20), quantidade: 120, unidade: 'Comprimido', setor: 'Farmácia', fornecedor: 'Distribuidora X', precoUnitario: 0.45, valorTotal: 54.00, categoria: 'Analgésico' },
    { id: 'd2', nome: 'Amoxicilina 500mg', codigo: 'MED-002', lote: 'A500', fabricante: 'Bayer', fabricacao: format(ontem), validade: format(daqui40), quantidade: 60, unidade: 'Caixa', setor: 'Enfermaria', fornecedor: 'Fornecedor Y', precoUnitario: 2.50, valorTotal: 150.00, categoria: 'Antibiótico' },
    { id: 'd3', nome: 'Soro Fisiológico 0,9%', codigo: 'MED-003', lote: 'S900', fabricante: 'Farma', fabricacao: format(ontem), validade: format(amanha), quantidade: 30, unidade: 'Frasco', setor: 'Emergência', fornecedor: 'Distribuidora Z', precoUnitario: 3.20, valorTotal: 96.00, categoria: 'Hidratante' },
    { id: 'd4', nome: 'Heparina 5000U', codigo: 'MED-004', lote: 'H5000', fabricante: 'MediLab', fabricacao: format(ontem), validade: format(hoje), quantidade: 10, unidade: 'Ampola', setor: 'Centro Cirúrgico', fornecedor: 'Fornecedor Z', precoUnitario: 12.00, valorTotal: 120.00, categoria: 'Anticoagulante' },
    { id: 'd5', nome: 'Paracetamol 750mg', codigo: 'MED-005', lote: 'P750', fabricante: 'Geral', fabricacao: format(ontem), validade: format(ontem), quantidade: 5, unidade: 'Caixa', setor: 'CAF', fornecedor: 'Distribuidora X', precoUnitario: 1.20, valorTotal: 6.00, categoria: 'Analgésico' }
  ];

  salvarMedicamentos(demo);
  atualizarInterface();
  exibirMensagem('Dados de demonstração inseridos. Abra a lista para conferir.', 'sucesso');
  console.info('Seed demo: ', demo);
}

function runAutoTests() {
  const meds = carregarMedicamentos();
  const total = meds.length;
  const vencidos = meds.filter(m => m.validade && new Date(m.validade) < new Date()).length;
  const proximos = meds.filter(m => {
    if (!m.validade) return false;
    const diff = (new Date(m.validade) - new Date()) / (1000*60*60*24);
    return diff >=0 && diff <= DIAS_PROXIMOS;
  }).length;

  const resumo = `AutoTest: total=${total}, vencidos=${vencidos}, proximos=${proximos}`;
  console.info(resumo);
  exibirMensagem(resumo, 'sucesso');
}

// Executa ações se query params estiverem presentes
const _seed = obterQueryParam('seed');
const _autotest = obterQueryParam('autotest');
if (_seed === '1' || _seed === 'true') seedDemoData(true);
if (_autotest === '1' || _autotest === 'true') runAutoTests();




