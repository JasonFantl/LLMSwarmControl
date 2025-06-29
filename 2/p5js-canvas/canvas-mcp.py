# python_mcp_server.py
import asyncio
import websockets
import json
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Browser Controlled Game")

WS_URI = "ws://localhost:8765"


async def send_to_browser(cmd, args=None):
    async with websockets.connect(WS_URI) as ws:
        # Register as python client
        await ws.send(json.dumps({"role": "python"}))
        await ws.send(json.dumps({"command": cmd, "args": args}))
        reply = await ws.recv()
        return json.loads(reply)["result"]


@mcp.tool()
async def add_circle(x: int, y: int, radius: int = 30, color: str = "blue") -> int:
    """
    Add a circle to the canvas.
    Args:
        x (int): X position of the center (pixels, 0-400).
        y (int): Y position of the center (pixels, 0-300).
        radius (int, optional): Radius of the circle (pixels, default 30, suggested 10-100).
        color (str, optional): Fill color (default 'blue'). Valid options: 'red', 'blue', 'green', 'yellow', 'black', 'white', or any CSS color string.
    Returns:
        int: The unique ID of the created circle.
    """
    return await send_to_browser(
        "add_circle", {"x": x, "y": y, "radius": radius, "color": color}
    )


@mcp.tool()
async def add_square(x: int, y: int, size: int = 40, color: str = "red") -> int:
    """
    Add a square to the canvas.
    Args:
        x (int): X position of the center (pixels, 0-400).
        y (int): Y position of the center (pixels, 0-300).
        size (int, optional): Side length of the square (pixels, default 40, suggested 10-100).
        color (str, optional): Fill color (default 'red'). Valid options: 'red', 'blue', 'green', 'yellow', 'black', 'white', or any CSS color string.
    Returns:
        int: The unique ID of the created square.
    """
    return await send_to_browser(
        "add_square", {"x": x, "y": y, "size": size, "color": color}
    )


@mcp.tool()
async def move_shape(id: int, x: int, y: int) -> bool:
    """
    Move a shape to a new position.
    Args:
        id (int): The unique ID of the shape to move (from add_circle/add_square).
        x (int): New X position (pixels, 0-400).
        y (int): New Y position (pixels, 0-300).
    Returns:
        bool: True if the shape was found and moved, False otherwise.
    """
    return await send_to_browser("move_shape", {"id": id, "x": x, "y": y})


@mcp.tool()
async def change_color(id: int, color: str) -> bool:
    """
    Change the color of a shape.
    Args:
        id (int): The unique ID of the shape to change.
        color (str): New fill color. Valid options: 'red', 'blue', 'green', 'yellow', 'black', 'white', or any CSS color string.
    Returns:
        bool: True if the shape was found and color changed, False otherwise.
    """
    return await send_to_browser("change_color", {"id": id, "color": color})


@mcp.tool()
async def remove_shape(id: int) -> bool:
    """
    Remove a shape from the canvas.
    Args:
        id (int): The unique ID of the shape to remove.
    Returns:
        bool: True if the shape was found and removed, False otherwise.
    """
    return await send_to_browser("remove_shape", {"id": id})


@mcp.tool()
async def get_canvas() -> list:
    """
    Get the current state of the canvas.
    Returns:
        list: A list of all shapes on the canvas. Each shape is a dict with keys:
            - id (int): Unique shape ID
            - type (str): 'circle' or 'square'
            - x (int): X position (pixels)
            - y (int): Y position (pixels)
            - radius (int): For circles, the radius (pixels)
            - size (int): For squares, the side length (pixels)
            - color (str): Fill color
    """
    return await send_to_browser("get_canvas")


if __name__ == "__main__":
    mcp.run(transport="sse")
