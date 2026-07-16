import { NextResponse } from 'next/server';
import { readQuestions } from '@/data/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeId = searchParams.get('excludeId');
  
  let questions = readQuestions().filter(q => q.status === 'enabled' && !q.isDeleted);
  
  if (excludeId) {
    questions = questions.filter(q => q.id !== parseInt(excludeId));
  }
  
  if (questions.length === 0) {
    return NextResponse.json({ success: false, error: '没有可用的题目' });
  }

  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];

  return NextResponse.json({ 
    success: true, 
    question: {
      id: question.id,
      question: question.question,
      hint: question.hint,
    }
  });
}