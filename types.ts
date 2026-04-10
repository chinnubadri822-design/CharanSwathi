
export enum MessageRole {
  USER = 'user',
  FRIDAY = 'friday',
  SYSTEM = 'system'
}

export type NeuralCore = 'FRIDAY' | 'DEEPSEEK' | 'GPT4' | 'GEMINI' | 'BOLT' | 'ULTRON' | 'JARVIS' | 'VISION';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  type?: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  core?: NeuralCore;
}

export interface VoiceState {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error?: string;
}
