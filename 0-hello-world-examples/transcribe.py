import whisper
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
from pynput import keyboard
import tempfile

# Load Whisper model (choose "tiny" or "base" for CPU)
model = whisper.load_model("base")

# Audio config
SAMPLE_RATE = 16000
CHANNELS = 1

recording = False
audio = []


def audio_callback(indata, frames, time, status):
    if recording:
        audio.append(indata.copy())


def start_recording():
    global recording, audio
    recording = True
    audio = []
    print("🎙️  Listening...")


def stop_recording_and_transcribe():
    global recording, audio
    recording = False
    print("🛑  Recording stopped. Transcribing...")

    # Flatten and save to WAV
    audio_np = np.concatenate(audio, axis=0)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmpfile:
        wav.write(tmpfile.name, SAMPLE_RATE, (audio_np * 32767).astype(np.int16))
        result = model.transcribe(tmpfile.name)
        print(f"📝 Transcription: {result['text']}\n")


# Keyboard handling
def on_press(key):
    if key == keyboard.Key.space and not recording:
        start_recording()


def on_release(key):
    if key == keyboard.Key.space and recording:
        stop_recording_and_transcribe()


# Start audio stream
stream = sd.InputStream(
    samplerate=SAMPLE_RATE, channels=CHANNELS, callback=audio_callback
)
stream.start()

# Keyboard listener
print("Press and hold [SPACE] to speak a command. Release to transcribe.")
with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
    listener.join()
