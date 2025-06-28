# notes-mcp.py
from mcp.server.fastmcp import FastMCP
from typing import List, Dict

mcp = FastMCP("Note Taking Server", port=8001)

# In-memory notes storage: list of dicts with 'id' and 'content'
notes: List[Dict] = []
note_id_counter = 1


@mcp.tool()
def get_all_notes() -> List[Dict]:
    """
    Get a list of all notes.
    Returns:
        List[Dict]: A list of notes, each with 'id' (int) and 'content' (str).
    """
    print(f"Retrieving all notes: {notes}")
    return notes.copy()


@mcp.tool()
def create_note(content: str) -> Dict:
    """
    Create a new note with the given content.
    Args:
        content (str): The text of the note.
    Returns:
        Dict: The created note with 'id' and 'content'.
    """
    print(f"Creating note with content: {content}")
    global note_id_counter
    note = {"id": note_id_counter, "content": content}
    notes.append(note)
    note_id_counter += 1
    return note


@mcp.tool()
def delete_note(note_id: int) -> bool:
    """
    Delete a note by its ID.
    Args:
        note_id (int): The ID of the note to delete.
    Returns:
        bool: True if deleted, False if not found.
    """
    global notes
    for i, note in enumerate(notes):
        if note["id"] == note_id:
            del notes[i]
            return True
    return False


@mcp.tool()
def rewrite_note(note_id: int, new_content: str) -> bool:
    """
    Rewrite (replace) the content of a note by its ID.
    Args:
        note_id (int): The ID of the note to rewrite.
        new_content (str): The new content for the note.
    Returns:
        bool: True if rewritten, False if not found.
    """
    for note in notes:
        if note["id"] == note_id:
            note["content"] = new_content
            return True
    return False


if __name__ == "__main__":
    mcp.run(transport="sse")
