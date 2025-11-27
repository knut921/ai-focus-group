export interface Participant {
  id: string;
  name: string;
  role: string;
  tags: string[];
  system_prompt: string;
}

export interface SubTopic {
  id: string;
  content: string;
}

export interface Message {
  id: string;
  participantId: string;
  participantCode: string;
  content: string;
  timestamp: Date;
  round: number;
}

export interface FocusGroupState {
  participants: Participant[];
  topic: string;
  rounds: number;
  subTopics: SubTopic[];
  messages: Message[];
  currentRound: number;
  isRunning: boolean;
  isComplete: boolean;
}

