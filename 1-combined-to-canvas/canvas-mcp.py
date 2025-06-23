from mcp.server.fastmcp import FastMCP
import threading
import tkinter as tk
import uuid


# Data structure for shapes
def make_shape(shape_type, x, y, size, color):
    return {
        "id": str(uuid.uuid4()),
        "type": shape_type,
        "x": x,
        "y": y,
        "size": size,
        "color": color,
    }


shapes = []
canvas_callbacks = []


# Tkinter GUI for live canvas
def start_canvas_gui():
    root = tk.Tk()
    root.title("MCP Canvas")
    canvas = tk.Canvas(root, width=600, height=400, bg="white")
    canvas.pack()

    def redraw():
        canvas.delete("all")
        for shape in shapes:
            if shape["type"] == "circle":
                x, y, r = shape["x"], shape["y"], shape["size"]
                canvas.create_oval(x - r, y - r, x + r, y + r, fill=shape["color"])
            elif shape["type"] == "square":
                x, y, s = shape["x"], shape["y"], shape["size"]
                canvas.create_rectangle(
                    x - s // 2, y - s // 2, x + s // 2, y + s // 2, fill=shape["color"]
                )
        canvas.after(100, redraw)

    canvas.after(100, redraw)
    root.mainloop()


# Start the GUI in a background thread
gui_thread = threading.Thread(target=start_canvas_gui, daemon=True)
gui_thread.start()


# MCP server
def update_canvas():
    # This is a placeholder for any future hooks
    pass


mcp = FastMCP("Canvas Demo")


@mcp.tool()
def create_circle(x: int, y: int, radius: int, color: str) -> str:
    """
    Create a circle on the canvas.

    Args:
        x (int): X position of the center in pixels (0-600, left to right).
        y (int): Y position of the center in pixels (0-400, top to bottom).
        radius (int): Radius of the circle in pixels (suggested: 10-100).
        color (str): Fill color (e.g., red, blue, green, yellow, black, white, or any Tkinter color string).

    Returns:
        str: The unique ID of the created circle.
    """
    shape = make_shape("circle", x, y, radius, color)
    shapes.append(shape)
    update_canvas()
    return shape["id"]


@mcp.tool()
def create_square(x: int, y: int, size: int, color: str) -> str:
    """
    Create a square on the canvas.

    Args:
        x (int): X position of the center in pixels (0-600, left to right).
        y (int): Y position of the center in pixels (0-400, top to bottom).
        size (int): Side length of the square in pixels (suggested: 10-100).
        color (str): Fill color (e.g., red, blue, green, yellow, black, white, or any Tkinter color string).

    Returns:
        str: The unique ID of the created square.
    """
    shape = make_shape("square", x, y, size, color)
    shapes.append(shape)
    update_canvas()
    return shape["id"]


@mcp.tool()
def move_shape(shape_id: str, new_x: int, new_y: int) -> bool:
    """
    Move an existing shape to a new position.

    Args:
        shape_id (str): The unique ID of the shape to move (from create_circle/create_square).
        new_x (int): New X position in pixels (0-600).
        new_y (int): New Y position in pixels (0-400).

    Returns:
        bool: True if the shape was found and moved, False otherwise.
    """
    for shape in shapes:
        if shape["id"] == shape_id:
            shape["x"] = new_x
            shape["y"] = new_y
            update_canvas()
            return True
    return False


@mcp.tool()
def get_canvas() -> list:
    """
    Get the current state of the canvas.

    Returns:
        list: A list of all shapes on the canvas. Each shape is a dict with keys:
            - id (str): Unique shape ID
            - type (str): 'circle' or 'square'
            - x (int): X position (pixels)
            - y (int): Y position (pixels)
            - size (int): Radius (for circles) or side length (for squares)
            - color (str): Fill color
    """
    return shapes


mcp.run(transport="sse")
