const countryList = {
  AED:"AE",AFN:"AF",XCD:"AG",ALL:"AL",AMD:"AM",ANG:"AN",AOA:"AO",ARS:"AR",AUD:"AU",AZN:"AZ",
  BAM:"BA",BBD:"BB",BDT:"BD",XOF:"BE",BGN:"BG",BHD:"BH",BIF:"BI",BMD:"BM",BND:"BN",BOB:"BO",
  BRL:"BR",BSD:"BS",NOK:"BV",BWP:"BW",BZD:"BZ",CAD:"CA",CDF:"CD",XAF:"CF",CHF:"CH",CLP:"CL",
  CNY:"CN",COP:"CO",CRC:"CR",CUP:"CU",CVE:"CV",CZK:"CZ",DJF:"DJ",DKK:"DK",DOP:"DO",DZD:"DZ",
  EGP:"EG",ETB:"ET",EUR:"FR",FJD:"FJ",FKP:"FK",GBP:"GB",GEL:"GE",GHS:"GH",GIP:"GI",GMD:"GM",
  GNF:"GN",GTQ:"GT",GYD:"GY",HKD:"HK",HNL:"HN",HRK:"HR",HTG:"HT",HUF:"HU",IDR:"ID",ILS:"IL",
  INR:"IN",IQD:"IQ",IRR:"IR",ISK:"IS",JMD:"JM",JOD:"JO",JPY:"JP",KES:"KE",KGS:"KG",KHR:"KH",
  KMF:"KM",KPW:"KP",KRW:"KR",KWD:"KW",KYD:"KY",KZT:"KZ",LAK:"LA",LBP:"LB",LKR:"LK",LRD:"LR",
  LSL:"LS",LYD:"LY",MAD:"MA",MDL:"MD",MGA:"MG",MKD:"MK",MMK:"MM",MNT:"MN",MOP:"MO",MRO:"MR",
  MUR:"MU",MVR:"MV",MWK:"MW",MXN:"MX",MYR:"MY",MZN:"MZ",NAD:"NA",NGN:"NG",NIO:"NI",NPR:"NP",
  NZD:"NZ",OMR:"OM",PAB:"PA",PEN:"PE",PGK:"PG",PHP:"PH",PKR:"PK",PLN:"PL",PYG:"PY",QAR:"QA",
  RON:"RO",RSD:"RS",RUB:"RU",RWF:"RW",SAR:"SA",SBD:"SB",SCR:"SC",SDG:"SD",SEK:"SE",SGD:"SG",
  SLL:"SL",SOS:"SO",SRD:"SR",SYP:"SY",SZL:"SZ",THB:"TH",TJS:"TJ",TMT:"TM",TND:"TN",TRY:"TR",
  TTD:"TT",TWD:"TW",TZS:"TZ",UAH:"UA",UGX:"UG",USD:"US",UYU:"UY",UZS:"UZ",VND:"VN",YER:"YE",
  ZAR:"ZA",ZMK:"ZM"
};

const currencySymbols = {
  USD:"$",EUR:"€",GBP:"£",JPY:"¥",INR:"₹",CNY:"¥",KRW:"₩",RUB:"₽",
  TRY:"₺",BRL:"R$",CAD:"CA$",AUD:"A$",CHF:"Fr",HKD:"HK$",SGD:"S$"
};

const popularRates = [
  "EUR","GBP","JPY","INR","CNY","CAD","AUD","CHF","HKD","SGD",
  "AED","BRL","KRW","MXN","ZAR","NZD","SEK","NOK","DKK","THB",
  "MYR","PHP","IDR","PKR","TRY","RUB","SAR","QAR","KWD","NGN"
];

const BASE_URL = "https://api.exchangerate-api.com/v4/latest";

