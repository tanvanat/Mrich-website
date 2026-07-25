// ข้อสอบ Habit 1+2 : Begin with the End in Mind สำหรับ ทุกrole
export const FORM_ID = "mrich-course3";

export type Question = {
  id: string;
  category: string;
  q: string;
  minChars?: number;
  minItems?: number;
  hint?: string;
};

export const questions: Question[] = [
  {
    id: "h2-1",
    category: "habit_one_two",
    q: '1. ทำไมเราจึงควร "ชนะใจตัวเอง" ให้ได้ (บอกเหตุผลมา 3 ข้อ)',
    minItems: 3,
    minChars: 60,
  },
  {
    id: "h2-2",
    category: "habit_one_two",
    q: "2. ดัชนีที่ใช้วัดว่าเราชนะใจตัวเองได้แล้วคืออะไร? (ตามหนังสือ)",
    minChars: 40,
  },
  {
    id: "h2-3",
    category: "habit_one_two",
    q: "3. ถ้าไม่มีนิสัย Proactive ทำไมถือว่ายังเป็นเด็ก?",
    minChars: 40,
  },
  {
    id: "h2-4",
    category: "habit_one_two",
    q: '4. คนที่มีนิสัย Proactive มี "คุณสมบัติ" อย่างไร? (ไม่ใช่นิยาม)',
    minChars: 50,
  },
  {
    id: "h2-5",
    category: "habit_one_two",
    q: "5. เป้าหมายหลักของการตอบสนองต่อสิ่งเร้า สิ่งกระตุ้น ของคนที่มีนิสัย Proactive คืออะไร?",
    minChars: 40,
  },
  {
    id: "h2-6",
    category: "habit_one_two",
    q: "6. ตอบสนองเป็นกับแก้ปัญหาได้ ต่างกันอย่างไร?",
    minChars: 40,
  },
  {
    id: "h2-7",
    category: "habit_one_two",
    q: "7. การมองตัวเองผิดจากความเป็นจริง ส่งผลเสียต่อชีวิตอย่างไร? (บอกมา 3 ข้อ)",
    minItems: 3,
    minChars: 60,
  },
  {
    id: "h2-8",
    category: "habit_one_two",
    q: "8. เราจะมีโอกาสเห็นตัวเองตรงกับความเป็นจริงที่เราเป็นได้อย่างไร?",
    minChars: 40,
  },
  {
    id: "h2-9",
    category: "habit_one_two",
    q: "9. อุปนิสัยพื้นฐาน 3 อย่างที่สังคมปลูกฝังให้เราเป็นตั้งแต่วัยเยาว์ มีอะไรบ้าง?",
    minItems: 3,
    minChars: 40,
  },
  {
    id: "h2-10",
    category: "habit_one_two",
    q: "10. ผลเสียจากการมีนิสัย Reactive ที่สร้างความเดือดร้อนต่อชีวิตเรามากที่สุดคืออะไร?",
    minChars: 40,
  },
  {
    id: "h2-11",
    category: "habit_one_two",
    q: "11. ปัญหามีกี่ประเภท? อะไรบ้าง?",
    minItems: 2,
    minChars: 30,
  },
  {
    id: "h2-12",
    category: "habit_one_two",
    q: "12. สาเหตุที่คนส่วนใหญ่แก้ปัญหาไม่ค่อยได้ หรือแม้แก้ได้ก็หายแค่ชั่วคราว สักพักปัญหาเดิมมันก็วนซ้ำมาอีก เป็นเพราะอะไร?",
    minChars: 50,
  },
  {
    id: "h2-13",
    category: "habit_one_two",
    q: "13. เวลาเจอปัญหาแล้ว EQ เราหลุดบ่อยๆ สาเหตุส่วนใหญ่เกิดจากอะไร?",
    minChars: 40,
  },
  {
    id: "h2-14",
    category: "habit_one_two",
    q: "14. การคิดถึงผลที่ตามมาและความผิดพลาด เกี่ยวข้องกับการสร้างนิสัย Proactive ยังไง?",
    minChars: 40,
  },
  {
    id: "h2-15",
    category: "habit_one_two",
    q: "15. ความรู้ ความเข้าใจอะไรที่เราต้องใช้มันซ้ำๆ ให้เป็น Routine ถึงจะได้นิสัย Proactive มา (บอกมา 2 อย่าง)",
    minItems: 2,
    minChars: 50,
  },
  {
    id: "h2-16",
    category: "habit_one_two",
    q: "16. ทักษะและความสามารถอะไร ที่เราต้องฝึกฝนมันซ้ำๆ ให้เป็น Routine ถึงจะได้นิสัย Proactive มา (บอกมา 2 อย่าง)",
    minItems: 2,
    minChars: 50,
  },
  {
    id: "h2-17",
    category: "habit_one_two",
    q: "17. เป้าหมายหรือแรงปรารถนาอะไร ที่เราต้องคิดถึงมันซ้ำๆ ให้เป็น Routine ถึงจะได้นิสัย Proactive มา (บอกมา 2 อย่าง)",
    minItems: 2,
    minChars: 50,
  },
  {
    id: "h2-18",
    category: "habit_one_two",
    q: "18. ทำไมชีวิตเราจึงควรมีเป้าหมายในการดำรงชีวิต (บอกมา 3 ข้อ)",
    minItems: 3,
    minChars: 60,
  },
  {
    id: "h2-19",
    category: "habit_one_two",
    q: "19. คำตอบจาก 3 คำถามที่เราควรได้จากการจินตนาการไปงานศพตัวเอง เพื่อเอามาตั้งเป็นเป้าหมายในการดำรงชีวิตคืออะไร?",
    minItems: 3,
    minChars: 60,
  },
  {
    id: "h2-20",
    category: "habit_one_two",
    q: '20. "ความต้องการสุดท้ายในใจ" ที่คนทุกคนจะเห็นเมื่อจินตนาการถึงชีวิตใกล้ตายจริงๆ คืออะไร?',
    minChars: 40,
  },
  {
    id: "h2-21",
    category: "habit_one_two",
    q: "21. ทุกความสำเร็จเกิดจากการสร้างให้สำเร็จ 2 ครั้ง ตัวแปรสำคัญที่ทำให้เราสร้างความสำเร็จครั้งที่ 1 ได้ คืออะไร?",
    minChars: 40,
  },
  {
    id: "h2-22",
    category: "habit_one_two",
    q: "22. สมการที่ใช้สร้างความสำเร็จครั้งที่ 2 ได้ คืออะไร?",
    minChars: 40,
  },
  {
    id: "h2-23",
    category: "habit_one_two",
    q: "23. รู้วิธีตั้งเป้าหมายแล้ว แต่ก็ไม่เขียนเป้าหมายขึ้นมาซะที ต้องไปแก้ที่ตรงไหน?",
    minChars: 40,
  },
  {
    id: "h2-24",
    category: "habit_one_two",
    q: '24. คนส่วนใหญ่ติดอะไร ถึงไม่เขียนแผนงาน "สร้างชีวิตที่ดี" ให้ตัวเอง?',
    minChars: 40,
  },
  {
    id: "h2-25",
    category: "habit_one_two",
    q: "25. ถ้าเขียนเป้าหมายชีวิตออกมาไม่ได้ ชีวิตเสียหายอะไรบ้าง? (บอกมา 3 ข้อ)",
    minItems: 3,
    minChars: 60,
  },
  {
    id: "h2-26",
    category: "habit_one_two",
    q: "26. ตามลิงก์คุณพศิน ชีวิตเรามี 2 เป้าหมายที่ต้องทำคู่กันไปคืออะไร?",
    minItems: 2,
    minChars: 40,
  },
  {
    id: "h2-27",
    category: "habit_one_two",
    q: "27. จากความรู้เรื่อง 3 ฐาน + 3 วงกลม สิ่งที่มีผลต่อการสร้างนิสัยมากที่สุดคืออะไร?",
    minChars: 40,
  },
  {
    id: "h2-28",
    category: "habit_one_two",
    q: '28. มนุษย์ทุกคน "มีศักยภาพ" หมายความว่าอย่างไร?',
    minChars: 40,
  },
];

