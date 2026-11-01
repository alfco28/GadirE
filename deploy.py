#!/usr/bin/env python3
# deploy.py — One-command deployment of the GadirE web app (frontend).
#
# Runs on the LAPTOP, inside the repo. The same flow as the manual process,
# minus the mistakes:
#   1) refuse to deploy uncommitted or unpushed code (what gets deployed is
#      always backed up on GitHub first);
#   2) rsync the working tree to a staging folder on the server, EXCLUDING
#      data/ (the live geojson and ICS live there and must never be clobbered
#      by the repo copies) and all the junk (.git, .DS_Store);
#   3) clean the staging leftovers (an old data/ clone, .DS_Store) and
#      sudo-copy staging over the web root — data/ never travels;
#   4) verify what the web actually serves (the version badge) and that the
#      production geojson did not move.
#
# The private details (host, user, paths) live in deploy_config.json next to
# this file, which is gitignored: the public repo only carries
# deploy_config.example.json. Fill it in once and you are done.
#
# Usage (from the repo root):
#     python3 deploy.py             # full deploy (asks for the sudo password once)
#     python3 deploy.py --dry-run  # print every remote command, execute nothing

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

CONFIG_FILE = "deploy_config.json"
EXAMPLE_FILE = "deploy_config.example.json"

# The version badge: the empty i18n paragraph followed by the plain one that
# the settings modal shows (the same pair `grep 0.5.233` checked by hand)
VERSION_ANCHOR = re.compile(
    r'<p id="t-settings-aboutGadirE-version"></p>\s*<p>([^<]+)</p>')


def run(cmd, check=True, capture=True):
    """
    Run a command and return its stdout.

    Parameters
    ----------
    cmd : list of str
        Command to run, argv-style.
    check : bool, optional
        If True (default) a non-zero exit aborts the script with stderr
        visible; if False the failure is returned as ``None`` instead.
    capture : bool, optional
        If False the command keeps the terminal (stdin included): needed for
        ``ssh -t`` so the sudo password prompt reaches the user.

    Returns
    -------
    str or None
        Stripped stdout, or ``None`` when the command failed with
        ``check=False``. Always ``None`` when ``capture=False``.
    """
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            if check:
                sys.exit(f"Error: {' '.join(cmd)} failed:\n{result.stderr.strip()}")
            return None
        return result.stdout.strip()
    result = subprocess.run(cmd)
    if result.returncode != 0 and check:
        sys.exit(f"Error: {' '.join(cmd)} failed with exit code {result.returncode}")
    return None


