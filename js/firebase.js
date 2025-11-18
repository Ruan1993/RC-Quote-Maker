window.FirebaseService = {
  initialized: false,
  init: function(config) {
    return new Promise((resolve, reject) => {
      try {
        if (!window.firebase || !config) { reject(new Error("missing")); return; }
        const app = firebase.initializeApp(config);
        const auth = firebase.auth();
        auth.signInAnonymously()
          .then(() => {
            this.db = firebase.firestore();
            this.auth = auth;
            if (firebase.storage) {
              this.storage = firebase.storage();
            }
            this.initialized = true;
            resolve(true);
          })
          .catch(() => { reject(new Error("auth")); });
      } catch (e) { reject(e); }
    });
  },
  _uid: function(){ try{ return (this.auth && this.auth.currentUser && this.auth.currentUser.uid) || "guest"; }catch(_){ return "guest"; } },
  _get: function(key){ try{ const s=localStorage.getItem(key); return s? JSON.parse(s): null; }catch(_){ return null; } },
  _set: function(key,val){ try{ localStorage.setItem(key, JSON.stringify(val)); return true; }catch(_){ return false; } },
  _id: function(){ return String(Date.now())+"-"+Math.random().toString(36).slice(2,8); },
  saveQuote: function(quote) {
    return new Promise((resolve, reject) => {
      try {
        if (this.initialized && this.db && this.auth) {
          const uid = this.auth.currentUser && this.auth.currentUser.uid;
          if (!uid) { reject(new Error("no-user")); return; }
          this.db.collection("quotes").add({ quote, uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
            .then(doc => { resolve(doc.id); }).catch(err => { reject(err); });
          return;
        }
        const uid=this._uid();
        const key=`rcqm:quotes:${uid}`;
        const arr=this._get(key)||[];
        const id=this._id();
        arr.push({id,quote});
        this._set(key,arr);
        resolve(id);
      } catch (e) { reject(e); }
    });
  },
  // NEW: Function to delete a quote document
  deleteQuote: function(id) {
    return new Promise((resolve, reject) => {
      try {
        if (this.initialized && this.db) {
          this.db.collection("quotes").doc(id).delete().then(() => resolve(true)).catch(err => reject(err));
          return;
        }
        const uid=this._uid();
        const key=`rcqm:quotes:${uid}`;
        const arr=this._get(key)||[];
        const next=arr.filter(x=>x.id!==id);
        this._set(key,next);
        resolve(true);
      } catch (e) { reject(e); }
    });
  },
  uploadLogo: function(file){
    return new Promise((resolve,reject)=>{
      try{
        if(!this.initialized || !this.storage || !this.auth){ reject(new Error("not-ready")); return; }
        const uid = this.auth.currentUser && this.auth.currentUser.uid;
        if(!uid){ reject(new Error("no-user")); return; }
        const name = (file && file.name) || "logo";
        const ext = name.includes('.') ? name.split('.').pop() : 'png';
        const ref = this.storage.ref().child(`users/${uid}/company-logo.${ext}`);
        ref.put(file).then(snap=>snap.ref.getDownloadURL()).then(url=>resolve(url)).catch(err=>reject(err));
      }catch(e){reject(e);}
    });
  },
  uploadLogoToLibrary: function(file){
    return new Promise((resolve,reject)=>{
      try{
        if(!this.initialized || !this.storage || !this.auth){ reject(new Error("not-ready")); return; }
        const uid = this.auth.currentUser && this.auth.currentUser.uid;
        if(!uid){ reject(new Error("no-user")); return; }
        const name = (file && file.name) || "logo";
        const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const ref = this.storage.ref().child(`users/${uid}/logos/${Date.now()}-${safe}`);
        ref.put(file).then(snap=>snap.ref.getDownloadURL()).then(url=>resolve({url,name:safe})).catch(err=>reject(err));
      }catch(e){reject(e);}
    });
  },
  listLogos: function(){
    return new Promise((resolve,reject)=>{
      try{
        if(!this.initialized || !this.storage || !this.auth){ resolve([]); return; }
        const uid = this.auth.currentUser && this.auth.currentUser.uid;
        if(!uid){ resolve([]); return; }
        const dir = this.storage.ref().child(`users/${uid}/logos`);
        dir.listAll().then(list=>Promise.all(list.items.map(i=>i.getDownloadURL().then(url=>({url,name:i.name}))))).then(arr=>resolve(arr)).catch(err=>resolve([]));
      }catch(e){resolve([]);}
    });
  },
  saveSettings: function(data){
    return new Promise((resolve,reject)=>{
      try{
        if(this.initialized && this.db && this.auth){
          const uid = this.auth.currentUser && this.auth.currentUser.uid;
          if(!uid){ reject(new Error("no-user")); return; }
          this.db.collection("settings").doc(uid).set(data,{merge:true}).then(()=>resolve(true)).catch(err=>reject(err));
          return;
        }
        const uid=this._uid();
        const key=`rcqm:settings:${uid}`;
        const prev=this._get(key)||{};
        this._set(key,Object.assign(prev,data));
        resolve(true);
      }catch(e){reject(e);}
    });
  },
  loadSettings: function(){
    return new Promise((resolve,reject)=>{
      try{
        if(this.initialized && this.db && this.auth){
          const uid = this.auth.currentUser && this.auth.currentUser.uid;
          if(!uid){ resolve(null); return; }
          this.db.collection("settings").doc(uid).get().then(doc=>{ resolve(doc.exists ? doc.data() : null); }).catch(err=>reject(err));
          return;
        }
        const uid=this._uid();
        const key=`rcqm:settings:${uid}`;
        resolve(this._get(key));
      }catch(e){reject(e);}
    });
  },
  listQuotes: function(){
    // UPDATED: Filter documents by the current user's UID
    return new Promise((resolve,reject)=>{
      try{
        if (!this.initialized || !this.db || !this.auth) { reject(new Error("not-ready")); return; }
        const uid = this.auth.currentUser && this.auth.currentUser.uid;
        if (!uid) { resolve([]); return; }

        this.db.collection("quotes")
          .where("uid", "==", uid)
          .limit(50)
          .get()
          .then(snap=>{
            const arr=[];snap.forEach(doc=>{const data=doc.data();arr.push({id:doc.id,quote:data.quote,createdAt:data.createdAt});});
            arr.sort((a,b)=>{
              const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
              const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
              return tb - ta;
            });
            resolve(arr.map(x=>({id:x.id,quote:x.quote})));
          }).catch(err=>reject(err));
      }catch(e){reject(e);}
    });
  },
  isInvoiceNumberTaken: function(number){
    return new Promise((resolve)=>{
      try{
        if (this.initialized && this.db && this.auth) {
          const uid = this.auth.currentUser && this.auth.currentUser.uid;
          if (!uid || !number) { resolve(false); return; }
          this.db.collection("invoices").where("uid","==",uid).where("quote.meta.quoteNumber","==", number).limit(1).get()
            .then(snap=>resolve(!snap.empty)).catch(()=>resolve(false));
          return;
        }
        const uid=this._uid();
        const key=`rcqm:invoices:${uid}`;
        const arr=this._get(key)||[];
        resolve(arr.some(x=>x && x.quote && x.quote.meta && x.quote.meta.quoteNumber === number));
      }catch(_){ resolve(false); }
    });
  },
  updateQuote: function(id, quote){
    return new Promise((resolve,reject)=>{
      try{
        if (this.initialized && this.db) {
          this.db.collection("quotes").doc(id).update({quote,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>resolve(true)).catch(err=>reject(err));
          return;
        }
        const uid=this._uid();
        const key=`rcqm:quotes:${uid}`;
        const arr=this._get(key)||[];
        const idx=arr.findIndex(x=>x.id===id);
        if(idx>=0){arr[idx].quote=quote; this._set(key,arr);} 
        resolve(true);
      }catch(e){reject(e);} 
    });
  },
  saveInvoice: function(quote) {
    return new Promise((resolve, reject) => {
      try {
        if (this.initialized && this.db && this.auth) {
          const uid = this.auth.currentUser && this.auth.currentUser.uid;
          if (!uid) { reject(new Error("no-user")); return; }
          this.db.collection("invoices").add({ quote, uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
            .then(doc => { resolve(doc.id); }).catch(err => { reject(err); });
          return;
        }
        const uid=this._uid();
        const key=`rcqm:invoices:${uid}`;
        const arr=this._get(key)||[];
        const id=this._id();
        arr.push({id,quote});
        this._set(key,arr);
        resolve(id);
      } catch (e) { reject(e); }
    });
  },
  listInvoices: function(){
    return new Promise((resolve,reject)=>{
      try{
        if (this.initialized && this.db && this.auth) {
          const uid = this.auth.currentUser && this.auth.currentUser.uid;
          if (!uid) { resolve([]); return; }
          this.db.collection("invoices").where("uid","==",uid).limit(50).get().then(snap=>{
            const arr=[];snap.forEach(doc=>{const data=doc.data();arr.push({id:doc.id,quote:data.quote,createdAt:data.createdAt});});
            arr.sort((a,b)=>{const ta=a.createdAt&&a.createdAt.toMillis?a.createdAt.toMillis():0;const tb=b.createdAt&&b.createdAt.toMillis?b.createdAt.toMillis():0;return tb-ta;});
            resolve(arr.map(x=>({id:x.id,quote:x.quote})));
          }).catch(err=>reject(err));
          return;
        }
        const uid=this._uid();
        const key=`rcqm:invoices:${uid}`;
        resolve((this._get(key)||[]).map(x=>({id:x.id,quote:x.quote})));
      }catch(e){reject(e);} 
    });
  },
  updateInvoice: function(id, quote){
    return new Promise((resolve,reject)=>{
      try{
        if (this.initialized && this.db) {
          this.db.collection("invoices").doc(id).update({quote,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>resolve(true)).catch(err=>reject(err));
          return;
        }
        const uid=this._uid();
        const key=`rcqm:invoices:${uid}`;
        const arr=this._get(key)||[];
        const idx=arr.findIndex(x=>x.id===id);
        if(idx>=0){arr[idx].quote=quote; this._set(key,arr);} 
        resolve(true);
      }catch(e){reject(e);} 
    });
  },
  deleteInvoice: function(id){
    return new Promise((resolve,reject)=>{
      try{
        if (this.initialized && this.db) {
          this.db.collection("invoices").doc(id).delete().then(()=>resolve(true)).catch(err=>reject(err));
          return;
        }
        const uid=this._uid();
        const key=`rcqm:invoices:${uid}`;
        const arr=this._get(key)||[];
        const next=arr.filter(x=>x.id!==id);
        this._set(key,next);
        resolve(true);
      }catch(e){reject(e);} 
    });
  }
}