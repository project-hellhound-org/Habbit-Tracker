# Habit OS — Personal Productivity & Habit Operating System

![Habit OS Banner](assets/banner.png)

<p align="center">
  <img src="public/icon.png" width="96" alt="Habit OS Logo" /><br>
  <b>A Minimalist, Local-First, High-Precision Productivity & Habit Operating System</b><br>
  Built with React, Vite, TypeScript, Dexie IndexedDB, and Electron for Standalone Desktop GUI Applications.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-000000?style=for-the-badge&logo=electron&logoColor=white" alt="Platforms" />
  <img src="https://img.shields.io/badge/Storage-Local--First%20IndexedDB-000000?style=for-the-badge&logo=sqlite&logoColor=white" alt="Local First" />
  <img src="https://img.shields.io/badge/AI-NVIDIA%20NIM%20%7C%20OpenAI%20%7C%20Claude%20%7C%20Offline-000000?style=for-the-badge&logo=nvidia&logoColor=white" alt="AI Providers" />
</p>

---

## 🌟 Overview

**Habit OS** is an advanced, privacy-focused productivity workstation designed for professionals, engineers, and power users who demand high-density workflow management without slow cloud bloat or visual distraction.

Every surface follows a **Minimal Ink & Monochromatic Precision** visual language, storing 100% of user data locally inside your device using Dexie IndexedDB.

---

## 🚀 Key Capabilities & Modules

### 1. 📊 Habit Consistency Engine
- Track daily, weekly, or custom scheduled habits with target values and metrics.
- 30-day streak heatmaps, completion consistency percentages, and best-performing day metrics.
- Flexible streak skip rules (*Pause*, *Reset*, *Forgive*, *Break*).

### 2. 🎯 Tasks, Workload & Strategic Goals
- Workload management supporting backlog, todo, in-progress, and critical priority items.
- Project alignment with target deadline tracking.

### 3. ⏱️ Verified Focus Engine (Anti-Gaming Protection)
- Multi-mode focus timers (**Guided Verification Mode**, **Continuous Mode**, **Goal-Based Focus**).
- Anti-gaming verification checkpoints: periodic verification prompts separate verified deep work from idle time.
- Interruption logging and session efficiency analytics.

### 4. 🧠 Context-Aware AI Analyst & Personalization System
- Productivity copilot analyzing habit consistency, task backlogs, focus efficiency, and daily journal reviews.
- **Provider Support**: 100% Offline Built-in Analytical Engine, **NVIDIA NIM** (Llama 3.1 & Mixtral), OpenAI (GPT-4o), Anthropic Claude 3.5, and Google Gemini.
- **Behavioral Framework Personalization**: Customize AI response tones (*Analytical*, *Motivational*, *Strict Audit*, *Executive Summary*, *Guided Mentor*) and system directives.

---

## 💻 Installation & Setup Guide

Habit OS can be installed either as a **Direct Standalone App** or via **CLI Clone-Repo Build & Setup**.

---

### Method 1: Direct Desktop App Installation (Recommended)

Run Habit OS directly as a standalone desktop application with a GUI icon:

1. Navigate to the latest **Releases** section on GitHub.
2. Download the pre-packaged executable for your operating system:
   - **Windows**: `Habit.OS.Setup.1.0.0.exe` (Installer) or `Habit.OS.1.0.0.Portable.exe` (Standalone)
   - **Linux**: `Habit_OS-1.0.0.AppImage` (Executable) or `habit-os_1.0.0_amd64.deb` (Debian Package)
   - **macOS**: `Habit_OS-1.0.0.dmg` (Disk Image Installer)
3. Launch the application directly via your desktop icon or start menu shortcut.

---

### Method 2: Command-Line CLI Setup & Build (Cross-Platform)

Follow these steps to set up the development environment, clone the repository, and perform the initial build from source.

#### Prerequisites

Ensure **Node.js** (v18.0.0 or higher) and **Git** are installed on your environment.

---

#### 1️⃣ Environment Setup & Dependencies

##### 🪟 Windows (PowerShell / Command Prompt)
```powershell
# Verify Node.js and Git installation
node -v
npm -v
git --version

# If Node.js is missing, install via winget:
winget install OpenJS.NodeJS.LTS
```

##### 🐧 Linux (Ubuntu / Debian / Kali / Arch)
```bash
# Ubuntu / Debian / Kali
sudo apt update
sudo apt install -y nodejs npm git build-essential

# Arch Linux
sudo pacman -S nodejs npm git base-devel
```

##### 🍎 macOS (Terminal)
```bash
# Install via Homebrew
brew install node git
```

---

#### 2️⃣ Clone Repository & Install Dependencies

Open your terminal or command line prompt and execute:

```bash
# Clone the repository
git clone https://github.com/project-hellhound-org/Habbit-Tracker.git

# Navigate into project directory
cd Habbit-Tracker

# Install Node.js & Electron dependencies
npm install
```

---

#### 3️⃣ Launch & Build Commands

##### 🌐 Web Browser Local Development
```bash
# Start Vite local development server
npm run dev
```
Open `http://localhost:3000` in your web browser.

##### 🖥️ Desktop App GUI Development Mode
```bash
# Launch Habit OS inside an Electron desktop window
npm run electron:dev
```

##### 📦 Build Standalone Executables (Cross-Platform)
```bash
# 1. Compile TypeScript & Vite web bundle
npm run build

# 2. Package cross-platform desktop executables
npm run electron:build
```

The output executables and installers will be generated inside the `dist_electron/` directory:
- **Linux Output**: `dist_electron/Habit OS-1.0.0.AppImage` & `dist_electron/habit-os_1.0.0_amd64.deb`
- **Windows Output**: `dist_electron/Habit OS Setup 1.0.0.exe` & `dist_electron/Habit OS 1.0.0 Portable.exe`
- **macOS Output**: `dist_electron/Habit OS-1.0.0.dmg`

---

## 🛠️ Technology Stack

- **GUI Framework**: Electron (Desktop Runtime) & React 18
- **Build System**: Vite & TypeScript
- **State & Storage**: Dexie.js (IndexedDB local-first database)
- **Styling**: Modern Vanilla CSS Design Tokens (Monochromatic High-Contrast Palette)
- **Icons**: Lucide React
- **Date Math**: date-fns

---

## 🔒 Privacy & Local-First Philosophy

- **Zero Mandatory Cloud Dependencies**: Your database lives exclusively inside your local device storage.
- **Granular AI Privacy Controls**: Control exactly which metrics (Habits, Tasks, Focus, Journal) are shared with AI providers.
- **Masked Credentials**: API keys are masked and securely stored locally.

---

## 📜 License

Distributed under the MIT License. Developed by **Project Hellhound**.
