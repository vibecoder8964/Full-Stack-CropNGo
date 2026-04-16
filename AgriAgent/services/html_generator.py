"""
HTML page builder for farmer SEO sites.
Generates a complete, self-contained index.html with inline CSS.
No external CSS, no JS frameworks, no external fonts.
Mobile-first, responsive, lightweight — targets 95+ PageSpeed.
"""

import html
import logging
from datetime import datetime, timezone

log = logging.getLogger("farmer_site_publisher")

# ── Category → Pill Color Mapping ────────────────────────────────────────────
_CATEGORY_COLORS = {
    "vegetables": ("#e8f5e9", "#2d7a4f"),
    "fruits": ("#fff3e0", "#e65100"),
    "paddy": ("#fff8e1", "#f57f17"),
    "durian": ("#fff3e0", "#e65100"),
    "rambutan": ("#fce4ec", "#c62828"),
    "mango": ("#fff8e1", "#f57f17"),
    "rubber": ("#efebe9", "#4e342e"),
    "palm oil": ("#fff3e0", "#bf360c"),
    "grains": ("#efebe9", "#5d4037"),
    "tractors": ("#e3f2fd", "#1565c0"),
    "irrigation systems": ("#e3f2fd", "#1565c0"),
    "drones": ("#ede7f6", "#4527a0"),
    "greenhouse equipment": ("#e8f5e9", "#2e7d32"),
    "harvesting tools": ("#efebe9", "#4e342e"),
    "fertilizers": ("#e8f5e9", "#1b5e20"),
    "pesticides": ("#fce4ec", "#b71c1c"),
    "other": ("#f5f5f5", "#616161"),
}


def _get_category_colors(category: str) -> tuple:
    """Return (bg_color, text_color) for a category pill."""
    key = (category or "other").lower().strip()
    return _CATEGORY_COLORS.get(key, _CATEGORY_COLORS["other"])


def _esc(text) -> str:
    """HTML-escape a string safely."""
    if text is None:
        return ""
    return html.escape(str(text))


