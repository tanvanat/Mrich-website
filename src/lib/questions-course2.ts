export const FORM_ID = "mrich-amway-proactive-v1";

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
    id: "p1",
    category: "ข้อสอบคนลีด Proactive",
    q: "1. ถ้าไม่มีนิสัย Proactive ทำไมถือว่ายังเป็นเด็ก",
    minChars: 40,
  },
  {
    id: "p2",
    category: "ข้อสอบคนลีด Proactive",
    q: '2. คน Proactive จะกล้าริเริ่มและตอบสนองเป็น "กล้าริเริ่ม" คือต้องกล้าริเริ่มอะไร? (บอกมา 3 อย่าง)',
    minItems: 3,
    minChars: 60,
  },
  {
    id: "p3",
    category: "ข้อสอบคนลีด Proactive",
    q: "3. ตอบสนองต่อสิ่งเร้า สิ่งกระตุ้นอย่างไรถึงจะเรียกว่าตอบสนองเป็นแบบคน Proactive",
    minChars: 40,
  },
  {
    id: "p4",
    category: "ข้อสอบคนลีด Proactive",
    q: "4. คนมีนิสัย Proactive เวลาเจอเรื่องไม่ดี เรื่องทุกข์ใจ เขาจะเลือกตอบสนองยังไง",
    minChars: 40,
  },
  {
    id: "p5",
    category: "ข้อสอบคนลีด Proactive",
    q: "5. คนมีนิสัย Proactive เวลาเจอเรื่องดีๆ โอกาสดีๆ เขาจะเลือกตอบสนองยังไง",
    minChars: 40,
  },
  {
    id: "p6",
    category: "ข้อสอบคนลีด Proactive",
    q: "6. ตอบสนองเป็นกับแก้ปัญหาได้ ต่างกันอย่างไร",
    minChars: 40,
  },
  {
    id: "p7",
    category: "ข้อสอบคนลีด Proactive",
    q: "7. ทำไมเราจึงควรมีเป้าหมายเพิ่มคุณค่าในตัวเองให้มากที่สุดเท่าที่ทำได้",
    minChars: 40,
  },
  {
    id: "p8",
    category: "ข้อสอบคนลีด Proactive",
    q: "8. คุณค่าในตัวเราจะเพิ่มขึ้นได้จากการทำอะไร?",
    minChars: 40,
  },
  {
    id: "p9",
    category: "ข้อสอบคนลีด Proactive",
    q: "9. นิสัยอะไรบ้าง ที่ส่งเสริมการสร้างนิสัย Proactive (บอกมา 3 อย่าง)",
    minItems: 3,
    minChars: 50,
  },
  {
    id: "p10",
    category: "ข้อสอบคนลีด Proactive",
    q: "10. การมองตัวเองผิดจากความเป็นจริง ส่งผลเสียต่อชีวิตอย่างไร",
    minChars: 40,
  },
  {
    id: "p11",
    category: "ข้อสอบคนลีด Proactive",
    q: "11. เราต้องมีอะไร? เราถึงจะมีโอกาสเห็นตัวเองตรงกับความเป็นจริงที่เราเป็น",
    minChars: 40,
  },
  {
    id: "p12",
    category: "ข้อสอบคนลีด Proactive",
    q: "12. อุปนิสัยพื้นฐาน 3อย่างที่สังคมปลูกฝังให้เราเป็นตั้งแต่วัยเยาว์ มีอะไรบ้าง",
    minItems: 3,
    minChars: 40,
  },
  {
    id: "p13",
    category: "ข้อสอบคนลีด Proactive",
    q: "13. คน Proactive กับ Reactive ต่างกันตรงไหนบ้าง (บอกมา 3อย่าง)",
    minItems: 3,
    minChars: 60,
  },
  {
    id: "p14",
    category: "ข้อสอบคนลีด Proactive",
    q: "14. ผลลัพธ์จากการมีนิสัย Reactive ที่สร้างความเดือดร้อนต่อชีวิตเรามากที่สุดคืออะไร",
    minChars: 40,
  },
  {
    id: "p15",
    category: "ข้อสอบคนลีด Proactive",
    q: "15. ปัญหามีกี่ประเภท",
    minItems: 2,
    minChars: 20,
  },
  {
    id: "p16",
    category: "ข้อสอบคนลีด Proactive",
    q: "16. สาเหตุที่คนส่วนใหญ่แก้ปัญหาไม่ค่อยได้ หรือแม้แก้ได้ก็แก้ไม่จบ เป็นเพราะอะไร",
    minChars: 40,
  },
  {
    id: "p17",
    category: "ข้อสอบคนลีด Proactive",
    q: "17. เวลาเจอปัญหาแล้ว EQ หลุดบ่อยๆ เป็นเพราะอะไร",
    minChars: 40,
  },
  {
    id: "p18",
    category: "ข้อสอบคนลีด Proactive",
    q: "18. การคิดถึงผลที่ตามมาและความผิดพลาด เกี่ยวข้องกับการสร้างนิสัย Proactive ยังไง?",
    minChars: 40,
  },
  {
    id: "p19",
    category: "ข้อสอบคนลีด Proactive",
    q: "19. ความรู้ ความเข้าใจอะไรที่เราต้องใช้มันซ้ำๆให้เป็น Routine ถึงจะได้นิสัย Proactive มา (บอกมา 3อย่าง)",
    minItems: 3,
    minChars: 60,
  },
  {
    id: "p20",
    category: "ข้อสอบคนลีด Proactive",
    q: "20. ทักษะและความสามารถอะไร ที่เราต้องใช้มันซ้ำๆให้เป็น Routine ถึงจะได้นิสัย Proactive มา (บอกมา 3อย่าง)",
    minItems: 3,
    minChars: 60,
  },
  {
    id: "p21",
    category: "ข้อสอบคนลีด Proactive",
    q: "21. เป้าหมายหรือแรงปรารถนาอะไร ที่เราต้องคิดถึงมันซ้ำๆให้เป็น Routine ถึงจะได้นิสัย Proactive มา (บอกมา 3อย่าง)",
    minItems: 3,
    minChars: 60,
  },
  {
    id: "p22",
    category: "ข้อสอบคนลีด Proactive",
    q: "22. จากความรู้เรื่อง 3ฐาน+3วงกลม สิ่งสำคัญที่สุด ที่มีผลต่อการสร้างนิสัย Proactive ให้ตัวเองคืออะไร",
    minChars: 40,
  },
];

export const maxTotal = questions.length;

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
  return { level: "REPEAT", tip: "ทำได้น้อยกว่า 79% ❌ เรียนซ้ำ" };
}

export const EXAM_MINUTES = 30;