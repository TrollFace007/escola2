const STORAGE_KEY = "educontrol_alunos_v1";
const $ = (id) => document.getElementById(id);
const lerAlunos = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
};
const salvarAlunos = (alunos) => localStorage.setItem(STORAGE_KEY, JSON.stringify(alunos));
const iniciais = (nome = "") => nome.trim().split(/\s+/).slice(0,2).map(p => p[0] || "").join("").toUpperCase();
const escapar = (valor = "") => String(valor).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const gerarId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

document.addEventListener("DOMContentLoaded", () => {
  // Login demonstrativo, sem autenticação real de servidor.
  const login = $("loginForm");
  if (login) login.addEventListener("submit", e => {
    e.preventDefault();
    sessionStorage.setItem("educontrol_sessao", "ativa");
    window.location.href = "dashboard.html";
  });

  document.querySelectorAll(".logout").forEach(btn => btn.addEventListener("click", () => {
    sessionStorage.removeItem("educontrol_sessao");
    window.location.href = "index.html";
  }));
  const menuToggle = document.querySelector(".menu-toggle");
  if (menuToggle) menuToggle.addEventListener("click", () => document.querySelector(".topbar nav")?.classList.toggle("open"));

  const form = $("alunoForm");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const alunos = lerAlunos();
      const id = $("alunoId").value;
      const aluno = {
        id: id || gerarId(),
        nome: $("nome").value.trim(),
        idade: Number($("idade").value),
        sexo: $("sexo").value,
        telefone: $("telefone").value.trim(),
        email: $("email").value.trim().toLowerCase(),
        atualizadoEm: new Date().toISOString()
      };
      if (!aluno.nome || !aluno.email || !Number.isInteger(aluno.idade) || aluno.idade < 1 || aluno.idade > 120) {
        $("formStatus").textContent = "Confira os campos obrigatórios.";
        return;
      }
      const emailDuplicado = alunos.some(a => a.email === aluno.email && a.id !== id);
      if (emailDuplicado) {
        $("formStatus").textContent = "Já existe um aluno com esse e-mail.";
        return;
      }
      if (id) {
        const index = alunos.findIndex(a => a.id === id);
        if (index >= 0) alunos[index] = aluno;
        $("formStatus").textContent = "Cadastro atualizado com sucesso!";
      } else {
        alunos.unshift(aluno);
        $("formStatus").textContent = "Aluno cadastrado com sucesso!";
      }
      salvarAlunos(alunos);
      form.reset();
      $("alunoId").value = "";
      $("salvarBtn").textContent = "Salvar aluno";
      renderRecentes();
    });
    form.addEventListener("reset", () => setTimeout(() => {
      $("alunoId").value = "";
      $("salvarBtn").textContent = "Salvar aluno";
      $("formStatus").textContent = "";
    }, 0));
    renderRecentes();
  }

  if ($("tabelaAlunos")) {
    $("buscaAluno").addEventListener("input", renderTabela);
    $("filtroSexo").addEventListener("change", renderTabela);
    $("tabelaAlunos").addEventListener("click", e => {
      const button = e.target.closest("button[data-action]");
      if (!button) return;
      const id = button.dataset.id;
      const alunos = lerAlunos();
      const aluno = alunos.find(a => a.id === id);
      if (!aluno) return;
      if (button.dataset.action === "editar") {
        window.location.href = `cadastro.html?editar=${encodeURIComponent(id)}`;
      } else if (button.dataset.action === "excluir") {
        if (confirm(`Deseja realmente excluir o cadastro de ${aluno.nome}?`)) {
          salvarAlunos(alunos.filter(a => a.id !== id));
          renderTabela();
        }
      }
    });
    renderTabela();
  }

  if (form && new URLSearchParams(location.search).has("editar")) {
    const id = new URLSearchParams(location.search).get("editar");
    const aluno = lerAlunos().find(a => a.id === id);
    if (aluno) {
      $("alunoId").value = aluno.id;
      $("nome").value = aluno.nome;
      $("idade").value = aluno.idade;
      $("sexo").value = aluno.sexo || "";
      $("telefone").value = aluno.telefone || "";
      $("email").value = aluno.email;
      $("salvarBtn").textContent = "Salvar alterações";
      document.querySelector("h1").textContent = "Editar cadastro";
    }
  }

  if ($("statTotal")) {
    const alunos = lerAlunos();
    $("statTotal").textContent = alunos.length;
    $("statRecent").textContent = alunos.slice(0, 5).length;
  }

  const contato = $("contatoForm");
  if (contato) contato.addEventListener("submit", e => {
    e.preventDefault();
    $("contatoStatus").textContent = "Mensagem registrada nesta demonstração. Obrigado!";
    contato.reset();
  });
});

function renderRecentes() {
  const alvo = $("recentes");
  if (!alvo) return;
  const alunos = lerAlunos().slice(0, 4);
  alvo.innerHTML = alunos.length ? alunos.map(a => `
    <div class="recent-item"><div class="avatar">${escapar(iniciais(a.nome))}</div>
    <div><b>${escapar(a.nome)}</b><small>${escapar(a.email)}</small></div>
    <a href="listagem.html">Consultar</a></div>`).join("") :
    '<p class="muted small">Nenhum cadastro por enquanto. Use o formulário acima para adicionar o primeiro aluno.</p>';
}
function renderTabela() {
  const tbody = $("tabelaAlunos");
  if (!tbody) return;
  const termo = $("buscaAluno").value.trim().toLowerCase();
  const sexo = $("filtroSexo").value;
  const alunos = lerAlunos().filter(a =>
    (a.nome.toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo)) &&
    (!sexo || a.sexo === sexo)
  );
  tbody.innerHTML = alunos.map(a => `<tr>
    <td><div class="student-cell"><div class="avatar">${escapar(iniciais(a.nome))}</div><div>${escapar(a.nome)}<small>${escapar(a.email)}</small></div></div></td>
    <td>${escapar(a.idade)}</td><td>${escapar(a.sexo || "—")}</td><td>${escapar(a.telefone || "—")}</td>
    <td><div class="table-actions"><button class="icon-btn edit" data-action="editar" data-id="${escapar(a.id)}" title="Editar">✎</button><button class="icon-btn delete" data-action="excluir" data-id="${escapar(a.id)}" title="Excluir">⌫</button></div></td></tr>`).join("");
  $("vazio").hidden = alunos.length > 0;
  $("totalAlunos").textContent = `${alunos.length} aluno(s) exibido(s)`;
}
