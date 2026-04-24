"""
Farmer Site Publisher — Main entry point.
Publishes (or updates) a static SEO landing page on GitHub Pages
for a farmer whenever they publish a product on CropNGo.

One GitHub repo per farmer. Same site updated for every new product.
Never blocks the product publish flow.

Usage:
    # Test setup
    python -m services.farmer_site_publisher --test

    # Publish for a specific farmer
    python -m services.farmer_site_publisher --farmer-id=<username>
"""

import os
import sys
import re
import base64
import logging
import time
from datetime import datetime, timezone

import requests as http_requests

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
log = logging.getLogger("farmer_site_publisher")

# ── Firebase Admin Setup (reuses same pattern as app_crawler.py) ─────────────
import firebase_admin
from firebase_admin import credentials, firestore

FIREBASE_ADMIN_INIT = False
_db = None

def _init_firebase():
    """Initialize Firebase Admin SDK (idempotent)."""
    global FIREBASE_ADMIN_INIT, _db
    if FIREBASE_ADMIN_INIT:
        return _db

    try:
        if not firebase_admin._apps:
            # 1. Try environment variable
            creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
            if creds_json:
                import json
                cred = credentials.Certificate(json.loads(creds_json))
                firebase_admin.initialize_app(cred)
            # 2. Try local file fallback
            elif os.path.exists("firebase-key.json"):
                cred = credentials.Certificate("firebase-key.json")
                firebase_admin.initialize_app(cred)
            else:
                # 3. Last resort - Default ADC
                firebase_admin.initialize_app()
                
        _db = firestore.client()
        FIREBASE_ADMIN_INIT = True
        log.info("Firebase Admin initialized.")
    except Exception:
        log.warning("Firebase Admin SDK not fully configured. Some features may not work without service account keys.")

    return _db


# ── Env vars ─────────────────────────────────────────────────────────────────
from dotenv import load_dotenv
_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(_base_dir, ".env"))

GITHUB_BOT_USERNAME = os.getenv("GITHUB_BOT_USERNAME", "cropngo-bot")


def _make_slug(username: str) -> str:
    """
    Convert a username to a URL-safe slug.
    Lowercase, replace spaces with hyphens, strip non-alphanumeric.
    """
    slug = username.lower().strip()
    slug = slug.replace(" ", "-")
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "farmer"


def _ping_google(page_url: str):
    """Ping Google and Bing to re-index the page. Non-critical, always silent."""
    try:
        http_requests.get(
            f"https://www.google.com/ping?sitemap={page_url}/sitemap.xml",
            timeout=5,
        )
        log.info(f"Pinged Google for {page_url}")
    except Exception:
        pass  # Non-critical
    try:
        http_requests.get(
            f"https://www.bing.com/ping?sitemap={page_url}/sitemap.xml",
            timeout=5,
        )
        log.info(f"Pinged Bing for {page_url}")
    except Exception:
        pass  # Non-critical


