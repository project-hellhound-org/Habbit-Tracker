# Habit OS — Personal Productivity & Habit Operating System

![Habit OS Hero Banner](assets/banner.png)

<p align="center">
  <b>A Minimalist, Local-First, High-Precision Productivity & Habit Operating System</b><br>
  Built with React, Vite, TypeScript, Dexie IndexedDB, and Electron for Cross-Platform Desktop Executables.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20macOS-000000?style=for-the-badge&logo=electron&logoColor=white" alt="Platforms" />
  <img src="https://img.shields.io/badge/Storage-Local--First%20IndexedDB-000000?style=for-the-badge&logo=sqlite&logoColor=white" alt="Local First" />
  <img src="https://img.shields.io/badge/AI-NVIDIA%20NIM%20%7C%20OpenAI%20%7C%20Claude%20%7C%20Offline-000000?style=for-the-badge&logo=nvidia&logoColor=white" alt="AI Providers" />
</p>

---

## 🌟 Overview

**Habit OS** is an advanced, privacy-focused productivity workstation designed for professionals, engineers, and power users who need high-density workflow management without slow cloud bloat or visual distraction. 

Every surface follows a **Minimal Ink & Monochromatic Precision** visual language, storing 100% of user data locally inside your device using Dexie IndexedDB.

---

## 🚀 Key Capabilities & Modules

### 1. 📊 Habit OS Consistency Engine
- Track daily, weekly, or custom scheduled habits with customizable target values and metrics.
- Comprehensive 30-day streak heatmaps, completion consistency percentages, and best-performing days of the week.
- Flexible streak skip rules (*Pause*, *Reset*, *Forgive*, *Break*).

### 2. 🎯 Tasks, Projects & Strategic Goals
- Integrated workload management supporting backlog, todo, in-progress, and critical priority tasks.
- Hierarchical project breakdown with goal alignment and target deadline tracking.

### 3. ⏱️ Verified Focus Engine (Anti-Gaming Protection)
- Multi-mode focus timers (**Guided Verification Mode**, **Continuous Mode**, and **Goal-Based Focus**).
- Anti-gaming verification checkpoints: periodic prompts verify active deep work, automatically separating verified focus minutes from unverified idle time.
- Detailed interruption logging and session efficiency analytics.

### 4. 🧠 Context-Aware AI Analyst & Personalization System
- Integrated productivity copilot capable of analyzing habit consistency, task backlogs, focus efficiency, and daily journal reviews.
- **Provider Support**: 100% Offline Built-in Analytical Engine, **NVIDIA NIM** (Llama 3.1 & Mixtral), OpenAI (GPT-4o), Anthropic Claude 3.5, and Google Gemini.
- **Behavioral Framework Personalization**: Customize AI response tones (*Analytical*, *Motivational*, *Strict Audit*, *Executive Summary*, *Guided Mentor*) and custom system directives.

### 5. 📖 Daily Review & Journal Reflections
- Structured end-of-day reviews tracking productivity ratings, accomplishments, blockers, wins, mood, and energy scores.

---

## 💻 Standalone Executable Desktop App

Habit OS is packaged as a standalone desktop application via **Electron & Electron Builder**.

### 📦 Build Standalone Desktop Executables

To build native cross-platform binaries for your operating system:

```bash
# 1. Install project dependencies
npm install

# 2. Launch Desktop App in Development Mode
npm run electron:dev

# 3. Package Production Standalone Executables
npm run electron:build
```

The output installers and binaries will be generated in `dist_electron/`:
- **Linux**: `Habit OS-1.0.0.AppImage` & `habit-os_1.0.0_amd64.deb`
- **Windows**: `Habit OS Setup 1.0.0.exe` & `Habit OS 1.0.0 Portable.exe`
- **macOS**: `Habit OS-1.0.0.dmg` & `Habit OS-1.0.0-mac.zip`

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