def _build_css() -> str:
    """Return the complete inline CSS for the page."""
    return """
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            color:#1a1a1a;
            background:#ffffff;
            line-height:1.6;
        }
        .container{max-width:960px;margin:0 auto;padding:0 20px}

        /* Sticky Header */
        .site-header{
            position:sticky;top:0;z-index:100;
            background:#2d7a4f;color:#fff;
            padding:14px 0;
            box-shadow:0 2px 8px rgba(0,0,0,0.15);
        }
        .site-header .container{
            display:flex;align-items:center;justify-content:space-between;
        }
        .site-header .brand{font-size:1.1rem;font-weight:700;letter-spacing:-0.01em}
        .site-header .cta-btn{
            background:#fff;color:#2d7a4f;
            padding:8px 18px;border-radius:6px;
            text-decoration:none;font-weight:700;font-size:0.9rem;
        }
        .site-header .cta-btn:hover{background:#f0f7f0}

        /* Hero */
        .hero{
            background:linear-gradient(135deg,#f0f7f0,#e8f5e9);
            padding:48px 0 40px;text-align:center;
        }
        .hero-avatar{
            width:80px;height:80px;border-radius:50%;
            object-fit:cover;margin:0 auto 16px;
            border:4px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.1);
            display:block;background:#2d7a4f;
        }
        .hero-avatar-initials{
            width:80px;height:80px;border-radius:50%;
            margin:0 auto 16px;
            border:4px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.1);
            display:flex;align-items:center;justify-content:center;
            background:#2d7a4f;color:#fff;font-size:1.8rem;font-weight:700;
        }
        .hero h1{font-size:1.8rem;font-weight:800;color:#1a1a1a;margin-bottom:6px}
        .hero .location{color:#6b7280;font-size:0.95rem;margin-bottom:10px}
        .hero .bio{color:#4a5568;font-size:0.95rem;max-width:600px;margin:0 auto 16px;line-height:1.6}
        .badge-verified{
            display:inline-block;
            background:#e8f5e9;color:#2d7a4f;
            padding:6px 16px;border-radius:20px;
            font-size:0.85rem;font-weight:600;
        }
        .product-count{
            margin-top:10px;color:#6b7280;font-size:0.9rem;font-weight:500;
        }

        /* Products Section */
        .products-section{padding:40px 0}
        .products-section h2.section-title{
            font-size:1.5rem;font-weight:700;color:#1a1a1a;margin-bottom:4px;
        }
        .products-section .section-sub{
            color:#6b7280;font-size:0.9rem;margin-bottom:28px;
        }

        /* Product Row */
        .product-row{
            display:flex;gap:24px;
            padding:28px 0;
            border-bottom:1px solid #e8f5e9;
        }
        .product-row:nth-child(odd){background:#ffffff}
        .product-row:nth-child(even){background:#f9fdf9}
        .product-row .product-img{
            width:280px;min-width:280px;
            height:280px;
            border-radius:8px;object-fit:cover;
            box-shadow:0 2px 8px rgba(0,0,0,0.1);
        }
        .product-row .product-details{
            flex:1;display:flex;flex-direction:column;gap:10px;
        }
        .product-row .product-details h2{
            font-size:1.25rem;font-weight:700;color:#1a1a1a;margin:0;
        }
        .category-pill{
            display:inline-block;
            padding:4px 12px;border-radius:12px;
            font-size:0.8rem;font-weight:600;
            width:fit-content;
        }
        .price{font-size:1.2rem;font-weight:800;color:#ff6b35}
        .description{color:#4a5568;font-size:0.9rem;line-height:1.6}
        .availability{font-size:0.85rem;font-weight:600}
        .availability.in-stock{color:#2d7a4f}
        .availability.out-of-stock{color:#dc2626}
        .keywords-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
        .keyword-pill{
            background:#f3f4f6;color:#6b7280;
            padding:3px 10px;border-radius:10px;
            font-size:0.75rem;font-weight:500;
        }
        .order-btn{
            display:block;width:100%;text-align:center;
            background:#2d7a4f;color:#fff;
            padding:14px 24px;border-radius:6px;
            font-size:1.1rem;font-weight:700;
            text-decoration:none;cursor:pointer;
            border:none;margin-top:auto;
            transition:background 0.2s;
        }
        .order-btn:hover{background:#1e5c3a}

        /* WhatsApp Section */
        .whatsapp-section{
            padding:36px 0;text-align:center;
            background:#f0f7f0;
        }
        .whatsapp-section h3{font-size:1.2rem;font-weight:700;margin-bottom:16px;color:#1a1a1a}
        .whatsapp-btn{
            display:inline-block;
            background:#25d366;color:#fff;
            padding:12px 28px;border-radius:8px;
            font-size:1rem;font-weight:700;
            text-decoration:none;
        }
        .whatsapp-btn:hover{background:#1fbd5a}

        /* Footer */
        .site-footer{
            background:#1a1a1a;color:#a0a0a0;
            padding:30px 0;text-align:center;
            font-size:0.85rem;line-height:1.8;
        }
        .site-footer a{color:#4ade80;text-decoration:none}
        .site-footer a:hover{text-decoration:underline}

        /* Mobile Responsive */
        @media(max-width:600px){
            .product-row{flex-direction:column;gap:16px;padding:20px 0}
            .product-row .product-img{width:100%;min-width:unset;height:220px}
            .hero h1{font-size:1.5rem}
            .site-header .brand{font-size:0.95rem}
            .site-header .cta-btn{padding:6px 14px;font-size:0.82rem}
        }
        @media(min-width:600px){
            .product-row{padding:28px 16px}
        }
    """


def generate_full_html(farmer: dict, all_products: list, seo_block: dict) -> str:
    """
    Generate a complete, self-contained index.html as a string.

    Args:
        farmer: dict with username, location, bio/description, avatar, phone, slug, etc.
        all_products: list of ALL product dicts for this farmer.
        seo_block: dict from seo_builder.build_seo_block() with all SEO metadata.

    Returns:
        Complete HTML string.
    """
    farmer_name = _esc(farmer.get("username") or farmer.get("name", "Farmer"))
    location = _esc(farmer.get("location", ""))
    bio = _esc(farmer.get("bio") or farmer.get("description", ""))
    phone = farmer.get("phone", "") or ""
    avatar = farmer.get("avatar", "") or ""
    slug = farmer.get("slug", "")
    current_year = datetime.now(timezone.utc).year
    today_str = datetime.now(timezone.utc).strftime("%B %d, %Y")

    # SEO fields
    title = _esc(seo_block.get("title", f"{farmer_name} — AgriConnect"))
    meta_desc = _esc(seo_block.get("meta_description", ""))
    meta_keywords = _esc(seo_block.get("meta_keywords", ""))
    og_title = _esc(seo_block.get("og_title", title))
    og_desc = _esc(seo_block.get("og_description", meta_desc))
    og_image = _esc(seo_block.get("og_image", ""))
    canonical_url = _esc(seo_block.get("canonical_url", ""))
    schema_json_ld = seo_block.get("schema_json_ld", "{}")

    # ── HEAD ─────────────────────────────────────────────────────────────────
    head = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{meta_desc}">
    <meta name="keywords" content="{meta_keywords}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{canonical_url}">

    <!-- OpenGraph Tags -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="{og_title}">
    <meta property="og:description" content="{og_desc}">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:image" content="{og_image}">
    <meta property="og:site_name" content="AgriConnect Malaysia">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{og_title}">
    <meta name="twitter:description" content="{og_desc}">
    <meta name="twitter:image" content="{og_image}">

    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
{schema_json_ld}
    </script>

    <style>{_build_css()}</style>
