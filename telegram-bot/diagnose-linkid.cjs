const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Diagnostic script to check why Link ID column shows "—" for all users.
 *
 * Checks:
 *   1. MarketingLink table — are there any marketing links?
 *   2. User utmParams — do users have utm data with mk_* patterns?
 *   3. Channel invite link matching — do stored invite links match?
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node diagnose-linkid.cjs
 */

async function main() {
  console.log('=== Link ID Diagnostic ===\n');

  // 1. Check MarketingLink table
  const marketingLinks = await prisma.marketingLink.findMany();
  console.log(`1. MarketingLink table: ${marketingLinks.length} records`);
  if (marketingLinks.length === 0) {
    console.log('   ⚠️  MarketingLink table is EMPTY — no link attribution is possible!');
    console.log('   → Create marketing links via CRM → Link Builder\n');
  } else {
    console.log('   Sample links:');
    for (const link of marketingLinks.slice(0, 10)) {
      console.log(`     linkId=${link.linkId}  source=${link.source}  trafficker=${link.trafficerName || '—'}  channelInvite=${link.channelInviteLink || '—'}`);
    }
    if (marketingLinks.length > 10) console.log(`     ... and ${marketingLinks.length - 10} more`);
    console.log('');
  }

  // 2. Check user utmParams distribution
  const usersWithUtm = await prisma.user.findMany({
    where: { utmParams: { not: null } },
    select: { id: true, utmParams: true, marketingSource: true },
    take: 500,
  });
  const totalUsers = await prisma.user.count();
  const usersWithUtmCount = await prisma.user.count({ where: { utmParams: { not: null } } });

  console.log(`2. User UTM data: ${usersWithUtmCount} of ${totalUsers} users have utmParams`);

  const mkPatternUsers = usersWithUtm.filter(u => /mk_[a-zA-Z0-9_-]+/.test(String(u.utmParams || '')));
  const channelUsers = usersWithUtm.filter(u => String(u.utmParams || '').toLowerCase() === 'channel');
  const jsonUsers = usersWithUtm.filter(u => String(u.utmParams || '').trim().startsWith('{'));

  console.log(`   - With mk_* pattern: ${mkPatternUsers.length}`);
  console.log(`   - With "channel" value: ${channelUsers.length}`);
  console.log(`   - With JSON object: ${jsonUsers.length}`);

  if (mkPatternUsers.length > 0) {
    console.log('   Sample mk_* utmParams:');
    for (const u of mkPatternUsers.slice(0, 5)) {
      const mkMatch = String(u.utmParams).match(/mk_[a-zA-Z0-9_-]+/);
      console.log(`     User ID=${u.id}: ${mkMatch ? mkMatch[0] : u.utmParams}`);
    }
  }

  if (jsonUsers.length > 0) {
    console.log('   Sample JSON utmParams:');
    for (const u of jsonUsers.slice(0, 5)) {
      try {
        const parsed = JSON.parse(String(u.utmParams));
        console.log(`     User ID=${u.id}: inviteLink=${parsed.inviteLink || '—'}  inviteLinkName=${parsed.inviteLinkName || '—'}`);
      } catch {
        console.log(`     User ID=${u.id}: (parse error) ${String(u.utmParams).substring(0, 80)}`);
      }
    }
  }
  console.log('');

  // 3. Check invite link matching
  if (marketingLinks.length > 0 && jsonUsers.length > 0) {
    const channelInvites = marketingLinks
      .filter(l => l.channelInviteLink)
      .map(l => ({ linkId: l.linkId, invite: l.channelInviteLink }));

    console.log(`3. Channel invite link matching:`);
    console.log(`   Marketing links with channelInviteLink: ${channelInvites.length}`);
    for (const ci of channelInvites) {
      console.log(`     ${ci.linkId} → ${ci.invite}`);
    }

    // Check if any user JSON utmParams match
    let matched = 0;
    for (const u of jsonUsers) {
      try {
        const parsed = JSON.parse(String(u.utmParams));
        if (parsed.inviteLink && channelInvites.some(ci => ci.invite === parsed.inviteLink)) {
          matched++;
        }
      } catch {}
    }
    console.log(`   Users with matching invite links: ${matched} of ${jsonUsers.length}`);
    if (matched === 0 && channelInvites.length > 0 && jsonUsers.length > 0) {
      console.log('   ⚠️  No matches! Channel invite links in MarketingLink table probably need updating.');
    }
  }

  // 4. Summary & recommendations
  console.log('\n=== Summary ===');
  if (marketingLinks.length === 0) {
    console.log('❌ No marketing links exist. Create them in CRM → Link Builder.');
  } else if (mkPatternUsers.length === 0 && jsonUsers.length === 0) {
    console.log('❌ No users have trackable utmParams (no mk_* or JSON data).');
    console.log('   Users are likely coming without ?ref= parameter or via untracked channels.');
  } else if (mkPatternUsers.length > 0) {
    const mkLinkIds = new Set(marketingLinks.map(l => l.linkId));
    const matchedMk = mkPatternUsers.filter(u => {
      const m = String(u.utmParams).match(/mk_[a-zA-Z0-9_-]+/);
      return m && mkLinkIds.has(m[0]);
    });
    if (matchedMk.length === 0) {
      console.log('⚠️  Users have mk_* utmParams but they don\'t match any MarketingLink records.');
      console.log('   Check if linkId values in MarketingLink table match the mk_* values in user utmParams.');
    } else {
      console.log(`✅ ${matchedMk.length} users have matching mk_* links. Link ID should work for these.`);
    }
  }
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
