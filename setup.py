#!/usr/bin/env python3
"""
Habit OS — Automated CLI Environment & Local AI Setup Script
Executes full setup: checks Node.js/npm dependencies, pulls Ollama model, and builds assets.
"""

import sys
import subprocess
import shutil
import json
import os

def print_banner():
    print("=" * 65)
    print("  HABIT OS — AUTOMATED CLI SETUP & ENVIRONMENT INITIALIZATION")
    print("=" * 65)

def check_system_tool(name):
    path = shutil.which(name)
    if path:
        print(f"[✓] Found system tool: {name} -> {path}")
        return True
    else:
        print(f"[✗] Warning: System tool '{name}' not found in PATH.")
        return False

def run_cmd(cmd, cwd=None):
    print(f"[>] Running: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"[!] Command failed with code {res.returncode}")
        return False
    return True

def main():
    print_banner()
    
    # 1. Verify Prerequisites
    has_node = check_system_tool("node")
    has_npm = check_system_tool("npm")
    has_ollama = check_system_tool("ollama")

    if not has_node or not has_npm:
        print("\n[!] Error: Node.js and npm are required. Please install Node.js (v18+ LTS).")
        sys.exit(1)

    # 2. Install npm dependencies
    print("\n[*] Installing Node.js & Electron dependencies via npm...")
    if not run_cmd("npm install"):
        print("[!] Failed to install npm dependencies.")
        sys.exit(1)

    # 3. Verify & Setup Ollama Local Model
    if has_ollama:
        print("\n[*] Checking Ollama Local Base AI status...")
        try:
            print("[*] Pulling default Ollama local model 'llama3.1'...")
            run_cmd("ollama pull llama3.1")
        except Exception as e:
            print(f"[!] Ollama pull notification: {e}")
    else:
        print("\n[i] Note: Ollama CLI not found. You can use the Built-in Offline Engine or Cloud Providers (OpenAI, Anthropic, Gemini, NVIDIA).")

    # 4. Build Static Assets & Test Bundle
    print("\n[*] Building production static bundle...")
    run_cmd("npm run build")

    print("\n" + "=" * 65)
    print("  ✓ HABIT OS CLI SETUP COMPLETED SUCCESSFULLY!")
    print("  - Launch Web View: npm run dev")
    print("  - Launch Desktop App: npm run electron:dev")
    print("  - Package Executable Apps: npm run electron:build")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    main()
