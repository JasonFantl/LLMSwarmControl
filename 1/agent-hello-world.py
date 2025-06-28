import argparse
import asyncio
from agents import Agent, Runner, gen_trace_id, trace
from agents.mcp import MCPServer, MCPServerSse


async def run(mcp_server: MCPServer):
    agent = Agent(
        name="Assistant",
        instructions="Use the tools to execute the command, then provide a summary of all the steps you took.",
        mcp_servers=[mcp_server],
    )

    # Turn natural language into an MCP command
    message = "Add 10 to the counter."
    print(f"Running: {message}")
    result = await Runner.run(starting_agent=agent, input=message)
    print(result.final_output)

    # Use some reasoning to modify the counter
    message = "Add whatever is necessary to get the counter to 40."
    print(f"Running: {message}")
    result = await Runner.run(starting_agent=agent, input=message)
    print(result.final_output)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mcp-url",
        required=True,
        help="Base URL for the MCP server (without /sse)",
    )
    args = parser.parse_args()

    async with MCPServerSse(
        name="SSE Custom Server",
        params={
            "url": args.mcp_url + "/sse",
        },
    ) as server:
        trace_id = gen_trace_id()
        with trace(workflow_name="SSE Example", trace_id=trace_id):
            print(
                f"View trace: https://platform.openai.com/traces/trace?trace_id={trace_id}\n"
            )
            await run(server)


if __name__ == "__main__":
    asyncio.run(main())
