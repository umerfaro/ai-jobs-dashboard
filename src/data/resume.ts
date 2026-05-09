export const DEFAULT_RESUME_TEXT = `
M. SHAHBAZ
+923499490427 | shzalpha1@gmail.com | Hostel city, Islamabad
Github: https://github.com/Pakzone1

OBJECTIVE
BS Artificial Intelligence graduate specializing in Agentic AI, enterprise automation, and intelligent systems. I design and deploy AI-powered conversational agents and decision-making frameworks that solve real-world complexities. Proven expertise in building scalable, autonomous tools and integrating AI-driven automation into enterprise workflows.

EDUCATION
BS Artificial Intelligence (2022 – 2026) — COMSATS University Islamabad
FSc (2019 - 2021) — BISE Multan

WORK EXPERIENCE
AI Developer — SPSNET (July 2024 – Present)
• Developing Agentic AI systems and AI-driven enterprise solutions
• Building LLM-powered AI applications for automation
• Enterprise SPS Workspace, Next.js platform unifying AI newsletter production, Teams attendance intelligence, and realtime meeting agents

AI/ML Developer — Decimal Solutions (July 2025 – January 2026)
• Designing and deploying Agent-driven systems
• Creating LLM-integrated applications to streamline business processes

Senior Moderator — Garena Free Fire (08/2020 - 01/2022)
• Managed Garena Free Fire PK Community as a Senior Moderator

Online Event Organizer — Gameloop & Farlight 84 (08/2020 - 01/2022)
• Organized gaming events for GameLoop & Farlight 84

AI Projects & Innovations
Conversational AI & Automation:
• WhatsApp AI Agent (No Meta API) — Handles appointments, orders, voice & vision tasks
• AI Agents for Discord, Telegram, and Websites — Enhancing user interaction and automation
• Agentic AI Development — Improving autonomous decision-making in AI systems

Other AI Projects:
• Resume Analysis AI — Automated resume screening & ranking using NLP
• AI Interviewer — AI-driven job interview automation & assessment
• AI Transcribers — Speech-to-text AI models for multilingual transcription
• B.R.A.I.N (Multi Agent SAAS platform)
• IBM Watsonx Orchestrate Agents

Previous AI & Software Projects:
1. Face & Mask Detector (OpenCV, Python)
2. Quran App Hybrid & Classic Snake Game (Python, Flutter, Dart)
3. Restaurant & Event Management System Web App (Java)
4. Hospital Management System (MongoDB, SQL, Oracle)
5. 4-Bit Binary Calculator (Xilinx, FPGA boards)
6. Regression Models on Datasets (Python)

Skills & Expertise
• Programming & AI Development: Python, JavaScript, Dart, C++, SQL
• AI Technologies: TensorFlow, OpenCV, LLMs, Agentic AI
• Web & App Development: Flutter, Webflow, Flutterflow
• AI-driven Recruitment Solutions: NLP, AI Resume Screening, Interview Automation
• Chatbot & AI Agent Development: WhatsApp AI, Discord AI, Telegram AI
• Game Development & Computer Vision: Pygame, OpenCV
• Automation & AI-based Decision Systems
`.trim();

export const RESUME_STORAGE_KEY = "ai-jobs-resume";

// Client-side: get resume from localStorage or default
export function getResume(): string {
  if (typeof window === "undefined") return DEFAULT_RESUME_TEXT;
  try {
    const saved = localStorage.getItem(RESUME_STORAGE_KEY);
    return saved || DEFAULT_RESUME_TEXT;
  } catch {
    return DEFAULT_RESUME_TEXT;
  }
}

export function saveResume(text: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESUME_STORAGE_KEY, text);
}
