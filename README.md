<div align="center">

<!-- PROJECT LOGO -->

<br />
<div style="background: linear-gradient(to right, #4f46e5, #06b6d4); padding: 2px; border-radius: 50%; display: inline-block;">
<img src="public/globe.svg" alt="Logo" width="80" height="80" style="background-color: white; border-radius: 50%; padding: 10px;">
</div>

<h1 style="font-size: 3rem; margin-top: 1rem;">Gemini Enhancer</h1>

<p style="font-size: 1.2rem; max-width: 600px; margin: 0 auto;">
<b>Unleash the full potential of AI.</b>




A powerful Next.js dashboard for Google Gemini featuring advanced editor capabilities, native LaTeX math rendering, and persistent data storage.
</p>

<br />

<!-- BADGES -->

<a href="https://nextjs.org">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Next.js-14-black%3Fstyle%3Dfor-the-badge%26logo%3Dnext.js" alt="Next.js" />
</a>
<a href="https://tailwindcss.com">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Tailwind_CSS-38B2AC%3Fstyle%3Dfor-the-badge%26logo%3Dtailwind-css%26logoColor%3Dwhite" alt="Tailwind CSS" />
</a>
<a href="https://supabase.com">
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</a>
<a href="https://ai.google.dev/">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Gemini_AI-8E75B2%3Fstyle%3Dfor-the-badge%26logo%3Dgoogle%26logoColor%3Dwhite" alt="Gemini AI" />
</a>

<br />
<br />

<a href="#demo">View Demo</a> •
<a href="#getting-started">Getting Started</a> •
<a href="#features">Features</a> •
<a href="https://www.google.com/search?q=CONTRIBUTING.md">Contribute</a>

</div>

<br />

<!-- SCREENSHOT / DEMO -->

<div id="demo" align="center">
<!-- REPLACE THIS URL WITH YOUR ACTUAL SCREENSHOT URL -->
<img src="https://www.google.com/search?q=https://via.placeholder.com/1000x500/1e1e1e/ffffff%3Ftext%3DDashboard%2BScreenshot%2BHere" alt="Project Screenshot" style="border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
</div>

<br />

📖 About The Project

Gemini Enhancer is a sophisticated wrapper and workspace designed around the Google Gemini API. It moves beyond simple chat interfaces to provide a structured environment for prompt engineering, content generation, and knowledge management.

Built with Next.js, it leverages Supabase for keeping track of your interactions and KaTeX to ensure that mathematical and scientific outputs are rendered beautifully.

Why use Gemini Enhancer?

Structured Workflow: Separate your drafting in the EditorView from your inquiries in the Dashboard.

Math First: Native LaTeX support means equations like $E = mc^2$ render perfectly, making it ideal for academic and scientific use cases.

Data Persistence: Unlike ephemeral chat sessions, your data is stored securely via Supabase.

✨ Key Features

Feature

Description

🤖 AI Integration

Direct integration with Google's Gemini models for high-quality text generation.

🧮 LaTeX Support

Native rendering of mathematical notation using KaTeX. Perfect for STEM tasks.

🌓 Dark/Light Mode

Built-in theme switching hook (useDarkMode) for comfortable viewing in any environment.

💾 Supabase Backend

Robust database integration for saving prompts, responses, and user settings.

📝 Rich Editor

A dedicated editor view for refining AI-generated content.

🔍 JSON Viewer

Inspect raw data structures with the built-in JsonViewerModal for debugging.

🛠️ Tech Stack

Framework: Next.js (App Router)

Styling: Tailwind CSS

Backend/Auth: Supabase

AI Model: Google Gemini API

Math Rendering: KaTeX

Icons: SVG / Heroicons

🚀 Getting Started

Follow these steps to set up the project locally on your machine.

Prerequisites

Node.js (v18 or higher)

npm or yarn

A Supabase account

A Google Cloud Project with Gemini API access

Installation

Clone the repository

git clone [https://github.com/saurabhkg03/gemini-enhancer.git](https://github.com/saurabhkg03/gemini-enhancer.git)
cd gemini-enhancer


Install dependencies

npm install
# or
yarn install


Configure Environment Variables
Create a .env.local file in the root directory and add your API keys:

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key


Run the application

npm run dev


Open http://localhost:3000 with your browser to see the result.

📂 Project Structure

gemini-enhancer/
├── app/
│   ├── components/      # React components (Dashboard, Editor, etc.)
│   ├── hooks/           # Custom hooks (useDarkMode, useKatex)
│   ├── lib/             # API clients (gemini.js, supabase.js)
│   ├── globals.css      # Global styles & Tailwind directives
│   ├── layout.js        # Root layout
│   └── page.js          # Main entry point
├── public/              # Static assets
└── ...config files      # Next.js, Tailwind, ESLint configs


🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

See CONTRIBUTING.md for detailed guidelines.

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
