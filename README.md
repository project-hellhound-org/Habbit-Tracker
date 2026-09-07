# Habit OS — Personal Productivity & Habit Operating System

![Habit OS Banner](assets/banner.png)

<p align="center">
  <img src="public/icon.png" width="96" alt="Habit OS Logo" /><br>
  <b>A Minimal Ink, Local-First, High-Precision Productivity Workstation & Habit Operating System</b><br>
  Built with React, Vite, TypeScript, Dexie IndexedDB, and Electron Desktop Runtime.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20macOS-000000?style=for-the-badge&logo=electron&logoColor=white" alt="Platforms" />
  <img src="https://img.shields.io/badge/Execution-Terminal%20Direct%20Launcher-000000?style=for-the-badge&logo=gnu-bash&logoColor=white" alt="Terminal Launcher" />
  <img src="https://img.shields.io/badge/Storage-Local--First%20IndexedDB-000000?style=for-the-badge&logo=sqlite&logoColor=white" alt="Local First" />
  <img src="https://img.shields.io/badge/AI-Ollama%20%7C%20NVIDIA%20%7C%20OpenAI%20%7C%20Claude%20%7C%20Gemini%20%7C%20OpenRouter-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="AI Model Integration" />
</p>

---

## 🌟 Overview

**Habit OS** is an advanced, privacy-conscious productivity workstation engineered for professionals, software developers, and research technicians who require high-density habit tracking, task scheduling, daily reviews, and AI analytical copiloting without cloud vendor lock-in or visual distraction.

Designed around the **Minimal Ink** philosophy, every component uses monochromatic high-contrast visual tokens (`#F7F7F5` light mode / `#0A0A0A` dark mode), 1px structural borders, centralized motion tokens, and GPU-friendly smooth micro-interactions.

---

## 🚀 Key Features & Architectural Enhancements

### 1. 📊 Habit Creation & Scheduling Engine
- **End Date Support**: Define timeline boundaries and completion targets.
- **Flexible Scheduling**: Set custom start and end time windows (`09:00` → `17:00`).
- **Post-Creation Habit Editing**: Edit habit parameters, schedules, and categories at any time.
- **Restricted Categories**: *Fitness & Health*, *Learning & Growth*, *Work & Projects*.
- **Mini Scheduling Calendar**: Integrated timeline view inside habit creation & editing modals.

### 2. 🎯 Task Specification & Scheduling Column
- **Schedule Window Column**: Dedicated Start Date/Time and End Date/Time selection column.
- **Daily Time Allocation Limits**: Cap daily task execution hours per day.
- **Completion Time (Duration)**: Specify task duration in hours and minutes for real-time workload estimation.

### 3. 📅 Dynamic Task Scheduling Calendar
- Replaced static calendar grid with a real-time dynamic date selector.
- Click any date to instantly open a comprehensive daily dashboard summarizing tasks, scheduled habits, reviews, and analytics for that specific day.

### 4. 🔥 Dynamic 0–100% Streak Flame Engine & Fix
- **Accurate Consecutive Streak Calculation**: Computes real-time consecutive historical calendar days with completed habits/tasks (e.g., logging 5 days = 5-day streak).
- **Interpolated Flame System**: 
  - `0–25%`: Cool Gray Ember
  - `50%`: Active Yellow Ember
  - `75%`: Active Orange Flame
  - `100%`: Deep-Red High-Fidelity Sustained Flame with layered bloom and micro-particles.

### 5. 📷 Real-Time Analytical Daily Review Snapshots
- Replaced hard-coded review data with **real-time dynamic database calculations**:
  - **Productivity Score**: Computed score (e.g., `82/100`).
  - **Habit Completion**: Real-time ratio (e.g., `8/10`).
  - **Task Completion**: Real-time ratio (e.g., `7/9`).
  - **Time Logged**: Total task execution time (e.g., `5h 24m`).
  - **Focus Efficiency**: Real-time performance ratio (e.g., `87%`).
  - **Goals Progress**: Real-time active goal progress (e.g., `3/4`).
  - **Overdue Tasks**: Count of uncompleted tasks past schedule end date.
- **Task & Work Review Statistics Audit**: Real-time audit table tracking items by *Planned*, *Completed*, *Remaining*, *Overdue*, *Cancelled*, and *Deferred*.

### 6. 🤖 Multi-Provider AI Integration (Bounty Hunter Key Logic)
- **Automatic Provider Detection**: Automatically detects AI providers based on API key structure (Bounty Hunter pattern):
  - `sk-ant-` → Anthropic Claude
  - `nvapi-` → NVIDIA NIM (Llama 3.1 70B)
  - `AIza` → Google Gemini
  - `sk-or-` → OpenRouter (Cloud Open-Source Models)
  - `sk-` → OpenAI (GPT-4o)
  - `ollama` / Empty → Ollama Local Base Server (`http://localhost:11434`)
- **Seamless Local & Cloud Models**: Switch between local offline Ollama models and open-source cloud models via API key configuration.

---

## ⚡ Direct Terminal Execution (`Habit`)

You can launch Habit OS directly from your command-line interface without using a web browser or localhost URLs:

```bash
# Type Habit anywhere in your terminal to launch the program directly
Habit
```

The installer registers `Habit` inside your system executable path (`~/.local/bin/Habit`).

---

## 💻 Modular Setup & Maintenance Scripts

Habit OS features a modular shell script toolkit (Bounty Hunter pattern) for streamlined installation, updates, diagnostics, and cleanup:

```bash
# 🛠️ Installation & System Initialization
./install.sh

# 🏥 System Health & Diagnostic Audit
./doctor.sh

# 🔄 Repository Update & Rebuild
./update.sh

# 🧹 Clean Uninstallation & Artifact Cleanup
./uninstall.sh
```

### Method 1: Single Command Automated Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/project-hellhound-org/Habbit-Tracker.git
cd Habbit-Tracker

# 2. Run automated modular installation
./install.sh
```

### Method 2: Python Setup Script

```bash
python3 setup.py
```

---

## 🔒 Security Architecture & Protocol Upgrades

- **Electron Security**:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - `webSecurity: true`
  - Secure external URL handler (`setWindowOpenHandler` enforcing `http:`/`https:` browser delegation)
- **Content Security Policy (CSP)**: Hardened CSP headers in `index.html`.
- **Master App Password**: Password verification prompt protecting database wipes (`Clear Entire Database`) and data exports in Settings.

---

## 📜 License

Distributed under the MIT License. Developed by **Project Hellhound**.
