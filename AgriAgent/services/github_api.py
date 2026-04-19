"""
GitHub REST API wrapper using PyGithub.
All repo operations for farmer SEO sites go through here.
No git CLI or subprocess — only GitHub REST API via PyGithub.
"""

import os
import time
import base64
import logging

from github import Github, GithubException

log = logging.getLogger("farmer_site_publisher")

GITHUB_BOT_TOKEN = os.getenv("GITHUB_BOT_TOKEN", "")
GITHUB_BOT_USERNAME = os.getenv("GITHUB_BOT_USERNAME", "cropngo-bot")


def _get_github_client() -> Github:
    """Create an authenticated PyGithub client."""
    if not GITHUB_BOT_TOKEN:
        raise RuntimeError("GITHUB_BOT_TOKEN is not set in .env")
    return Github(GITHUB_BOT_TOKEN)


def get_or_create_repo(slug: str) -> tuple:
    """
    Ensure a GitHub repo 'cropngo-{slug}' exists under the bot account.
    Creates it as PUBLIC with auto-init if missing, then enables GitHub Pages.

    Returns: (repo_object, was_created: bool)
    """
    g = _get_github_client()
    user = g.get_user()
    repo_name = f"cropngo-{slug}"
    was_created = False

    # Check if repo already exists
    try:
        repo = user.get_repo(repo_name)
        log.info(f"Repo '{repo_name}' already exists.")
    except GithubException as e:
        if e.status == 404:
            # Create new public repo with auto-init (README)
            repo = user.create_repo(
                name=repo_name,
                description=f"{slug}'s farm store on CropNGo",
                auto_init=True,
                private=False,
            )
            was_created = True
            log.info(f"Created repo '{repo_name}'.")
        else:
            raise

    # Enable GitHub Pages (source: main branch, path: /)
    _enable_github_pages(repo)

    return repo, was_created


def _enable_github_pages(repo):
    """
    Enable GitHub Pages on the repo using the REST API.
    Source: main branch, path: /
    Polls up to 30 seconds for Pages to become active.
    """
    try:
        # Use the repo's raw requester to call the Pages API
        # PyGithub doesn't have native Pages support, so we use _requester
        headers = {"Accept": "application/vnd.github+json"}
        
        # Check if Pages is already enabled
        try:
            repo._requester.requestJsonAndCheck(
                "GET",
                f"/repos/{repo.full_name}/pages",
                headers=headers,
            )
            log.info("GitHub Pages already enabled.")
            return
        except GithubException as e:
            if e.status != 404:
                raise

        # Enable Pages
        body = {
            "source": {
                "branch": "main",
                "path": "/"
            }
        }
        repo._requester.requestJsonAndCheck(
            "POST",
            f"/repos/{repo.full_name}/pages",
            headers=headers,
            input=body,
        )
        log.info("GitHub Pages enabled. Waiting for activation...")

        # Poll for Pages to become active (up to 30 seconds)
        for i in range(15):
            time.sleep(2)
            try:
                status, data = repo._requester.requestJsonAndCheck(
                    "GET",
                    f"/repos/{repo.full_name}/pages",
                    headers=headers,
                )
                if data.get("status") == "built":
                    log.info("GitHub Pages is active.")
                    return
            except GithubException:
                pass

        log.info("GitHub Pages activation timed out (will activate eventually).")

    except GithubException as e:
        # Pages might already be enabled or might require manual activation
        log.warning(f"GitHub Pages setup note: {e}")


def get_file_sha(repo, path: str):
    """
    Get the SHA of an existing file in the repo.
    Returns SHA string if file exists, None otherwise.
    """
    try:
        contents = repo.get_contents(path, ref="main")
        return contents.sha
    except GithubException as e:
        if e.status == 404:
            return None
        raise


def push_file(repo, path: str, content_b64: str, commit_message: str, sha=None):
    """
    Push a file to the repo via GitHub Contents API.
    If sha is provided → UPDATE commit.
    If sha is None → CREATE commit.

    content_b64: base64-encoded file content string.
    """
    try:
        if sha:
            repo.update_file(
                path=path,
                message=commit_message,
                content=base64.b64decode(content_b64),
                sha=sha,
                branch="main",
            )
            log.info(f"Updated '{path}' in {repo.name}")
        else:
            repo.create_file(
                path=path,
                message=commit_message,
                content=base64.b64decode(content_b64),
                branch="main",
            )
            log.info(f"Created '{path}' in {repo.name}")
    except GithubException as e:
        log.error(f"Failed to push '{path}': {e}")
        raise


def push_multiple_files(repo, files: list, commit_message: str):
    """
    Push multiple files in a single commit using the Git Trees API.
    files: list of dicts with keys: path, content_b64

    This avoids multiple commits when pushing index.html + sitemap.xml.
    """
    try:
        # Get the current commit SHA on main
        ref = repo.get_git_ref("heads/main")
        latest_commit_sha = ref.object.sha
        base_tree = repo.get_git_tree(latest_commit_sha)

        # Build tree elements
        tree_elements = []
        from github import InputGitTreeElement
        for f in files:
            content = base64.b64decode(f["content_b64"]).decode("utf-8")
            element = InputGitTreeElement(
                path=f["path"],
                mode="100644",
                type="blob",
                content=content,
            )
            tree_elements.append(element)

        # Create new tree
        new_tree = repo.create_git_tree(tree_elements, base_tree)

        # Create commit
        parent_commit = repo.get_git_commit(latest_commit_sha)
        new_commit = repo.create_git_commit(
            message=commit_message,
            tree=new_tree,
            parents=[parent_commit],
        )

        # Update ref
        ref.edit(sha=new_commit.sha)
        log.info(f"Pushed {len(files)} files in single commit to {repo.name}")

    except GithubException as e:
        log.error(f"Multi-file push failed: {e}")
        raise
