import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projects = [
  { key: "feedback-hub", name: "피드백 허브", domain: "feedback.pnuops.com", description: "이 피드백 사이트", sortOrder: 0 },
  { key: "opus", name: "SW프로젝트관리시스템", domain: "opus.pusan.ac.kr", description: "opus", sortOrder: 10 },
  { key: "pickle", name: "부산대학교 클라우드 플랫폼", domain: "pickle.pusan.ac.kr", description: "pickle", sortOrder: 20 },
];

const labels = [
  { name: "버그", color: "#d73a4a", description: "동작이 잘못됨" },
  { name: "기능 추가", color: "#0e8a16", description: "새 기능 요청" },
  { name: "개선", color: "#1d76db", description: "기존 기능 개선" },
  { name: "문의", color: "#8250df", description: "질문" },
  { name: "문서", color: "#6a737d", description: "문서 관련" },
  { name: "긴급", color: "#e99695", description: "우선 처리 필요" },
];

async function main() {
  for (const p of projects) {
    await prisma.project.upsert({
      where: { key: p.key },
      update: { name: p.name, domain: p.domain, sortOrder: p.sortOrder },
      create: p,
    });
  }
  for (const l of labels) {
    await prisma.label.upsert({
      where: { name: l.name },
      update: { color: l.color, description: l.description },
      create: l,
    });
  }
  console.log(`seeded ${projects.length} projects, ${labels.length} labels`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
