#!/usr/bin/env python3
"""
Habit OS — Automated CLI Environment & Local AI Setup Script
Executes full setup: bootstraps pip if missing, installs dependencies, pulls Ollama model, and builds assets.
"""

import sys
import subprocess
import shutil
import os

def print_banner():
    print("=" * 68)
    print("  HABIT OS — AUTOMATED CLI SETUP & ENVIRONMENT INITIALIZATION")
    print("=" * 68)

def check_system_tool(name):
    path = shutil.which(name)
    if path:
        print(f"[✓] Found system tool: {name} -> {path}")
        return True
    else:
        print(f"[!] Warning: System tool '{name}' not found in PATH.")
        return False

def run_cmd(cmd, cwd=None):
    print(f"[>] Executing: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"[!] Command failed with code {res.returncode}")
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
            print("[i] Please run: sudo apt install python3-pip python3-venv")

def main():
    print_banner()
    
    # 1. Ensure Pip is working
    ensure_pip_available()

    # 2. Install requirements using python -m pip
    print("\n[*] Installing Python setup dependencies...")
    run_cmd(f'"{sys.executable}" -m pip install -r requirements.txt')

    # 3. Verify System Tools (Node.js, npm, Ollama)
    print("\n[*] Verifying Node.js and Ollama prerequisites...")
    has_node = check_system_tool("node")
    has_npm = check_system_tool("npm")
    has_ollama = check_system_tool("ollama")

    if not has_node or not has_npm:
        print("\n[!] Error: Node.js and npm are required. Please install Node.js (v18+ LTS).")
        print("    Linux: sudo apt install -y nodejs npm")
        print("    Windows: winget install OpenJS.NodeJS.LTS")
        sys.exit(1)

    # 4. Install Node.js Dependencies (quiet clean output)
    print("\n[*] Installing Node.js & Electron dependencies via npm...")
    if not run_cmd("npm install --no-fund --no-audit"):
        print("[!] Failed to install npm dependencies.")
        sys.exit(1)

    # 5. Verify & Pull Ollama Model
    if has_ollama:
        print("\n[*] Checking Ollama Local Base AI status...")
        print("[*] Pulling default Ollama local model 'llama3.1'...")
        run_cmd("ollama pull llama3.1")
    else:
        print("\n[i] Note: Ollama CLI not found. You can use the Built-in Offline Engine or Cloud Providers (OpenAI, Anthropic, Gemini, NVIDIA).")

    # 6. Build Production Bundle
    print("\n[*] Building production static bundle...")
    run_cmd("npm run build")

    print("\n" + "=" * 68)
    print("  ✓ HABIT OS CLI SETUP COMPLETED SUCCESSFULLY!")
    print("  - Launch Web View:      npm run dev")
    print("  - Launch Desktop App:  npm run electron:dev")
    print("  - Package Executables:  npm run electron:build")
    print("=" * 68 + "\n")

if __name__ == "__main__":
    main()
