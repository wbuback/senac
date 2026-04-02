/**
 * TASKSCHOOL — app.js
 * ====================
 * Branch 3 — HTML + CSS + JavaScript
 *
 * Conceitos demonstrados neste arquivo:
 * - Variáveis: const, let
 * - Tipos de dados: string, number, boolean, array, object
 * - Funções declaradas e arrow functions
 * - Manipulação do DOM: querySelector, getElementById, createElement
 * - Eventos: addEventListener, event.preventDefault
 * - Arrays: push, filter, find, findIndex, forEach, map
 * - Template literals (template strings com ``)
 * - Desestruturação de objetos
 * - Operador spread (...)
 * - localStorage: setItem, getItem, JSON.stringify, JSON.parse
 * - Validação de formulário
 * - CRUD: Create, Read, Update, Delete
 *
 * Índice:
 * 1.  Estado da aplicação
 * 2.  Referências aos elementos do DOM
 * 3.  Inicialização
 * 4.  CRUD de tarefas
 * 5.  Renderização (exibição na tela)
 * 6.  Filtros e busca
 * 7.  Estatísticas
 * 8.  localStorage (persistência)
 * 9.  Eventos
 * 10. Utilitários
 */


/* ================================================
   1. ESTADO DA APLICAÇÃO
   ================================================
   "Estado" (state) é o conjunto de dados que
   a aplicação usa e exibe. Toda mudança na tela
   deve refletir uma mudança no estado.
   ================================================ */

/**
 * Array que armazena todas as tarefas.
 * Cada tarefa é um objeto com as propriedades abaixo.
 *
 * @type {Array<Object>}
 */
let tarefas = [];

/**
 * Filtro atualmente ativo.
 * Controla quais tarefas são exibidas.
 * @type {string}
 */
let filtroAtivo = "todas";

/**
 * Texto de busca digitado pelo usuário.
 * @type {string}
 */
let textoBusca = "";

/**
 * ID da tarefa sendo editada (null quando não há edição ativa).
 * @type {number|null}
 */
let idEdicao = null;


/* ================================================
   2. REFERÊNCIAS AOS ELEMENTOS DO DOM
   ================================================
   Armazenamos as referências uma única vez e
   reutilizamos ao longo do código — mais eficiente
   do que buscar o elemento toda vez que precisar.
   ================================================ */
const formulario        = document.getElementById("tarefa-form");
const inputTitulo       = document.getElementById("titulo");
const inputDescricao    = document.getElementById("descricao");
const selectPrioridade  = document.getElementById("prioridade");
const inputVencimento   = document.getElementById("vencimento");
const selectCategoria   = document.getElementById("categoria");
const containerCards    = document.getElementById("cards-tarefas");
const corpoTabela       = document.getElementById("tbody-tarefas");
const inputBusca        = document.getElementById("busca");
const btnFiltros        = document.querySelectorAll(".btn-filtro");
const btnSubmit         = formulario.querySelector("button[type='submit']");


/* ================================================
   3. INICIALIZAÇÃO
   ================================================
   A função init() é chamada quando a página carrega.
   Ela recupera dados salvos e renderiza a interface.
   ================================================ */

/**
 * Inicializa a aplicação:
 * - Carrega tarefas salvas do localStorage
 * - Renderiza os cards e a tabela
 * - Atualiza as estatísticas
 */
function init() {
    // Carrega tarefas persistidas (se houver)
    tarefas = carregarDoStorage();

    // Renderiza interface com os dados carregados
    renderizar();

    // Define a data mínima do campo de vencimento como hoje
    const hoje = new Date().toISOString().split("T")[0];
    inputVencimento.setAttribute("min", hoje);

    console.log("Taskschool iniciado. Tarefas carregadas:", tarefas.length);
}


/* ================================================
   4. CRUD DE TAREFAS
   ================================================
   CRUD = Create, Read, Update, Delete
   São as quatro operações básicas de dados.
   ================================================ */

