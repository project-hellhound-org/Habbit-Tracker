#!/usr/bin/env python3
"""
Habit OS — Comprehensive Environment & Dependency Validation Tool
Validates Python, Pip, Node.js, npm, Ollama, TypeScript, Vite, and Electron.
Prints clear PASS / WARN / FAIL results.
"""

import sys
import subprocess
import shutil
import json
import os
import urllib.request

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

def log_pass(message):
    print(f"[{GREEN}PASS{RESET}] {message}")

def log_warn(message):
    print(f"[{YELLOW}WARN{RESET}] {message}")

def log_fail(message):
    print(f"[{RED}FAIL{RESET}] {message}")

def run_cmd(cmd, cwd=None):
    res = subprocess.run(cmd, shell=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.returncode == 0, res.stdout.strip(), res.stderr.strip()

def main():
    print(f"\n{BOLD}{'=' * 68}{RESET}")
    print(f"{BOLD}  HABIT OS — ENVIRONMENT & DEPENDENCY VALIDATION TOOL{RESET}")
    print(f"{BOLD}{'=' * 68}{RESET}\n")

    has_critical_failure = False

    # 1. Python Version Check
    py_ver = sys.version_info
    if py_ver >= (3, 8):
        log_pass(f"Python Runtime: {sys.version.split()[0]} (>= 3.8)")
    else:
        log_fail(f"Python Version {sys.version.split()[0]} is outdated. Python 3.8+ required.")
        has_critical_failure = True

    # 2. Pip Availability
    ok, stdout, _ = run_cmd(f'"{sys.executable}" -m pip --version')
    if ok:
        log_pass(f"Pip Module: {stdout}")
    else:
        log_fail("Pip module is missing or corrupted in active Python environment.")
        has_critical_failure = True

    # 3. Node.js Check
    node_path = shutil.which("node")
    if node_path:
        ok, stdout, _ = run_cmd("node -v")
        log_pass(f"Node.js Runtime: {stdout} -> {node_path}")
    else:
        log_fail("Node.js not found in PATH. Node.js (v18+ LTS) required.")
        has_critical_failure = True

    # 4. npm Check
    npm_path = shutil.which("npm")
    if npm_path:
        ok, stdout, _ = run_cmd("npm -v")
        log_pass(f"npm Package Manager: v{stdout} -> {npm_path}")
    else:
        log_fail("npm not found in PATH.")
        has_critical_failure = True

    # 5. npm Dependency Tree & Audit
    ok, stdout, _ = run_cmd("npm audit")
    if ok and "0 vulnerabilities" in stdout:
        log_pass("npm Audit Security Check: 0 vulnerabilities found!")
    elif ok:
        log_pass(f"npm Audit: {stdout.splitlines()[-1] if stdout else 'OK'}")
    else:
        log_warn("npm audit detected security warnings. Run 'npm audit' for details.")

    # 6. TypeScript Compilation Check
    ok, stdout, stderr = run_cmd("npx tsc --noEmit")
    if ok:
        log_pass("TypeScript Typecheck (`npx tsc --noEmit`): 0 errors")
    else:
        log_fail(f"TypeScript compilation failed:\n{stderr or stdout}")
        has_critical_failure = True

    # 7. Vite Build Check
    ok, stdout, stderr = run_cmd("npm run build")
    if ok:
        log_pass("Vite Production Build (`npm run build`): Succeeded cleanly")
    else:
        log_fail(f"Vite production build failed:\n{stderr or stdout}")
        has_critical_failure = True

    # 8. Electron Executable Check
    electron_path = shutil.which("electron") or os.path.exists("./node_modules/.bin/electron")
    if electron_path:
        ok, stdout, _ = run_cmd("./node_modules/.bin/electron -v")
        log_pass(f"Electron Desktop Engine: {stdout if ok else 'Installed'}")
    else:
        log_warn("Electron binary not found in node_modules.")

    # 9. Ollama Service Connection
    ollama_path = shutil.which("ollama")
    if ollama_path:
        log_pass(f"Ollama CLI Binary: Found at {ollama_path}")
        try:
            req = urllib.request.urlopen("http://localhost:11434/api/tags", timeout=3)
            if req.status == 200:
                data = json.loads(req.read().decode())
                models = [m.get("name") for m in data.get("models", [])]
                log_pass(f"Ollama Service (`http://localhost:11434`): Active! Local models: {models}")
            else:
                log_warn("Ollama HTTP endpoint returned status non-200.")
        except Exception:
            log_warn("Ollama service not running on port 11434. Start with 'ollama serve'.")
    else:
        log_warn("Ollama CLI not installed. Built-in offline & Cloud AI providers available.")

    print(f"\n{BOLD}{'=' * 68}{RESET}")
    if has_critical_failure:
        print(f"{RED}{BOLD}  RESULT: FAILED — Critical dependency errors detected.{RESET}")
        print(f"{BOLD}{'=' * 68}{RESET}\n")
        sys.exit(1)
    else:
        print(f"{GREEN}{BOLD}  RESULT: PASSED — All environment and build checks succeeded!{RESET}")
        print(f"{BOLD}{'=' * 68}{RESET}\n")
        sys.exit(0)

if __name__ == "__main__":
    main()
