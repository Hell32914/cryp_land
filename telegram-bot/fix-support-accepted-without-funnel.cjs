require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function hasFlag(name) {
  return process.argv.includes(name);
}

async function main() {
  const apply = hasFlag('--apply');

  console.log('🔧 Fix support chats: ACCEPTED but missing funnelStageId');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'} (use --apply to write changes)`);

  const acceptedLike = await prisma.supportChat.findMany({
    where: {
      // Match what CRM treats as "Accepted" (status variants or accepted metadata).
      AND: [
        { NOT: { status: 'ARCHIVE' } },
        {
          OR: [
            { status: { in: ['ACCEPTED', 'TAKEN', 'IN_PROGRESS', 'ASSIGNED'] } },
            { acceptedBy: { not: null } },
            { acceptedAt: { not: null } },
          ],
        },
      ],
    },
    select: {
      id: true,
      chatId: true,
      telegramId: true,
      username: true,
      acceptedBy: true,
      acceptedAt: true,
      funnelStageId: true,
      lastMessageAt: true,
      lastMessageText: true,
    },
    orderBy: [{ lastMessageAt: 'desc' }],
  });

  const broken = acceptedLike.filter((c) => {
    const s = typeof c.funnelStageId === 'string' ? c.funnelStageId.trim() : ''
    return !s
  })

  console.log(`Found ${broken.length} broken chats.`);

  if (!broken.length) return;

  console.log('\nSample (up to 10):');
  for (const c of broken.slice(0, 10)) {
    const who = c.username ? `@${c.username}` : c.telegramId;
    console.log(
      `- chatId=${c.chatId} user=${who} acceptedBy=${c.acceptedBy || '—'} funnelStageId=${c.funnelStageId}`
    );
  }

  if (!apply) {
    console.log('\nDry run complete. Re-run with --apply to fix.');
    return;
  }

  const ids = broken.map((c) => c.id)
  const result = await prisma.supportChat.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'NEW',
      acceptedBy: null,
      acceptedAt: null,
      archivedAt: null,
      funnelStageId: 'primary',
    },
  })

  console.log(`\n✅ Updated ${result.count} chats.`);
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
