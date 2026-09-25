import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('node_modules/@lobehub/icons-static-svg/icons');
const DEST_DIR = path.resolve('public/assets/logos');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

function processSvg(rawSvg, { width = 256, height = 256, fillColor = null } = {}) {
  let svg = rawSvg;
  // Replace width and height to 256
  svg = svg.replace(/width="[^"]*"/, `width="${width}"`);
  svg = svg.replace(/height="[^"]*"/, `height="${height}"`);
  if (!svg.includes('width=')) {
    svg = svg.replace('<svg', `<svg width="${width}" height="${height}"`);
  }
  if (fillColor) {
    if (svg.includes('fill="currentColor"')) {
      svg = svg.replace('fill="currentColor"', `fill="${fillColor}"`);
    } else if (svg.includes('fill=')) {
      svg = svg.replace(/fill="[^"]*"/g, `fill="${fillColor}"`);
    } else {
      svg = svg.replace('<svg', `<svg fill="${fillColor}"`);
    }
  }
  return svg;
}

const copyConfigs = [
  // Gemini
  { src: 'gemini-color.svg', dest: 'gemini.svg' },
  
  // OpenAI Tiers (Luna, Terra, Sol, Astra)
  { src: 'openai.svg', dest: 'openai.svg', fillColor: '#ffffff' },
  { src: 'openai.svg', dest: 'openai_luna.svg', fillColor: '#10a37f' },
  { src: 'openai.svg', dest: 'openai_terra.svg', fillColor: '#38bdf8' },
  { src: 'openai.svg', dest: 'openai_sol.svg', fillColor: '#fbbf24' },
  { src: 'openai.svg', dest: 'openai_astra.svg', fillColor: '#ffffff' },

  // Claude Tiers (Haiku, Sonnet, Opus, Fable)
  { src: 'claude-color.svg', dest: 'claude.svg' },
  { src: 'claude-color.svg', dest: 'claude_haiku.svg', fillColor: '#f87171' },
  { src: 'claude-color.svg', dest: 'claude_sonnet.svg', fillColor: '#D97757' },
  { src: 'claude-color.svg', dest: 'claude_opus.svg', fillColor: '#ea580c' },
  { src: 'claude-color.svg', dest: 'claude_fable.svg', fillColor: '#fbbf24' },

  // DeepSeek Whale
  { src: 'deepseek-color.svg', dest: 'deepseek.svg' },

  // Grok Slash-X
  { src: 'grok.svg', dest: 'grok.svg', fillColor: '#ffffff' },

  // Cursor Isometric Cube
  { src: 'cursor.svg', dest: 'cursor.svg' },

  // Kimi Moonshot
  { src: 'kimi-color.svg', dest: 'kimi.svg' },

  // Mistral Flame
  { src: 'mistral-color.svg', dest: 'mistral.svg' },

  // Copilot Multi-color Ribbon
  { src: 'copilot-color.svg', dest: 'copilot.svg' },

  // Perplexity Asterisk
  { src: 'perplexity-color.svg', dest: 'perplexity.svg' },

  // Qwen Hexagon Flower
  { src: 'qwen-color.svg', dest: 'qwen.svg' },
];

for (const cfg of copyConfigs) {
  const srcPath = path.join(SRC_DIR, cfg.src);
  const destPath = path.join(DEST_DIR, cfg.dest);
  if (!fs.existsSync(srcPath)) {
    console.error(`Missing source icon: ${srcPath}`);
    continue;
  }
  const raw = fs.readFileSync(srcPath, 'utf8');
  const processed = processSvg(raw, { width: 256, height: 256, fillColor: cfg.fillColor });
  fs.writeFileSync(destPath, processed, 'utf8');
  console.log(`Synced ${cfg.dest} from @lobehub/icons-static-svg/${cfg.src}`);
}

console.log('All LobeHub AI icons synced successfully!');