export const maxTotal = questions.length;

export const MAX_SCORES = [
  6, 2, 2, 2, 2, 2,
  6, 2, 2, 2,
  6, 2, 2, 2,
  2, 2, 2,
  6, 6, 6, 6, 6,
  2, 2, 6, 6, 6, 2,
] as const;
 
export const TOTAL_MAX = MAX_SCORES.reduce((sum, v) => sum + v, 0);

function normalize(s: string) {
  return (s ?? "").replace(/\r/g, "").trim();
}

export function countItems(answer: string) {
  const s = normalize(answer);
  if (!s) return 0;

  const lines = s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const byLines = lines.length;

  const bySep = s
    .split(/[,;•]/)
    .map((x) => x.trim())
    .filter(Boolean).length;

  const byNumbered = (s.match(/(^|\s)\d+[\)\.]/g) ?? []).length;

  return Math.max(byLines, bySep, byNumbered);
}

export function scoreAnswer(q: Question, answer: string) {
  const s = normalize(answer);
  if (!s) return 0;
  if (q.minChars && s.length < q.minChars) return 0;
  if (q.minItems && countItems(s) < q.minItems) return 0;
  return 1;
}

export function levelFromPercent(pct: number) {
  if (pct === 100) return { level: "LEAD", tip: "ทำได้เต็ม 100% ✅ ได้ลีด" };
  if (pct >= 80) return { level: "PASS", tip: "ทำได้เกิน 80% ✅ ได้เรียนต่อ" };
  return { level: "REPEAT", tip: "ทำได้น้อยกว่า 80% ❌ เรียนซ้ำ" };
}

export const EXAM_MINUTES = 40;