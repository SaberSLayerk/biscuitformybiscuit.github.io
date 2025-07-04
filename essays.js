 const firebaseConfig = {
    apiKey: "AIzaSyAW0zxO4opk2VRlV4Rn2uW5r540ydSDtD4",
    authDomain: "biscuit-for-my-biscuit.firebaseapp.com",
    projectId: "biscuit-for-my-biscuit",
    storageBucket: "biscuit-for-my-biscuit.appspot.com",
    messagingSenderId: "1059060992203",
    appId: "1:1059060992203:web:14f3ffe6e984b51b57734e",
    measurementId: "G-NMFLB5HE3K"
  };

  // ✅ Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

      let currentUser = null;

      auth.onAuthStateChanged(user => {
        if (user) {
          currentUser = user;
          loadEssays();
        } else {
          // not logged in, send to login page
          window.location.href = "index.html";
        }
      });

      function saveEssayToFirestore() {
        const title = document.getElementById("essayTitle").value.trim();
        const body = document.getElementById("essayBody").value.trim();
        if (!title || !body || !currentUser) return;

       db.collection("essays").add({
         uid: firebase.auth().currentUser.uid, // ✅ must be set
         title: title,
         body: body,
         timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
          document.getElementById('status').textContent = 'Essay saved!';
          loadEssays();
        });
      }

     function loadEssays() {
  const list = document.getElementById("essayList");
  list.innerHTML = "";

  db.collection("essays")
    .where("uid", "==", currentUser.uid)
    .orderBy("timestamp", "desc")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        list.innerHTML = "<p>No essays yet.</p>";
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const preview = data.body.length > 60 ? data.body.slice(0, 60) + "..." : data.body;

        const div = document.createElement("div");
        div.style.marginBottom = "20px";

        div.innerHTML = `
          <h3>${data.title}</h3>
          <p>${preview}</p>
          <button onclick="loadEssay('${doc.id}')">Load</button>
          <button onclick="deleteEssay('${doc.id}')">Delete</button>
          <hr>
        `;
        list.appendChild(div);
      });
    })
    .catch(error => {
      list.innerHTML = `<p style="color:red;">Error loading essays: ${error.message}</p>`;
    });
}
function loadEssay(essayId) {
  db.collection("essays").doc(essayId).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("essayTitle").value = data.title;
        document.getElementById("essayBody").value = data.body;
        document.getElementById("status").textContent = "Essay loaded for viewing.";
        document.getElementById("status").style.color = "green";
      } else {
        alert("Essay not found.");
      }
    })
    .catch(error => {
      alert("Failed to load essay: " + error.message);
    });
}

    function deleteEssay(essayId) {
  if (confirm("Are you sure you want to delete this essay?")) {
    db.collection("essays").doc(essayId).delete()
      .then(() => {
        loadEssays(); // reload after deletion
      })
      .catch(error => {
        alert("Failed to delete essay: " + error.message);
      });
  }
}


      function logout() {
        auth.signOut().then(() => {
          window.location.href = "index.html";
        });
      }