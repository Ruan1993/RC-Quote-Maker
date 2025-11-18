const state = {
  company: { name: "", email: "", phone: "", address: "", vat: "", bankName: "", bankAccountName: "", bankAccountNumber: "", bankBranchCode: "", logoUrl: "", logoFile: null },
  client: { name: "", email: "", phone: "", address: "", vat: "" },
  meta: { quoteNumber: "", date: "", dueDate: "", validUntil: "", docType: "Quote", currency: "ZAR", taxRate: 0, docId: null, vatExclusive: false },
  items: [],
  notes: "",
  inclusions: "",
  exclusions: "",
  paymentTerms: "",
  acceptance: "",
  include: { inclusions: true, exclusions: true, paymentTerms: true, acceptance: true, notes: true }
};

const el = {
  // REMOVED: logoUrl input element as it was removed from index.html
  logoFile: document.getElementById("logoFile"),
  pvCompanyLogo: document.getElementById("pvCompanyLogo"),
  // Existing elements
  companyName: document.getElementById("companyName"),
  companyEmail: document.getElementById("companyEmail"),
  companyPhone: document.getElementById("companyPhone"),
  companyAddress: document.getElementById("companyAddress"),
  clientName: document.getElementById("clientName"),
  clientEmail: document.getElementById("clientEmail"),
  clientPhone: document.getElementById("clientPhone"),
  clientAddress: document.getElementById("clientAddress"),
  quoteNumber: document.getElementById("quoteNumber"),
  quoteDate: document.getElementById("quoteDate"),
  currency: document.getElementById("currency"),
  taxRate: document.getElementById("taxRate"),
  notes: document.getElementById("notes"),
  itemsContainer: document.getElementById("itemsContainer"),
  addItemBtn: document.getElementById("addItemBtn"),
  previewDownloadBtn: document.getElementById("previewDownloadBtn"),
  saveQuoteBtn: document.getElementById("saveQuoteBtn"),
  vatNoteToggle: document.getElementById("vatNoteToggle"),
  pvCompanyName: document.getElementById("pvCompanyName"),
  pvCompanyDetails: document.getElementById("pvCompanyDetails"),
  pvClientDetails: document.getElementById("pvClientDetails"),
  pvQuoteNumber: document.getElementById("pvQuoteNumber"),
  pvQuoteDate: document.getElementById("pvQuoteDate"),
  pvItems: document.getElementById("pvItems"),
  pvSubtotal: document.getElementById("pvSubtotal"),
  pvTax: document.getElementById("pvTax"),
  pvGrandTotal: document.getElementById("pvGrandTotal"),
  pvNotes: document.getElementById("pvNotes")
};
const quotesEl={refreshBtn:document.getElementById("refreshQuotesBtn"),list:document.getElementById("quotesList")};
const previewEl={
  previewBtn:document.getElementById("previewDownloadBtn"),
  modal:document.getElementById("previewModal"),
  closeBtn:document.getElementById("closePreviewBtn"),
  modalQuoteContainer:document.getElementById("modalQuoteContainer"),
  zoomInBtn:document.getElementById("zoomInBtn"),
  zoomOutBtn:document.getElementById("zoomOutBtn"),
  downloadBtn:document.getElementById("downloadInModalBtn")
};
const printEl={host:document.getElementById("printHost")};
let previewScale=1;
const invoiceBtn=document.getElementById("invoiceMakerBtn");
const quoteBtn=document.getElementById("quoteMakerBtn");

function init() {
  const d = new Date();
  el.quoteDate.value = d.toISOString().slice(0, 10);
  state.meta.date = el.quoteDate.value;
  bindInputs();
  addItem();
  renderQuote();
  if (typeof window.firebaseConfig !== "undefined" && window.FirebaseService) {
    window.FirebaseService.init(window.firebaseConfig)
      .then(() => { toggleSave(true); loadSavedLogos(); loadQuotesList(); loadBankDetails(); })
      .catch(() => { toggleSave(false); });
  } else {
    toggleSave(false);
  }
}

