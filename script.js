const form = document.getElementById('formMedicamento');
const mensagem = document.getElementById('mensagem');
const listaContainer = document.getElementById('listaContainer');
const resumoNome = document.getElementById('resumoNome');
const resumoCodigo = document.getElementById('resumoCodigo');
const resumoLote = document.getElementById('resumoLote');
const resumoFabricacao = document.getElementById('resumoFabricacao');
const resumoValidade = document.getElementById('resumoValidade');
const resumoQuantidade = document.getElementById('resumoQuantidade');
const resumoSetor = document.getElementById('resumoSetor');
const resumoNotaFiscal = document.getElementById('resumoNotaFiscal');
const btnCancelar = document.getElementById('btnCancelar');

const STORAGE_KEY = 'medicamentosHospitalares';
let mensagemTimeout = null;
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  definirDataMinimaValidade();
  renderizarResumo();
  renderizarLista();
});

form.addEventListener('submit', (evento) => {
  evento.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    exibirMensagem('Preencha corretamente os campos obrigatórios.', 'erro');
    return;
  }

  const medicamento = {
    id: Date.now().toString(),
    nome: document.getElementById('nome').value.trim(),
    codigo: document.getElementById('codigo').value.trim(),
    lote: document.getElementById('lote').value.trim(),
    fabricante: document.getElementById('fabricante').value.trim(),
    fabricacao: document.getElementById('fabricacao').value,
    validade: document.getElementById('validade').value,
    quantidade: document.getElementById('quantidade').value,
    unidade: document.getElementById('unidade').value,
    setor: document.getElementById('setor').value,
    notaFiscal: document.getElementById('notaFiscal').value.trim(),
    observacoes: document.getElementById('observacoes').value.trim()
  };

  const medicamentos = carregarMedicamentos();

  if (editandoId) {
    const index = medicamentos.findIndex((item) => item.id === editandoId);
    if (index !== -1) {
      medicamentos[index] = { ...medicamento, id: editandoId };
      salvarMedicamentos(medicamentos);
      exibirMensagem('Medicamento atualizado com sucesso!', 'sucesso');
      atualizarResumo(medicamento);
      renderizarLista();
      finalizarEdicao();
      form.reset();
      definirDataMinimaValidade();
      return;
    }
  }

  medicamentos.unshift(medicamento);
  salvarMedicamentos(medicamentos);

  exibirMensagem('Medicamento cadastrado com sucesso!', 'sucesso');
  atualizarResumo(medicamento);
  renderizarLista();
  form.reset();
  definirDataMinimaValidade();
});

function carregarMedicamentos() {
  const registros = localStorage.getItem(STORAGE_KEY);
  return registros ? JSON.parse(registros) : [];
}

function salvarMedicamentos(medicamentos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(medicamentos));
}

function exibirMensagem(texto, tipo) {
  mensagem.className = `mensagem ${tipo}`;
  mensagem.textContent = texto;

  if (mensagemTimeout) {
    clearTimeout(mensagemTimeout);
  }

  mensagemTimeout = setTimeout(() => {
    mensagem.className = 'mensagem';
    mensagem.textContent = '';
  }, 4500);
}

function atualizarResumo(medicamento) {
  resumoNome.textContent = medicamento.nome || 'Não informado';
  resumoCodigo.textContent = medicamento.codigo || 'Não informado';
  resumoLote.textContent = medicamento.lote || 'Não informado';
  resumoFabricacao.textContent = formatarData(medicamento.fabricacao) || 'Não informado';
  resumoValidade.textContent = formatarData(medicamento.validade) || 'Não informado';
  resumoQuantidade.textContent = medicamento.quantidade || 'Não informado';
  resumoSetor.textContent = medicamento.setor || 'Não informado';
  resumoNotaFiscal.textContent = medicamento.notaFiscal || 'Não informado';
}

function resetResumo() {
  resumoNome.textContent = 'Não informado';
  resumoCodigo.textContent = 'Não informado';
  resumoLote.textContent = 'Não informado';
  resumoFabricacao.textContent = 'Não informado';
  resumoValidade.textContent = 'Não informado';
  resumoQuantidade.textContent = 'Não informado';
  resumoSetor.textContent = 'Não informado';
  resumoNotaFiscal.textContent = 'Não informado';
}

