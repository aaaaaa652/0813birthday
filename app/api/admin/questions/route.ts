import { NextResponse } from 'next/server';
import { readQuestions, writeQuestions } from '@/data/store';
import type { Question } from '@/data/types';

function validateSession(request: Request): boolean {
  const sessionId = request.headers.get('x-session-id');
  return !!sessionId && sessionId.length > 0;
}

export async function GET(request: Request) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  const questions = readQuestions().filter(q => !q.isDeleted);
  questions.sort((a, b) => a.sortOrder - b.sortOrder || b.id - a.id);
  
  return NextResponse.json(questions);
}

export async function POST(request: Request) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const { question, correctAnswer, otherAnswers, hint, sortOrder, status } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: '题目内容不能为空' }, { status: 400 });
    }

    if (!correctAnswer?.trim()) {
      return NextResponse.json({ error: '标准答案不能为空' }, { status: 400 });
    }

    const questions = readQuestions();
    const maxId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) : 0;
    const now = new Date().toISOString();

    const newQuestion: Question = {
      id: maxId + 1,
      question: question.trim(),
      correctAnswer: correctAnswer.trim(),
      otherAnswers: otherAnswers?.filter((a: string) => a.trim()) || [],
      hint: hint?.trim() || '',
      status: status === 'enabled' ? 'enabled' : 'disabled',
      sortOrder: sortOrder || 0,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    questions.push(newQuestion);
    writeQuestions(questions);

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}