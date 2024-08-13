import io
import speech_recognition as sr
from flask import Flask, jsonify, request
from googletrans import Translator
from flask_cors import CORS
from gtts import gTTS

# Initialize the Flask application
app = Flask(__name__)
CORS(app)

# Initialize speech recognizer and translator
recognizer = sr.Recognizer()
translator = Translator()

# Define available languages
lang_lib = ["en", "mr", "hi", "ml", "ta", "te"]
lang_dict = {
    "en": "English",
    "mr": "Marathi",
    "hi": "Hindi",
    "ml": "Malayalam",
    "ta": "Tamil",
    "te": "Telugu"
}

@app.route('/')
def home():
    return "Welcome to the Speech Recognition and Translation API"

@app.route('/recognize', methods=['POST'])
def recognize_speech():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    input_lang = request.form.get('input_lang', 'en')  # Default to 'en' if not provided

    print("Received audio file:", audio_file.filename)
    print("Input language:", input_lang)

    try:
        # Read audio data from file
        audio_data = audio_file.read()
        audio_file.seek(0)

        # Create a BytesIO object from the audio data
        audio_file_wav = io.BytesIO(audio_data)
        
        # Recognize audio
        with sr.AudioFile(audio_file_wav) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language=input_lang)
            return jsonify({'text': text})
    except sr.UnknownValueError:
        return jsonify({'error': 'Could not understand audio'}), 400
    except sr.RequestError as e:
        return jsonify({'error': f'Could not request results; {e}'}), 500
    except ValueError as e:
        return jsonify({'error': f'ValueError: {e}'}), 400
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500

@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.get_json()
    text = data['text']
    output_lang = data['output_lang']

    translated = translator.translate(text, dest=output_lang)
    return jsonify({'translated_text': translated.text})

@app.route('/text_to_speech', methods=['POST'])
def text_to_speech():
    data = request.get_json()
    text = data['text']
    lang = data['lang']
    
    tts = gTTS(text=text, lang=lang)
    filename = 'output.mp3'
    tts.save(filename)
    
    return jsonify({'audio_file': filename})

# Check if the script is run directly (not imported as a module)
if __name__ == '__main__':
    app.run(debug=True)
