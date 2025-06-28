from mcp.server.fastmcp import FastMCP

# Create an MCP server
mcp = FastMCP("Counter Demo")

counter = 0


@mcp.tool()
def add_to_counter(amount: int) -> int:
    """Add a value to the counter and return the new value."""
    global counter
    counter += amount
    return counter


@mcp.tool()
def get_counter_value() -> int:
    """Get the current value of the counter."""
    return counter


if __name__ == "__main__":
    mcp.run(transport="sse")
