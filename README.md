<div align="center">

  <h1>✨ Gemini Enhancer</h1>
  
  <p>
    <strong>AI-Powered Educational Content Refinement Tool</strong>
  </p>

  <p>
    <a href="#-overview">Overview</a> •
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-usage">Usage</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=flat&logo=google-gemini" alt="Gemini" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css" alt="Tailwind" />
  </p>
</div>

<br />

## 🚀 Overview

**Gemini Enhancer** is a sophisticated dashboard designed to transform raw question banks into high-quality, well-explained educational content. 

Leveraging **Google's Gemini 2.5 Flash** model, this tool automates the generation of step-by-step solutions, latex-formatted equations, and conceptual explanations for multiple-choice questions. It supports **multimodal input**, allowing the AI to "see" and solve questions containing diagrams or images.

Built with a focus on speed and usability, it features an **Optimistic UI** with atomic saving, ensuring that revisions are safe, fast, and collaborative.

## ✨ Features

* **🧠 AI-Powered Enhancement:** Automatically generates detailed, HTML-formatted explanations using Gemini 2.5 Flash.
* **🖼️ Multimodal Support:** Analyzes images within questions to provide context-aware solutions.
* **⚡ Batch Processing:** Enhance hundreds of questions in the background with a progress tracking bar.
* **📝 Interactive Editor:** Side-by-side view of the "Original" vs. "Enhanced" content with live editing capabilities.
* **💾 Atomic & Optimistic Saving:** Changes are saved instantly to Supabase with undo/redo history support.
* **🌗 Dark Mode:** A fully responsive UI that looks great in light or dark themes.
* **📤 JSON Import/Export:** easily upload raw JSON banks and download the enhanced versions.
* **🧮 KaTeX Rendering:** Native support for rendering complex mathematical equations.

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19, Tailwind CSS 4, Lucide React |
| **Backend & Auth** | Supabase (PostgreSQL) |
| **AI Model** | Google Gemini (Generative AI SDK) |
| **Math Rendering** | KaTeX |
| **State Management** | React Hooks (Optimistic UI patterns) |

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* **Node.js** (v18 or higher)
* **Supabase Account** (for database and auth)
* **Google Gemini API Key**

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/gemini-enhancer.git](https://github.com/yourusername/gemini-enhancer.git)
    cd gemini-enhancer
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**
    Ensure your Supabase database has the required tables (`question_banks`, `questions`) with the appropriate columns as seen in the schema usage (e.g., `original_data` jsonb, `enhanced_data` jsonb, `status` text).

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser.

## 💡 Usage

1.  **Login:** Sign in using Google Auth (via Supabase).
2.  **API Key:** Enter your Gemini API Key in the dashboard settings (stored locally for privacy).
3.  **Upload:** Drag and drop a JSON file containing an array of questions.
4.  **Enhance:** * Click **Auto-Enhance** on individual questions.
    * Use **Batch Enhance** to process the entire file at once.
5.  **Review:** Edit the AI output if necessary, then click **Approve**.
6.  **Export:** Download the fully enhanced JSON file for use in your LMS or app.

## 🤝 Contributing

Contributions are welcome! Please check the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to help improve this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
