# Habit OS Architecture Documentation

![Habit OS System Banner](assets/Banner.png)

<p align="center">
  <img src="assets/Icon.png" width="96" alt="Habit OS Application Logo" /><br>
  <b>Local-First Personal Productivity & Environmental Habit Operating System</b><br>
  Built with React 18, TypeScript 5, Vite, Dexie IndexedDB, and Electron.
</p>

---

## 1. Project Overview

Habit OS is an enterprise-grade productivity workstation designed for professionals, engineers, and researchers requiring local-first data privacy, structured habit formation, timeline-based task management, and zero-latency AI copilot analytics.

### Core Functionality
- **Habit Formation & Schedule Tracking**: Provides habit categorization, start/end scheduling windows, completion target parameters, and consecutive day streak evaluation.
- **Timeline Task Management**: Supports task duration allocation, start/end date constraints, priority levels, subtask breakdowns, and deadline tracking.
- **Daily Review & Performance Analytics**: Calculates productivity efficiency indices, habit completion ratios, focus scores, and task workload audits.
- **Zero-Latency AI Insight Engine**: Integrates local (Ollama) and generic cloud API models without reasoning/thinking latency delays.

### Environmental Design Philosophy
The system implements the Forest Flow Environment Engine, an architectural framework that separates atmospheric rendering from application UI interactivity. The environment is rendered as a persistent fixed background layer behind the UI shell. This approach delivers atmospheric immersion while maintaining application readability, component stability, and frame-rate performance.

---

## 2. Setup Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Python 3.8 or higher
- Optional: Ollama local service for offline AI inference

### Installation & Initialization

1. **Clone the Repository**:
```bash
git clone https://github.com/project-hellhound-org/Habbit-Tracker.git
cd Habbit-Tracker
```

2. **Automated System Setup**:
Execute the automated shell installer script to inspect system prerequisites, install dependencies, compile production assets, and link terminal launchers:
```bash
chmod +x install.sh
./install.sh
```

3. **Manual Dependency Installation**:
Alternatively, dependencies can be installed manually using npm:
```bash
npm install
```

4. **Launch Development Environment**:
```bash
# Web application development server
npm run dev

# Desktop application (Electron runtime)
npm run electron:dev
```

### AI Model Integration Configuration

Habit OS supports both offline local models via Ollama and vendor-agnostic cloud API endpoints.

- **Local Inference Setup**:
  - Install Ollama (`https://ollama.com`).
  - Start the Ollama daemon: `ollama serve`.
  - Pull desired models: `ollama pull llama3.1`.
  - Set Environment Mode to `Local Model (Ollama)` in Settings. Default endpoint: `http://localhost:11434/v1/chat/completions`.

- **Cloud Model Setup**:
  - Set Environment Mode to `Cloud Model (Generic API)` in Settings.
  - Provide **API Key**, **Base URL** (e.g., `https://api.openai.com/v1`), and **Model Name** (e.g., `gpt-4o-mini`).
  - Use the built-in Connection Test utility to verify endpoint latency and authorization.

---

## 3. Usage Guidelines

### Global Environment Engine Controls

The environment engine operates persistently across all views and can be configured within the Settings view:

1. **Environment Theme Selector**:
   - **Rain Forest**: Tropical forest composition featuring dark emerald base tones (`#071A13`), midground foliage, top canopy silhouettes, diffused sunlight ray movement, sparse rain droplets, and blurred foreground foliage.
   - **Foggy Mist Forest**: Mountain forest composition utilizing cool desaturated gray-green tones (`#111A18`), distant tree blur, deep background mist, mid-distance trees, three unsynchronized fog motion layers, and moisture particles.

2. **Atmosphere Toggles**:
   - **Animation**: Enables or disables environmental motion, including rain particles and fog slice translation.
   - **Ambient Motion**: Toggles foliage oscillation and canopy sunlight drift.

3. **Intensity & Speed Sliders**:
   - **Environment Opacity (0–100%)**: Adjusts total environmental scene visibility.
   - **Motion Speed (0–100%)**: Multiplier modifying environmental animation velocity.
   - **Mist/Rain Density (0–100%)**: Adjusts droplet count for Rain Forest or fog layer opacity and particle density for Foggy Mist Forest.

### Terminal Executable Launcher

The application installs a terminal binary `Habit` registered in user binary paths (`~/.local/bin/Habit`). You can invoke the software directly from any command prompt:
```bash
Habit
```

---

## 4. Project Hellhound

Project Hellhound represents an engineering initiative focused on building privacy-preserving, high-density productivity software and local AI copilot tools.

### Architectural Objectives
- **Data Sovereignty**: Eliminating third-party telemetry and cloud lock-in by executing database storage locally within IndexedDB.
- **Zero-Latency Copilot Interface**: Bypassing chain-of-thought latency to deliver rapid analytical responses for user habit and workload queries.
- **Environmental Immersion**: Merging organic aesthetics with software usability to reduce digital fatigue during long technical working sessions.

### Repository License
Distributed under the MIT License. Copyright (c) Project Hellhound.
