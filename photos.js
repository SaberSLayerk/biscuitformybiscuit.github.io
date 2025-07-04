

    const firebaseConfig = {
        apiKey: "AIzaSyAW0zxO4opk2VRlV4Rn2uW5r540ydSDtD4",
        authDomain: "biscuit-for-my-biscuit.firebaseapp.com",
        projectId: "biscuit-for-my-biscuit",
        storageBucket: "biscuit-for-my-biscuit.appspot.com", // ✅ fixed
        messagingSenderId: "1059060992203",
        appId: "1:1059060992203:web:14f3ffe6e984b51b57734e",
        measurementId: "G-NMFLB5HE3K"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    let currentUser = null;

    auth.onAuthStateChanged(user => {
      if (user) {
        currentUser = user;
        loadPhotos();
      } else {
        window.location.href = "index.html";
      }
    });

    function logout() {
      auth.signOut().then(() => window.location.href = "index.html");
    }

    function uploadPhoto() {
        if (!currentUser) {
  status.style.color = "red";
  status.textContent = "You must be logged in to upload photos.";
  return;
}

      const file = document.getElementById("photoInput").files[0];
      const tagInput = document.getElementById("tagInput").value.trim();
      const tags = tagInput ? tagInput.split(',').map(tag => tag.trim().toLowerCase()) : [];
      const status = document.getElementById("uploadStatus");

      if (!file) {
        status.textContent = "Please select a photo.";
        return;
      }

      const safeFileName = encodeURIComponent(file.name);
      const storageRef = storage.ref(`photos/${currentUser.uid}/${safeFileName}`);

      storageRef.put(file)
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
          return db.collection("photos").add({
            uid: currentUser.uid,
            url: url,
            tags: tags,
            filename: file.name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .then(() => {
          status.style.color = "green";
          status.textContent = "Photo uploaded!";
          document.getElementById("photoInput").value = "";
          document.getElementById("tagInput").value = "";
          loadPhotos();
        })
        .catch(error => {
          status.style.color = "red";
          status.textContent = "Error: " + error.message;
        });
    }

    function loadPhotos() {
      const gallery = document.getElementById("gallery");
      gallery.innerHTML = "";

      db.collection("photos")
        .where("uid", "==", currentUser.uid)
        .orderBy("timestamp", "desc")
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            gallery.innerHTML = "<p>No photos yet.</p>";
            return;
          }

          snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.className = "photo";
            div.innerHTML = `
              <img src="${data.url}" alt="Photo">
              <p><strong>Tags:</strong> ${data.tags.join(', ')}</p>
              <button onclick="deletePhoto('${doc.id}', '${encodeURIComponent(data.filename)}')">Delete</button>
            `;
            gallery.appendChild(div);
          });
        });
    }

    function deletePhoto(docId, filename) {
        if (!currentUser) {
  status.style.color = "red";
  status.textContent = "You must be logged in to upload photos.";
  return;
}

      if (!confirm("Delete this photo?")) return;

      const fileRef = storage.ref(`photos/${currentUser.uid}/${filename}`);
      fileRef.delete().then(() => {
        return db.collection("photos").doc(docId).delete();
      }).then(() => {
        loadPhotos();
      }).catch(error => {
        alert("Error deleting photo: " + error.message);
      });
    }

    function searchPhotos() {
      const tag = document.getElementById("searchTag").value.trim().toLowerCase();
      const gallery = document.getElementById("gallery");
      gallery.innerHTML = "";

      if (!tag) {
        loadPhotos();
        return;
      }

      db.collection("photos")
        .where("uid", "==", currentUser.uid)
        .get()
        .then(snapshot => {
          const results = snapshot.docs.filter(doc => {
            const tags = doc.data().tags || [];
            return tags.includes(tag);
          });

          if (results.length === 0) {
            gallery.innerHTML = "<p>No photos with that tag.</p>";
            return;
          }

          results.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.className = "photo";
            div.innerHTML = `
              <img src="${data.url}" alt="Photo">
              <p><strong>Tags:</strong> ${data.tags.join(', ')}</p>
              <button onclick="deletePhoto('${doc.id}', '${encodeURIComponent(data.filename)}')">Delete</button>
            `;
            gallery.appendChild(div);
          });
        });
    }