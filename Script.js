// IndexedDB for storing user profiles, playlists, and songs
let db;
let currentUser = null; // Track the signed-in user

const request = indexedDB.open('musicAppDB', 1);

request.onerror = function(event) {
    console.error('Database error:', event.target.error);
};

request.onsuccess = function(event) {
    db = event.target.result;
    checkUserSession(); // Check if a user is already signed in when the app loads
};

request.onupgradeneeded = function(event) {
    db = event.target.result;

    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    userStore.createIndex('email', 'email', { unique: true });

    const songsStore = db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
    songsStore.createIndex('artistName', 'artistName', { unique: false });

    const playlistStore = db.createObjectStore('playlists', { keyPath: 'id', autoIncrement: true });
    playlistStore.createIndex('playlistName', 'playlistName', { unique: true });
};

// Sign-Up and Artist Profile Creation
document.getElementById('signUpButton').addEventListener('click', function() {
    const username = document.getElementById('usernameInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const artistName = document.getElementById('artistNameInput').value;

    if (!username || !email || !password || !artistName) {
        alert('Please fill in all the fields to create your artist profile.');
        return;
    }

    const transaction = db.transaction(['users'], 'readwrite');
    const userStore = transaction.objectStore('users');

    const newUser = {
        username: username,
        email: email,
        password: password,
        artistName: artistName
    };

    userStore.add(newUser).onsuccess = function() {
        alert('Artist profile created successfully!');
        signInUser(email); // Automatically sign in the user after successful registration
        enableUpload(); // Enable upload functionality after sign-up
    };
});

// Function to simulate signing in the user
function signInUser(email) {
    const transaction = db.transaction(['users'], 'readonly');
    const userStore = transaction.objectStore('users');
    const userIndex = userStore.index('email');
    const getUser = userIndex.get(email);

    getUser.onsuccess = function(event) {
        currentUser = event.target.result;
        alert(`Welcome ${currentUser.artistName}! You are now signed in.`);
        enableUpload(); // Allow the user to upload music now that they are signed in
    };

    getUser.onerror = function(event) {
        console.error('Error signing in:', event.target.error);
    };
}

// Function to check if a user is already signed in
function checkUserSession() {
    if (currentUser) {
        enableUpload();
    } else {
        disableUpload(); // Disable upload if no user is signed in
    }
}

// Disable upload form if user is not signed in
function disableUpload() {
    document.getElementById('titleInput').disabled = true;
    document.getElementById('artistInput').disabled = true;
    document.getElementById('fileInput').disabled = true;
    document.getElementById('coverArtInput').disabled = true;
    document.getElementById('uploadButton').disabled = true;
}

// Enable upload form after sign-up or sign-in
function enableUpload() {
    document.getElementById('titleInput').disabled = false;
    document.getElementById('artistInput').disabled = false;
    document.getElementById('fileInput').disabled = false;
    document.getElementById('coverArtInput').disabled = false;
    document.getElementById('uploadButton').disabled = false;

    document.getElementById('artistInput').value = currentUser.artistName; // Automatically fill artist name
}

// Upload Music with Cover Art (only enabled after signing in)
document.getElementById('uploadButton').addEventListener('click', function() {
    const title = document.getElementById('titleInput').value;
    const artist = document.getElementById('artistInput').value;
    const fileInput = document.getElementById('fileInput').files[0];
    const coverArtInput = document.getElementById('coverArtInput').files[0];

    if (!title || !artist || !fileInput || !coverArtInput) {
        alert('Please fill in all fields and select files to upload.');
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(fileInput);

    reader.onload = function(e) {
        const songData = e.target.result;

        const transaction = db.transaction(['songs'], 'readwrite');
        const songStore = transaction.objectStore('songs');

        const newSong = {
            title: title,
            artistName: artist,
            songData: songData,
            coverArt: URL.createObjectURL(coverArtInput),
            uploadedBy: currentUser.email // Track which user uploaded the song
        };

        songStore.add(newSong);
        alert('Song and cover art uploaded successfully!');

        // Update artist profile with new song
        addSongToProfile(newSong);
    };
});

// Add song to artist's profile (displayed on profile page)
function addSongToProfile(song) {
    const fileList = document.getElementById('fileList');
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <img src="${song.coverArt}" alt="${song.title}" style="width: 50px; height: 50px; margin-right: 10px;">
        ${song.title} by ${song.artistName}
        <button onclick="playSong('${song.songData}')">Play</button>
        <button onclick="reportSong(${song.id})">Report</button>
        <button onclick="hideSong(this)">Hide</button>
    `;
    fileList.appendChild(listItem);
}

// Play Song
function playSong(songData) {
    const audio = document.getElementById('audio');
    audio.src = songData;
    audio.play();
}

// Report Song (logic for reporting inappropriate content)
function reportSong(songId) {
    alert(`The song with ID ${songId} has been reported.`);
}

// Hide Song from profile
function hideSong(element) {
    element.parentElement.style.display = 'none';
}

// Check if the user is logged in before allowing uploads
window.onload = function() {
    checkUserSession();
};