</head>"""

    # ── HEADER ───────────────────────────────────────────────────────────────
    header = f"""
<body>
    <header class="site-header">
        <div class="container">
            <span class="brand">🌿 {farmer_name}'s Farm Store</span>
            <a href="https://agriconnect-1654b.web.app/app/shop" class="cta-btn" target="_blank">View on AgriConnect →</a>
        </div>
    </header>"""

    # ── HERO ─────────────────────────────────────────────────────────────────
    if avatar and not avatar.startswith("data:"):
        avatar_html = f'<img src="{_esc(avatar)}" alt="{farmer_name}" class="hero-avatar" loading="lazy">'
    else:
        initials = (farmer.get("username") or "?")[:2].upper()
        avatar_html = f'<div class="hero-avatar-initials">{_esc(initials)}</div>'

    hero = f"""
    <section class="hero">
        <div class="container">
            {avatar_html}
            <h1>{farmer_name}</h1>
            {"<p class='location'>📍 " + location + "</p>" if location else ""}
            {"<p class='bio'>" + bio + "</p>" if bio else ""}
            <span class="badge-verified">✅ Verified AgriConnect Seller</span>
            <p class="product-count">{len(all_products)} Product{"s" if len(all_products) != 1 else ""} Available</p>
        </div>
    </section>"""

    # ── PRODUCTS ─────────────────────────────────────────────────────────────
    product_rows = []
    for p in all_products:
        p_name = _esc(p.get("name", "Product"))
        p_desc = _esc(p.get("description", ""))
        p_price = p.get("price")
        p_category = p.get("category", "Other")
        p_id = p.get("id", "")
        p_tab = p.get("tab", "Crops")

        # Image: uploaded URL or fallback data URI
        p_image = p.get("imageUrl") or p.get("image_url") or p.get("fallback_image", "")

        # Availability
        is_available = not p.get("isDraft", False)

        # Category pill colors
        cat_bg, cat_text = _get_category_colors(p_category)

        # Keywords / tags
        tags = p.get("tags", []) or []
        keywords_html = ""
        if tags:
            pills = "".join(f'<span class="keyword-pill">{_esc(t)}</span>' for t in tags)
            keywords_html = f'<div class="keywords-row">{pills}</div>'

        # Price display
        price_html = ""
        if p_price is not None:
            price_html = f'<div class="price">RM {p_price}</div>'

        # Availability badge
        if is_available:
            avail_html = '<div class="availability in-stock">✅ In Stock</div>'
        else:
            avail_html = '<div class="availability out-of-stock">❌ Out of Stock</div>'

        row = f"""
        <div class="product-row">
            <img src="{_esc(p_image)}" alt="{p_name}" class="product-img" loading="lazy">
            <div class="product-details">
                <h2>{p_name}</h2>
                <span class="category-pill" style="background:{cat_bg};color:{cat_text}">{_esc(p_category)}</span>
                {price_html}
                <p class="description">{p_desc}</p>
                {avail_html}
                {keywords_html}
                <a href="https://agriconnect-1654b.web.app/app/shop" class="order-btn" target="_blank">Order on AgriConnect →</a>
            </div>
        </div>"""
        product_rows.append(row)

    products_section = f"""
    <section class="products-section">
        <div class="container">
            <h2 class="section-title">Products for Sale</h2>
            <p class="section-sub">Click any product to order on AgriConnect</p>
            {"".join(product_rows)}
        </div>
    </section>"""

    # ── WHATSAPP ─────────────────────────────────────────────────────────────
    whatsapp_section = ""
    clean_phone = phone.replace(" ", "").replace("-", "").replace("+", "")
    if clean_phone:
        wa_msg = "Hi, I found your products on AgriConnect! I am interested in ordering."
        whatsapp_section = f"""
    <section class="whatsapp-section">
        <div class="container">
            <h3>📱 Contact {farmer_name} directly</h3>
            <a href="https://wa.me/{_esc(clean_phone)}?text={_esc(wa_msg)}" class="whatsapp-btn" target="_blank">
                Message on WhatsApp
            </a>
        </div>
    </section>"""

    # ── FOOTER ───────────────────────────────────────────────────────────────
    footer = f"""
    <footer class="site-footer">
        <div class="container">
            <p>Sold via <a href="https://agriconnect-1654b.web.app" target="_blank">AgriConnect</a> — Malaysia's Agricultural Marketplace</p>
            <p>© {current_year} AgriConnect. Supporting local farmers.</p>
            <p>Last updated: {today_str}</p>
        </div>
    </footer>
</body>
</html>"""

    return head + header + hero + products_section + whatsapp_section + footer
