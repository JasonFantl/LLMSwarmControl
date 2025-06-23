import os
import asyncio
import argparse
from agents import Agent, Runner
from agents.mcp import MCPServerSse
from agents.model_settings import ModelSettings

PIPE_PATH = "/tmp/agent_pipe"

# Create the named pipe if it doesn't exist
if not os.path.exists(PIPE_PATH):
    os.mkfifo(PIPE_PATH)


def parse_args():
    parser = argparse.ArgumentParser(description="Agent from named pipe")
    parser.add_argument(
        "--mcp-url",
        required=True,
        help="Base URL for the MCP server (without /sse)",
    )
    return parser.parse_args()


async def agent_worker(agent):
    print("Agent is ready and waiting for prompts...")
    with open(PIPE_PATH, "r") as pipe:
        while True:
            prompt = pipe.readline()
            if prompt:
                prompt = prompt.strip()
                print(f"Running agent with input: {prompt}")
                result = await Runner.run(starting_agent=agent, input=prompt)
                print(f"🤖 Agent output: {result.final_output}\n")


async def main():
    args = parse_args()
    mcp_url = args.mcp_url
    # TODO: the server will close after 10 minutes, this is a bad solution to this problem, I need to find a cleaner solution
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


if __name__ == "__main__":
    asyncio.run(main())
