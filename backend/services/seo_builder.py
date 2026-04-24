"""
SEO metadata builder for farmer sites.
Builds meta tags, OpenGraph tags, Schema.org JSON-LD,
and manages cumulative keyword merging in Firestore.
"""

import json
import logging
from datetime import datetime, timezone

log = logging.getLogger("farmer_site_publisher")


def build_seo_block(farmer: dict, all_products: list, new_keywords: list,
                    db_ref=None, page_url: str = "") -> dict:
    """
    Build a complete SEO metadata block for the farmer's site.

    Args:
        farmer: dict with name, location, description, slug, avatar, phone, etc.
        all_products: list of ALL products this farmer has published.
        new_keywords: keywords from the latest (and all) products.
        db_ref: Firestore document reference for this user (to save merged keywords).
        page_url: The GitHub Pages URL for this farmer's site.

    Returns:
        dict with title, meta_description, meta_keywords, og_*, canonical_url,
        schema_json_ld.
    """
    farmer_name = farmer.get("username") or farmer.get("name", "Farmer")
    location = farmer.get("location", "Malaysia")

    # ── Keyword Merging ──────────────────────────────────────────────────────
    existing_kw_str = farmer.get("site_seo_keywords", "") or ""
    old_kws = [k.strip().lower() for k in existing_kw_str.split(",") if k.strip()]
    clean_new = [k.strip().lower() for k in new_keywords if k.strip()]

    # Merge: preserve order, deduplicate, never remove old keywords
    merged = list(dict.fromkeys(old_kws + clean_new))
    merged_str = ",".join(merged)

    # Save merged keywords back to Firestore
    if db_ref:
        try:
            db_ref.update({"site_seo_keywords": merged_str})
            log.info(f"Saved {len(merged)} merged keywords to Firestore.")
        except Exception as e:
            log.warning(f"Failed to save keywords to Firestore: {e}")

    # ── Top Products for Description ─────────────────────────────────────────
    product_names = [p.get("name", "") for p in all_products[:3]]
    top_products_str = ", ".join(product_names) if product_names else "fresh produce"

    # ── Build Meta Fields ────────────────────────────────────────────────────
    title = f"{farmer_name} — Fresh Farm Products | CropNGo Malaysia"

    meta_desc = f"Buy fresh {top_products_str} directly from {farmer_name} in {location}. Order now on CropNGo."
    # Trim to 155 chars for SEO
    if len(meta_desc) > 155:
        meta_desc = meta_desc[:152] + "..."

    # First product's image for OG
    og_image = ""
    for p in all_products:
        img = p.get("imageUrl") or p.get("image_url") or p.get("fallback_image")
        if img:
            og_image = img
            break

    # Schema.org JSON-LD
    schema_json_ld = build_schema_jsonld(farmer, all_products, page_url)

    return {
        "title": title,
        "meta_description": meta_desc,
        "meta_keywords": merged_str,
        "og_title": title,
        "og_description": meta_desc,
        "og_image": og_image,
        "canonical_url": page_url,
        "schema_json_ld": schema_json_ld,
    }


def build_schema_jsonld(farmer: dict, all_products: list, page_url: str) -> str:
    """
    Build Schema.org JSON-LD as a string.
    Type: LocalBusiness / Store with makesOffer array.
    """
    farmer_name = farmer.get("username") or farmer.get("name", "Farmer")
    location = farmer.get("location", "")
    phone = farmer.get("phone", "")
    slug = farmer.get("slug", "")

    offers = []
    for p in all_products:
        price = p.get("price")
        is_available = p.get("is_available", True)
        # Handle various availability field names
        if "isDraft" in p:
            is_available = not p.get("isDraft", False)

        product_id = p.get("id", "")
        offer = {
            "@type": "Offer",
            "name": p.get("name", "Product"),
            "description": (p.get("description", "") or "")[:200],
            "priceCurrency": "MYR",
            "availability": "https://schema.org/InStock" if is_available else "https://schema.org/OutOfStock",
            "url": f"https://cropngo-1654b.web.app/app/shop"
        }
        if price is not None:
            offer["price"] = str(price)

        offers.append(offer)

    schema = {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": f"{farmer_name}'s Farm Store",
        "description": farmer.get("bio") or farmer.get("description") or f"{farmer_name}'s agricultural products on CropNGo",
        "url": page_url,
        "makesOffer": offers,
    }

    if location:
        schema["address"] = {
            "@type": "PostalAddress",
            "addressLocality": location,
            "addressCountry": "MY",
        }

    lat = farmer.get("latitude")
    lng = farmer.get("longitude")
    if lat and lng:
        schema["geo"] = {
            "@type": "GeoCoordinates",
            "latitude": lat,
            "longitude": lng,
        }

    if phone:
        schema["telephone"] = phone

    return json.dumps(schema, ensure_ascii=False, indent=2)


def build_sitemap_xml(page_url: str) -> str:
    """
    Generate a sitemap.xml string for the farmer's site.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{page_url}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>"""


def build_robots_txt(page_url: str) -> str:
    """
    Generate a robots.txt string allowing all crawlers.
    Points to the sitemap for better indexing.
    """
    return f"""User-agent: *
Allow: /

Sitemap: {page_url}/sitemap.xml
"""