const fromSelect   = document.getElementById("from-select");
const toSelect     = document.getElementById("to-select");
const fromFlag     = document.getElementById("from-flag");
const toFlag       = document.getElementById("to-flag");
const fromSymbol   = document.getElementById("from-symbol");
const amountInput  = document.getElementById("amount-input");
const resultAmount = document.getElementById("result-amount");
const resultRate   = document.getElementById("result-rate");
const convertBtn   = document.getElementById("convert-btn");
const btnLabel     = document.getElementById("btn-label");
const swapBtn      = document.getElementById("swap-btn");
const lastUpdated  = document.getElementById("last-updated");
const liveTime     = document.getElementById("live-time");
const histList     = document.getElementById("history-list");
const clearHistBtn = document.getElementById("clear-hist");
const favGrid      = document.getElementById("fav-grid");
const addFavBtn    = document.getElementById("add-fav-btn");
const ratesTbody   = document.getElementById("rates-tbody");
const ratesBase    = document.getElementById("rates-base");
const refreshRatesBtn = document.getElementById("refresh-rates-btn");

let history   = JSON.parse(localStorage.getItem("fx_history")   || "[]");
let favorites = JSON.parse(localStorage.getItem("fx_favorites") || "[]");
let allRates  = {};

// Populate selects
for (let code in countryList) {
  [fromSelect, toSelect].forEach(sel => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = code;
    sel.appendChild(opt);
  });
}
fromSelect.value = "USD";
toSelect.value   = "INR";

function updateFlag(code, imgEl) {
  const cc = countryList[code];
  if (cc) imgEl.src = `https://flagsapi.com/${cc}/flat/64.png`;
}

function updateSymbol() {
  fromSymbol.textContent = currencySymbols[fromSelect.value] || fromSelect.value.slice(0, 1);
}

fromSelect.addEventListener("change", () => {
  updateFlag(fromSelect.value, fromFlag);
  updateSymbol();
});
toSelect.addEventListener("change", () => updateFlag(toSelect.value, toFlag));

// Swap button
swapBtn.addEventListener("click", () => {
  const tmp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value   = tmp;
  updateFlag(fromSelect.value, fromFlag);
  updateFlag(toSelect.value,   toFlag);
  updateSymbol();
  convert();
});

// Live clock
function updateClock() {
  liveTime.textContent = "Live rates · " + new Date().toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}
setInterval(updateClock, 1000);
updateClock();

// Core convert function
async function convert() {
  let amt = parseFloat(amountInput.value) || 1;
  if (amt <= 0) amt = 1;
  amountInput.value = amt;

  btnLabel.innerHTML = '<span class="spinner"></span>';
  convertBtn.disabled = true;

  try {
    const res = await fetch(`${BASE_URL}/${fromSelect.value}`);
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    allRates = data.rates;

    const rate = data.rates[toSelect.value];
    if (!rate) throw new Error("Invalid currency");

    const converted = (amt * rate).toFixed(4);
    const display   = parseFloat(converted).toLocaleString(undefined, { maximumFractionDigits: 4 });

    resultAmount.className  = "result-amount";
    resultAmount.textContent = `${display} ${toSelect.value}`;
    resultRate.textContent  = `1 ${fromSelect.value} = ${rate.toFixed(6)} ${toSelect.value}`;

    const ts = new Date().toLocaleString();
    lastUpdated.textContent = `Last updated: ${ts}`;

    // Save history entry
    history.unshift({ from: fromSelect.value, to: toSelect.value, amt, result: display, rate: rate.toFixed(4), time: ts });
    if (history.length > 20) history.pop();
    localStorage.setItem("fx_history", JSON.stringify(history));
    renderHistory();

    // Update live rates panel
    ratesBase.textContent = fromSelect.value;
    renderRates(data.rates, fromSelect.value);

  } catch (e) {
    resultAmount.className   = "result-error";
    resultAmount.textContent = "Failed to fetch rates.";
    resultRate.textContent   = "";
  } finally {
    btnLabel.textContent    = "Get Exchange Rate";
    convertBtn.disabled     = false;
  }
}

