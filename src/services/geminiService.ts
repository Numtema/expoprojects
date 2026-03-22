import { GoogleGenAI, Type } from "@google/genai";
import { AppPlan, ProjectFile } from "../types";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenAI({ apiKey });

export async function generateAppPlan(idea: string, audioData?: { data: string, mimeType: string }, stylePreference?: string): Promise<AppPlan> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an expert Expo and React Native architect. 
    Your goal is to plan a mobile application based on a user's idea, specifically designed for the "Expo Local-first Pro Template".
    
    Template Architecture (MANDATORY):
    - Framework: Expo v54 (React Native 0.81)
    - Navigation: Expo Router (File-based, using (tabs) group)
    - Database: Drizzle ORM + Expo SQLite (Local-first)
    - Styling: NativeWind v4 (Tailwind CSS)
    - UI Components: 
      * Primitives: components/primitives/ (Radix-like)
      * UI: components/ui/ (shadcn-like: button, card, input, select, dialog, alert-dialog, etc.)
    - Icons: lucide-react-native (using lib/icons/ pattern with cssInterop)
    - State: Zustand
    - Storage: react-native-mmkv (lib/storage.ts)
    
    ${stylePreference ? `The user has requested a "${stylePreference}" visual style. Incorporate this into the architecture and UI descriptions.` : ''}
    
    The plan must include:
    1. A clear app name and tagline.
    2. A list of implementation tasks (Setup, Database, UI, Logic, Features). Each task MUST be broken down into "morsels" (small, actionable steps). 
    3. A database schema (Drizzle style) with tables and columns.
    4. A list of screens with their file paths (Expo Router style) and components.
    5. A brief description of the architecture.
    6. A few "artifacts" which are key code snippets.
    7. A "style" choice (minimal, brutalist, modern, glassmorphism) that fits the app's purpose.
    8. A list of "dependencies" (npm packages) required for the project.
    
    Format the output as a structured JSON object.
  `;

  const responseSchema = {
    // ... (rest of the schema remains the same)
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      tagline: { type: Type.STRING },
      description: { type: Type.STRING },
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["setup", "database", "ui", "logic", "feature"] },
            status: { type: Type.STRING, enum: ["todo", "in-progress", "done"] },
            morsels: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "title", "description", "category", "status", "morsels"]
        }
      },
      schema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            columns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  isPrimary: { type: Type.BOOLEAN },
                  isNotNull: { type: Type.BOOLEAN },
                  default: { type: Type.STRING }
                },
                required: ["name", "type", "description"]
              }
            }
          },
          required: ["name", "description", "columns"]
        }
      },
      screens: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            path: { type: Type.STRING },
            description: { type: Type.STRING },
            components: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "path", "description", "components"]
        }
      },
      architecture: { type: Type.STRING },
      style: { type: Type.STRING, enum: ["minimal", "brutalist", "modern", "glassmorphism"] },
      dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      artifacts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            file: { type: Type.STRING },
            code: { type: Type.STRING },
            language: { type: Type.STRING }
          },
          required: ["title", "file", "code", "language"]
        }
      }
    },
    required: ["name", "tagline", "description", "tasks", "schema", "screens", "architecture", "artifacts", "style", "dependencies"]
  };

  const parts: any[] = [{ text: `User Idea: ${idea}` }];
  if (audioData) {
    parts.push({
      inlineData: {
        data: audioData.data,
        mimeType: audioData.mimeType
      }
    });
  }

  const response = await genAI.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  return JSON.parse(response.text);
}

export async function generateFileContent(plan: AppPlan, filePath: string, contextFiles?: { name: string, content: string }[]): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert React Native developer. 
    Based on the provided App Plan, generate the full source code for the file at: ${filePath}.
    
    The code must follow the "Expo Local-first Pro Template" patterns:
    - Navigation: Expo Router v3+ (use (tabs) group, Stack, Link)
    - Styling: NativeWind v4 (Tailwind CSS)
    - Components: Use components from "@/components/ui" (e.g., Button, Card, Input, Text)
    - Icons: Use icons from "@/lib/icons" (e.g., import { Settings } from "@/lib/icons/Settings")
    - Database: Drizzle ORM (import { db } from "@/db/drizzle", use useLiveQuery)
    - State: Zustand
    - Utils: Use "@/lib/utils" (cn helper)
    
    Coding Standards:
    1. Use modern TypeScript with strict typing.
    2. Follow the directory structure: app/, components/ui/, components/primitives/, db/, lib/icons/.
    3. For screens, use functional components with "export default function".
    4. Ensure accessibility props are included where appropriate.
    
    Return ONLY the raw code content. No markdown blocks.
  `;

  let prompt = `App Plan: ${JSON.stringify(plan)}\n\nGenerate content for file: ${filePath}`;
  if (contextFiles && contextFiles.length > 0) {
    prompt += `\n\nAdditional Context Documents:\n${contextFiles.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join('\n\n')}`;
  }

  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
    }
  });

  return response.text.trim();
}

export async function generateTailwindConfig(plan: AppPlan): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert UI/UX Designer specialized in Tailwind CSS and NativeWind.
    Based on the App Plan and the chosen style (${plan.style}), generate a comprehensive tailwind.config.ts.
    
    Include:
    - Custom colors that match the aesthetic.
    - Font family configurations.
    - Any specific animations or transitions.
    
    Return ONLY the raw TypeScript code. No markdown blocks.
  `;

  const response = await genAI.models.generateContent({
    model,
    contents: `App Plan: ${JSON.stringify(plan)}`,
    config: { systemInstruction }
  });

  return response.text.trim();
}

export async function generateTests(plan: AppPlan): Promise<ProjectFile[]> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a QA Engineer specialized in React Native testing.
    Generate a basic test suite for the following App Plan using Jest and React Native Testing Library.
    
    Return a JSON array of files:
    [
      { "path": "__tests__/App-test.tsx", "content": "..." },
      { "path": "__tests__/Database-test.ts", "content": "..." }
    ]
    
    Return ONLY the raw JSON.
  `;

  const response = await genAI.models.generateContent({
    model,
    contents: `App Plan: ${JSON.stringify(plan)}`,
    config: { 
      systemInstruction,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text);
}

export async function generateDevOpsConfigs(plan: AppPlan): Promise<ProjectFile[]> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a DevOps Specialist specialized in Expo and mobile CI/CD.
    Generate deployment configurations for:
    - app.json / app.config.ts (EAS config)
    - .github/workflows/main.yml (GitHub Actions for build/deploy)
    
    Return a JSON array of files:
    [
      { "path": "app.json", "content": "..." },
      { "path": ".github/workflows/main.yml", "content": "..." }
    ]
    
    Return ONLY the raw JSON.
  `;

  const response = await genAI.models.generateContent({
    model,
    contents: `App Plan: ${JSON.stringify(plan)}`,
    config: { 
      systemInstruction,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text);
}

export async function generateReadme(plan: AppPlan): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert technical writer. 
    Generate a professional README.md for the following App Plan.
    Include:
    - App Name & Tagline
    - Description
    - Features
    - Tech Stack (Expo, NativeWind, Drizzle, Zustand)
    - Installation Instructions
    - Database Schema Overview
    - Architecture details
    
    Use clean Markdown. Return ONLY the markdown content.
  `;

  const response = await genAI.models.generateContent({
    model,
    contents: `App Plan: ${JSON.stringify(plan)}`,
    config: {
      systemInstruction,
    }
  });

  return response.text.trim();
}