/**
 * CREATE — Cria uma nova tarefa e adiciona ao array.
 *
 * @param {string} titulo       - Título da tarefa (obrigatório)
 * @param {string} descricao    - Descrição (opcional)
 * @param {string} prioridade   - "alta", "media" ou "baixa"
 * @param {string} vencimento   - Data no formato YYYY-MM-DD (opcional)
 * @param {string} categoria    - Categoria da tarefa (opcional)
 */
function criarTarefa(titulo, descricao, prioridade, vencimento, categoria) {
    // Cria o objeto tarefa com todos os seus atributos
    const novaTarefa = {
        id: gerarId(),          // ID único baseado no timestamp
        titulo: titulo.trim(),  // .trim() remove espaços extras
        descricao: descricao.trim(),
        prioridade,
        vencimento,
        categoria,
        concluida: false,       // Toda tarefa começa pendente
        criadaEm: new Date().toISOString() // Data de criação (formato ISO)
    };

    // Adiciona a nova tarefa ao início do array (mais recente primeiro)
    tarefas.unshift(novaTarefa);

    // Salva o array atualizado no localStorage
    salvarNoStorage(tarefas);

    return novaTarefa;
}

/**
 * UPDATE — Atualiza os dados de uma tarefa existente.
 *
 * @param {number} id    - ID da tarefa a atualizar
 * @param {Object} dados - Objeto com os campos a atualizar
 */
function atualizarTarefa(id, dados) {
    // Encontra o índice da tarefa no array
    const indice = tarefas.findIndex((t) => t.id === id);

    if (indice === -1) {
        console.warn("Tarefa não encontrada para atualização:", id);
        return;
    }

    /**
     * Operador spread (...):
     * Copia todas as propriedades do objeto original
     * e sobrescreve apenas as que estão em `dados`.
     * Isso garante que campos não editados sejam preservados.
     */
    tarefas[indice] = { ...tarefas[indice], ...dados };

    salvarNoStorage(tarefas);
}

/**
 * DELETE — Remove uma tarefa do array pelo ID.
 *
 * @param {number} id - ID da tarefa a remover
 */
function deletarTarefa(id) {
    // Pede confirmação antes de excluir (boa prática de UX)
    const confirmar = confirm("Tem certeza que deseja excluir esta tarefa?");
    if (!confirmar) return;

    /**
     * Array.filter() retorna um NOVO array
     * contendo apenas os elementos que passam no teste.
     * Elementos onde t.id === id são excluídos.
     */
    tarefas = tarefas.filter((t) => t.id !== id);

    salvarNoStorage(tarefas);
    renderizar();
}

/**
 * TOGGLE — Alterna o status concluída/pendente de uma tarefa.
 *
 * @param {number} id - ID da tarefa
 */
function alternarConclusao(id) {
    const tarefa = tarefas.find((t) => t.id === id);
    if (!tarefa) return;

    // O operador ! inverte o boolean: true → false, false → true
    atualizarTarefa(id, { concluida: !tarefa.concluida });
    renderizar();
}

/**
 * EDIT — Preenche o formulário com dados da tarefa para edição.
 *
 * @param {number} id - ID da tarefa a editar
 */
function iniciarEdicao(id) {
    const tarefa = tarefas.find((t) => t.id === id);
    if (!tarefa) return;

    // Armazena o ID para saber qual tarefa estamos editando
    idEdicao = id;

    // Preenche o formulário com os dados atuais da tarefa
    inputTitulo.value      = tarefa.titulo;
    inputDescricao.value   = tarefa.descricao;
    selectPrioridade.value = tarefa.prioridade;
    inputVencimento.value  = tarefa.vencimento;
    selectCategoria.value  = tarefa.categoria;

    // Muda o texto do botão para indicar modo de edição
    btnSubmit.textContent = "💾 Salvar Alterações";

    // Rola suavemente até o formulário
    formulario.scrollIntoView({ behavior: "smooth" });
    inputTitulo.focus();
}

/**
 * Salva as alterações após edição no formulário.
 */