convertBtn.addEventListener("click", convert);
amountInput.addEventListener("keydown", e => { if (e.key === "Enter") convert(); });

// History
function renderHistory() {
  if (!history.length) {
    histList.innerHTML = '<div class="history-empty">No conversions yet.</div>';
    return;
  }
  histList.innerHTML = history.map((h, i) => `
    <div class="history-item" data-i="${i}">
      <span class="from-val">${h.amt} ${h.from}</span>
      <span class="to-val">= ${h.result} ${h.to}</span>
      <span class="hist-time">${h.time}</span>
      <button class="hist-del" data-i="${i}" title="Remove">✕</button>
    </div>
  `).join("");

  histList.querySelectorAll(".history-item").forEach(el => {
    el.addEventListener("click", e => {
      if (e.target.classList.contains("hist-del")) return;
      const h = history[el.dataset.i];
      fromSelect.value = h.from;
      toSelect.value   = h.to;
      amountInput.value = h.amt;
      updateFlag(h.from, fromFlag);
      updateFlag(h.to, toFlag);
      updateSymbol();
      convert();
    });
  });

  histList.querySelectorAll(".hist-del").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      history.splice(btn.dataset.i, 1);
      localStorage.setItem("fx_history", JSON.stringify(history));
      renderHistory();
    });
  });
}

clearHistBtn.addEventListener("click", () => {
  history = [];
  localStorage.setItem("fx_history", "[]");
  renderHistory();
});

// Favorites
function renderFavorites() {
  if (!favorites.length) {
    favGrid.innerHTML = '<div class="fav-empty" style="grid-column:span 2">No saved pairs yet.</div>';
    return;
  }
  favGrid.innerHTML = favorites.map((f, i) => `
    <div class="fav-item" data-i="${i}">
      <div class="fav-flags">
        <img src="https://flagsapi.com/${countryList[f.from]||"US"}/flat/32.png" alt="${f.from}"/>
        <img src="https://flagsapi.com/${countryList[f.to]||"IN"}/flat/32.png"   alt="${f.to}"/>
      </div>
      <span class="fav-pair">${f.from} → ${f.to}</span>
      <button class="fav-del" data-i="${i}" title="Remove">✕</button>
    </div>
  `).join("");

  favGrid.querySelectorAll(".fav-item").forEach(el => {
    el.addEventListener("click", e => {
      if (e.target.classList.contains("fav-del")) return;
      const f = favorites[el.dataset.i];
      fromSelect.value = f.from;
      toSelect.value   = f.to;
      updateFlag(f.from, fromFlag);
      updateFlag(f.to,   toFlag);
      updateSymbol();
      convert();
      switchTab("history");
    });
  });

  favGrid.querySelectorAll(".fav-del").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      favorites.splice(btn.dataset.i, 1);
      localStorage.setItem("fx_favorites", JSON.stringify(favorites));
      renderFavorites();
    });
  });
}

addFavBtn.addEventListener("click", () => {
  const pair = { from: fromSelect.value, to: toSelect.value };
  if (favorites.some(f => f.from === pair.from && f.to === pair.to)) return;
  favorites.push(pair);
  localStorage.setItem("fx_favorites", JSON.stringify(favorites));
  renderFavorites();
});

// Live Rates
function renderRates(rates, base) {
  const rows = popularRates
    .filter(c => c !== base)
    .map(c => {
      const r = rates[c];
      if (!r) return "";
      return `<tr><td>${c}</td><td style="color:var(--text3)">${countryList[c] || "—"}</td><td>${r.toFixed(4)}</td></tr>`;
    }).join("");
  ratesTbody.innerHTML = rows || '<tr><td colspan="3" style="color:var(--text3);padding:1rem 0">Fetch a rate first.</td></tr>';
}

refreshRatesBtn.addEventListener("click", convert);

// Tabs
function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + name));
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

// Init
renderHistory();
renderFavorites();
convert();
