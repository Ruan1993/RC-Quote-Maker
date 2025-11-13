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
    // UPDATED: Include UID in the saved document
    return new Promise((resolve, reject) => {
      try {
        if (!this.initialized || !this.db || !this.auth) { reject(new Error("not-ready")); return; }
        const uid = this.auth.currentUser && this.auth.currentUser.uid;
        if (!uid) { reject(new Error("no-user")); return; }
        
        this.db.collection("quotes").add({
          quote,
          uid, // <-- NEW: Save the User ID
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(doc => { resolve(doc.id); }).catch(err => { reject(err); });
      } catch (e) { reject(e); }
    });
  },
  // NEW: Function to delete a quote document
  deleteQuote: function(id) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.initialized || !this.db) { reject(new Error("not-ready")); return; }
        // Note: For full security, you should also check the UID here or use Firebase Security Rules
        this.db.collection("quotes").doc(id).delete().then(() => resolve(true)).catch(err => reject(err));
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
  saveSettings: function(data){
    return new Promise((resolve,reject)=>{
      try{
        if(!this.initialized || !this.db || !this.auth){ reject(new Error("not-ready")); return; }
        const uid = this.auth.currentUser && this.auth.currentUser.uid;
        if(!uid){ reject(new Error("no-user")); return; }
        this.db.collection("settings").doc(uid).set(data,{merge:true}).then(()=>resolve(true)).catch(err=>reject(err));
      }catch(e){reject(e);}
    });
  },
  loadSettings: function(){
    return new Promise((resolve,reject)=>{
      try{
        if(!this.initialized || !this.db || !this.auth){ resolve(null); return; }
        const uid = this.auth.currentUser && this.auth.currentUser.uid;
        if(!uid){ resolve(null); return; }
        this.db.collection("settings").doc(uid).get().then(doc=>{ resolve(doc.exists ? doc.data() : null); }).catch(err=>reject(err));
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
  updateQuote: function(id, quote){
    return new Promise((resolve,reject)=>{
      try{
        if (!this.initialized || !this.db) { reject(new Error("not-ready")); return; }
        this.db.collection("quotes").doc(id).update({quote,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>resolve(true)).catch(err=>reject(err));
      }catch(e){reject(e);}
    });
  }
}