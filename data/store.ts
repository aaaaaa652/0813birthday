import fs from 'fs';
import path from 'path';
import type { Card, Question, Announcement } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function atomicWriteFile(filePath: string, content: string): void {
  const tempFilePath = `${filePath}.tmp`;
  fs.writeFileSync(tempFilePath, content);
  fs.renameSync(tempFilePath, filePath);
}

export function readCards(): Card[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'cards.json');
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function writeCards(cards: Card[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'cards.json');
  atomicWriteFile(filePath, JSON.stringify(cards, null, 2));
}

export function readQuestions(): Question[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'questions.json');
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function writeQuestions(questions: Question[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'questions.json');
  atomicWriteFile(filePath, JSON.stringify(questions, null, 2));
}

export function readAnnouncements(): Announcement[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'announcements.json');
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function writeAnnouncements(announcements: Announcement[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'announcements.json');
  atomicWriteFile(filePath, JSON.stringify(announcements, null, 2));
}