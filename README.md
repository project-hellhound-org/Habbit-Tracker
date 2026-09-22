# Habit OS — Enterprise Habit & Productivity Operating System

![Habit OS Banner](assets/banner.png)

<p align="center">
  <img src="public/icon.png" width="96" alt="Habit OS Logo" /><br>
  <b>An Enterprise-Grade, Local-First Productivity Workstation & AI Copilot System</b><br>
  Built with React 18, TypeScript 5, Vite, Dexie.js (IndexedDB), and Electron.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-2F8F5B?style=for-the-badge&logo=github" alt="Production Ready" />
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20macOS-163A29?style=for-the-badge&logo=electron&logoColor=white" alt="Platforms" />
  <img src="https://img.shields.io/badge/Execution-CLI%20Launcher%20%7C%20GUI-071A13?style=for-the-badge&logo=gnu-bash&logoColor=white" alt="Launcher" />
  <img src="https://img.shields.io/badge/Theme-Rain%20Forest%20%7C%20Foggy%20Mist-57B978?style=for-the-badge&logo=tree&logoColor=white" alt="Environmental Themes" />
  <img src="https://img.shields.io/badge/AI Engine-Zero--Latency%20Local%20%26%20Cloud-2F8F5B?style=for-the-badge&logo=cpu&logoColor=white" alt="AI Engine" />
  <img src="https://img.shields.io/badge/License-MIT-0B261B?style=for-the-badge" alt="MIT License" />
</p>

---

## 🌟 Executive Summary

**Habit OS** is an enterprise-grade, privacy-first habit operating system and productivity workstation designed for professionals, engineers, and researchers. It combines high-density habit tracking, timeline task scheduling, real-time productivity analytics, daily journal reviews, and zero-latency AI analytical copiloting in a distraction-free environment.

---

## 🌲 Environmental Design System

Habit OS features two custom-engineered, multi-layered environmental themes that separate visual depth from UI usability:

### 1. 🌿 Rain Forest — Deep, Lush & Living
* **Visual Direction**: A dense tropical rainforest immediately following rainfall. Deep emerald floor (`#071A13`), wet leaves reflecting soft light, subtle rain droplets, humid depth, and sunlight filtering through the canopy.
* **Architecture**: 6-layer background system containing base foundation, blurred background foliage, canopy shapes, animated sunlight drift, rain droplets, and foreground leaf silhouettes with spring-like easing.
* **Glass UI**: Semi-transparent forest glass (`rgba(13, 42, 29, 0.72)`) with `backdrop-filter: blur(18px)` and `1px solid rgba(141, 217, 160, 0.10)` borders.

### 2. 🌫️ Foggy Mist Forest — Quiet, Cold & Atmospheric
* **Visual Direction**: Early morning mountain forest surrounded by heavy mist and wet ground. Cooler, desaturated gray-green palette (`#111A18` base / `#536F61` forest green / `#A8B8B1` mist).
* **Architecture**: Atmospheric depth perspective with asynchronous slow-moving fog layers (35s, 50s, 75s animation cycles) and micro moisture particles (`1–3px`).

Both environments support real-time 3-second cubic-bezier transitions (`cubic-bezier(0.22, 1, 0.36, 1)`), animation toggle controls, and `@media (prefers-reduced-motion: reduce)` accessibility compliance.

---

## 🚀 Core Platform Features

### 📊 Habit & Task Management Engine
* **Precision Scheduling**: Set explicit start/end dates, daily execution time windows, and completion durations.
* **Categorization & Filtering**: Organize by *Fitness & Health*, *Learning & Growth*, or *Work & Projects*.
* **Dynamic Calendar Timeline**: Real-time date selector mapping tasks, habits, and daily reviews across historical and future days.
* **0–100% Streak Flame System**: Calculates consecutive completion days with 4-tier visual flame progression (Cool Ember → Yellow → Orange → Sustained Deep Red Flame).
* **Streak Freeze Security**: Maintain 5 consecutive completion days to earn a Streak Freeze, protecting your streak count from single-day lapses.

### 🤖 High-Speed, Zero-Latency AI Copilot Engine
* **Disabled Thinking/Reasoning Latency**: All reasoning/thinking loops are disabled across local and cloud providers, enforcing immediate 3–10s response generation.
* **Local AI Integration (Ollama)**: Full offline support for local models (`llama3.1`, `qwen2.5`, `mistral`, etc.) running on `http://localhost:11434`.
* **Vendor-Agnostic Cloud Interface**: Standardized 3-field setup (**API Key**, **Base URL**, **Model Name**) compatible with any OpenAI-compatible API endpoint.
* **Automated Connection Testing**: Built-in verification utility in Settings to validate credentials and endpoint responsiveness prior to activation.

---

## ⚡ Direct Executable Launchers

Habit OS can be launched seamlessly via command-line or desktop launcher:

```bash
# Launch Habit OS directly from any terminal prompt
Habit
```

The setup system automatically creates launcher symlinks in `~/.local/bin/Habit` and `/usr/local/bin/Habit`.

---

## 🛠️ Automated Setup & Script Toolkit

Habit OS includes a suite of maintenance shell and Python scripts:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Installer** | `./install.sh` | Validates prerequisites, installs dependencies, compiles bundle, and links CLI launcher |
| **Updater** | `./update.sh` | Synchronizes git remote, updates packages, rebuilds bundle, and verifies launcher |
| **Diagnostics** | `./doctor.sh` | Runs deep audit on Node.js, Python, TypeScript compilation, security vulnerabilities, and AI endpoints |
| **Validator** | `python3 validate_env.py` | Programmatically verifies environment versions, build readiness, and local services |
| **Uninstaller** | `./uninstall.sh` | Safely removes executable symlinks and clears build artifacts |

### Quick Start Installation

```bash
# 1. Clone repository
git clone https://github.com/project-hellhound-org/Habbit-Tracker.git
cd Habbit-Tracker

# 2. Run automated installer
chmod +x install.sh
./install.sh
```

### Development Execution

```bash
# Web Development Server
npm run dev

# Desktop App (Electron)
npm run electron:dev

# Run Diagnostic Health Check
./doctor.sh
```

---

## 🔒 Security Architecture

* **Local-First Privacy**: All user data, habits, tasks, and journals are persisted locally via Dexie IndexedDB.
* **Hardened Electron Security**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
* **Password Protection**: Database wipes and backup data extractions require Master Security Password verification.

---

## 📜 License

Distributed under the MIT License. Built by **Project Hellhound**.
