(function(){
  const KEY = "pj_cookie_consent_v1";
  const banner = document.getElementById("cookieBanner");
  const status = document.getElementById("cookieStatus");
  const consent = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch(e){ return null; } })();

  function setStatus(msg){ if(status) status.textContent = msg; }
  function applyConsent(c){
    if(c && c.analytics){
      window.__mockAnalyticsEnabled = true;
      setStatus("Analytics cookies: enabled.");
    } else {
      window.__mockAnalyticsEnabled = false;
      setStatus("Analytics cookies: disabled.");
    }
  }
  function showBanner(){ banner?.setAttribute("open",""); }
  function hideBanner(){ banner?.removeAttribute("open"); }

  if(!consent){ showBanner(); } else { applyConsent(consent); }

  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-consent]");
    if(!btn) return;
    const choice = btn.getAttribute("data-consent");
    const c = { necessary:true, analytics: choice === "accept", marketing:false, timestamp:new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(c));
    applyConsent(c);
    hideBanner();
  });

  const cartKey = "pj_cart_v1";
  function loadCart(){ try { return JSON.parse(localStorage.getItem(cartKey)) || []; } catch(e){ return []; } }
  function saveCart(items){ localStorage.setItem(cartKey, JSON.stringify(items)); updateCartCount(); }
  function updateCartCount(){
    const el = document.getElementById("cartCount");
    if(!el) return;
    const items = loadCart();
    const count = items.reduce((a,i)=>a+(i.qty||1),0);
    el.textContent = String(count);
  }
  updateCartCount();

  document.addEventListener("click", (ev) => {
    const add = ev.target.closest("[data-add-to-cart]");
    if(!add) return;
    const sku = add.getAttribute("data-add-to-cart");
    const name = add.getAttribute("data-name") || "Item";
    const price = Number(add.getAttribute("data-price") || "0");
    const items = loadCart();
    const found = items.find(i=>i.sku===sku);
    if(found) found.qty += 1;
    else items.push({sku, name, price, qty:1});
    saveCart(items);

    const live = document.getElementById("liveRegion");
    if(live){
      live.textContent = name + " added to cart.";
      setTimeout(()=>{ live.textContent = ""; }, 1500);
    }
  });

  const cartTable = document.getElementById("cartTableBody");
  if(cartTable){
    const items = loadCart();
    if(items.length === 0){
      cartTable.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
    } else {
      cartTable.innerHTML = items.map(i => {
        const total = (i.price * i.qty).toFixed(2);
        return `<tr>
          <td>${escapeHtml(i.name)}</td>
          <td>${escapeHtml(i.sku)}</td>
          <td>${i.qty}</td>
          <td>€ ${total}</td>
        </tr>`;
      }).join("");
    }
    const totalEl = document.getElementById("cartTotal");
    if(totalEl){
      const sum = items.reduce((a,i)=>a+i.price*i.qty,0);
      totalEl.textContent = "€ " + sum.toFixed(2);
    }
    document.getElementById("clearCart")?.addEventListener("click", ()=>{
      localStorage.removeItem(cartKey);
      location.reload();
    });
  }

  window.playJoystickSound = function(kind="click"){
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) return false;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){
      data[i] = (Math.random()*2-1) * (1 - i/data.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, now);
    nGain.gain.exponentialRampToValueAtTime(0.12, now + 0.004);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    const osc = ctx.createOscillator();
    osc.type = "square";
    const base = kind === "diagonal" ? 420 : 520;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base*1.8, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(base*0.9, now + 0.08);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.001, now);
    oGain.gain.exponentialRampToValueAtTime(0.08, now + 0.005);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    const master = ctx.createGain();
    master.gain.value = 0.7;

    noise.connect(nGain).connect(master);
    osc.connect(oGain).connect(master);
    master.connect(ctx.destination);

    noise.start(now);
    osc.start(now);
    noise.stop(now + 0.07);
    osc.stop(now + 0.10);

    setTimeout(()=>ctx.close(), 180);
    return true;
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
})();