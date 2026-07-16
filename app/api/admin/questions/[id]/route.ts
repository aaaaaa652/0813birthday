import { NextResponse } from 'next/server';
import { readQuestions, writeQuestions } from '@/data/store';

function validateSession(request: Request): boolean {
  const sessionId = request.headers.get('x-session-id');
  return !!sessionId && sessionId.length > 0;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const questionId = parseInt(id);
    
    if (isNaN(questionId)) {
      return NextResponse.json({ error: '无效的题目ID' }, { status: 400 });
    }

    const questions = readQuestions();
    const questionIndex = questions.findIndex(q => q.id === questionId && !q.isDeleted);
    
    if (questionIndex === -1) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    const { question, correctAnswer, otherAnswers, hint, sortOrder, status } = await request.json();
    const now = new Date().toISOString();

    if (status !== undefined && status === 'disabled') {
      const enabledCount = questions.filter(q => q.status === 'enabled' && !q.isDeleted && q.id !== questionId).length;
      if (enabledCount === 0) {
        return NextResponse.json({ 
          error: '至少需要保留一道启用题目，否则用户将无法进入留言页面。' 
        }, { status: 400 });
      }
    }

    const targetQuestion = questions[questionIndex];

    if (question !== undefined) {
      if (!question.trim()) {
        return NextResponse.json({ error: '题目内容不能为空' }, { status: 400 });
      }
      targetQuestion.question = question.trim();
    }

    if (correctAnswer !== undefined) {
      if (!correctAnswer.trim()) {
        return NextResponse.json({ error: '标准答案不能为空' }, { status: 400 });
      }
      targetQuestion.correctAnswer = correctAnswer.trim();
    }

    if (otherAnswers !== undefined) {
      targetQuestion.otherAnswers = otherAnswers?.filter((a: string) => a.trim()) || [];
    }

    if (hint !== undefined) {
      targetQuestion.hint = hint?.trim() || '';
    }

    if (sortOrder !== undefined) {
      targetQuestion.sortOrder = sortOrder || 0;
    }

    if (status !== undefined) {
      targetQuestion.status = status === 'enabled' ? 'enabled' : 'disabled';
    }

    targetQuestion.updatedAt = now;
    writeQuestions(questions);

    return NextResponse.json({ success: true, question: targetQuestion });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const questionId = parseInt(id);
    
    if (isNaN(questionId)) {
      return NextResponse.json({ error: '无效的题目ID' }, { status: 400 });
    }

    const questions = readQuestions();
    const questionIndex = questions.findIndex(q => q.id === questionId && !q.isDeleted);
    
    if (questionIndex === -1) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    const targetQuestion = questions[questionIndex];
    
    if (targetQuestion.status === 'enabled') {
      const enabledCount = questions.filter(q => q.status === 'enabled' && !q.isDeleted && q.id !== questionId).length;
      if (enabledCount === 0) {
        return NextResponse.json({ 
          error: '至少需要保留一道启用题目，否则用户将无法进入留言页面。' 
        }, { status: 400 });
      }
    }

    questions[questionIndex].isDeleted = true;
    questions[questionIndex].updatedAt = new Date().toISOString();
    writeQuestions(questions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}