function bindInputs() {
  // UPDATED: Handle logo file selection
  if (el.logoFile) {
    el.logoFile.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        state.company.logoFile = null;
        return;
      }
      state.company.logoFile = file; // Store the file object for upload later
      // Set a temporary URL for immediate preview
      const url = URL.createObjectURL(file);
      state.company.logoUrl = url;
      renderQuote();
    });
  }
  
  el.companyName.addEventListener("input", e => { state.company.name = e.target.value; renderQuote(); });
  el.companyEmail.addEventListener("input", e => { state.company.email = e.target.value; renderQuote(); });
  el.companyPhone.addEventListener("input", e => { state.company.phone = e.target.value; renderQuote(); });
  const companyVat=document.getElementById("companyVat"); if(companyVat){ companyVat.addEventListener("input", e=>{ state.company.vat = e.target.value; renderQuote(); }); }
  el.companyAddress.addEventListener("input", e => { state.company.address = e.target.value; renderQuote(); });
  el.clientName.addEventListener("input", e => { state.client.name = e.target.value; renderQuote(); });
  el.clientEmail.addEventListener("input", e => { state.client.email = e.target.value; renderQuote(); });
  el.clientPhone.addEventListener("input", e => { state.client.phone = e.target.value; renderQuote(); });
  const clientVat=document.getElementById("clientVat"); if(clientVat){ clientVat.addEventListener("input", e=>{ state.client.vat = e.target.value; renderQuote(); }); }
  el.clientAddress.addEventListener("input", e => { state.client.address = e.target.value; renderQuote(); });
  el.quoteNumber.addEventListener("input", e => { state.meta.quoteNumber = e.target.value; renderQuote(); });
  el.quoteDate.addEventListener("change", e => { state.meta.date = e.target.value; renderQuote(); });
  const dueDateEl=document.getElementById("dueDate");
  if(dueDateEl){ dueDateEl.addEventListener("change", e=>{ state.meta.dueDate = e.target.value; renderQuote(); }); }
  const validUntilEl=document.getElementById("validUntil");
  if(validUntilEl){ validUntilEl.addEventListener("change", e=>{ state.meta.validUntil = e.target.value; renderQuote(); }); }
  const docTypeEl=document.getElementById("docType");
  if(docTypeEl){ docTypeEl.addEventListener("change", e=>{ state.meta.docType = e.target.value; renderQuote(); }); }
  el.currency.addEventListener("change", e => { state.meta.currency = e.target.value; renderQuote(); });
  el.taxRate.addEventListener("input", e => { state.meta.taxRate = parseFloat(e.target.value || 0); renderQuote(); });
  el.notes.addEventListener("input", e => { state.notes = e.target.value; renderQuote(); });
  const notesInclude=document.getElementById("includeNotes"); if(notesInclude){ notesInclude.addEventListener("change", e=>{ state.include.notes = !!e.target.checked; renderQuote(); }); }
  const incInclude=document.getElementById("includeInclusions"); if(incInclude){ incInclude.addEventListener("change", e=>{ state.include.inclusions = !!e.target.checked; renderQuote(); }); }
  const excInclude=document.getElementById("includeExclusions"); if(excInclude){ excInclude.addEventListener("change", e=>{ state.include.exclusions = !!e.target.checked; renderQuote(); }); }
  const payInclude=document.getElementById("includePaymentTerms"); if(payInclude){ payInclude.addEventListener("change", e=>{ state.include.paymentTerms = !!e.target.checked; renderQuote(); }); }
  const accInclude=document.getElementById("includeAcceptance"); if(accInclude){ accInclude.addEventListener("change", e=>{ state.include.acceptance = !!e.target.checked; renderQuote(); }); }
  const incEl=document.getElementById("inclusions"); if(incEl){ incEl.addEventListener("input", e=>{ state.inclusions = e.target.value; renderQuote(); }); }
  const excEl=document.getElementById("exclusions"); if(excEl){ excEl.addEventListener("input", e=>{ state.exclusions = e.target.value; renderQuote(); }); }
  const payEl=document.getElementById("paymentTerms"); if(payEl){ payEl.addEventListener("input", e=>{ state.paymentTerms = e.target.value; renderQuote(); }); }
  const accEl=document.getElementById("acceptance"); if(accEl){ accEl.addEventListener("input", e=>{ state.acceptance = e.target.value; renderQuote(); }); }
  const bankName=document.getElementById("bankName"); if(bankName){ bankName.addEventListener("input", e=>{ state.company.bankName = e.target.value; renderQuote(); }); }
  const bankAccName=document.getElementById("bankAccountName"); if(bankAccName){ bankAccName.addEventListener("input", e=>{ state.company.bankAccountName = e.target.value; renderQuote(); }); }
  const bankAccNum=document.getElementById("bankAccountNumber"); if(bankAccNum){ bankAccNum.addEventListener("input", e=>{ state.company.bankAccountNumber = e.target.value; renderQuote(); }); }
  const bankBranch=document.getElementById("bankBranchCode"); if(bankBranch){ bankBranch.addEventListener("input", e=>{ state.company.bankBranchCode = e.target.value; renderQuote(); }); }
  el.vatNoteToggle.addEventListener("change", e => { state.meta.vatExclusive = !!e.target.checked; renderQuote(); });
  el.addItemBtn.addEventListener("click", addItem);
  el.saveQuoteBtn.addEventListener("click", onSaveQuote);
  if(invoiceBtn){ invoiceBtn.addEventListener("click", ()=>{ location.href = "invoice.html"; }); }
  if(quoteBtn){ quoteBtn.addEventListener("click", ()=>{ location.href = "index.html"; }); }
  const savedSelect=document.getElementById("savedLogosSelect");
  const useSaved=document.getElementById("useSelectedLogoBtn");
  const refreshSaved=document.getElementById("refreshLogosBtn");
  if(refreshSaved) refreshSaved.addEventListener("click", loadSavedLogos);
  if(useSaved && savedSelect) useSaved.addEventListener("click",()=>{const url=savedSelect.value;if(url){state.company.logoUrl=url; renderQuote();}});
  if(quotesEl.refreshBtn){quotesEl.refreshBtn.addEventListener("click", ()=>{ loadQuotesList(); loadBankDetails(); });} 
  if(previewEl.previewBtn){previewEl.previewBtn.addEventListener("click", openPreview);} 
  if(previewEl.closeBtn){previewEl.closeBtn.addEventListener("click", closePreview);} 
  if(previewEl.zoomInBtn){previewEl.zoomInBtn.addEventListener("click",()=>{previewScale=Math.min(2,previewScale+0.1); applyPreviewScale();});}
  if(previewEl.zoomOutBtn){previewEl.zoomOutBtn.addEventListener("click",()=>{previewScale=Math.max(0.7,previewScale-0.1); applyPreviewScale();});}
  if(previewEl.downloadBtn){previewEl.downloadBtn.addEventListener("click", downloadPdf);} 
  const saveBankBtn=document.getElementById("saveBankDetailsBtn");
  if(saveBankBtn){ saveBankBtn.addEventListener("click", saveBankDetails); }
}

