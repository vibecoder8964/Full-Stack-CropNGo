"""
SEO Scheduler — Monthly auto-refresh for all farmer SEO sites.

Called by GitHub Actions cron or manually via POST /api/seo/refresh-all.
Iterates through all users with a published site and re-publishes
their GitHub Pages site with fresh SEO metadata.

Usage:
    # Via API endpoint (registered in main.py)
    POST /api/seo/refresh-all

    # Via CLI
    python -m services.seo_scheduler
"""

import logging
import time

log = logging.getLogger("seo_scheduler")


def refresh_all_sites() -> dict:
    """
    Re-publish SEO sites for ALL users who have a site_url set.

    Steps:
    1. Query Firestore for all users with site_url
    2. For each user, call publish_farmer_site()
    3. Return summary of results

    Returns:
        dict: {
            "total_users": int,
            "success": int,
            "failed": int,
            "results": list[dict]
        }
    """
    from services.farmer_site_publisher import publish_farmer_site, _init_firebase

    db = _init_firebase()
    if not db:
        return {"total_users": 0, "success": 0, "failed": 0,
                "error": "Firebase not initialized", "results": []}

    # Query all users who have a published site
    try:
        users_ref = db.collection("users")
        # Get all users that have a site_url field set
        all_users = users_ref.stream()

        users_with_sites = []
        for doc in all_users:
            data = doc.to_dict()
            if data.get("site_url"):
                users_with_sites.append(doc.id)

    except Exception as e:
        log.error(f"Failed to query users: {e}")
        return {"total_users": 0, "success": 0, "failed": 0,
                "error": str(e), "results": []}

    log.info(f"[SEO Refresh] Found {len(users_with_sites)} users with published sites")

    results = []
    success_count = 0
    fail_count = 0

    for farmer_id in users_with_sites:
        log.info(f"[SEO Refresh] Processing: {farmer_id}")
        try:
            result = publish_farmer_site(farmer_id=farmer_id)
            if result.get("status") in ("created", "updated"):
                success_count += 1
                results.append({
                    "farmer_id": farmer_id,
                    "status": result["status"],
                    "url": result.get("url"),
                })
            else:
                fail_count += 1
                results.append({
                    "farmer_id": farmer_id,
                    "status": "skipped",
                    "reason": result.get("status", "no products"),
                })
        except Exception as e:
            fail_count += 1
            log.error(f"[SEO Refresh] Failed for {farmer_id}: {e}")
            results.append({
                "farmer_id": farmer_id,
                "status": "error",
                "reason": str(e)[:100],
            })

        # Brief delay between users to avoid rate limiting
        time.sleep(1)

    summary = {
        "total_users": len(users_with_sites),
        "success": success_count,
        "failed": fail_count,
        "results": results,
    }
    log.info(f"[SEO Refresh] Complete: {summary['success']}/{summary['total_users']} updated")
    return summary


# ── CLI Runner ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json
    logging.basicConfig(level=logging.INFO)
    print("Running SEO refresh for all sites...")
    result = refresh_all_sites()
    print(json.dumps(result, indent=2))