function salvarEdicao(titulo, descricao, prioridade, vencimento, categoria) {
    atualizarTarefa(idEdicao, { titulo, descricao, prioridade, vencimento, categoria });

    // Reseta o modo de edição
    idEdicao = null;
    btnSubmit.textContent = "Adicionar Tarefa";

    renderizar();
}


/* ================================================
   5. RENDERIZAÇÃO
   ================================================
   Renderizar = transformar os dados em HTML visível.
   Toda vez que os dados mudam, re-renderizamos.
   ================================================ */

/**
 * Função principal de renderização.
 * Chama as funções específicas para cada parte da UI.
 */
function renderizar() {
    const tarefasFiltradas = filtrarTarefas();
    renderizarCards(tarefasFiltradas);
    renderizarTabela(tarefasFiltradas);
    atualizarEstatisticas();
}

/**
 * Renderiza os cards de tarefa na grade.
 *
 * @param {Array} lista - Array de tarefas a renderizar
 */
function renderizarCards(lista) {
    // Se não há tarefas, exibe mensagem
    if (lista.length === 0) {
        containerCards.innerHTML = `
            <div class="mensagem-vazia">
                <p>Nenhuma tarefa encontrada. Adicione uma nova tarefa acima!</p>
            </div>
        `;
        return;
    }

    /**
     * Array.map() transforma cada elemento em outra coisa.
     * Aqui: transforma cada tarefa em uma string HTML (card).
     *
     * Template literals (backticks ``) permitem:
     * - Strings multilinha
     * - Interpolação com ${expressão}
     */
    const html = lista.map((tarefa) => criarHtmlCard(tarefa)).join("");

    // innerHTML substitui todo o conteúdo do container
    containerCards.innerHTML = html;

    // Após injetar o HTML, adiciona os event listeners nos botões
    adicionarEventosBotoes();
}

/**
 * Cria a string HTML de um card de tarefa.
 *
 * @param   {Object} tarefa - Objeto tarefa
 * @returns {string}        - HTML do card
 */
function criarHtmlCard(tarefa) {
    // Desestruturação: extrai propriedades do objeto em variáveis
    const { id, titulo, descricao, prioridade, vencimento, categoria, concluida } = tarefa;

    // Formata a data de vencimento para exibição
    const dataFormatada = vencimento ? formatarData(vencimento) : "Sem prazo";
    const estaVencida   = vencimento ? verificarVencimento(vencimento) : false;

    // Classes CSS condicionais (operador ternário: condição ? valor_se_true : valor_se_false)
    const classeCard       = `card-tarefa prioridade-${prioridade} ${concluida ? "concluida" : ""}`;
    const classeData       = estaVencida && !concluida ? "data-vencida" : "";
    const textoBotaoConcluir = concluida ? "↩ Reabrir" : "✓ Concluir";

    return `
        <article class="${classeCard}" data-id="${id}">
            <div class="card-cabecalho">
                <h3 class="card-titulo">${escaparHtml(titulo)}</h3>
                <span class="badge badge-${prioridade}">${nomePrioridade(prioridade)}</span>
            </div>

            ${descricao ? `<p class="card-descricao">${escaparHtml(descricao)}</p>` : ""}

            <div class="card-meta">
                <span class="card-categoria">${nomeCategoria(categoria)}</span>
                <span class="card-data ${classeData}">
                    ${estaVencida && !concluida ? "⚠️ Vencida: " : "📅 "}${dataFormatada}
                </span>
            </div>

            <div class="card-acoes">
                <button class="btn btn-concluir" data-acao="concluir" data-id="${id}">
                    ${textoBotaoConcluir}
                </button>
                <button class="btn btn-editar" data-acao="editar" data-id="${id}">
                    ✏️ Editar
                </button>
                <button class="btn btn-excluir" data-acao="excluir" data-id="${id}">
                    🗑️ Excluir
                </button>
            </div>
        </article>
    `;
}

/**
 * Renderiza as linhas da tabela de tarefas.
 *
 * @param {Array} lista - Array de tarefas a renderizar
 */
