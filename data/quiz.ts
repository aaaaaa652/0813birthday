// 旧题目数据，仅用于迁移备份，前台不得再读取
// 所有题目数据已迁移到 data/questions.json
// 确认无引用后可删除此文件
export interface QuizQuestion {
  id: number;
  question: string;
  answers: string[];
  hint: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "宋老师的代表作是什么？",
    answers: ["苗岭飞歌", "《苗岭飞歌》"],
    hint: "4个字"
  },
  {
    id: 2,
    question: "宋老师来自哪个民族？",
    answers: ["苗族"],
    hint: "2个字"
  },
  {
    id: 3,
    question: "宋老师的音乐风格是什么？",
    answers: ["原生态", "民族", "原生态民歌"],
    hint: "2-4个字"
  },
  {
    id: 4,
    question: "宋老师的歌声像什么？",
    answers: ["天籁", "天籁之音", "百灵鸟"],
    hint: "2-4个字"
  },
  {
    id: 5,
    question: "宋老师出生在哪里？",
    answers: ["贵州", "贵州黔东南", "黔东南"],
    hint: "2-4个字"
  },
  {
    id: 6,
    question: "宋老师擅长演唱哪种类型的歌曲？",
    answers: ["民歌", "民族歌曲", "原生态民歌"],
    hint: "2-4个字"
  },
  {
    id: 7,
    question: "宋老师的歌声带给人的感受是什么？",
    answers: ["纯净", "空灵", "清澈", "自然"],
    hint: "2个字"
  },
  {
    id: 8,
    question: "宋老师参加过哪个著名的音乐节目？",
    answers: ["星光大道", "《星光大道》"],
    hint: "4个字"
  }
];
