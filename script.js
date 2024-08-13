document.addEventListener("DOMContentLoaded", () => {
    const speakBtn = document.getElementById("speak-btn");
    const clearBtn = document.getElementById("clear-btn");
    const copyBtn = document.getElementById("copy-btn");
    const recognizedText = document.getElementById("recognized-text");
    const translatedText = document.getElementById("translated-text");
    const message = document.getElementById("message");
    let recognizing = false;

    let mediaRecorder;
    let audioChunks = [];

    speakBtn.addEventListener("click", () => {
        if (recognizing) {
            mediaRecorder.stop();
            return;
        }
        startRecording();
    });

    clearBtn.addEventListener("click", () => {
        recognizedText.value = "";
        translatedText.value = "";
        showMessage("Text cleared.");
    });

    copyBtn.addEventListener("click", () => {
        if (translatedText.value) {
            translatedText.select();
        } else {
            recognizedText.select();
        }
        document.execCommand("copy");
        showMessage("Text copied.");
    });

    function showMessage(msg) {
        message.textContent = msg;
        message.style.visibility = "visible";
        setTimeout(() => {
            message.style.visibility = "hidden";
        }, 2000);
    }

    function startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                recognizing = true;
                speakBtn.innerHTML = '<i class="fas fa-stop"></i> Stop'; // Updated to show stop icon

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // Ensure correct MIME type
                    audioChunks = [];
                    recognizing = false;
                    speakBtn.innerHTML = '<i class="fas fa-microphone"></i> Speak'; // Updated to show speak icon
                    recognizeSpeech(audioBlob);
                });
            })
            .catch(error => {
                console.error("Error accessing the microphone: ", error);
                showMessage('Error accessing the microphone');
            });
    }

    async function recognizeSpeech(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('input_lang', document.getElementById("input-lang").value);

        try {
            const response = await fetch('http://127.0.0.1:5000/recognize', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.error) {
                showMessage(data.error);
            } else {
                recognizedText.value = data.text;
                translateText(data.text);
            }
        } catch (error) {
            console.error('Error recognizing speech:', error);
            showMessage('Error recognizing speech');
        }
    }

    function translateText(text) {
        const outputLang = document.getElementById("output-lang").value;

        fetch('http://127.0.0.1:5000/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text, output_lang: outputLang })
        })
        .then(response => response.json())
        .then(data => {
            translatedText.value = data.translated_text;
        })
        .catch(error => {
            console.error('Error translating text:', error);
            showMessage('Error translating text');
        });
    }
});
