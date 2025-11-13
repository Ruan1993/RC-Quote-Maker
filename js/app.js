const state = {
  // UPDATED: Added logoFile to temporarily hold the file object before upload
  company: { name: "", email: "", phone: "", address: "", logoUrl: "", logoFile: null },
  client: { name: "", email: "", phone: "", address: "" },
  meta: { quoteNumber: "", date: "", currency: "ZAR", taxRate: 0, docId: null, vatExclusive: false },
  items: [],
  notes: ""
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
  downloadPdfBtn: document.getElementById("downloadPdfBtn"),
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
  previewBtn:document.getElementById("previewQuoteBtn"),
  modal:document.getElementById("previewModal"),
  closeBtn:document.getElementById("closePreviewBtn"),
  modalQuoteContainer:document.getElementById("modalQuoteContainer")
};
const printEl={host:document.getElementById("printHost")};

function init() {
  const d = new Date();
  el.quoteDate.value = d.toISOString().slice(0, 10);
  state.meta.date = el.quoteDate.value;
  bindInputs();
  addItem();
  renderQuote();
  if (typeof window.firebaseConfig !== "undefined" && window.FirebaseService) {
    window.FirebaseService.init(window.firebaseConfig)
      .then(() => { toggleSave(true); })
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
  el.companyAddress.addEventListener("input", e => { state.company.address = e.target.value; renderQuote(); });
  el.clientName.addEventListener("input", e => { state.client.name = e.target.value; renderQuote(); });
  el.clientEmail.addEventListener("input", e => { state.client.email = e.target.value; renderQuote(); });
  el.clientPhone.addEventListener("input", e => { state.client.phone = e.target.value; renderQuote(); });
  el.clientAddress.addEventListener("input", e => { state.client.address = e.target.value; renderQuote(); });
  el.quoteNumber.addEventListener("input", e => { state.meta.quoteNumber = e.target.value; renderQuote(); });
  el.quoteDate.addEventListener("change", e => { state.meta.date = e.target.value; renderQuote(); });
  el.currency.addEventListener("change", e => { state.meta.currency = e.target.value; renderQuote(); });
  el.taxRate.addEventListener("input", e => { state.meta.taxRate = parseFloat(e.target.value || 0); renderQuote(); });
  el.notes.addEventListener("input", e => { state.notes = e.target.value; renderQuote(); });
  el.vatNoteToggle.addEventListener("change", e => { state.meta.vatExclusive = !!e.target.checked; renderQuote(); });
  el.addItemBtn.addEventListener("click", addItem);
  el.downloadPdfBtn.addEventListener("click", downloadPdf);
  el.saveQuoteBtn.addEventListener("click", onSaveQuote);
  if(quotesEl.refreshBtn){quotesEl.refreshBtn.addEventListener("click", loadQuotesList);} 
  if(previewEl.previewBtn){previewEl.previewBtn.addEventListener("click", openPreview);} 
  if(previewEl.closeBtn){previewEl.closeBtn.addEventListener("click", closePreview);} 
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
  const vatText = state.meta.vatExclusive ? "All prices are exclusive of VAT." : "";
  const vatNode = document.getElementById("pvVatNote");
  if(vatNode) vatNode.textContent = vatText;
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
  const opt = {
    margin: 10,
    filename: `Quote-${state.meta.quoteNumber || Date.now()}.pdf`,
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
  if (!window.FirebaseService || !window.FirebaseService.initialized) return;
  el.saveQuoteBtn.disabled = true;
  let uploadSucceeded = false; // Track if the logo was successfully uploaded

  try {
    // Handle Logo Upload if a new file has been selected
    if (state.company.logoFile) {
      el.saveQuoteBtn.textContent = "Uploading Logo...";
      const logoUrl = await window.FirebaseService.uploadLogo(state.company.logoFile);
      state.company.logoUrl = logoUrl; // Update state with the permanent URL
      state.company.logoFile = null; // Clear the temporary file object
      uploadSucceeded = true;
    }

    const payload = {
      company: state.company,
      client: state.client,
      meta: state.meta,
      items: state.items,
      notes: state.notes,
      totals: calcTotals()
    };
    
    // Set button text back to default before saving the quote
    el.saveQuoteBtn.textContent = "Saving Quote...";

    // Save or Update the quote
    if(state.meta.docId){
      await window.FirebaseService.updateQuote(state.meta.docId, payload);
    }else{
      const id = await window.FirebaseService.saveQuote(payload);
      state.meta.docId = id;
      loadQuotesList();
    }
    el.saveQuoteBtn.textContent = "Saved";
    setTimeout(() => { el.saveQuoteBtn.textContent = "Save Quote"; el.saveQuoteBtn.disabled = false; }, 1200);
  } catch (e) {
    el.saveQuoteBtn.textContent = "Error";
    console.error("Save Quote Error:", e);
    // Ensure button is re-enabled and text is reset regardless of whether upload or save failed
    setTimeout(() => { 
        el.saveQuoteBtn.textContent = "Save Quote"; 
        el.saveQuoteBtn.disabled = false; 
    }, 1200);
  }
}

// NEW: Handler for the delete button
async function deleteQuoteHandler(docId) {
  if (!window.FirebaseService || !window.FirebaseService.initialized || !confirm("Are you sure you want to delete this quote?")) return;
  
  try {
    await window.FirebaseService.deleteQuote(docId);
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
  if(!window.FirebaseService||!window.FirebaseService.initialized) return;
  quotesEl.list.innerHTML = "";
  const items = await window.FirebaseService.listQuotes();
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
    
    // NEW: Delete button
    const deleteBtn=document.createElement("button");
    deleteBtn.className="btn";
    deleteBtn.textContent="Delete";
    deleteBtn.addEventListener("click",()=>deleteQuoteHandler(doc.id)); // Use new handler
    
    card.appendChild(title);
    card.appendChild(client);
    card.appendChild(total);
    card.appendChild(loadBtn);
    card.appendChild(deleteBtn); // Append delete button
    quotesEl.list.appendChild(card);
  });
}

function setInputValue(input, value){ if(input) input.value = value ?? ""; }

function loadQuote(doc){
  const q = doc.quote;
  state.company = q.company || state.company;
  state.client = q.client || state.client;
  state.meta = Object.assign({}, state.meta, q.meta || {});
  state.items = Array.isArray(q.items)? q.items : [];
  state.notes = q.notes || "";
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
  setInputValue(el.taxRate, state.meta.taxRate);
  if(el.currency) el.currency.value = state.meta.currency;
  // FIX: Ensure VAT checkbox is set from state
  if(el.vatNoteToggle) el.vatNoteToggle.checked = !!state.meta.vatExclusive;
  el.notes.value = state.notes;
  renderItems();
  renderQuote();
}

document.addEventListener("DOMContentLoaded", init);
function openPreview(){
  const elQuote = document.getElementById("quote-preview");
  if(!elQuote||!previewEl.modalQuoteContainer||!previewEl.modal) return;
  previewEl.modalQuoteContainer.innerHTML = "";
  previewEl.modalQuoteContainer.appendChild(elQuote);
  previewEl.modal.style.display = "flex";
}

function closePreview(){
  const elQuote = document.getElementById("quote-preview");
  const panel = document.querySelector(".preview-panel");
  if(!elQuote||!panel||!previewEl.modal) return;
  panel.appendChild(elQuote);
  previewEl.modal.style.display = "none";
}