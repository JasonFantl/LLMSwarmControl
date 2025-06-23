import os
import whisper
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
from pynput import keyboard
import tempfile
import threading
import queue

PIPE_PATH = "/tmp/agent_pipe"

# Create the named pipe if it doesn't exist
if not os.path.exists(PIPE_PATH):
    os.mkfifo(PIPE_PATH)

model = whisper.load_model("base")
SAMPLE_RATE = 16000
CHANNELS = 1
recording = False
audio = []

# Thread-safe queue for audio to be transcribed
audio_queue = queue.Queue()
# A lock to prevent concurrent writes to the pipe
pipe_lock = threading.Lock()


def audio_callback(indata, frames, time, status):
    if recording:
        audio.append(indata.copy())


def start_recording():
    global recording, audio
    recording = True
    audio = []
    print("🎙️  Listening...")


def stop_recording_and_queue():
    global recording, audio
    recording = False
    print("🛑  Recording stopped. Queuing for transcription...")
    audio_np = np.concatenate(audio, axis=0)
    audio_queue.put(audio_np)


def transcribe_worker():
    while True:
        print("Getting audio for transcription...")
        audio_np = audio_queue.get()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmpfile:
            wav.write(tmpfile.name, SAMPLE_RATE, (audio_np * 32767).astype(np.int16))
            result = model.transcribe(tmpfile.name)
            print(f"📝 Transcription: {result['text']}\n")
            # Write to the named pipe (thread-safe)
            with pipe_lock:
                with open(PIPE_PATH, "w") as pipe:
                    pipe.write(result["text"] + "\n")

        audio_queue.task_done()


def on_press(key):
    if key == keyboard.Key.space and not recording:
        start_recording()


def on_release(key):
    if key == keyboard.Key.space and recording:
        stop_recording_and_queue()


# Start the transcription worker thread
threading.Thread(target=transcribe_worker, daemon=True).start()

stream = sd.InputStream(
    samplerate=SAMPLE_RATE, channels=CHANNELS, callback=audio_callback
)
stream.start()

print(
    "Press and hold [SPACE] to speak a command. Release to queue for transcription and send to agent."
)
with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
    listener.join()
