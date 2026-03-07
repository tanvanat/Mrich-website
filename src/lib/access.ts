export type ExamRole = "ADMIN" | "LEADER" | "LEARNER";

export type AccessInfo = {
  role: ExamRole;
  canAccessAdmin: boolean;
  canAccessLeaderExam: boolean;
  canAccessLearnerExam: boolean;
};

function parseNames(raw?: string) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const ADMIN_NAMES = parseNames(process.env.ADMIN_NAMES);
const LEADER_NAMES = parseNames(process.env.LEADER_NAMES);
const LEARNER_NAMES = parseNames(process.env.LEARNER_NAMES);

export function getAccessInfo(nick?: string | null): AccessInfo {
  const n = (nick ?? "").trim().toLowerCase();

  if (!n) {
    throw new Error("Missing nickname");
  }

  if (ADMIN_NAMES.includes(n)) {
    return {
      role: "ADMIN",
      canAccessAdmin: true,
      canAccessLeaderExam: true,
      canAccessLearnerExam: true,
    };
  }

  if (LEADER_NAMES.includes(n)) {
    return {
      role: "LEADER",
      canAccessAdmin: false,
      canAccessLeaderExam: true,
      canAccessLearnerExam: true,
    };
  }

  if (LEARNER_NAMES.includes(n)) {
    return {
      role: "LEARNER",
      canAccessAdmin: false,
      canAccessLeaderExam: false,
      canAccessLearnerExam: true,
    };
  }

  throw new Error(`Nickname "${nick}" is not configured in access lists`);
}