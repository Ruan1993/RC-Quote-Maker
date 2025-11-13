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
  saveQuote: function(quote) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.initialized || !this.db) { reject(new Error("not-ready")); return; }
        this.db.collection("quotes").add({
          quote,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(doc => { resolve(doc.id); }).catch(err => { reject(err); });
      } catch (e) { reject(e); }
    });
  }
}
window.FirebaseService.uploadLogo = function(file){
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
}
window.FirebaseService.saveSettings = function(data){
  return new Promise((resolve,reject)=>{
    try{
      if(!this.initialized || !this.db || !this.auth){ reject(new Error("not-ready")); return; }
      const uid = this.auth.currentUser && this.auth.currentUser.uid;
      if(!uid){ reject(new Error("no-user")); return; }
      this.db.collection("settings").doc(uid).set(data,{merge:true}).then(()=>resolve(true)).catch(err=>reject(err));
    }catch(e){reject(e);}
  });
}
window.FirebaseService.loadSettings = function(){
  return new Promise((resolve,reject)=>{
    try{
      if(!this.initialized || !this.db || !this.auth){ resolve(null); return; }
      const uid = this.auth.currentUser && this.auth.currentUser.uid;
      if(!uid){ resolve(null); return; }
      this.db.collection("settings").doc(uid).get().then(doc=>{ resolve(doc.exists ? doc.data() : null); }).catch(err=>reject(err));
    }catch(e){reject(e);}
  });
}
window.FirebaseService.listQuotes = function(){
  return new Promise((resolve,reject)=>{
    try{
      if (!this.initialized || !this.db) { reject(new Error("not-ready")); return; }
      this.db.collection("quotes").orderBy("createdAt","desc").limit(50).get().then(snap=>{
        const arr=[];snap.forEach(doc=>{arr.push({id:doc.id,quote:doc.data().quote});});resolve(arr);
      }).catch(err=>reject(err));
    }catch(e){reject(e);}
  });
}
window.FirebaseService.updateQuote = function(id, quote){
  return new Promise((resolve,reject)=>{
    try{
      if (!this.initialized || !this.db) { reject(new Error("not-ready")); return; }
      this.db.collection("quotes").doc(id).update({quote,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>resolve(true)).catch(err=>reject(err));
    }catch(e){reject(e);}
  });
}