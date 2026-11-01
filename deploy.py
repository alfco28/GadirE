#!/usr/bin/env python3
# deploy.py — One-command deployment of the GadirE web app (frontend).
#
# Runs on the LAPTOP, inside the repo. The same flow as the manual process,
# minus the mistakes:
#   1) refuse to deploy uncommitted or unpushed code (what gets deployed is
#      always backed up on GitHub first);
#   2) rsync the working tree to a staging folder on the server, EXCLUDING
#      data/ (the live geojson and ICS live there and must never be clobbered
#      by the repo copies), deploy_logs/ (this run's log is FULL of private
#      details — host, user, paths: it must never reach the web) and all the
#      junk (.git, .DS_Store);
#   3) clean the staging leftovers (an old data/ clone, .DS_Store) and
#      sudo-copy staging over the web root — data/ never travels;
#   4) verify what the web actually serves (the version badge) and that the
#      production geojson did not move.
#
# Every step is recorded in deploy_logs/ (gitignored): one file per deploy,
# kept forever, plus ultimo.log with the latest one (for tail -f) — the same
# convention as the backend logs since v14. A --dry-run records NOTHING: it
# must leave no trace at all.
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
import logging
import re
import subprocess
import sys
import time
from pathlib import Path

CONFIG_FILE = "deploy_config.json"
EXAMPLE_FILE = "deploy_config.example.json"
LOG_DIR = "deploy_logs"

# The version badge: the empty i18n paragraph followed by the plain one that
# the settings modal shows (the same pair `grep 0.5.233` checked by hand)
VERSION_ANCHOR = re.compile(
    r'<p id="t-settings-aboutGadirE-version"></p>\s*<p>([^<]+)</p>')


class DeployError(Exception):
    """
    A controlled failure of the deploy (its message is user-facing).

    Raised instead of calling sys.exit() from deep inside the flow so that
    main() can write the failure to the log BEFORE stopping: an unrecorded
    error is a lost error.
    """


def configurar_log(repo):
    """
    Create the deploy logger: console + one log file per run + ultimo.log.

    Mirrors the backend convention (gen_geojson logs/, since v14) so both
    deploy scripts read the same way: ``deploy_logs/deploy_<date>.log`` is
    kept forever, one file per deploy, and ``deploy_logs/ultimo.log`` always
    holds the latest deploy (for ``tail -f``).

    Parameters
    ----------
    repo : Path
        Repository root; the logs live in ``deploy_logs/`` inside it.

    Returns
    -------
    tuple of (logging.Logger, Path)
        The configured logger and the path of this run's log file.
    """
    log_dir = repo / LOG_DIR
    log_dir.mkdir(exist_ok=True)                      # created on the first deploy ever
    fecha = time.strftime("%Y%m%d_%H%M%S")
    ruta_log = log_dir / f"deploy_{fecha}.log"

    # Logger unique to this run (never inherits handlers from a previous one)
    logger = logging.getLogger(f"gadire.deploy.{fecha}")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    formato = logging.Formatter("[%(asctime)s] %(message)s", "%Y-%m-%d %H:%M:%S")

    # Three sinks: console, the per-run file (kept forever) and ultimo.log
    consola = logging.StreamHandler(sys.stdout)
    archivo = logging.FileHandler(ruta_log, encoding="utf-8")
    ultimo = logging.FileHandler(log_dir / "ultimo.log", mode="w", encoding="utf-8")
    for manejador in (consola, archivo, ultimo):
        manejador.setFormatter(formato)
        logger.addHandler(manejador)
    return logger, ruta_log