def publish_farmer_site(farmer_id: str) -> dict:
    """
    Main entry point. Creates or updates a GitHub Pages SEO site for a farmer.

    Args:
        farmer_id: The farmer's username (Firestore document ID in 'users' collection).

    Returns:
        dict: {"url": str|None, "status": "created"|"updated"|"error", "repo": str|None}
    """
    try:
        # ── Step 1: Initialize Firebase & fetch farmer ───────────────────────
        db = _init_firebase()
        farmer_ref = db.collection("users").document(farmer_id)
        farmer_doc = farmer_ref.get()

        if not farmer_doc.exists:
            log.error(f"Farmer '{farmer_id}' not found in Firestore.")
            return {"url": None, "status": "error", "repo": None}

        farmer = farmer_doc.to_dict()
        farmer["username"] = farmer_id  # ensure username is set

        log.info(f"Publishing site for farmer: {farmer_id}")

        # ── Step 2: Fetch ALL products for this farmer ───────────────────────
        listings_query = db.collection("listings").where("sellerId", "==", farmer_id)
        listings_docs = listings_query.stream()
        all_products = []
        for doc in listings_docs:
            product = doc.to_dict()
            product["id"] = doc.id
            # Skip drafts from the website
            if product.get("isDraft", False):
                continue
            all_products.append(product)

        if not all_products:
            log.info(f"No published products for '{farmer_id}'. Skipping site generation.")
            return {"url": None, "status": "error", "repo": None}

        log.info(f"Found {len(all_products)} published products for {farmer_id}")

        # ── Step 3: Generate fallback images for products without images ─────
        from services.fallback_image import get_fallback_image

        for product in all_products:
            img = product.get("imageUrl") or product.get("image_url")
            if not img:
                tab = product.get("tab", "Crops")
                category = product.get("category", "Other")
                product["fallback_image"] = get_fallback_image(tab, category)
                product["imageUrl"] = product["fallback_image"]
                log.info(f"  → Using fallback image for '{product.get('name')}'")

        # ── Step 4: Build slug ────────────────────────────────────────────────
        base_slug = _make_slug(farmer_id)
        
        # Build product slug string
        product_names = [p.get("name", "").lower() for p in all_products if p.get("name")]
        
        # Filter and clean product names
        clean_names = []
        for name in product_names:
            cn = re.sub(r'[^a-z0-9]', '', name.split()[0]) # take first word to avoid massive urls
            if cn and cn not in clean_names:
                clean_names.append(cn)
                
        if len(clean_names) > 0:
            if len(clean_names) <= 4:
                prod_slug = "_and_".join(clean_names)
            else:
                prod_slug = "_and_".join(clean_names[:4]) + "_and_more"
            slug = f"{base_slug}-{prod_slug}"
        else:
            slug = base_slug
            
        farmer["slug"] = slug

        # ── Check if we need to rename an existing repo ───────────────────────
        old_repo_name = farmer.get("site_repo")
        new_repo_name = f"cropngo-{slug}"
        
        from services.github_api import _get_github_client
        if old_repo_name and old_repo_name != new_repo_name:
            try:
                g = _get_github_client()
                user = g.get_user()
                existing = user.get_repo(old_repo_name)
                existing.edit(name=new_repo_name)
                log.info(f"Renamed repo from {old_repo_name} to {new_repo_name}")
                time.sleep(2) # Wait for GitHub to process the rename
            except Exception as e:
                log.warning(f"Failed to rename repo from {old_repo_name} to {new_repo_name}: {e}")

        # ── Step 5: Get or create GitHub repo ─────────────────────────────────
        from services.github_api import get_or_create_repo, push_multiple_files

        repo, was_created = get_or_create_repo(slug)

        # ── Step 6: Build page URL ────────────────────────────────────────────
        page_url = f"https://{GITHUB_BOT_USERNAME}.github.io/cropngo-{slug}"

        # ── Step 7: Build SEO block ───────────────────────────────────────────
        from services.seo_builder import build_seo_block, build_sitemap_xml, build_robots_txt

        # Collect all keywords from all products
        new_keywords = []
        for p in all_products:
            tags = p.get("tags", []) or []
            for t in tags:
                if isinstance(t, str):
                    new_keywords.append(t)

        seo_block = build_seo_block(
            farmer=farmer,
            all_products=all_products,
            new_keywords=new_keywords,
            db_ref=farmer_ref,
            page_url=page_url,
        )

        # ── Step 8: Generate HTML ─────────────────────────────────────────────
        from services.html_generator import generate_full_html

        html_string = generate_full_html(farmer, all_products, seo_block)
        log.info(f"Generated HTML: {len(html_string)} bytes")

        # ── Step 9: Encode files to base64 ────────────────────────────────────
        html_b64 = base64.b64encode(html_string.encode("utf-8")).decode("utf-8")

        sitemap_xml = build_sitemap_xml(page_url)
        sitemap_b64 = base64.b64encode(sitemap_xml.encode("utf-8")).decode("utf-8")

        # ── Step 10-12: Build commit & push files ─────────────────────────────
        farmer_name = farmer.get("username", "Farmer")
        if was_created:
            commit_msg = f"Add {farmer_name}'s farm store"
        else:
            commit_msg = f"Update {farmer_name}'s store — {len(all_products)} products"

        robots_txt = build_robots_txt(page_url)
        robots_b64 = base64.b64encode(robots_txt.encode("utf-8")).decode("utf-8")

        files_to_push = [
            {"path": "index.html", "content_b64": html_b64},
            {"path": "sitemap.xml", "content_b64": sitemap_b64},
            {"path": "robots.txt", "content_b64": robots_b64},
        ]

        push_multiple_files(repo, files_to_push, commit_msg)

        # ── Step 13: Ping Google ──────────────────────────────────────────────
        _ping_google(page_url)

        # ── Step 14: Update farmer record in Firestore ────────────────────────
        farmer_ref.update({
            "site_url": page_url,
            "site_repo": repo.name,
            "site_last_updated": datetime.now(timezone.utc).isoformat(),
        })
        log.info(f"Updated farmer record with site_url: {page_url}")

        # ── Step 15: Return result ────────────────────────────────────────────
        status = "created" if was_created else "updated"
        result = {
            "url": page_url,
            "status": status,
            "repo": repo.name,
        }
        log.info(f"Site publish result: {result}")
        return result

    except Exception as e:
        log.error(f"farmer_site_publisher failed: {e}", exc_info=True)
        return {"url": None, "status": "error", "repo": None}


