"""
PayFlow - One-file setup & launcher
Run: python start.py

Requirements (must be pre-installed):
  - Python 3.9+   https://www.python.org/downloads/
  - Node.js 18+   https://nodejs.org/
"""

import subprocess
import sys
import os
import platform
import shutil
import time
import signal
import threading

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(ROOT, "backend")
IS_WINDOWS = platform.system() == "Windows"

# ── Colours ────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
RESET  = "\033[0m"

def ok(msg):   print(f"{GREEN}[OK]{RESET}  {msg}")
def info(msg): print(f"{CYAN}[..]{RESET}  {msg}")
def warn(msg): print(f"{YELLOW}[!!]{RESET}  {msg}")
def err(msg):  print(f"{RED}[ERR]{RESET} {msg}")

# ── Prerequisite checks ─────────────────────────────────────────────────────
def check_python():
    v = sys.version_info
    if v < (3, 9):
        err(f"Python 3.9+ required. You have {v.major}.{v.minor}.")
        err("Download: https://www.python.org/downloads/")
        sys.exit(1)
    ok(f"Python {v.major}.{v.minor}.{v.micro}")

def check_node():
    node = shutil.which("node")
    npm  = shutil.which("npm")
    if not node or not npm:
        err("Node.js / npm not found.")
        err("Download: https://nodejs.org/")
        sys.exit(1)
    result = subprocess.run(["node", "--version"], capture_output=True, text=True)
    version_str = result.stdout.strip().lstrip("v")
    major = int(version_str.split(".")[0])
    if major < 18:
        err(f"Node.js 18+ required. You have {version_str}.")
        err("Download: https://nodejs.org/")
        sys.exit(1)
    ok(f"Node.js {result.stdout.strip()}")

# ── Virtual environment ─────────────────────────────────────────────────────
def venv_python():
    venv_dir = os.path.join(BACKEND, "venv")
    if IS_WINDOWS:
        return os.path.join(venv_dir, "Scripts", "python.exe")
    return os.path.join(venv_dir, "bin", "python")

def setup_venv():
    venv_dir = os.path.join(BACKEND, "venv")
    if not os.path.isdir(venv_dir):
        info("Creating Python virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)
        ok("Virtual environment created")
    else:
        ok("Virtual environment already exists")

# ── Dependency installation ─────────────────────────────────────────────────
def install_python_deps():
    req = os.path.join(BACKEND, "requirements.txt")
    info("Installing Python dependencies (flask, flask-cors)...")
    subprocess.run(
        [venv_python(), "-m", "pip", "install", "--quiet", "--upgrade", "pip"],
        check=True
    )
    subprocess.run(
        [venv_python(), "-m", "pip", "install", "--quiet", "-r", req],
        check=True
    )
    ok("Python dependencies installed")

def install_node_deps():
    node_modules = os.path.join(ROOT, "node_modules")
    if not os.path.isdir(node_modules):
        info("Installing Node.js dependencies (npm install)...")
        subprocess.run(["npm", "install", "--silent"], cwd=ROOT, check=True)
        ok("Node.js dependencies installed")
    else:
        ok("Node.js dependencies already installed")

# ── Launch servers ──────────────────────────────────────────────────────────
processes = []

def stream_output(proc, prefix, color):
    for line in iter(proc.stdout.readline, ""):
        print(f"{color}[{prefix}]{RESET} {line}", end="")

def start_backend():
    info("Starting Flask backend on http://localhost:5000 ...")
    proc = subprocess.Popen(
        [venv_python(), "app.py"],
        cwd=BACKEND,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append(proc)
    t = threading.Thread(target=stream_output, args=(proc, "Backend", YELLOW), daemon=True)
    t.start()
    return proc

def start_frontend():
    info("Starting Vite frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if IS_WINDOWS else "npm"
    proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append(proc)
    t = threading.Thread(target=stream_output, args=(proc, "Frontend", GREEN), daemon=True)
    t.start()
    return proc

def shutdown(sig=None, frame=None):
    print(f"\n{YELLOW}Shutting down...{RESET}")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)

# ── Main ────────────────────────────────────────────────────────────────────
def main():
    print(f"\n{CYAN}{'='*50}")
    print("  PayFlow - Setup & Launcher")
    print(f"{'='*50}{RESET}\n")

    print("Checking prerequisites...")
    check_python()
    check_node()

    print("\nSetting up backend...")
    setup_venv()
    install_python_deps()

    print("\nSetting up frontend...")
    install_node_deps()

    print(f"\n{CYAN}Starting servers...{RESET}")
    start_backend()
    time.sleep(2)           # let Flask initialise the DB first
    start_frontend()

    print(f"""
{GREEN}{'='*50}
  PayFlow is running!

  Frontend : http://localhost:5173
  Backend  : http://localhost:5000

  Demo logins:
    rahul@example.com  / password123
    priya@example.com  / password123
    admin@payflow.com  / admin123  (admin panel)
  UPI PIN  : 1234 (all demo users)

  Press Ctrl+C to stop both servers.
{'='*50}{RESET}
""")

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Keep alive — exit if either server dies
    while True:
        for p in processes:
            if p.poll() is not None:
                warn("A server stopped unexpectedly. Shutting down.")
                shutdown()
        time.sleep(2)

if __name__ == "__main__":
    main()
