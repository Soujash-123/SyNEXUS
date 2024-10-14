// File input elements
const imageInput = document.getElementById('image__input');
const videoInput = document.getElementById('video__input');
const audioInput = document.getElementById('audio__input');
const fileInput = document.getElementById('file__input');

// Button elements
const imageButton = document.getElementById('image__button');
const videoButton = document.getElementById('video__button');
const audioButton = document.getElementById('audio__button');
const fileButton = document.getElementById('file__button');

// Event listeners for buttons
imageButton.addEventListener('click', () => imageInput.click());
videoButton.addEventListener('click', () => videoInput.click());
fileButton.addEventListener('click', () => fileInput.click());

// Audio recording
let mediaRecorder;
let audioChunks = [];

audioButton.addEventListener('click', toggleAudioRecording);

function toggleAudioRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        audioButton.innerHTML = '<img src="/static/icons/microphone.svg" alt="Audio">';
    } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                audioButton.innerHTML = '<img src="/static/icons/stop.svg" alt="Stop">';

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    audioChunks = [];
                    sendFile(audioBlob, 'audio');
                    stream.getTracks().forEach(track => track.stop());
                });
            });
    }
}

// File change event listeners
imageInput.addEventListener('change', (e) => handleFileSelect(e, 'image'));
videoInput.addEventListener('change', (e) => handleFileSelect(e, 'video'));
audioInput.addEventListener('change', (e) => handleFileSelect(e, 'audio'));
fileInput.addEventListener('change', (e) => handleFileSelect(e, 'file'));

function handleFileSelect(event, type) {
    const file = event.target.files[0];
    if (file) {
        sendFile(file, type);
    }
}

function sendFile(file, type) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileData = e.target.result;
        // Instead of sending the whole file, we'll just send metadata
        sendFileMessage(file.name, type, file.size);
        // Then upload the file to the server
        uploadFile(file, type);
    };
    reader.readAsDataURL(file);
}

function sendFileMessage(fileName, fileType, fileSize) {
    const message = {
        type: 'file_info',
        fileType: fileType,
        fileName: fileName,
        fileSize: fileSize
    };
    channel.sendMessage({text: JSON.stringify(message)});
}

function uploadFile(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            addFileMessageToDom(displayName, file.name, type, data.url);
            // Notify others about the uploaded file
            notifyFileUploaded(file.name, type, data.url);
        } else {
            console.error('File upload failed:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function notifyFileUploaded(fileName, fileType, fileUrl) {
    const message = {
        type: 'file_uploaded',
        fileName: fileName,
        fileType: fileType,
        fileUrl: fileUrl
    };
    channel.sendMessage({text: JSON.stringify(message)});
}

function addFileMessageToDom(name, fileName, fileType, fileUrl) {
    let fileContent;
    switch(fileType) {
        case 'image':
            fileContent = `<img src="${fileUrl}" alt="${fileName}" style="max-width: 200px;">`;
            break;
        case 'video':
            fileContent = `<video src="${fileUrl}" controls style="max-width: 200px;"></video>`;
            break;
        case 'audio':
            fileContent = `<audio src="${fileUrl}" controls></audio>`;
            break;
        default:
            fileContent = `<a href="${fileUrl}" download="${fileName}">${fileName}</a>`;
    }

    let messagesWrapper = document.getElementById('messages');
    let newMessage = `
        <div class="message__wrapper">
            <div class="message__body">
                <strong class="message__author">${name}</strong>
                <p class="message__text">${fileContent}</p>
            </div>
        </div>
    `;
    messagesWrapper.insertAdjacentHTML('beforeend', newMessage);
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
}