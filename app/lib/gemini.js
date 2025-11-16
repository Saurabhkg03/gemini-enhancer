// --- PROMPTS ---
export const PROMPTS = {
    MULTIMODAL: `You are an expert revision tutor. Provide a CONCISE, clear explanation for the "QUESTION" based on provided images.

Formatting Rules (STRICT):
1. Output MUST be clean HTML. Do NOT use markdown code blocks (\`\`\`).
2. Structure:
   - Use <h3> for short section headers (e.g., <h3>Analysis</h3>).
   - Use <ul> or <ol> for steps and given values.
   - Use <p> for standard text.
3. Math:
   - Block equations: wrap in $$...$$ and place on their own line.
   - Inline math: wrap in $...$.
4. Brevity: Skip lengthy derivations if standard. Focus on key steps to reach the solution.

Final Output Template:
<div class="mtq_explanation-text space-y-3">
  <h3>Key Concept</h3>
  <p>...concise explanation...</p>
  <h3>Solution</h3>
  <ul>
    <li>Step 1: ...</li>
    <li>Step 2: ... $$ formula $$</li>
  </ul>
  <p><b>Final Answer: ...</b></p>
</div>`,

    REPHRASE: `You are an expert technical editor. Rewrite the "ORIGINAL EXPLANATION" to be CONCISE, structured, and professional.

Goals:
1. SHORTEN: Remove redundant words and filler text. Make it punchy.
2. FORMAT: Use HTML (<h3>, <ul>, <p>) to break up wall-of-text paragraphs.
3. MATH: Ensure all math uses strict LaTeX delimiters ($...$ inline, $$...$$ block).

Output ONLY the revised HTML wrapped in <div class="mtq_explanation-text space-y-3">...</div>.`,

    TEXT_GEN: `You are an expert revision tutor. Provide a CONCISE step-by-step solution for the "QUESTION".

Formatting Rules (STRICT):
1. NO markdown blocks. Output raw HTML only.
2. Use 3 for headers, <ul>/<ol> for steps, <p> for text.
3. Use $$...$$ for block math, $...$ for inline math.
4. Keep it short and direct. Focus on the mathematical steps.

Final Output Template:
<div class="mtq_explanation-text space-y-3">
  <h3>Analysis</h3>
  <p>...</p>
  <h3>Derivation</h3>
  <ol>
     <li>... $$ math $$</li>
     <li>...</li>
  </ol>
  <p><b>Conclusion: ...</b></p>
</div>`
};

// --- UTILITIES ---
export const cleanHtmlForPrompt = (html) => html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : "";

export const cleanOutputExplanation = (text) => {
    if (!text) return "";
    const match = text.match(/<div class="mtq_explanation-text">[\s\S]*?<\/div>/);
    if (match) return match[0];
    return text.replace(/```html/g, '').replace(/```/g, '').trim();
};

export const urlToGenerativePart = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch`);
        const blob = await response.blob();
        
        if (blob.type === 'image/svg+xml') {
            console.warn("Skipping unsupported SVG image:", url);
            return null;
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ inlineData: { data: reader.result.split(',')[1], mimeType: blob.type } });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) { console.warn("Image skip:", url); return null; }
};