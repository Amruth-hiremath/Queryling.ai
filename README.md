<div align="center">
  <img width="1200" height="475" alt="Queryling Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # Queryling
  ### Master by Teaching. The Feynman Technique Simulator.

  <p align="center">
    <b>Teach an AI that sees, hears, and challenges your logic.</b><br />
    Powered by Google Gemini 2.5 Flash & Multimodal Live API.
  </p>
</div>

---

## 💡 Inspiration: The Illusion of Competence
We often think we understand a topic until we try to explain it. This is the **Illusion of Competence**. The physicist Richard Feynman famously argued that *"if you can't explain it simply, you don't understand it."*

**Queryling** flips the script on traditional AI tutoring. Instead of an AI lecturing you, **YOU teach the AI.** It acts as a curious child, a confused student, or a skeptical peer, forcing you to simplify your language, identify gaps in your logic, and truly master your subject.

## 🚀 Key Features

### 🧠 Adaptive AI Personas
Queryling isn't just a chatbot. It adopts specific psychological profiles to test your knowledge depth:
* **The 5-Year Old:** Demands analogies and simple language. Asks "Why?" incessantly.
* **The Confused Student:** Points out logical inconsistencies and asks for clarification.
* **The Skeptic:** Doubts everything. Demands proof and rigorous explanation.
* **Evolution System:** As your "Mastery Score" increases, the AI automatically levels up from a Child to a Peer, adapting its difficulty in real-time.

### 🗣️ Multimodal Live Voice Mode
Experience a real-time tutoring session with sub-second latency.
* **Powered by Gemini Live API:** Uses WebSockets to stream raw audio for natural, interruptible conversations.
* **Video Understanding:** Turn on your camera to show diagrams or notes—Queryling "sees" what you are explaining.

### 🕸️ Live Logic Graph (Mermaid.js)
As you explain concepts, Queryling analyzes your speech in the background and **autonomously draws a flowchart of your logic**.
* If your explanation is messy, the graph is messy.
* If your logic is sound, the graph is structured.
* *Tech:* Uses structured JSON output to generate `mermaid.js` syntax on the fly.

### 🎨 Mental Model Visualization
Struggling to describe a concept? Queryling uses **Gemini 2.5 Flash Image** to draw what it *thinks* you mean. This visual feedback loop instantly exposes misconceptions.

### 📚 Auto-Generated Study Assets
Don't let your teaching session vanish. Queryling generates:
* **Smart Study Guides:** A structured Markdown revision sheet based on *your* correct explanations.
* **Flashcard Forge:** Automatically extracts key concepts and "Deep Understanding" questions into a spaced-repetition deck.

### 🌍 Global Classroom
Native support for **10+ languages** (English, Spanish, French, Japanese, Hindi, Kannada, Telugu, Tamil, Malayalam, etc.). Practice teaching complex topics in your target language.

---

## 🛠️ The Stack

Queryling is built on a modern, type-safe stack designed for speed and interactivity.

| Component | Tech | Description |
| :--- | :--- | :--- |
| **Core Brain** | **Gemini 2.5 Flash** | Ultra-low latency reasoning & JSON structured output. |
| **Real-time Voice** | **Gemini Live API** | `gemini-2.5-flash-native-audio-preview` for WebSocket audio streaming. |
| **Vision/Image** | **Imagen 3 / Gemini Vision** | `gemini-2.5-flash-image` for mental model generation. |
| **Frontend** | **React 19 + Vite** | Fast, modern UI with React Server Components support. |
| **Language** | **TypeScript** | Strict typing for robust message and session handling. |
| **Styling** | **Tailwind CSS** | Responsive, dark-mode ready glassmorphism design. |
| **Animations** | **Framer Motion** | "Butter-smooth" layout transitions and modal effects. |
| **Diagrams** | **Mermaid.js** | Rendering the live logic graphs. |

---

## 💻 Running Locally

### Prerequisites
* Node.js (v18 or higher)
* A Google Cloud Project with the **Gemini API** enabled.
* An API Key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/queryling.git](https://github.com/yourusername/queryling.git)
    cd queryling
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env.local` file in the root directory:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

5.  **Open in Browser:**
    Navigate to `http://localhost:3000` (or the port shown in your terminal).

---

## 📂 Project Structure

```text
src/
├── components/         # UI Components
│   ├── ChatMessage.tsx     # Renders text/markdown messages with avatars
│   ├── LiveVoiceModal.tsx  # WebRTC/WebSocket manager for Live API
│   ├── MermaidDiagram.tsx  # Renders logic graphs
│   ├── Sidebar.tsx         # The "Metacognitive Dashboard"
│   └── ...
├── services/
│   └── geminiService.ts    # The Core Brain. Handles all API calls (Text, Stream, Live, Image)
├── utils/
│   └── i18n.ts             # Translations for 10+ languages
├── types.ts            # Shared TypeScript interfaces (SessionRecord, Message, etc.)
├── App.tsx             # Main application logic & state management
└── main.tsx            # Entry point
