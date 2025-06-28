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
    return shape["id"]


@mcp.tool()
def move_shapes(new_shape_positions: list) -> bool:
    """
    Move one or more shapes to new positions.

    Args:
        new_shape_positions (list): A list of dicts with shape IDs and new positions.
            Each dict should have keys: 'id', 'x', 'y'.

    Returns:
        bool: True if all shapes were found and moved, False if any shape was not found.
    """
    all_moved = True
    for new_shape_position in new_shape_positions:
        shape_found = False
        for shape in shapes:
            if shape["id"] == new_shape_position["id"]:
                shape["x"] = new_shape_position["x"]
                shape["y"] = new_shape_position["y"]
                shape_found = True
        if not shape_found:
            all_moved = False
    return all_moved


@mcp.tool()
def remove_shapes(shape_ids: list) -> bool:
    """
    Remove one or more shapes from the canvas.

    Args:
        shape_ids (list): A list of unique shape IDs to remove.

    Returns:
        bool: True if all shapes were found and removed, False if any shape was not found.
    """
    global shapes
    initial_count = len(shapes)
    shapes = [shape for shape in shapes if shape["id"] not in shape_ids]
    return len(shapes) < initial_count


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


if __name__ == "__main__":
    mcp.run(transport="sse")
