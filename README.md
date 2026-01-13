<div align="center">
<a href="https://www.google.com/search?q=https://github.com/saurabhkg03/gemini-enhancer">
<img src="./public/globe.svg" alt="Logo" width="100" height="100">
</a>

<h1 align="center">Gemini Enhancer</h1>

<p align="center">
<b>Unleash the full potential of AI with structured workflows.</b>
<br />
A powerful Next.js dashboard for Google Gemini featuring advanced editor capabilities, native LaTeX math rendering, and persistent data storage.
<br />
<br />
<a href="#demo">View Demo</a>
·
<a href="#getting-started">Getting Started</a>
·
<a href="CONTRIBUTING.md">Contribute</a>
</p>
</div>

<!-- BADGES -->

<div align="center">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Next.js-black%3Fstyle%3Dfor-the-badge%26logo%3Dnext.js%26logoColor%3Dwhite" alt="Next.js" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Tailwind_CSS-38B2AC%3Fstyle%3Dfor-the-badge%26logo%3Dtailwind-css%26logoColor%3Dwhite" alt="Tailwind CSS" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Supabase-3ECF8E%3Fstyle%3Dfor-the-badge%26logo%3Dsupabase%26logoColor%3Dwhite" alt="Supabase" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Google%2520Gemini-8E75B2%3Fstyle%3Dfor-the-badge%26logo%3Dgoogle%26logoColor%3Dwhite" alt="Gemini AI" />
</div>

<br />

<!-- SCREENSHOT SECTION -->

<div id="demo" align="center">
<!-- Replace the src below with a real screenshot of your dashboard for the best effect -->
<img src="https://www.google.com/search?q=https://placehold.co/1200x600/1e1e1e/FFF%3Ftext%3DGemini%2BEnhancer%2BDashboard%2BPreview" alt="Dashboard Preview" style="border-radius: 10px;">
</div>

<br />

📖 About The Project

Gemini Enhancer allows users to move beyond simple chat interfaces. It provides a structured workspace designed for prompt engineering, complex content generation, and knowledge management.

Built with Next.js 14, it leverages Supabase for secure data persistence and KaTeX for rendering complex mathematical notations instantly.

Key Capabilities

Structured Workflow: Separate drafting in the EditorView from inquiries in the Dashboard.

Math First: Native LaTeX support means equations like $E = mc^2$ render perfectly—ideal for STEM.

Persistent Memory: Save prompts, responses, and settings to the cloud via Supabase.

Developer Friendly: Includes a JSON viewer to inspect raw API responses.

🛠️ Tech Stack

Component

Technology

Description

Framework

Next.js 14

App Router & Server Components

Styling

Tailwind CSS

Utility-first CSS framework

Backend

Supabase

PostgreSQL database & Authentication

AI Model

Google Gemini

gemini-pro for text generation

Math

KaTeX

Fast LaTeX math rendering

🚀 Getting Started

Follow these steps to get a local copy up and running.

Prerequisites

Node.js 18+

npm or yarn

Supabase Account & Project

Google AI Studio API Key

Installation

Clone the repo

git clone [https://github.com/saurabhkg03/gemini-enhancer.git](https://github.com/saurabhkg03/gemini-enhancer.git)
cd gemini-enhancer


Install dependencies

npm install


Environment Setup
Create a .env.local file in the root directory:

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key


Run the development server

npm run dev


Open http://localhost:3000 in your browser.

📂 Project Structure

gemini-enhancer/
├── app/
│   ├── components/      # React UI components (Dashboard, Editor, etc.)
│   ├── hooks/           # Custom hooks (useDarkMode, useKatex)
│   ├── lib/             # API clients (gemini.js, supabase.js)
│   └── page.js          # Entry point
├── public/              # Static assets (icons, SVGs)
└── ...config files      # Next.js, Tailwind, ESLint configs


🤝 Contributing

Contributions are strictly welcome! See CONTRIBUTING.md for details.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📜 License

Distributed under the MIT License. See LICENSE for more information.

<div align="center">
<p>Built with ❤️ by <a href="https://www.google.com/search?q=https://github.com/saurabhkg03">Saurabh</a></p>
</div>