function renderizarResumo() {
  const medicamentos = carregarMedicamentos();

  if (medicamentos.length > 0) {
    atualizarResumo(medicamentos[0]);
  } else {
    resetResumo();
  }
}

function renderizarLista() {
  const medicamentos = carregarMedicamentos();

  if (medicamentos.length === 0) {
    listaContainer.innerHTML = '<p class="sem-registros">Nenhum medicamento cadastrado ainda.</p>';
    return;
  }

  const linhas = medicamentos.map((item) => {
    return `
      <tr>
        <td>${item.nome}</td>
        <td>${item.codigo}</td>
        <td>${item.lote}</td>
        <td>${formatarData(item.fabricacao)}</td>
        <td>${formatarData(item.validade)}</td>
        <td>${item.quantidade}</td>
        <td>${item.unidade || '-'}</td>
        <td>${item.setor}</td>
        <td>${item.fabricante || '-'}</td>
        <td>${item.notaFiscal || '-'}</td>
        <td>
          <button type="button" class="btn-editar" onclick="editarMedicamento('${item.id}')">Editar</button>
          <button type="button" class="btn-excluir" onclick="deletarMedicamento('${item.id}')">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');

  listaContainer.innerHTML = `
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

function deletarMedicamento(id) {
  const confirmar = window.confirm('Tem certeza que deseja excluir este medicamento?');
  if (!confirmar) {
    return;
  }

  const medicamentos = carregarMedicamentos().filter((item) => item.id !== id);
  salvarMedicamentos(medicamentos);
  if (editandoId === id) {
    cancelarEdicao();
  }
  renderizarLista();
  renderizarResumo();
  exibirMensagem('Medicamento excluído com sucesso.', 'sucesso');
}

function editarMedicamento(id) {
  const medicamento = carregarMedicamentos().find((item) => item.id === id);
  if (!medicamento) {
    exibirMensagem('Registro não encontrado.', 'erro');
    return;
  }

  editandoId = id;
  document.getElementById('nome').value = medicamento.nome;
  document.getElementById('codigo').value = medicamento.codigo;
  document.getElementById('lote').value = medicamento.lote;
  document.getElementById('fabricante').value = medicamento.fabricante;
  document.getElementById('fabricacao').value = medicamento.fabricacao;
  document.getElementById('validade').value = medicamento.validade;
  document.getElementById('quantidade').value = medicamento.quantidade;
  document.getElementById('unidade').value = medicamento.unidade;
  document.getElementById('setor').value = medicamento.setor;
  document.getElementById('notaFiscal').value = medicamento.notaFiscal;
  document.getElementById('observacoes').value = medicamento.observacoes;

  document.querySelector('.btn-cadastrar').textContent = 'Salvar alterações';
  btnCancelar.classList.remove('hidden');
  exibirMensagem('Modo de edição ativado. Faça suas alterações e salve.', 'sucesso');
  document.getElementById('nome').focus();
}

function cancelarEdicao() {
  form.reset();
  definirDataMinimaValidade();
  finalizarEdicao();
  renderizarResumo();
  exibirMensagem('Edição cancelada.', 'erro');
}

function finalizarEdicao() {
  editandoId = null;
  document.querySelector('.btn-cadastrar').textContent = 'Cadastrar medicamento';
  btnCancelar.classList.add('hidden');
}

function formatarData(data) {
  if (!data) {
    return '';
  }
  const [year, month, day] = data.split('-');
  return `${day}/${month}/${year}`;
}

function definirDataMinimaValidade() {
  const validadeInput = document.getElementById('validade');
  const fabricacaoInput = document.getElementById('fabricacao');
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  validadeInput.min = `${ano}-${mes}-${dia}`;
  fabricacaoInput.max = `${ano}-${mes}-${dia}`;
}

function limparFormulario() {
  form.reset();
  finalizarEdicao();
  mensagem.className = 'mensagem';
  mensagem.textContent = '';
  resetResumo();
  definirDataMinimaValidade();
}