def main():
    """
    Orchestrate the deploy and return the exit code.

    Returns
    -------
    int
        0 on success, 1 on a controlled abort.
    """
    parser = argparse.ArgumentParser(
        description="Deploy the web app to the server (staging + sudo copy + verify)")
    parser.add_argument("--dry-run", action="store_true",
                        help="print the remote commands, execute nothing")
    args = parser.parse_args()

    # The repo root is where this file lives
    repo = Path(__file__).resolve().parent

    # Private configuration: host, user, staging folder and web root
    config_path = repo / CONFIG_FILE
    if not config_path.exists():
        sys.exit(f"Error: {CONFIG_FILE} not found. Copy {EXAMPLE_FILE} to "
                 f"{CONFIG_FILE}, fill in your host, user and paths, and run again.")
    config = json.loads(config_path.read_text())
    host = f"{config['user']}@{config['host']}"
    staging = config["staging_dir"]
    web_root = config["web_root"]
    port = config.get("port", 22)
    ssh = ["ssh"] + (["-p", str(port)] if port != 22 else [])

    # What we are about to publish: the version badge of this working tree
    html = (repo / "index.html").read_text()
    version = VERSION_ANCHOR.search(html)
    if not version:
        sys.exit("Error: version badge not found in index.html "
                 "(<p id=\"t-settings-aboutGadirE-version\">).")
    version = version.group(1)
    print(f"Deploying version {version} to {host}:{web_root}")

    # 1) Only deploy committed and pushed code: uncommitted work cannot be
    #    rolled back on the server and unpushed work is not backed up
    run(["git", "-C", str(repo), "fetch", "origin"])
    if run(["git", "-C", str(repo), "status", "--porcelain"]):
        sys.exit("Error: the working tree is dirty. Commit (or stash) first: "
                 "a deploy must always be reproducible from GitHub.")
    local_head = run(["git", "-C", str(repo), "rev-parse", "HEAD"])
    remote_head = run(["git", "-C", str(repo), "rev-parse", "origin/main"])
    if local_head != remote_head:
        sys.exit("Error: the local main is not what is on GitHub. Push first "
                 "(deploying only what is pushed keeps every deploy recoverable).")

    # 2) Staging: exact mirror of the working tree MINUS data/ (the server
    #    owns it) and the junk. --delete keeps the staging from accumulating
    rsync = ["rsync", "-a", "--delete",
             "--exclude=.git/", "--exclude=.DS_Store", "--exclude=data/"]
    if port != 22:
        rsync += ["-e", f"ssh -p {port}"]
    rsync += [f"{repo}/", f"{host}:{staging}/"]

    # 3) Clean the staging leftovers (an old data/ from the manual clone
    #    days, stray .DS_Store) so the copy step can NEVER reach production data
    cleanup = f"rm -rf {staging}/data && find {staging} -name .DS_Store -delete"

    # 4) The copy itself: the glob skips dotfiles and the staging has no
    #    data/, so only the app files travel; the find sweeps any .DS_Store
    #    that previous manual copies left in the web root
    copy = (f"sudo cp -r {staging}/* {web_root}/ && "
            f"sudo find {web_root} -name .DS_Store -delete")

    if args.dry_run:
        # Nothing is executed, not even ssh: a dry run must work offline
        print(f"[dry-run] {' '.join(rsync)}")
        print(f"[dry-run] ssh {host} \"{cleanup}\"")
        print(f"[dry-run] ssh -t {host} \"{copy}\"")
        print("[dry-run] nothing was executed.")
        return 0

    # 5) Snapshot of the production geojson BEFORE touching anything: the
    #    deploy must not move it, and this proves it afterwards
    before = run([*ssh, host, f"stat -c '%s %y' {web_root}/data/map_data.geojson"],
                 check=False)
    if before:
        print(f"Production geojson before: {before}")

    run(rsync)
    run([*ssh, host, cleanup])
    # ssh -t: the sudo password prompt needs a live terminal
    run([*ssh, "-t", host, copy], capture=False)

    # 6) Verify what the web actually serves: the badge in the SERVED
    #    index.html must be the version we just pushed
    served = run([*ssh, host,
                  f"grep -A1 't-settings-aboutGadirE-version' {web_root}/index.html "
                  f"| grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+'"], check=False)
    if served != version:
        sys.exit(f"Error: the web serves version {served!r}, expected {version!r}. "
                 "Check the copy step (web root, sudo output) before telling anybody.")
    print(f"Verified: the web serves {served}")

    # 7) The production geojson must be untouched (same size, same mtime);
    #    if it moved, something in the flow is clobbering data/
    after = run([*ssh, host, f"stat -c '%s %y' {web_root}/data/map_data.geojson"],
                check=False)
    if before and after and before != after:
        print(f"WARNING: the production geojson CHANGED during the deploy "
              f"(before: {before} / after: {after}). It should never move: "
              "check what happened before the next cron run.")
    elif after:
        print(f"Verified: the production geojson is untouched ({after})")

    print("Deploy complete. Reminder: the service worker serves the first visit "
          "from cache (SWR) — the new version shows up on the second visit "
          "(or after clearing site data).")
    return 0


if __name__ == "__main__":
    sys.exit(main())