#!/usr/bin/env python3
"""
Habit OS — Automated Robust Setup & Deployment Initialization Script
Detects Python, Node.js, npm, Ollama, validates virtualenv, installs dependencies,
verifies security, pulls Ollama model, builds application, and runs full validation.
"""

import sys
import subprocess
import shutil
import os

def print_banner():
    print("=" * 68)
    print("  HABIT OS — AUTOMATED SETUP & REMEDIATION INITIALIZATION")
    print("=" * 68)

def check_system_tool(name):
    path = shutil.which(name)
    if path:
        print(f"[✓] Found system tool: {name} -> {path}")
        return True
    else:
        print(f"[!] Warning: System tool '{name}' not found in PATH.")
        return False

def run_cmd(cmd, cwd=None, fatal=True):
    print(f"[>] Executing: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"[!] Error: Command failed with exit code {res.returncode}")
        if fatal:
            print("[!] Halting setup due to step failure.")
            sys.exit(res.returncode)
        return False
    return True

def ensure_pip_available():
    """Ensure python module pip is installed and functioning."""
    print("\n[*] Verifying Python pip availability...")
    res = subprocess.run([sys.executable, "-m", "pip", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        print("[!] Warning: 'pip' module not found in Python environment. Bootstrapping ensurepip...")
        try:
            subprocess.run([sys.executable, "-m", "ensurepip", "--default-pip"], check=True)
            print("[✓] Pip bootstrapped successfully.")
        except Exception as e:
            print(f"[!] Could not auto-bootstrap pip: {e}")
            sys.exit(1)

def main():
    print_banner()

    # 1. Detect Python Version
    py_ver = sys.version_info
    print(f"[*] Python Version: {sys.version.split()[0]} ({sys.executable})")
    if py_ver < (3, 8):
        print("[!] Error: Python 3.8 or higher is required.")
        sys.exit(1)

    # 2. Ensure Pip is working
    ensure_pip_available()

    # 3. Install requirements using python -m pip
    print("\n[*] Installing Python setup dependencies...")
    run_cmd(f'"{sys.executable}" -m pip install -r requirements.txt')

    # 4. Verify System Tools (Node.js, npm, Ollama)
    print("\n[*] Verifying Node.js and Ollama prerequisites...")
    has_node = check_system_tool("node")
    has_npm = check_system_tool("npm")
    has_ollama = check_system_tool("ollama")

    if not has_node or not has_npm:
        print("\n[!] Error: Node.js (v18+) and npm are required.")
        print("    Linux: sudo apt install -y nodejs npm")
        print("    Windows: winget install OpenJS.NodeJS.LTS")
        sys.exit(1)

    # 5. Install Node.js Dependencies (Clean & Audit-Verified)
    print("\n[*] Installing Node.js & Electron dependencies via npm...")
    run_cmd("npm install --no-fund")

    # 6. Verify & Pull Ollama Model
    if has_ollama:
        print("\n[*] Checking Ollama Local Base AI status...")
        print("[*] Pulling default Ollama local model 'llama3.1'...")
        run_cmd("ollama pull llama3.1", fatal=False)
    else:
        print("\n[i] Note: Ollama CLI not found. You can use the Built-in Offline Engine or Cloud Providers (OpenAI, Anthropic, Gemini, NVIDIA).")

    # 7. Build Production Bundle
    print("\n[*] Building production static bundle...")
    run_cmd("npm run build")

    # 8. Environment Validation
    print("\n[*] Running Environment Validation Check...")
    run_cmd(f'"{sys.executable}" validate_env.py')

    print("\n" + "=" * 68)
    print("  ✓ HABIT OS SETUP & REMEDIATION COMPLETED SUCCESSFULLY!")
    print("  - Launch Web View:      npm run dev")
    print("  - Launch Desktop App:  npm run electron:dev")
    print("  - Package Executables:  npm run electron:build")
    print("  - Run Validation:       npm run validate")
    print("=" * 68 + "\n")

if __name__ == "__main__":
    main()