function renderizarTabela(lista) {
    if (lista.length === 0) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color: #64748B; padding: 24px;">
                    Nenhuma tarefa encontrada.
                </td>
            </tr>
        `;
        return;
    }

    corpoTabela.innerHTML = lista.map((tarefa, indice) => `
        <tr class="${tarefa.concluida ? "linha-concluida" : ""}">
            <td>${indice + 1}</td>
            <td>${escaparHtml(tarefa.titulo)}</td>
            <td><span class="badge badge-${tarefa.prioridade}">${nomePrioridade(tarefa.prioridade)}</span></td>
            <td>${nomeCategoria(tarefa.categoria)}</td>
            <td>${tarefa.vencimento ? formatarData(tarefa.vencimento) : "—"}</td>
            <td><span class="status ${tarefa.concluida ? "concluida" : "pendente"}">
                ${tarefa.concluida ? "Concluída" : "Pendente"}
            </span></td>
            <td>
                <button class="btn btn-concluir" data-acao="concluir" data-id="${tarefa.id}">✓</button>
                <button class="btn btn-editar"   data-acao="editar"   data-id="${tarefa.id}">✏️</button>
                <button class="btn btn-excluir"  data-acao="excluir"  data-id="${tarefa.id}">🗑️</button>
            </td>
        </tr>
    `).join("");

    // Adiciona eventos nos botões da tabela também
    adicionarEventosBotoes();
}

/**
 * Adiciona event listeners nos botões de ação (cards + tabela).
 * Usa "event delegation": um listener no container captura
 * eventos de todos os filhos via target.
 */
function adicionarEventosBotoes() {
    // Botões dos cards
    adicionarDelegacao(containerCards);
    // Botões da tabela
    adicionarDelegacao(corpoTabela);
}

/**
 * Adiciona um listener de click no container e identifica
 * qual botão foi clicado pelo atributo data-acao.
 *
 * @param {HTMLElement} container - Elemento pai dos botões
 */
function adicionarDelegacao(container) {
    container.addEventListener("click", (evento) => {
        // evento.target: elemento que foi clicado
        const botao = evento.target.closest("[data-acao]");
        if (!botao) return;

        // Lê os atributos data-* do botão
        const acao = botao.dataset.acao;
        const id   = Number(botao.dataset.id); // converte string para número

        // Executa a ação correspondente
        if (acao === "concluir") alternarConclusao(id);
        if (acao === "editar")   iniciarEdicao(id);
        if (acao === "excluir")  deletarTarefa(id);
    });
}


/* ================================================
   6. FILTROS E BUSCA
   ================================================ */

/**
 * Retorna o array de tarefas filtrado pelo filtro ativo e busca.
 *
 * @returns {Array} - Tarefas filtradas
 */
function filtrarTarefas() {
    /**
     * Array.filter() percorre o array e retorna
     * apenas os elementos que passam no teste (função retorna true).
     */
    return tarefas.filter((tarefa) => {
        // Teste 1: filtragem por status/prioridade
        const passaFiltro = (
            filtroAtivo === "todas"     ||
            (filtroAtivo === "pendentes"  && !tarefa.concluida)  ||
            (filtroAtivo === "concluidas" && tarefa.concluida)   ||
            (filtroAtivo === "alta"       && tarefa.prioridade === "alta")
        );

        // Teste 2: busca por texto no título e descrição
        const passaBusca = textoBusca === "" || (
            tarefa.titulo.toLowerCase().includes(textoBusca.toLowerCase()) ||
            tarefa.descricao.toLowerCase().includes(textoBusca.toLowerCase())
        );

        // A tarefa só aparece se passar nos dois testes
        return passaFiltro && passaBusca;
    });
}

/**
 * Ativa o filtro selecionado e re-renderiza.
 *
 * @param {string} filtro - Nome do filtro
 */
function ativarFiltro(filtro) {
    filtroAtivo = filtro;

    // Atualiza a classe .ativo nos botões de filtro
    btnFiltros.forEach((btn) => {
        // Remove .ativo de todos
        btn.classList.remove("ativo");
        // Adiciona .ativo somente no botão selecionado
        if (btn.dataset.filtro === filtro) {
            btn.classList.add("ativo");
        }
    });

    renderizar();
}


/* ================================================
   7. ESTATÍSTICAS
   ================================================ */

/**
 * Atualiza os números exibidos nos cards de estatística.
 * Usa Array.filter() para contar tarefas por categoria.
 */
function atualizarEstatisticas() {
    const total      = tarefas.length;
    const concluidas = tarefas.filter((t) => t.concluida).length;
    const pendentes  = tarefas.filter((t) => !t.concluida).length;
    const alta       = tarefas.filter((t) => t.prioridade === "alta" && !t.concluida).length;

    // Atualiza o textContent de cada elemento de estatística
    document.getElementById("stat-total").textContent      = total;
    document.getElementById("stat-concluidas").textContent = concluidas;
    document.getElementById("stat-pendentes").textContent  = pendentes;
    document.getElementById("stat-alta").textContent       = alta;
}


/* ================================================
   8. LOCALSTORAGE — PERSISTÊNCIA DE DADOS
   ================================================
   localStorage salva dados no navegador do usuário.
   Os dados persistem mesmo após fechar o navegador.

   Limite: ~5MB por domínio.
   Apenas strings: usamos JSON para serializar/deserializar.
   ================================================ */

/** Chave usada para identificar os dados no localStorage */
const CHAVE_STORAGE = "taskschool_tarefas";

/**
 * Salva o array de tarefas no localStorage.
 * JSON.stringify() converte o array em uma string JSON.
 *
 * @param {Array} lista - Array de tarefas a salvar
 */
function salvarNoStorage(lista) {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));
}

/**
 * Carrega as tarefas do localStorage.
 * JSON.parse() converte a string JSON de volta para array.
 *
 * @returns {Array} - Array de tarefas (vazio se nenhuma salva)
 */
function carregarDoStorage() {
    const dados = localStorage.getItem(CHAVE_STORAGE);

    // Se não há dados salvos, retorna array vazio
    if (!dados) return [];

    // Tenta fazer o parse; se falhar, retorna array vazio
    try {
        return JSON.parse(dados);
    } catch (erro) {
        console.error("Erro ao carregar tarefas do storage:", erro);
        return [];
    }
}


/* ================================================
   9. EVENTOS
   ================================================
   Event listeners conectam ações do usuário (clicks,
   teclas, mudanças de campo) às funções da aplicação.
   ================================================ */

/**
 * EVENTO: Submit do formulário (adicionar ou editar tarefa)
 *
 * event.preventDefault() cancela o comportamento padrão
 * do formulário (que seria recarregar a página).
 */
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault(); // Impede o recarregamento da página

    // Lê os valores dos campos
    const titulo     = inputTitulo.value.trim();
    const descricao  = inputDescricao.value.trim();
    const prioridade = selectPrioridade.value;
    const vencimento = inputVencimento.value;
    const categoria  = selectCategoria.value;

    // Validação manual: campos obrigatórios
    if (!titulo) {
        mostrarErro(inputTitulo, "O título é obrigatório.");
        return;
    }
    if (!prioridade) {
        mostrarErro(selectPrioridade, "Selecione uma prioridade.");
        return;
    }

    // Verifica se estamos em modo de edição ou criação
    if (idEdicao !== null) {
        salvarEdicao(titulo, descricao, prioridade, vencimento, categoria);
    } else {
        criarTarefa(titulo, descricao, prioridade, vencimento, categoria);
        renderizar();
    }

    // Limpa e reseta o formulário após a operação
    formulario.reset();
});

/**
 * EVENTO: Busca em tempo real (a cada tecla digitada)
 *
 * O evento "input" dispara sempre que o valor do campo muda.
 */
inputBusca.addEventListener("input", (evento) => {
    textoBusca = evento.target.value;
    renderizar();
});

/**
 * EVENTO: Clique nos botões de filtro
 *
 * Usa forEach para adicionar listener em cada botão.
 */
btnFiltros.forEach((btn) => {
    btn.addEventListener("click", () => {
        ativarFiltro(btn.dataset.filtro);
    });
});

/**
 * EVENTO: Atalho de teclado ESC para cancelar edição
 */
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && idEdicao !== null) {
        idEdicao = null;
        btnSubmit.textContent = "Adicionar Tarefa";
        formulario.reset();
    }
});


/* ================================================
   10. UTILITÁRIOS
   ================================================
   Funções auxiliares genéricas usadas no projeto.
   ================================================ */

/**
 * Gera um ID único baseado no timestamp atual.
 * Date.now() retorna os milissegundos desde 01/01/1970.
 *
 * @returns {number} - ID único
 */
function gerarId() {
    return Date.now();
}

/**
 * Formata uma data no formato YYYY-MM-DD para DD/MM/YYYY.
 *
 * @param   {string} dataISO - Data no formato YYYY-MM-DD
 * @returns {string}          - Data no formato DD/MM/YYYY
 */
function formatarData(dataISO) {
    if (!dataISO) return "—";

    // Divide a string "2024-03-25" em ["2024", "03", "25"]
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
}

/**
 * Verifica se a data de vencimento já passou.
 *
 * @param   {string}  dataISO - Data no formato YYYY-MM-DD
 * @returns {boolean}         - true se a tarefa está vencida
 */
function verificarVencimento(dataISO) {
    const hoje     = new Date();
    const vencimento = new Date(dataISO + "T23:59:59");
    return vencimento < hoje;
}

/**
 * Retorna o nome legível da prioridade.
 *
 * @param   {string} prioridade - "alta", "media" ou "baixa"
 * @returns {string}            - Nome formatado
 */
function nomePrioridade(prioridade) {
    const nomes = {
        alta:  "🔴 Alta",
        media: "🟡 Média",
        baixa: "🟢 Baixa"
    };
    return nomes[prioridade] || prioridade;
}

/**
 * Retorna o nome legível da categoria.
 *
 * @param   {string} categoria - Slug da categoria
 * @returns {string}           - Nome formatado
 */
function nomeCategoria(categoria) {
    const nomes = {
        estudo:   "📚 Estudo",
        trabalho: "💼 Trabalho",
        pessoal:  "🏠 Pessoal",
        saude:    "❤️ Saúde"
    };
    return nomes[categoria] || "📌 Geral";
}

/**
 * Escapa caracteres HTML para evitar XSS (Cross-Site Scripting).
 * XSS: ataque onde código malicioso é injetado via inputs do usuário.
 *
 * @param   {string} texto - Texto a escapar
 * @returns {string}       - Texto seguro para inserir no HTML
 */
function escaparHtml(texto) {
    const mapa = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };
    return String(texto).replace(/[&<>"']/g, (char) => mapa[char]);
}

/**
 * Exibe uma mensagem de erro abaixo de um campo.
 *
 * @param {HTMLElement} campo    - Campo com erro
 * @param {string}      mensagem - Mensagem a exibir
 */
function mostrarErro(campo, mensagem) {
    campo.focus();

    // Adiciona uma classe visual de erro
    campo.style.borderColor = "#EF4444";

    // Cria ou atualiza a mensagem de erro
    let erroEl = campo.parentNode.querySelector(".erro-campo");
    if (!erroEl) {
        erroEl = document.createElement("span");
        erroEl.className = "erro-campo";
        erroEl.style.color = "#EF4444";
        erroEl.style.fontSize = "0.8rem";
        campo.parentNode.appendChild(erroEl);
    }
    erroEl.textContent = mensagem;

    // Remove o erro após 3 segundos
    setTimeout(() => {
        campo.style.borderColor = "";
        erroEl.remove();
    }, 3000);
}


/* ================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ================================================
   Chama init() para começar tudo quando o arquivo
   JavaScript é carregado pelo navegador.
   ================================================ */
init();
