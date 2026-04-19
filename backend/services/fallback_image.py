"""
Fallback image provider for products without uploaded photos.
Uses pre-generated static assets — NO Gemini API calls.

Categories map to one of two fallback images:
  - Fruits/Crops → fallback_fruits.png
  - Equipment    → fallback_equipment.png

Images are embedded as base64 data URIs in the HTML so no external
image hosting is needed.
"""

import os
import base64
import logging

log = logging.getLogger("farmer_site_publisher")

# Path to the pre-generated fallback images
_ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
_FRUITS_PATH = os.path.join(_ASSETS_DIR, "fallback_fruits.png")
_EQUIPMENT_PATH = os.path.join(_ASSETS_DIR, "fallback_equipment.png")

# Cache the data URIs once loaded
_cache = {}

# Tabs/categories that map to equipment
_EQUIPMENT_TABS = {"equipment"}
_EQUIPMENT_CATEGORIES = {
    "tractors", "irrigation systems", "drones", "greenhouse equipment",
    "harvesting tools", "fertilizers", "pesticides", "plows",
    "seedling tools", "storage equipment",
}

# Hardcoded SVG fallback if even the static images are missing
_SVG_FALLBACK = (
    "data:image/svg+xml;base64,"
    + base64.b64encode(
        b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">'
        b'<rect width="200" height="200" fill="#f0f7f0"/>'
        b'<g transform="translate(100,100)">'
        b'<ellipse rx="50" ry="35" fill="#2d7a4f" opacity="0.8"/>'
        b'<path d="M0,-60 Q20,-40 10,-10 Q0,5 -5,-10 Q-15,-40 0,-60Z" fill="#4caf50"/>'
        b'<path d="M0,-60 Q-20,-40 -10,-10 Q0,5 5,-10 Q15,-40 0,-60Z" fill="#388e3c"/>'
        b'<line x1="0" y1="-60" x2="0" y2="0" stroke="#2e7d32" stroke-width="3"/>'
        b'</g>'
        b'<text x="100" y="170" text-anchor="middle" font-family="sans-serif" '
        b'font-size="14" fill="#6b7280">No Image</text>'
        b'</svg>'
    ).decode("utf-8")
)


def _load_image_as_data_uri(path: str) -> str:
    """Load a PNG image file and return as a base64 data URI."""
    if path in _cache:
        return _cache[path]

    try:
        with open(path, "rb") as f:
            raw = f.read()
        data_uri = "data:image/png;base64," + base64.b64encode(raw).decode("utf-8")
        _cache[path] = data_uri
        return data_uri
    except Exception as e:
        log.warning(f"Failed to load fallback image '{path}': {e}")
        return _SVG_FALLBACK


def get_fallback_image(tab: str = "", category: str = "") -> str:
    """
    Return a base64 data URI for the appropriate fallback image.

    Args:
        tab: The listing tab (e.g. 'Crops', 'Equipment', 'Wanted')
        category: The product category (e.g. 'Tractors', 'Vegetables')

    Returns:
        A data URI string (never empty).
    """
    tab_lower = (tab or "").lower().strip()
    cat_lower = (category or "").lower().strip()

    # If the tab is Equipment or the category is an equipment category
    if tab_lower in _EQUIPMENT_TABS or cat_lower in _EQUIPMENT_CATEGORIES:
        return _load_image_as_data_uri(_EQUIPMENT_PATH)

    # Default to fruits/crops image
    return _load_image_as_data_uri(_FRUITS_PATH)
