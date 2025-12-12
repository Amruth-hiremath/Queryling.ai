
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string for displayed image
  type?: 'normal' | 'clarification' | 'challenge' | 'feedback' | 'levelup';
}

export interface SidebarData {
  summary: string;
  keyTerms: string[];
  relatedConcepts: string[];
  masteryScore: number; // 0-100
  mermaidCode?: string; // Code for the diagram
}

export interface ImprovementItem {
  text: string;
  url?: string;
  sourceTitle?: string;
}

export interface FeedbackReport {
  score: number; // 1-5
  strengths: string[];
  improvements: ImprovementItem[];
  summary: string;
}

export interface Flashcard {
  front: string;
  back: string;
  type?: 'concept' | 'scenario' | 'definition';
  hint?: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  topic: string;
  persona: Persona;
  score: number;
  summary: string;
  language?: Language;
  messages?: Message[];
  sidebarData?: SidebarData;
  customInstruction?: string;
}

export type ChatStyle = 'standard' | 'bubble' | 'scifi' | 'cyberpunk' | 'minimal';
export type Persona = 'child' | 'student' | 'skeptic' | 'custom';
export type Language = 'en' | 'es' | 'fr' | 'nl' | 'ja' | 'hi' | 'kn' | 'te' | 'ta' | 'ml';