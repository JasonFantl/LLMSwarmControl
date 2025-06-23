import os
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
from agents import Agent, Runner
from agents.mcp import MCPServerSse
from agents.model_settings import ModelSettings

# Audio config
model = whisper.load_model("base")
SAMPLE_RATE = 16000
CHANNELS = 1
recording = False
audio = []

audio_queue = queue.Queue()  # For audio to be transcribed
transcription_queue = asyncio.Queue()  # For transcribed text to be processed by agent

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
    global recording, audio
    recording = False
    print("🛑  Recording stopped. Queuing for transcription...")
    audio_np = np.concatenate(audio, axis=0)
    audio_queue.put(audio_np)


def on_press(key):
    if key == keyboard.Key.space and not recording:
        start_recording()


def on_release(key):
    if key == keyboard.Key.space and recording:
        stop_recording_and_queue()


# Transcription worker (thread)
def transcribe_worker():
    while True:
        audio_np = audio_queue.get()
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
    print("Agent is ready and waiting for transcriptions...")
    while True:
        prompt = await transcription_queue.get()
        print(f"Running agent with input: {prompt}")
        result = await Runner.run(starting_agent=agent, input=prompt)
        print(f"🤖 Agent output: {result.final_output}\n")
        transcription_queue.task_done()


# Main async entry point
async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mcp-url",
        required=True,
        help="Base URL for the MCP server (without /sse)",
    )
    args = parser.parse_args()
    mcp_url = args.mcp_url
    async with MCPServerSse(
        name="SSE Custom Server",
        params={"url": mcp_url + "/sse"},
        client_session_timeout_seconds=60 * 10,
    ) as server:
        agent = Agent(
            name="Assistant",
            instructions="Use the tools to execute the command, then provide a summary of all the steps you took.",
            mcp_servers=[server],
            model_settings=ModelSettings(tool_choice="required"),
        )
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
    # Start audio stream and keyboard listener in main thread
    stream = sd.InputStream(
        samplerate=SAMPLE_RATE, channels=CHANNELS, callback=audio_callback
    )
    stream.start()
    print(
        "Press and hold [SPACE] to speak a command. Release to queue for transcription and send to agent."
    )
    with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()
