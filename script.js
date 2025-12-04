let products = [];
let currentCategory = "";

// --------------------------------------
// FUTURO-PROOF: Carica i prodotti (statico ora)
// --------------------------------------
// --------------------------------------
// Carica i prodotti da products.json
// --------------------------------------
async function loadProductsData() {
  try {
    // se index.html e products.json sono nella stessa cartella
    const res = await fetch("products.json");

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();

    // opzionale: controllino veloce che sia un array
    if (!Array.isArray(data)) {
      throw new Error("Formato JSON non valido (atteso array)");
    }

    return data;
  } catch (err) {
    console.error("Errore caricamento products.json:", err);
    // se vuoi, qui puoi mostrare un messaggio a schermo
    return [];
  }
}


// --------------------------------------
// INIT
// --------------------------------------
window.onload = async function () {
    products = await loadProductsData();

    if (window.Telegram?.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.ready();
    }
};


// --------------------------------------
// NAVIGAZIONE
// --------------------------------------
function showScreen(screenId) {
    // Se sto uscendo dalla pagina prodotto → stoppo il video
    if (screenId !== 'product-screen') {
        const video = document.getElementById('product-video');
        if (video) {
            video.pause();
            video.currentTime = 0; // torni all'inizio
        }
    }

    // Nascondi tutte le schermate
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Mostra quella richiesta
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.scrollTop = 0;
    }

    // Aggiorna stato Footer
    updateFooter(screenId);
}


function updateFooter(id) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    if (["home-screen", "category-screen", "product-screen"].includes(id))
        document.getElementById("nav-home").classList.add("active");

    else if (id === "info-screen")
        document.getElementById("nav-info").classList.add("active");

    else if (id === "links-screen")
        document.getElementById("nav-links").classList.add("active");
}

// --------------------------------------
// CATEGORIE
// --------------------------------------
function openCategory(categoryName) {
    currentCategory = categoryName;

    document.getElementById("category-title").innerText = categoryName;
    document.getElementById("search-bar").value = "";

    populateFarmSelect();
    filterProducts();
    showScreen('category-screen');
}


// --------------------------------------
// FILTRI
// --------------------------------------
function populateFarmSelect() {
    const select = document.getElementById("farm-select");
    select.innerHTML = `<option value="all">Tutte le Farm</option>`;

    [...new Set(products
        .filter(p => p.category === currentCategory)
        .map(p => p.farm)
    )].forEach(f => {
        const opt = document.createElement("option");
        opt.value = f;
        opt.innerText = f;
        select.appendChild(opt);
    });
}

function filterProducts() {
    const search = document.getElementById("search-bar").value.toLowerCase();
    const farm = document.getElementById("farm-select").value;
    const box = document.getElementById("product-list");

    box.innerHTML = "";

    const filtered = products.filter(p =>
        p.category === currentCategory &&
        p.name.toLowerCase().includes(search) &&
        (farm === "all" || p.farm === farm)
    );

    // 👉 Se non ci sono prodotti, mostra il messaggio
    if (filtered.length === 0) {
        const msg = document.createElement("div");
        msg.className = "no-products-message";
        msg.textContent = "Non ci sono prodotti in questa categoria";
        box.appendChild(msg);
        return;
    }

    filtered.forEach(prod => {
        const card = document.createElement("div");
        card.className = "product-item";

    const thumbHTML = prod.thumb
        ? `<img src="${prod.thumb}"
                class="prod-thumb-small"
                loading="lazy"
                alt="${prod.name}">`: "";


        card.innerHTML = `
            ${thumbHTML}
            <div class="product-info">
                <div class="product-name">${prod.name}</div>
                <div class="product-meta">${prod.farm}</div>
            </div>
        `;

        card.onclick = () => openProduct(prod.id);
        box.appendChild(card);
    });
}


// --------------------------------------
// PRODUCT PAGE
// --------------------------------------
function openProduct(id) {
    const p = products.find(pr => pr.id === id);
    if (!p) return;

    document.getElementById("product-title").innerText = p.name;
    document.getElementById("product-farm-top").innerText = p.farm;

    // VIDEO
    const videoWrap = document.getElementById("product-video-wrapper");
    if (p.videoUrl) {
        videoWrap.classList.remove("hidden");
        document.getElementById("product-video-src").src = p.videoUrl;
        document.getElementById("product-video").load();
    } else videoWrap.classList.add("hidden");

    // TARIFE
    const grid = document.getElementById("tariffs-grid");
    grid.innerHTML = "";

    p.tariffs.forEach(t => {
        const box = document.createElement("div");
        box.className = "tariff-card";
        box.innerHTML = `
            <div class="tariff-quantity">${t.label}</div>
            <div class="tariff-price">${t.price}</div>
        `;
        grid.appendChild(box);
    });

    showScreen('product-screen');
}


// --------------------------------------
// INFO CARD
// --------------------------------------
function toggleInfoCard(key) {
    document.querySelectorAll(".info-card").forEach(card => {
        const open = card.id === "info-" + key;
        if (open) card.classList.toggle("open");
        else card.classList.remove("open");
    });
}