function addItem() {
  const item = { description: "", qty: 1, price: 0 };
  state.items.push(item);
  renderItems();
  renderQuote();
}

function removeItem(i) {
  state.items.splice(i, 1);
  renderItems();
  renderQuote();
}

function updateItem(i, field, value) {
  const item = state.items[i];
  if (field === "description") item.description = value;
  if (field === "qty") item.qty = parseFloat(value || 0);
  if (field === "price") item.price = parseFloat(value || 0);
  renderQuote();
}

function renderItems() {
  el.itemsContainer.innerHTML = "";
  state.items.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "item-row";
    const desc = document.createElement("input");
    desc.type = "text";
    desc.placeholder = "Description";
    desc.value = item.description;
    desc.addEventListener("input", e => updateItem(i, "description", e.target.value));
    const qty = document.createElement("input");
    qty.type = "number";
    qty.step = "1";
    qty.min = "0";
    qty.value = item.qty;
    qty.addEventListener("input", e => updateItem(i, "qty", e.target.value));
    const price = document.createElement("input");
    price.type = "number";
    price.step = "0.01";
    price.min = "0";
    price.value = item.price;
    price.addEventListener("input", e => updateItem(i, "price", e.target.value));
    const total = document.createElement("div");
    total.className = "item-total";
    total.textContent = formatCurrency(item.qty * item.price, state.meta.currency);
    const remove = document.createElement("button");
    remove.className = "btn";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeItem(i));
    row.appendChild(desc);
    row.appendChild(qty);
    row.appendChild(price);
    row.appendChild(total);
    row.appendChild(remove);
    el.itemsContainer.appendChild(row);
  });
}

