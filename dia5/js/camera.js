
// ==========================================================
// camera.js - Dia 5: câmera do celular e galeria de fotos
// RECURSO DE HARDWARE: câmera frontal e traseira
// Exige HTTPS (ou arquivo local/localhost) e permissão.
// ==========================================================

const areaCamera = document.querySelector("#area-camera");
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const btnLigarCamera = document.querySelector("#btn-ligar-camera");
const btnFoto = document.querySelector("#btn-foto");
const btnTrocarCamera = document.querySelector("#btn-trocar-camera");
const inputFoto = document.querySelector("#input-foto");
const galeria = document.querySelector("#galeria");

let stream = null;
let cameraAtual = "environment";

// ---------- Ligar e desligar ----------

async function ligarCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    mostrarAviso("Câmera indisponível. Abra o app pelo link https://");
    return;
  }

  desligarCamera();

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraAtual },
      audio: false
    });

    video.srcObject = stream;
    video.classList.toggle("espelhado", cameraAtual === "user");
    areaCamera.classList.add("ligada");
    btnFoto.disabled = false;
    btnTrocarCamera.disabled = false;
    btnLigarCamera.textContent = "Desligar";

  } catch (erro) {
    console.log(erro);

    if (erro.name === "NotAllowedError" ||
        erro.name === "PermissionDeniedError") {
      mostrarAviso("Você precisa permitir o uso da câmera");
    } else {
      mostrarAviso("Não foi possível abrir a câmera (" + erro.name + ")");
    }
  }
}

function desligarCamera() {
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    stream = null;
  }

  video.srcObject = null;
  areaCamera.classList.remove("ligada");
  btnFoto.disabled = true;
  btnTrocarCamera.disabled = true;
  btnLigarCamera.textContent = "Ligar câmera";
}

function trocarCamera() {
  cameraAtual = cameraAtual === "environment"
    ? "user"
    : "environment";

  ligarCamera();
}

btnLigarCamera.addEventListener("click", function () {
  if (stream) {
    desligarCamera();
  } else {
    ligarCamera();
  }
});

btnTrocarCamera.addEventListener("click", trocarCamera);

// ---------- Fotos ----------

function carregarFotos() {
  try {
    const salvas = localStorage.getItem("fotos");
    return salvas ? JSON.parse(salvas) : [];
  } catch (erro) {
    console.log("Erro ao carregar fotos:", erro);
    return [];
  }
}

let fotos = carregarFotos();

function salvarFotos() {
  try {
    localStorage.setItem("fotos", JSON.stringify(fotos));
  } catch (erro) {
    fotos.pop();

    mostrarAviso("Galeria cheia: a foto mais antiga foi removida");

    try {
      localStorage.setItem("fotos", JSON.stringify(fotos));
    } catch (novoErro) {
      console.log("Não foi possível salvar a galeria:", novoErro);
    }
  }
}

// Salva a imagem com legenda e qualidade maior
function guardarImagem(fonte, larguraOriginal, alturaOriginal) {

  const legenda = prompt("Legenda da foto:");

  if (legenda === null) {
    return false;
  }

  const largura = 1080;
  const altura = Math.round(
    (alturaOriginal / larguraOriginal) * largura
  );

  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");
  contexto.drawImage(fonte, 0, 0, largura, altura);

  // Qualidade JPEG de 95%
  const imagem = canvas.toDataURL("image/jpeg", 0.95);

  fotos.unshift({
    imagem: imagem,
    legenda: legenda.trim() || "Sem legenda",
    data: new Date().toLocaleString("pt-BR")
  });

  if (fotos.length > 12) {
    fotos.pop();
  }

  salvarFotos();
  mostrarGaleria();

  return true;
}

function tirarFoto() {
  if (!stream) {
    return;
  }

  const salva = guardarImagem(
    video,
    video.videoWidth,
    video.videoHeight
  );

  if (!salva) {
    return;
  }

  // Efeito de flash e vibração
  areaCamera.classList.remove("flash");
  void areaCamera.offsetWidth;
  areaCamera.classList.add("flash");

  vibrar(30);
  mostrarAviso("📸 Foto salva na galeria");
}

btnFoto.addEventListener("click", tirarFoto);

// ---------- Importar foto do celular ----------

inputFoto.addEventListener("change", function () {
  const arquivo = inputFoto.files[0];

  if (!arquivo) {
    return;
  }

  const img = new Image();

  img.onload = function () {
    const salva = guardarImagem(
      img,
      img.naturalWidth,
      img.naturalHeight
    );

    URL.revokeObjectURL(img.src);

    if (salva) {
      mostrarAviso("📸 Foto salva na galeria");
    }
  };

  img.onerror = function () {
    URL.revokeObjectURL(img.src);
    mostrarAviso("Não foi possível carregar essa imagem");
  };

  img.src = URL.createObjectURL(arquivo);

  inputFoto.value = "";
});

// ---------- Galeria e contador ----------

function mostrarGaleria() {
  galeria.innerHTML = "";

  // Atualiza a quantidade de fotos
  const contador = document.querySelector("#contador-fotos");

  if (contador) {
    contador.textContent = fotos.length;
  }

  if (fotos.length === 0) {
    galeria.innerHTML = '<p class="vazio">Nenhuma foto ainda.</p>';
    return;
  }

  for (const foto of fotos) {
    const div = document.createElement("div");
    div.className = "foto";

    // Mantém compatibilidade com fotos antigas
    const legenda = foto.legenda || foto.data || "Sem legenda";

    div.innerHTML = `
      <img src="${foto.imagem}" alt="Foto do meu café">
      <small></small>
      <div class="foto-acoes">
        <button class="btn-compartilhar-foto" aria-label="Compartilhar foto">
          📤
        </button>
      </div>
    `;

    div.querySelector("small").textContent = legenda;

    div.querySelector(".btn-compartilhar-foto")
      .addEventListener("click", function () {
        compartilharFoto(foto);
      });

    galeria.appendChild(div);
  }
}

// ---------- Início ----------

mostrarGaleria();
