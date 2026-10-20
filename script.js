// Файлы модели лежат в той же папке, что и этот скрипт
const MODEL_URL = "model.json";
const METADATA_URL = "metadata.json";

const $ = id => document.getElementById(id);
let model, webcam, running = false;

function show(predictions) {
  $("res").innerHTML = predictions
    .slice()
    .sort((a, b) => b.probability - a.probability)
    .map(p => {
      const v = Math.round(p.probability * 100);
      return `<div class="row"><div><span>${p.className}</span><b>${v}%</b></div><div class="t"><i style="width:${v}%"></i></div></div>`;
    })
    .join("");
}

async function init() {
  try {
    model = await tmImage.load(MODEL_URL, METADATA_URL);
    $("st").textContent = "Модель готова.";
  } catch (e) {
    $("st").textContent = "Не удалось загрузить модель: " + e.message;
  }
}

function stopCamera() {
  running = false;
  if (webcam) {
    try { webcam.stop(); } catch (e) {}
    webcam = null;
  }
  $("cam").textContent = "Включить камеру";
}

$("f").onchange = e => {
  const file = e.target.files[0];
  if (!file || !model) return;
  stopCamera();
  const img = new Image();
  img.onload = async () => {
    $("view").replaceChildren(img);
    show(await model.predict(img));
  };
  img.src = URL.createObjectURL(file);
};

$("cam").onclick = async () => {
  if (running) { stopCamera(); return; }
  if (!model) return;
  try {
    webcam = new tmImage.Webcam(224, 224, true);
    await webcam.setup();
    await webcam.play();
    running = true;
    $("cam").textContent = "Выключить камеру";
    $("view").replaceChildren(webcam.canvas);
    (async function loop() {
      if (!running) return;
      webcam.update();
      show(await model.predict(webcam.canvas));
      requestAnimationFrame(loop);
    })();
  } catch (e) {
    stopCamera();
    $("st").textContent = "Камера недоступна, загрузи фото.";
  }
};

init();