def run(cmd, check=True, capture=True):
    """
    Run a command and return its stdout.

    Parameters
    ----------
    cmd : list of str
        Command to run, argv-style.
    check : bool, optional
        If True (default) a non-zero exit raises :class:`DeployError`
        (main() logs it and stops); if False the failure is returned
        as ``None`` instead.
    capture : bool, optional
        If False the command keeps the terminal (stdin included): needed for
        ``ssh -t`` so the sudo password prompt reaches the user.

    Returns
    -------
    str or None
        Stripped stdout, or ``None`` when the command failed with
        ``check=False``. Always ``None`` when ``capture=False``.

    Raises
    ------
    DeployError
        If the command failed and ``check`` is True.
    """
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            if check:
                raise DeployError(f"Error: {' '.join(cmd)} failed:\n{result.stderr.strip()}")
            return None
        return result.stdout.strip()
    result = subprocess.run(cmd)
    if result.returncode != 0 and check:
        raise DeployError(f"Error: {' '.join(cmd)} failed with exit code {result.returncode}")
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

    # Reporter: a real deploy records EVERY step (deploy_logs/, gitignored);
    # a dry run records nothing at all — not even the log file. The logger is
    # created BEFORE anything can fail, so even a missing config is recorded.
    logger = None
    if not args.dry_run:
        logger, ruta_log = configurar_log(repo)
        logger.info("=== deploy — inicio (log completo en %s) ===", ruta_log)

    def say(msg):
        """Report one step: to the log when recording, to stdout in a dry run."""
        if logger:
            logger.info(msg)
        else:
            print(msg)

    def fail(msg):
        """Report a fatal problem in every sink and stop with exit code 1."""
        if logger:
            logger.error(msg)  # the console handler shows it too
        else:
            print(msg, file=sys.stderr)
        sys.exit(1)

    try:
        # Private configuration: host, user, staging folder and web root
        config_path = repo / CONFIG_FILE
        if not config_path.exists():
            raise DeployError(f"Error: {CONFIG_FILE} not found. Copy {EXAMPLE_FILE} to "
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
            raise DeployError("Error: version badge not found in index.html "
                              "(<p id=\"t-settings-aboutGadirE-version\">).")
        version = version.group(1)
        say(f"Deploying version {version} to {host}:{web_root}")

        # 1) Only deploy committed and pushed code: uncommitted work cannot be
        #    rolled back on the server and unpushed work is not backed up
        run(["git", "-C", str(repo), "fetch", "origin"])
        if run(["git", "-C", str(repo), "status", "--porcelain"]):
            raise DeployError("Error: the working tree is dirty. Commit (or stash) first: "
                              "a deploy must always be reproducible from GitHub.")
        local_head = run(["git", "-C", str(repo), "rev-parse", "HEAD"])
        remote_head = run(["git", "-C", str(repo), "rev-parse", "origin/main"])
        if local_head != remote_head:
            raise DeployError("Error: the local main is not what is on GitHub. Push first "
                              "(deploying only what is pushed keeps every deploy recoverable).")
        say(f"Checked: the tree is clean and pushed ({local_head[:8]} on GitHub).")

        # 2) Staging: exact mirror of the working tree MINUS data/ (the server
        #    owns it), the junk, deploy_config.json (the PRIVATE config with
        #    the host and user: gitignored, so it is untracked but PRESENT
        #    here), deploy_logs/ (this run's own log — it contains the host,
        #    user and paths, so it must NEVER be published) and the deploy
        #    tooling itself (deploy.py and its example: dev files, not web
        #    files; without the exclude rsync would serve them publicly).
        #    --delete keeps the staging from accumulating
        rsync = ["rsync", "-a", "--delete", "--exclude=.git/", "--exclude=.DS_Store", "--exclude=data/", "--exclude=deploy_config.json", "--exclude=deploy_logs/", "--exclude=deploy.py", "--exclude=deploy_config.example.json"]
        if port != 22:
            rsync += ["-e", f"ssh -p {port}"]
        rsync += [f"{repo}/", f"{host}:{staging}/"]

        # 3) Clean the staging leftovers: an old data/ from the manual clone
        #    days, the deploy files older deploys left there (rsync --delete
        #    does NOT remove excluded files) and stray .DS_Store — so the
        #    copy step can NEVER reach production data or publish dev files
        cleanup = (f"rm -rf {staging}/data {staging}/deploy_logs && "
                   f"rm -f {staging}/deploy.py {staging}/deploy_config.example.json && "
                   f"find {staging} -name .DS_Store -delete")

        # 4) The copy itself: the glob skips dotfiles and the staging has no
        #    data/, so only the app files travel; the find sweeps any .DS_Store
        #    that previous manual copies left in the web root
        copy = (f"sudo cp -r {staging}/* {web_root}/ && "
                f"sudo find {web_root} -name .DS_Store -delete")

        if args.dry_run:
            # Nothing is executed, not even ssh: a dry run must work offline
            say(f"[dry-run] {' '.join(rsync)}")
            say(f"[dry-run] ssh {host} \"{cleanup}\"")
            say(f"[dry-run] ssh -t {host} \"{copy}\"")
            say("[dry-run] nothing was executed.")
            return 0

        # 5) Snapshot of the production geojson BEFORE touching anything: the
        #    deploy must not move it, and this proves it afterwards
        before = run([*ssh, host, f"stat -c '%s %y' {web_root}/data/map_data.geojson"],
                     check=False)
        if before:
            say(f"Production geojson before: {before}")

        run(rsync)
        say(f"Staging synced ({host}:{staging}, data/ and the private config excluded).")
        run([*ssh, host, cleanup])
        # ssh -t: the sudo password prompt needs a live terminal
        run([*ssh, "-t", host, copy], capture=False)
        say(f"Copied to the web root ({web_root}).")

        # 6) Verify what the web actually serves: the badge in the SERVED
        #    index.html must be the version we just pushed
        served = run([*ssh, host,
                      f"grep -A1 't-settings-aboutGadirE-version' {web_root}/index.html "
                      f"| grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+'"], check=False)
        if served != version:
            raise DeployError(f"Error: the web serves version {served!r}, expected {version!r}. "
                              "Check the copy step (web root, sudo output) before telling anybody.")
        say(f"Verified: the web serves {served}")

        # 7) The production geojson must be untouched (same size, same mtime);
        #    if it moved, something in the flow is clobbering data/
        after = run([*ssh, host, f"stat -c '%s %y' {web_root}/data/map_data.geojson"],
                     check=False)
        if before and after and before != after:
            say(f"WARNING: the production geojson CHANGED during the deploy "
                f"(before: {before} / after: {after}). It should never move: "
                "check what happened before the next cron run.")
        elif after:
            say(f"Verified: the production geojson is untouched ({after})")

        say("Deploy complete. Reminder: the service worker serves the first visit "
            "from cache (SWR) — the new version shows up on the second visit "
            "(or after clearing site data).")
        return 0

    except DeployError as exc:
        # The message is already user-facing: record it everywhere and stop
        fail(str(exc))


if __name__ == "__main__":
    sys.exit(main())