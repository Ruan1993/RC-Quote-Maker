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