# ── CLI Runner ───────────────────────────────────────────────────────────────
def _run_test():
    """
    Test setup: create a test repo, push a test page, verify, then delete.
    """
    print("🧪 Running setup test...")
    print()

    from services.github_api import _get_github_client

    try:
        g = _get_github_client()
        user = g.get_user()
        print(f"✅ Authenticated as: {user.login}")
    except Exception as e:
        print(f"❌ GitHub authentication failed: {e}")
        print("   Check your GITHUB_BOT_TOKEN in .env")
        sys.exit(1)

    test_repo_name = "cropngo-test-delete-me"

    # Create test repo
    try:
        try:
            existing = user.get_repo(test_repo_name)
            print(f"   Found existing test repo, deleting first...")
            existing.delete()
            time.sleep(2)
        except Exception:
            pass

        print(f"   Creating test repo: {test_repo_name}...")
        repo = user.create_repo(
            name=test_repo_name,
            description="CropNGo setup test — safe to delete",
            auto_init=True,
            private=False,
        )
        print(f"✅ Repo created: {repo.html_url}")

        # Push test file
        test_html = "<html><body><h1>CropNGo Test</h1><p>Setup successful!</p></body></html>"
        repo.create_file(
            path="index.html",
            message="Test setup",
            content=test_html.encode("utf-8"),
            branch="main",
        )
        print(f"✅ Test index.html pushed")

        pages_url = f"https://{user.login}.github.io/{test_repo_name}"
        print(f"   Pages URL: {pages_url}")

        # Wait & clean up
        print("   Waiting 5s before cleanup...")
        time.sleep(5)
        repo.delete()
        print(f"✅ Test repo deleted")
        print()
        print("✅ Setup successful. You are ready to publish farmer sites.")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        # Try to clean up
        try:
            user.get_repo(test_repo_name).delete()
        except Exception:
            pass
        sys.exit(1)


def _run_for_farmer(farmer_id: str):
    """Publish site for a specific farmer."""
    print(f"Publishing site for farmer: {farmer_id}")
    result = publish_farmer_site(farmer_id)
    print(f"Result: {result}")


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--test" in args:
        _run_test()
    else:
        farmer_id = None
        for arg in args:
            if arg.startswith("--farmer-id="):
                farmer_id = arg.split("=", 1)[1]
                break

        if not farmer_id:
            print("Usage:")
            print("  python -m services.farmer_site_publisher --test")
            print("  python -m services.farmer_site_publisher --farmer-id=<username>")
            sys.exit(1)

        _run_for_farmer(farmer_id)
