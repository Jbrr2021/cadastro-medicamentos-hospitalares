const form = document.getElementById('formMedicamento');
const mensagem = document.getElementById('mensagem');
const listaContainer = document.getElementById('listaContainer');
const resumoNome = document.getElementById('resumoNome');
const resumoCodigo = document.getElementById('resumoCodigo');
const resumoLote = document.getElementById('resumoLote');
const resumoValidade = document.getElementById('resumoValidade');
const resumoQuantidade = document.getElementById('resumoQuantidade');
const resumoSetor = document.getElementById('resumoSetor');

const STORAGE_KEY = 'medicamentosHospitalares';
let mensagemTimeout = null;

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
    validade: document.getElementById('validade').value,
    quantidade: document.getElementById('quantidade').value,
    unidade: document.getElementById('unidade').value,
    setor: document.getElementById('setor').value,
    observacoes: document.getElementById('observacoes').value.trim()
  };

  const medicamentos = carregarMedicamentos();
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
  resumoValidade.textContent = formatarData(medicamento.validade) || 'Não informado';
  resumoQuantidade.textContent = medicamento.quantidade || 'Não informado';
  resumoSetor.textContent = medicamento.setor || 'Não informado';
}

function resetResumo() {
  resumoNome.textContent = 'Não informado';
  resumoCodigo.textContent = 'Não informado';
  resumoLote.textContent = 'Não informado';
  resumoValidade.textContent = 'Não informado';
  resumoQuantidade.textContent = 'Não informado';
  resumoSetor.textContent = 'Não informado';
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
        <td>${formatarData(item.validade)}</td>
        <td>${item.quantidade}</td>
        <td>${item.unidade || '-'}</td>
        <td>${item.setor}</td>
        <td>${item.fabricante || '-'}</td>
        <td><button type="button" class="btn-excluir" onclick="deletarMedicamento('${item.id}')">Excluir</button></td>
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
            <th>Validade</th>
            <th>Quantidade</th>
            <th>Unidade</th>
            <th>Setor</th>
            <th>Fabricante</th>
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
  const medicamentos = carregarMedicamentos().filter((item) => item.id !== id);
  salvarMedicamentos(medicamentos);
  renderizarLista();
  renderizarResumo();
  exibirMensagem('Medicamento excluído com sucesso.', 'sucesso');
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
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  validadeInput.min = `${ano}-${mes}-${dia}`;
}

function limparFormulario() {
  form.reset();
  mensagem.className = 'mensagem';
  mensagem.textContent = '';
  resetResumo();
  definirDataMinimaValidade();
}
