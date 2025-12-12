import { GoogleGenAI, Type, Chat, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
import { Message, SidebarData, FeedbackReport, Persona, Flashcard, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PERSONAS = {
  child: `You are a curious 5-year-old. You use simple words. You often ask "Why?" and get easily confused by big words or abstract concepts. You want analogies involving toys, animals, or food.`,
  student: `You are a confused university student. You are trying your best but struggling. You ask clarifying questions and point out logical gaps.`,
  skeptic: `You are a skeptical peer. You doubt everything until it's proven. You challenge assumptions and ask for evidence or logical proof. You are tough to convince.`
};

const LANGUAGE_INSTRUCTIONS = {
  en: "English",
  es: "Spanish",
  fr: "French",
  nl: "Dutch",
  ja: "Japanese",
  hi: "Hindi",
  kn: "Kannada",
  te: "Telugu",
  ta: "Tamil",
  ml: "Malayalam"
};

const BASE_INSTRUCTION = `
You are using the Feynman Technique to learn from the user. 
Your goal is to help the user understand a topic deeply by having them explain it to you.
Do NOT Lecture. Your job is to extract the explanation from the user.

Strategy:
1. Ask clarifying questions when the explanation is vague.
2. The "Socratic Trap": Occasionally, instead of just accepting an explanation, ask a "Trap Question" based on common misconceptions about the topic to test if the user really understands the mechanics or is just reciting definitions.
3. Be curious, persistent, and react naturally to the user's teaching style.
`;

let chatSession: Chat | null = null;

// --- Helper Functions ---

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function retryOperation<T>(
  operation: () => Promise<T>, 
  retries = 3, 
  baseDelay = 2000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRetryable = 
      error?.status === 429 || 
      error?.status === 503 ||
      error?.message?.includes('429') || 
      error?.message?.includes('503') ||
      error?.message?.includes('unavailable') ||
      error?.message?.includes('RESOURCE_EXHAUSTED');
    
    if (isRetryable && retries > 0) {
      console.warn(`Gemini API Error. Retrying in ${baseDelay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, baseDelay));
      return retryOperation(operation, retries - 1, baseDelay * 2);
    }
    throw error;
  }
}

// --- Live Session Manager ---

export class LiveSessionManager {
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private currentStream: MediaStream | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private session: any = null; 
  private accumulatedTranscripts: Message[] = [];
  private currentInputTranscript = "";
  private currentOutputTranscript = "";
  
  public onVolumeUpdate: ((vol: number) => void) | null = null;

  async connect(
    topic: string, 
    persona: Persona, 
    language: Language, 
    customInstruction: string | undefined,
    videoElement: HTMLVideoElement | null
  ): Promise<void> {
    
    this.accumulatedTranscripts = [];
    this.currentInputTranscript = "";
    this.currentOutputTranscript = "";

    const langName = LANGUAGE_INSTRUCTIONS[language];
    let personaInstruction = PERSONAS[persona as keyof typeof PERSONAS] || PERSONAS.child;
    if (persona === 'custom' && customInstruction) {
        personaInstruction = `You are a custom character defined as: "${customInstruction}". Stay in character at all times.`;
    }

    const sysInstruction = `${BASE_INSTRUCTION}\n\nPersona:\n${personaInstruction}\n\nIMPORTANT: Converse in ${langName}. The user wants to discuss "${topic}". Start by asking a question about it.`;

    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    if (this.outputContext?.state === 'suspended') {
        await this.outputContext.resume();
    }

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: sysInstruction,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: async () => {
          await this.startAudioInput(sessionPromise);
          if (videoElement) {
              this.startVideoInput(videoElement, sessionPromise);
          }
        },
        onmessage: async (msg: LiveServerMessage) => {
          this.handleServerMessage(msg);
        },
        onclose: () => {
          console.log("Gemini Live Closed");
        },
        onerror: (err) => {
          console.error("Gemini Live Error", err);
        }
      }
    });
  }

  private async startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputContext) return;

    try {
        this.currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.inputSource = this.inputContext.createMediaStreamSource(this.currentStream);
        this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
        
        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            if (this.onVolumeUpdate) this.onVolumeUpdate(rms);

            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            const base64Audio = arrayBufferToBase64(pcmData.buffer);

            if (this.inputContext?.state === 'suspended') {
                this.inputContext.resume();
            }

            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Audio
                    }
                });
            }).catch(err => console.error("Send audio failed", err));
        };

        this.inputSource.connect(this.processor);
        this.processor.connect(this.inputContext.destination);

    } catch (e) {
        console.error("Microphone access failed", e);
    }
  }

  private startVideoInput(videoEl: HTMLVideoElement, sessionPromise: Promise<any>) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const interval = setInterval(() => {
        if (!this.inputContext || this.inputContext.state === 'closed') {
            clearInterval(interval);
            return;
        }
        if (videoEl.videoWidth > 0) {
            canvas.width = videoEl.videoWidth * 0.5;
            canvas.height = videoEl.videoHeight * 0.5;
            ctx?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: "image/jpeg",
                        data: base64
                    }
                });
            }).catch(() => {});
        }
    }, 1000);
  }

  private async handleServerMessage(message: LiveServerMessage) {
      const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
      if (audioData && this.outputContext) {
          const audioBytes = base64ToUint8Array(audioData);
          const audioBuffer = await this.decodeAudioData(audioBytes, 24000);
          this.playAudioBuffer(audioBuffer);
      }

      if (message.serverContent?.interrupted) {
          this.stopAudioPlayback();
      }

      const inputTrans = message.serverContent?.inputTranscription;
      if (inputTrans) {
          this.currentInputTranscript += inputTrans.text;
      }

      const outputTrans = message.serverContent?.outputTranscription;
      if (outputTrans) {
          this.currentOutputTranscript += outputTrans.text;
      }

      if (message.serverContent?.turnComplete) {
          if (this.currentInputTranscript.trim()) {
              this.accumulatedTranscripts.push({
                  id: Date.now().toString() + "_user",
                  role: 'user',
                  text: this.currentInputTranscript.trim()
              });
              this.currentInputTranscript = "";
          }
          if (this.currentOutputTranscript.trim()) {
              this.accumulatedTranscripts.push({
                  id: Date.now().toString() + "_model",
                  role: 'model',
                  text: this.currentOutputTranscript.trim(),
                  type: 'normal'
              });
              this.currentOutputTranscript = "";
          }
      }
  }

  private async decodeAudioData(data: Uint8Array, sampleRate: number): Promise<AudioBuffer> {
     if (!this.outputContext) throw new Error("No output context");
     const dataInt16 = new Int16Array(data.buffer);
     const buffer = this.outputContext.createBuffer(1, dataInt16.length, sampleRate);
     const channelData = buffer.getChannelData(0);
     for (let i = 0; i < dataInt16.length; i++) {
         channelData[i] = dataInt16[i] / 32768.0;
     }
     return buffer;
  }

  private playAudioBuffer(buffer: AudioBuffer) {
      if (!this.outputContext) return;
      const source = this.outputContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputContext.destination);
      const currentTime = this.outputContext.currentTime;
      if (this.nextStartTime < currentTime) {
          this.nextStartTime = currentTime;
      }
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      this.sources.add(source);
      source.onended = () => { this.sources.delete(source); };
  }

  private stopAudioPlayback() {
      this.sources.forEach(s => { try { s.stop(); } catch(e) {} });
      this.sources.clear();
      this.nextStartTime = 0;
  }

  public disconnect(): Message[] {
      const finalHistory = [...this.accumulatedTranscripts];
      if (this.currentInputTranscript.trim()) {
          finalHistory.push({id: "final_user", role: 'user', text: this.currentInputTranscript.trim()});
      }
      if (this.currentOutputTranscript.trim()) {
           finalHistory.push({id: "final_model", role: 'model', text: this.currentOutputTranscript.trim()});
      }
      this.stopAudioPlayback();
      if (this.inputSource) this.inputSource.disconnect();
      if (this.processor) this.processor.disconnect();
      if (this.currentStream) this.currentStream.getTracks().forEach(t => t.stop());
      if (this.inputContext) this.inputContext.close();
      if (this.outputContext) this.outputContext.close();
      return finalHistory;
  }
}

// --- Standard Chat Functions ---

export const startChatSession = (
    topic: string, 
    persona: Persona = 'child', 
    language: Language = 'en', 
    customPersonaInstruction?: string,
    history?: Message[]
) => {
  let personaInstruction = PERSONAS[persona as keyof typeof PERSONAS] || PERSONAS.child;
  if (persona === 'custom' && customPersonaInstruction) {
    personaInstruction = `You are a custom character defined as: "${customPersonaInstruction}". Stay in character at all times.`;
  }
  const langName = LANGUAGE_INSTRUCTIONS[language] || "English";
  const formattedHistory = history ? history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
  })) : undefined;

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `${BASE_INSTRUCTION}\n\nPersona:\n${personaInstruction}\n\nIMPORTANT: You must converse exclusively in ${langName}.`,
    },
    history: formattedHistory
  });
  
  if (!formattedHistory || formattedHistory.length === 0) {
    return retryOperation(() => chatSession!.sendMessage({ 
        message: `I want to teach you about "${topic}". Please start by expressing your confusion or asking a basic question about what "${topic}" even is. Reply in ${langName}.` 
    }));
  } else {
      return Promise.resolve({ text: "" } as any);
  }
};

export const injectPersonaUpdate = async (newPersona: Persona) => {
    if (!chatSession) return;
    const personaInstruction = PERSONAS[newPersona as keyof typeof PERSONAS] || "You are a curious student.";
    await retryOperation(() => chatSession!.sendMessage({
        message: `[SYSTEM INSTRUCTION UPDATE]: The user has improved their explanation. EVOLVE your persona now. 
        New Persona: ${newPersona}. 
        Instructions: ${personaInstruction}`
    }));
};

export const sendMessageStream = async (text: string, imageBase64: string | null, onChunk: (text: string) => void) => {
  if (!chatSession) throw new Error("Chat session not initialized");
  let messagePayload: any = text;
  if (imageBase64) {
    messagePayload = { parts: [
        { text: text },
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
    ]};
  }
  const result = await retryOperation(() => chatSession!.sendMessageStream({ message: messagePayload })) as AsyncIterable<GenerateContentResponse>;
  let fullText = "";
  for await (const chunk of result) {
    if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
    }
  }
  return fullText;
};

export const analyzeContextForSidebar = async (history: Message[], currentTopic: string, language: Language): Promise<SidebarData> => {
  const conversationText = history.map(m => `${m.role}: ${m.text}`).join('\n');
  const langName = LANGUAGE_INSTRUCTIONS[language];

  const prompt = `
    Analyze the conversation about "${currentTopic}".
    
    1. Summarize established knowledge (max 2 sentences).
    2. List 5 key terms.
    3. List 3 related concepts.
    4. Estimate "Mastery Score" (0-100).
    5. Generate a mermaid.js flowchart code representing the logic explained so far. 
       - Start with 'graph TD'.
       - Use ONLY rectangular nodes: id[Label].
       - STRICTLY WRITE EACH RELATIONSHIP ON A NEW LINE.
       - DO NOT use link suffixes like '--X', '--o', '--1', or '--|'. Use ONLY '-->' for arrows.
       - DO NOT use parentheses () or brackets [] inside node labels.
       - Ensure simple, valid syntax.
    
    IMPORTANT: Provide the summary, keyTerms, and relatedConcepts in ${langName}.
    Conversation:
    ${conversationText}
  `;

  try {
    const response = await retryOperation(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            masteryScore: { type: Type.NUMBER },
            mermaidCode: { type: Type.STRING }
          },
        },
      },
    })) as GenerateContentResponse;

    const text = response.text;
    if (!text) return { summary: "Analyzing...", keyTerms: [], relatedConcepts: [], masteryScore: 0 };
    
    try {
        const parsed = JSON.parse(text);
        let mermaidCode = parsed.mermaidCode || "";
        if (mermaidCode) {
            mermaidCode = mermaidCode.replace(/```mermaid\n?|```/g, "").trim();
            if (!mermaidCode.includes('graph TD') && !mermaidCode.includes('graph TB')) {
                 mermaidCode = 'graph TD\n' + mermaidCode;
            }
            mermaidCode = mermaidCode.replace(/^graph\s+(TD|TB|LR)[^\n]*(\n|$)/, 'graph TD\n');
            mermaidCode = mermaidCode.replace(/[\(\)]/g, ' ');
            
            // Refined sanitization: Ensure only valid link arrows and strip hallucinated suffixes
            const lines = mermaidCode.split('\n');
            const cleanLines = lines.map(line => {
                let trimmed = line.trim();
                if (!trimmed) return null;
                
                // Convert common invalid arrow forms to standard mermaid arrows
                trimmed = trimmed.replace(/--[XxOo|1-9]/g, '-->');
                trimmed = trimmed.replace(/->/g, '-->');
                
                // Strip lines that look like numbers or list items hallucinated at the end of the diagram
                if (trimmed.match(/^\d+\.?\s*$/)) return null;

                // Strip trailing node IDs
                const matchRepeat = trimmed.match(/^([A-Za-z0-9_]+\[.*?\])\s+\1$/);
                if (matchRepeat) return matchRepeat[1];

                // Remove trailing syntax errors
                trimmed = trimmed.replace(/[-+]+$/, '');
                return trimmed;
            }).filter(Boolean);
            
            mermaidCode = cleanLines.join('\n');
        }

        return {
            summary: parsed.summary || "Analyzing...",
            keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
            relatedConcepts: Array.isArray(parsed.relatedConcepts) ? parsed.relatedConcepts : [],
            masteryScore: typeof parsed.masteryScore === 'number' ? parsed.masteryScore : 0,
            mermaidCode: mermaidCode
        };
    } catch (parseError) {
        return { summary: "Update pending...", keyTerms: [], relatedConcepts: [], masteryScore: 0 };
    }
  } catch (error) {
    return { summary: "Update pending...", keyTerms: [], relatedConcepts: [], masteryScore: 0 };
  }
};

export const generateVisualization = async (topic: string, summary: string, persona: Persona): Promise<string | null> => {
  const stylePrompt = persona === 'child' ? "child's crayon drawing" : persona === 'student' ? "hand-drawn notebook sketch" : "whiteboard diagram";
  const prompt = `Representation of "${topic}" understanding: "${summary}". Style: ${stylePrompt}.`;
  try {
    const response = await retryOperation(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] }
    })) as GenerateContentResponse;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const generateFinalFeedback = async (history: Message[], topic: string, language: Language): Promise<FeedbackReport> => {
   const conversationText = history.map(m => `${m.role}: ${m.text}`).join('\n');
   const langName = LANGUAGE_INSTRUCTIONS[language];
   const prompt = `Evaluate user's teaching of "${topic}" in ${langName}. Return VALID JSON: {score: 1-5, strengths: [], improvements: [{text: "", url: "", sourceTitle: ""}], summary: ""}. Use googleSearch tool for real educational links. Transcript: ${conversationText}`;
   try {
     const response = await retryOperation(() => ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: prompt,
       config: { tools: [{ googleSearch: {} }] }
     })) as GenerateContentResponse;
     let text = response.text || "{}";
     text = text.replace(/```json\n?|```/g, "").trim();
     const data = JSON.parse(text);
     return {
        score: data.score || 3,
        strengths: Array.isArray(data.strengths) ? data.strengths : ["Engagement"],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        summary: data.summary || "Good session."
     };
   } catch (e) {
     return { score: 0, strengths: ["Effort"], improvements: [], summary: "Error generating report." };
   }
};

export const generateStudyGuide = async (history: Message[], topic: string, language: Language): Promise<string> => {
    const conversationText = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const langName = LANGUAGE_INSTRUCTIONS[language];
    const prompt = `Generate Markdown study guide for "${topic}" in ${langName} based on transcript: ${conversationText}`;
    const response = await retryOperation(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    })) as GenerateContentResponse;
    return response.text || "# Failed to generate";
};

export const generateFlashcards = async (history: Message[], topic: string, language: Language): Promise<Flashcard[]> => {
    const conversationText = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const langName = LANGUAGE_INSTRUCTIONS[language];
    const prompt = `Generate 8 JSON flashcards for "${topic}" in ${langName}: [{front, back, type, hint}]. Transcript: ${conversationText}`;
    try {
        const response = await retryOperation(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            front: { type: Type.STRING },
                            back: { type: Type.STRING },
                            type: { type: Type.STRING },
                            hint: { type: Type.STRING }
                        }
                    }
                }
            }
        })) as GenerateContentResponse;
        return JSON.parse(response.text || "[]") as Flashcard[];
    } catch (e) {
        return [];
    }
};