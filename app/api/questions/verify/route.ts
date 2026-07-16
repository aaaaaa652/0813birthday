import { NextResponse } from 'next/server';
import { readQuestions } from '@/data/store';

export async function POST(request: Request) {
  try {
    const { questionId, answer } = await request.json();

    if (!questionId || !answer?.trim()) {
      return NextResponse.json({ correct: false, error: '参数错误' }, { status: 400 });
    }

    const questions = readQuestions();
    const question = questions.find(q => q.id === questionId && q.status === 'enabled' && !q.isDeleted);

    if (!question) {
      return NextResponse.json({ correct: false, error: '题目不存在或已停用' }, { status: 404 });
    }

    const cleanedAnswer = answer
      .trim()
      .toLowerCase()
      .replace(/《|》/g, '')
      .replace(/\s+/g, '');

    const allAnswers = [question.correctAnswer, ...question.otherAnswers];
    
    const isCorrect = allAnswers.some(
      correctAnswer => 
        correctAnswer.toLowerCase().replace(/《|》/g, '').replace(/\s+/g, '') === cleanedAnswer
    );

    return NextResponse.json({ correct: isCorrect });
  } catch (error) {
    console.error('Error validating answer:', error);
    return NextResponse.json({ correct: false, error: '验证失败' }, { status: 500 });
  }
}