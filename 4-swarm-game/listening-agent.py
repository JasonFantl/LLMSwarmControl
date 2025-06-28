import whisper
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
from pynput import keyboard
import tempfile
import threading
import queue
import asyncio
import argparse
from contextlib import AsyncExitStack
from agents import Agent, Runner
from agents.mcp import MCPServerSse
from agents.model_settings import ModelSettings

print("[INFO] Loading Whisper model...")
model = whisper.load_model("base")
print("[INFO] Whisper model loaded.")
SAMPLE_RATE = 16000
CHANNELS = 1
recording = False
audio = []

audio_id_counter = 0  # Counter for audio segments

audio_queue = queue.Queue()  # For audio to be transcribed
transcription_queue = asyncio.Queue()  # For transcribed text to be processed by agent

ready_event = threading.Event()  # Event to signal when the agent is ready


# Recording and audio queueing
def audio_callback(indata, frames, time, status):
    if recording:
        audio.append(indata.copy())


def start_recording():
    global recording, audio
    recording = True
    audio = []
    print("🎙️  Listening...")


def stop_recording_and_queue():
    global recording, audio, audio_id_counter
    recording = False
    print("🛑  Recording stopped. Queuing for transcription...")
    audio_np = np.concatenate(audio, axis=0)
    audio_queue.put((audio_np, audio_id_counter))
    audio_id_counter += 1


def on_press(key):
    if key == keyboard.Key.space and not recording:
        start_recording()


def on_release(key):
    if key == keyboard.Key.space and recording:
        stop_recording_and_queue()


# Transcription worker (thread)
def transcribe_worker():
    while True:
        audio_np, audio_id = audio_queue.get()
        print(f"📝 Transcribing audio file {audio_id}\n")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmpfile:
            wav.write(tmpfile.name, SAMPLE_RATE, (audio_np * 32767).astype(np.int16))
            result = model.transcribe(tmpfile.name)
            print(f"📝 Transcription: {result['text']}\n")
            # Put transcription into the async queue for the agent
            asyncio.run_coroutine_threadsafe(
                transcription_queue.put(result["text"]), agent_loop
            )
        audio_queue.task_done()


# Agent worker (async)
async def agent_worker(agent):
    print("[INFO] Agent is ready and waiting for transcriptions...")
    ready_event.set()  # Signal that agent is ready
    while True:
        prompt = await transcription_queue.get()
        print(f"🤖 Running agent with input: {prompt}")
        result = await Runner.run(starting_agent=agent, input=prompt)
        print(f"🤖 Agent output: {result.final_output}\n")
        transcription_queue.task_done()


# Main async entry point
async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mcp-urls",
        required=True,
        nargs="+",
        help="One or more base URLs for MCP servers (without /sse)",
    )
    args = parser.parse_args()
    mcp_urls = args.mcp_urls
    print(f"[INFO] Loading agent and connecting to MCP servers: {mcp_urls}")
    # Connect to all MCP servers
    servers = []
    for url in mcp_urls:
        server = MCPServerSse(
            name=f"SSE Custom Server ({url})",
            params={"url": url + "/sse"},
            client_session_timeout_seconds=60 * 10,
        )
        servers.append(server)
    # Use async context manager for all servers
    async with AsyncExitStack() as stack:
        mcp_servers = [await stack.enter_async_context(s) for s in servers]
        print("[INFO] Connected to all MCP servers.")
        agent = Agent(
            name="Assistant",
            instructions="Use the tools to execute the command (if it makes sense, otherwise ignore), then provide a summary of all the steps you took. It can be useful to check the notes first to see if any of them are relevant to the command, but commands are always a higher priority then notes. If something is important enough that it should be remembered for all future commands, it should be added to the notes.",
            mcp_servers=mcp_servers,
            # model_settings=ModelSettings(tool_choice="required"),
        )
        print("[INFO] Agent loaded with all MCP servers.")
        await agent_worker(agent)


# Start the agent event loop in a background thread
def start_agent_loop():
    global agent_loop
    agent_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(agent_loop)
    agent_loop.run_until_complete(main())


if __name__ == "__main__":
    # Start agent loop in background thread
    agent_loop = None
    threading.Thread(target=start_agent_loop, daemon=True).start()
    # Start transcription worker thread
    threading.Thread(target=transcribe_worker, daemon=True).start()
    # Start audio stream in main thread
    stream = sd.InputStream(
        samplerate=SAMPLE_RATE, channels=CHANNELS, callback=audio_callback
    )
    stream.start()
    # Wait until agent is ready before starting keyboard listener and printing prompt
    ready_event.wait()
    print("[INFO] Whisper model and agent are ready.")
    print(
        "Press and hold [SPACE] to speak a command. Release to queue for transcription and send to agent."
    )
    with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()
