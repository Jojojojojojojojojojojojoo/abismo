firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const fichasArea = document.getElementById("fichas-area");
const formFicha = document.getElementById("form-ficha");
const listaFichas = document.getElementById("lista-fichas");

let currentUser = null;

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    fichasArea.style.display = "block";
    carregarFichas();
  } else {
    currentUser = null;
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    fichasArea.style.display = "none";
  }
});

loginBtn.onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
logoutBtn.onclick = () => auth.signOut();

formFicha.onsubmit = async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(formFicha).entries());

  const fichasSnapshot = await db.collection("fichas")
    .where("uid", "==", currentUser.uid).get();

  if (fichasSnapshot.size >= 10) {
    alert("Você atingiu o limite de 10 fichas.");
    return;
  }

  await db.collection("fichas").add({
    ...data,
    uid: currentUser.uid,
    criado: new Date()
  });

  formFicha.reset();
  carregarFichas();
};

// Função para carregar fichas (já existente, mas atualizada)
async function carregarFichas() {
  listaFichas.innerHTML = "";
  const snapshot = await db.collection("fichas")
    .where("uid", "==", currentUser.uid)
    .orderBy("criado", "desc")
    .get();

  snapshot.forEach(doc => {
    const ficha = doc.data();
    const item = document.createElement("li");
    item.innerHTML = `
      ${ficha.nome} (${ficha.classe}) - Força: ${ficha.forca}
      <button onclick="editarFicha('${doc.id}', '${ficha.nome}', '${ficha.classe}', '${ficha.forca}')">Editar</button>
      <button onclick="deletarFicha('${doc.id}')">Excluir</button>
    `;
    listaFichas.appendChild(item);
  });
}

// Função para deletar ficha
async function deletarFicha(id) {
  if (confirm("Tem certeza que quer excluir esta ficha?")) {
    await db.collection("fichas").doc(id).delete();
    carregarFichas();
  }
}

// Função para abrir o modal de edição
function editarFicha(id, nome, classe, forca) {
  const modal = document.getElementById("editar-ficha-modal");
  const form = document.getElementById("editar-ficha-form");
  form.reset();
  form.nome.value = nome;
  form.classe.value = classe;
  form.forca.value = forca;
  modal.style.display = "block";

  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    await db.collection("fichas").doc(id).update(data);
    modal.style.display = "none";
    carregarFichas();
  };
}

}