function calcTotals() {
  const subtotal = state.items.reduce((s, x) => s + x.qty * x.price, 0);
  const tax = subtotal * (state.meta.taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function renderQuote() {
  // Render logo 
  const logoUrl = state.company.logoUrl;
  if (logoUrl) {
    el.pvCompanyLogo.src = logoUrl;
    el.pvCompanyLogo.style.display = "block";
  } else {
    el.pvCompanyLogo.src = "";
    el.pvCompanyLogo.style.display = "none";
  }
  
  el.pvCompanyName.textContent = state.company.name || "";
  el.pvCompanyDetails.textContent = [
    state.company.email,
    state.company.phone,
    state.company.address
  ].filter(Boolean).join(" • ");
  const docLabelEl=document.getElementById("pvDocLabel");
  const mode=(window.appMode==='invoice')?'invoice':'quote';
  if(docLabelEl){
    if(mode==='invoice'){
      docLabelEl.textContent = (state.company.vat && state.company.vat.trim()) ? 'Tax Invoice' : 'Invoice';
    }else{
      docLabelEl.textContent = state.meta.docType || 'Quote';
    }
  }
  const clientDetails = [
    state.client.name,
    state.client.email,
    state.client.phone,
    state.client.address
  ].filter(Boolean).join(" • ");
  el.pvClientDetails.textContent = clientDetails;
  el.pvQuoteNumber.textContent = state.meta.quoteNumber || "";
  el.pvQuoteDate.textContent = formatDate(state.meta.date);
  el.pvNotes.textContent = state.notes || "";
  const pvNotesWrap = el.pvNotes && el.pvNotes.parentElement; if(pvNotesWrap) pvNotesWrap.style.display = state.include.notes ? "" : "none";
  const vatText = state.meta.vatExclusive ? "All prices are exclusive of VAT." : "";
  const vatNode = document.getElementById("pvVatNote");
  if(vatNode) vatNode.textContent = vatText;
  const dueEl = document.getElementById("pvDueDate");
  if(dueEl) dueEl.textContent = formatDate(state.meta.dueDate);
  const pvValid=document.getElementById('pvValidUntil'); if(pvValid) pvValid.textContent = formatDate(state.meta.validUntil);
  const pvInc=document.getElementById('pvInclusions'); if(pvInc){ pvInc.textContent = state.inclusions || ''; const w=pvInc.parentElement; if(w) w.style.display = state.include.inclusions? '' : 'none'; }
  const pvExc=document.getElementById('pvExclusions'); if(pvExc){ pvExc.textContent = state.exclusions || ''; const w=pvExc.parentElement; if(w) w.style.display = state.include.exclusions? '' : 'none'; }
  const pvPay=document.getElementById('pvPaymentTerms'); if(pvPay){ pvPay.textContent = state.paymentTerms || ''; const w=pvPay.parentElement; if(w) w.style.display = state.include.paymentTerms? '' : 'none'; }
  const pvAcc=document.getElementById('pvAcceptance'); if(pvAcc){ pvAcc.textContent = state.acceptance || ''; const w=pvAcc.parentElement; if(w) w.style.display = state.include.acceptance? '' : 'none'; }
  const pvBank=document.getElementById('pvBankDetails'); if(pvBank){
    const bankParts=[state.company.bankName,state.company.bankAccountName,state.company.bankAccountNumber,state.company.bankBranchCode].filter(Boolean);
    pvBank.textContent = bankParts.join(' • ');
  }
  el.pvItems.innerHTML = "";
  state.items.forEach(item => {
    const tr = document.createElement("tr");
    const tdDesc = document.createElement("td");
    tdDesc.textContent = item.description;
    const tdQty = document.createElement("td");
    tdQty.textContent = item.qty;
    const tdPrice = document.createElement("td");
    tdPrice.textContent = formatCurrency(item.price, state.meta.currency);
    const tdTotal = document.createElement("td");
    tdTotal.textContent = formatCurrency(item.qty * item.price, state.meta.currency);
    tr.appendChild(tdDesc);
    tr.appendChild(tdQty);
    tr.appendChild(tdPrice);
    tr.appendChild(tdTotal);
    el.pvItems.appendChild(tr);
  });
  const totals = calcTotals();
  el.pvSubtotal.textContent = formatCurrency(totals.subtotal, state.meta.currency);
  el.pvTax.textContent = formatCurrency(totals.tax, state.meta.currency);
  el.pvGrandTotal.textContent = formatCurrency(totals.total, state.meta.currency);
}

function formatCurrency(v, c) {
  const locales = { ZAR: "en-ZA", USD: "en-US", EUR: "de-DE", GBP: "en-GB" };
  const symbols = { ZAR: "ZAR", USD: "USD", EUR: "EUR", GBP: "GBP" };
  return new Intl.NumberFormat(locales[c] || "en-US", { style: "currency", currency: symbols[c] || "USD" }).format(isFinite(v) ? v : 0);
}

function formatDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function downloadPdf() {
  const src = document.getElementById("quote-preview");
  if(!src) return;
  const clone = src.cloneNode(true);
  if(printEl.host){
    printEl.host.innerHTML = "";
    printEl.host.appendChild(clone);
  }
  const mode=(window.appMode==='invoice')?'invoice':'quote';
  const noun = mode==='invoice' ? 'Invoice' : 'Quote';
  const opt = {
    margin: 10,
    filename: `${noun}-${state.meta.quoteNumber || Date.now()}.pdf`,
    image: { type: "png", quality: 1 },
    html2canvas: { scale: 3, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };
  const promise = html2pdf().from(clone).set(opt).save();
  if(promise && typeof promise.then === "function"){
    promise.then(()=>{ if(printEl.host) printEl.host.innerHTML = ""; });
  }
}

function toggleSave(enabled) {
  el.saveQuoteBtn.disabled = !enabled;
  if(quotesEl.refreshBtn) quotesEl.refreshBtn.disabled = !enabled;
}

async function onSaveQuote() {
  if (!window.FirebaseService) return;
  el.saveQuoteBtn.disabled = true;
  let uploadSucceeded = false; // Track if the logo was successfully uploaded
  const mode = (window.appMode === "invoice") ? "invoice" : "quote";
  const noun = mode === "invoice" ? "Invoice" : "Quote";

  try {
    if (state.company.logoFile) {
      el.saveQuoteBtn.textContent = "Uploading Logo...";
      try {
        const res = await Promise.race([
          window.FirebaseService.uploadLogoToLibrary(state.company.logoFile),
          new Promise((_, reject) => setTimeout(() => reject(new Error("upload-timeout")), 15000))
        ]);
        state.company.logoUrl = res && res.url ? res.url : state.company.logoUrl;
        uploadSucceeded = true;
        await loadSavedLogos();
      } catch (e) {}
      state.company.logoFile = null;
    }

    const payload = {
      company: state.company,
      client: state.client,
      meta: state.meta,
      items: state.items,
      notes: state.notes,
      extras: { inclusions: state.inclusions, exclusions: state.exclusions, paymentTerms: state.paymentTerms, acceptance: state.acceptance },
      totals: calcTotals()
    };
    
    el.saveQuoteBtn.textContent = `Saving ${noun}...`;

    // Save or Update the quote
    if(state.meta.docId){
      if(mode==="invoice"){ await window.FirebaseService.updateInvoice(state.meta.docId, payload); }
      else{ await window.FirebaseService.updateQuote(state.meta.docId, payload); }
    }else{
      if(mode==='invoice'){
        const taken = await window.FirebaseService.isInvoiceNumberTaken(state.meta.quoteNumber);
        if(taken){ throw new Error('number-taken'); }
      }
      const id = mode==="invoice" ? await window.FirebaseService.saveInvoice(payload) : await window.FirebaseService.saveQuote(payload);
      state.meta.docId = id;
      loadQuotesList();
    }
    try{ await window.FirebaseService.saveSettings({ bankName: state.company.bankName, bankAccountName: state.company.bankAccountName, bankAccountNumber: state.company.bankAccountNumber, bankBranchCode: state.company.bankBranchCode }); }catch(e){}
    el.saveQuoteBtn.textContent = "Saved";
    setTimeout(() => { el.saveQuoteBtn.textContent = "Save Quote"; el.saveQuoteBtn.disabled = false; }, 1200);
  } catch (e) {
    el.saveQuoteBtn.textContent = "Error";
    console.error("Save Quote Error:", e);
    if((e && e.message)==='number-taken'){ alert('Invoice number already exists. Use a new unique number.'); }
    const totals = calcTotals();
    if(window.appMode==='invoice' && totals.total>5000 && !(state.client.vat && state.client.vat.trim())){
      alert('Client VAT number is required for invoices over R5,000.');
    }
    // Ensure button is re-enabled and text is reset regardless of whether upload or save failed
    setTimeout(() => { 
        el.saveQuoteBtn.textContent = "Save Quote"; 
        el.saveQuoteBtn.disabled = false; 
    }, 1200);
  }
}

async function loadSavedLogos(){
  const savedSelect=document.getElementById("savedLogosSelect");
  if(!window.FirebaseService||!window.FirebaseService.initialized||!savedSelect) return;
  const arr=await window.FirebaseService.listLogos();
  savedSelect.innerHTML="";
  arr.forEach(x=>{const opt=document.createElement("option"); opt.value=x.url; opt.textContent=x.name; savedSelect.appendChild(opt);});
}

async function loadBankDetails(){
  const view = document.getElementById("bankDetailsView");
  const useBtn = document.getElementById("useBankDetailsBtn");
  if(!view || !window.FirebaseService) return;
  try{
    const s = await window.FirebaseService.loadSettings();
    const parts = [s && s.bankName, s && s.bankAccountName, s && s.bankAccountNumber, s && s.bankBranchCode].filter(Boolean);
    view.textContent = parts.length ? parts.join(" • ") : "No saved banking details";
    if(useBtn){useBtn.disabled = !parts.length; useBtn.onclick = async ()=>{
      const latest = await window.FirebaseService.loadSettings();
      if(latest){
        state.company.bankName = latest.bankName || "";
        state.company.bankAccountName = latest.bankAccountName || "";
        state.company.bankAccountNumber = latest.bankAccountNumber || "";
        state.company.bankBranchCode = latest.bankBranchCode || "";
        renderQuote();
      }
    };}
  }catch(e){
    try{
      const uid = (window.FirebaseService && typeof window.FirebaseService._uid === 'function') ? window.FirebaseService._uid() : 'guest';
      const key = `rcqm:settings:${uid}`;
      const s = (window.FirebaseService && typeof window.FirebaseService._get === 'function') ? window.FirebaseService._get(key) : null;
      const parts = [s && s.bankName, s && s.bankAccountName, s && s.bankAccountNumber, s && s.bankBranchCode].filter(Boolean);
      view.textContent = parts.length ? parts.join(" • ") : "No saved banking details";
      if(useBtn){ useBtn.disabled = !parts.length; }
    }catch(_){ if(view){ view.textContent = "No saved banking details"; } }
  }
}

async function saveBankDetails(){
  const btn=document.getElementById("saveBankDetailsBtn");
  try{
    if(btn){ btn.disabled=true; btn.textContent="Saving..."; }
    await window.FirebaseService.saveSettings({
      bankName: state.company.bankName,
      bankAccountName: state.company.bankAccountName,
      bankAccountNumber: state.company.bankAccountNumber,
      bankBranchCode: state.company.bankBranchCode
    });
    if(btn){ btn.textContent="Saved"; setTimeout(()=>{ btn.disabled=false; btn.textContent="Save Banking Details"; },1200); }
    loadBankDetails();
  }catch(e){
    if(btn){ btn.textContent="Error"; setTimeout(()=>{ btn.disabled=false; btn.textContent="Save Banking Details"; },1200); }
  }
}

// NEW: Handler for the delete button
async function deleteQuoteHandler(docId) {
  if (!window.FirebaseService || !confirm("Are you sure you want to delete this item?")) return;
  const mode = (window.appMode === "invoice") ? "invoice" : "quote";
  
  try {
    if(mode==="invoice"){ await window.FirebaseService.deleteInvoice(docId); }
    else{ await window.FirebaseService.deleteQuote(docId); }
    // Reload the list after successful deletion
    loadQuotesList();
    
    // If the deleted quote was the one currently loaded, clear the form
    if (state.meta.docId === docId) {
      // Simple reload to reset the state/form
      window.location.reload(); 
    }
  } catch (e) {
    console.error("Delete Quote Error:", e);
    alert("Failed to delete quote. Check the console for details.");
  }
}


async function loadQuotesList(){
  if(!window.FirebaseService) return;
  quotesEl.list.innerHTML = "";
  try{
    const mode = (window.appMode === "invoice") ? "invoice" : "quote";
    const items = mode==="invoice" ? await window.FirebaseService.listInvoices() : await window.FirebaseService.listQuotes();
    items.forEach(doc=>{
      const card=document.createElement("div");
      card.className="quote-card";
      const title=document.createElement("div");
      title.textContent = doc.quote.meta.quoteNumber || doc.id;
      const client=document.createElement("div");
      client.className="meta";
      client.textContent = doc.quote.client.name || "";
      const total=document.createElement("div");
      total.textContent = formatCurrency(doc.quote.totals.total, doc.quote.meta.currency);
      const loadBtn=document.createElement("button");
      loadBtn.className="btn";
      loadBtn.textContent="Load";
      loadBtn.addEventListener("click",()=>loadQuote(doc));
      const deleteBtn=document.createElement("button");
      deleteBtn.className="btn";
      deleteBtn.textContent="Delete";
      deleteBtn.addEventListener("click",()=>deleteQuoteHandler(doc.id));
      card.appendChild(title);
      card.appendChild(client);
      card.appendChild(total);
      card.appendChild(loadBtn);
      card.appendChild(deleteBtn);
      quotesEl.list.appendChild(card);
    });
    if(items.length===0){
      const empty=document.createElement("div");
      empty.className="quote-card";
      empty.textContent = (mode==="invoice") ? "No invoices found for this device/user." : "No quotes found for this device/user.";
      quotesEl.list.appendChild(empty);
    }
  }catch(e){
    console.error("List Quotes Error:", e);
    try{
      const mode = (window.appMode === "invoice") ? "invoice" : "quote";
      const uid = (window.FirebaseService && typeof window.FirebaseService._uid === 'function') ? window.FirebaseService._uid() : 'guest';
      const key = mode==="invoice" ? `rcqm:invoices:${uid}` : `rcqm:quotes:${uid}`;
      const arr = (window.FirebaseService && typeof window.FirebaseService._get === 'function') ? (window.FirebaseService._get(key) || []) : [];
      if(arr.length===0){
        const empty=document.createElement("div");
        empty.className="quote-card";
        empty.textContent = (mode==="invoice") ? "No invoices found for this device/user." : "No quotes found for this device/user.";
        quotesEl.list.appendChild(empty);
        return;
      }
      arr.forEach(doc=>{
        const card=document.createElement("div");
        card.className="quote-card";
        const title=document.createElement("div");
        title.textContent = (doc.quote && doc.quote.meta && doc.quote.meta.quoteNumber) ? doc.quote.meta.quoteNumber : doc.id;
        const client=document.createElement("div");
        client.className="meta";
        client.textContent = (doc.quote && doc.quote.client && doc.quote.client.name) ? doc.quote.client.name : "";
        const total=document.createElement("div");
        const currency=(doc.quote && doc.quote.meta && doc.quote.meta.currency)||'ZAR';
        const totalVal=(doc.quote && doc.quote.totals && doc.quote.totals.total)||0;
        total.textContent = formatCurrency(totalVal, currency);
        const loadBtn=document.createElement("button");
        loadBtn.className="btn";
        loadBtn.textContent="Load";
        loadBtn.addEventListener("click",()=>loadQuote(doc));
        const deleteBtn=document.createElement("button");
        deleteBtn.className="btn";
        deleteBtn.textContent="Delete";
        deleteBtn.addEventListener("click",()=>deleteQuoteHandler(doc.id));
        card.appendChild(title);
        card.appendChild(client);
        card.appendChild(total);
        card.appendChild(loadBtn);
        card.appendChild(deleteBtn);
        quotesEl.list.appendChild(card);
      });
    }catch(err){
      const errEl=document.createElement("div");
      errEl.className="quote-card";
      const mode = (window.appMode === "invoice") ? "invoice" : "quote";
      errEl.textContent = (mode==="invoice") ? "Failed to load invoices. See console." : "Failed to load quotes. See console.";
      quotesEl.list.appendChild(errEl);
    }
  }
}

function setInputValue(input, value){ if(input) input.value = value ?? ""; }

function loadQuote(doc){
  const q = doc.quote;
  state.company = q.company || state.company;
  state.client = q.client || state.client;
  state.meta = Object.assign({}, state.meta, q.meta || {});
  state.items = Array.isArray(q.items)? q.items : [];
  state.notes = q.notes || "";
  if(q.extras){ state.inclusions = q.extras.inclusions || ''; state.exclusions = q.extras.exclusions || ''; state.paymentTerms = q.extras.paymentTerms || ''; state.acceptance = q.extras.acceptance || ''; }
  state.meta.docId = doc.id;
  
  // The logo file input cannot be programmatically set for security reasons.
  // The state.company.logoUrl is loaded, which will be rendered by renderQuote().
  // We explicitly clear the logoFile property if it exists, as it's not persisted.
  state.company.logoFile = null; 
  
  setInputValue(el.companyName, state.company.name);
  setInputValue(el.companyEmail, state.company.email);
  setInputValue(el.companyPhone, state.company.phone);
  setInputValue(el.companyAddress, state.company.address);
  setInputValue(el.clientName, state.client.name);
  setInputValue(el.clientEmail, state.client.email);
  setInputValue(el.clientPhone, state.client.phone);
  setInputValue(el.clientAddress, state.client.address);
  setInputValue(el.quoteNumber, state.meta.quoteNumber);
  setInputValue(el.quoteDate, state.meta.date);
  const dueDateEl=document.getElementById("dueDate");
  if(dueDateEl) setInputValue(dueDateEl, state.meta.dueDate);
  const validUntilEl=document.getElementById("validUntil"); if(validUntilEl) setInputValue(validUntilEl, state.meta.validUntil);
  const docTypeEl=document.getElementById("docType"); if(docTypeEl) docTypeEl.value = state.meta.docType || 'Quote';
  setInputValue(el.taxRate, state.meta.taxRate);
  if(el.currency) el.currency.value = state.meta.currency;
  // FIX: Ensure VAT checkbox is set from state
  if(el.vatNoteToggle) el.vatNoteToggle.checked = !!state.meta.vatExclusive;
  el.notes.value = state.notes;
  renderItems();
  renderQuote();
}

document.addEventListener("DOMContentLoaded", init);
if("serviceWorker" in navigator){
  const host = location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if(isLocal){
    navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
  }else{
    navigator.serviceWorker.register("sw.js");
  }
}

// Allow the browser to handle its native install prompt; no interception
const backBtn=document.getElementById('backToTopBtn');
window.addEventListener('scroll', ()=>{ if(backBtn){ backBtn.style.display = window.scrollY>200? 'block':'none'; }});
if(backBtn){ backBtn.addEventListener('click', ()=>{ window.scrollTo({top:0,behavior:'smooth'}); }); }
function openPreview(){
  const elQuote = document.getElementById("quote-preview");
  if(!elQuote||!previewEl.modalQuoteContainer||!previewEl.modal) return;
  previewEl.modalQuoteContainer.innerHTML = "";
  previewEl.modalQuoteContainer.appendChild(elQuote);
  previewScale=1; applyPreviewScale();
  previewEl.modal.style.display = "flex";
}

function closePreview(){
  const elQuote = document.getElementById("quote-preview");
  const panel = document.querySelector(".preview-panel");
  if(!elQuote||!panel||!previewEl.modal) return;
  panel.appendChild(elQuote);
  previewEl.modal.style.display = "none";
}

function applyPreviewScale(){
  const elQuote = document.getElementById("quote-preview");
  if(elQuote){ elQuote.style.transform=`scale(${previewScale})`; }
}