/**
 * Marks the premium quests in DynamoDB.
 *
 * Free quests (product decision, 2026-07-13): Art Essentials, Bronze Legacy,
 * Sacred Animals — 10 of the 47 scannable artworks. Every other quest is
 * premium.
 *
 * DRY RUN BY DEFAULT. Pass --apply to write. Seven of the eight other scripts
 * here are read-only; a write script that defaults to writing is how a catalog
 * gets wrecked.
 *
 *   node scripts/markPremiumQuests.js            # show the plan, write nothing
 *   node scripts/markPremiumQuests.js --apply    # actually write
 *
 * Requires in .env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION,
 * and optionally QUEST_TABLE_NAME.
 *
 * Timing note: apply this AFTER (or immediately before) the gating build
 * reaches users. Already-shipped builds render a "Premium" badge with no gate,
 * so marking early shows a badge on quests users can still start for free.
 */
const AWS = require("aws-sdk");
require("dotenv").config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
  console.error(
    "❌ Missing required AWS environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)"
  );
  process.exit(1);
}

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TABLE_SUFFIX = "wpjj3wuv3rfdndu6j3uvtroxve-dev";
const QUEST_TABLE = process.env.QUEST_TABLE_NAME || `Quest-${TABLE_SUFFIX}`;

const FREE_QUEST_TITLES = ["Art Essentials", "Bronze Legacy", "Sacred Animals"];

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`🔍 Scanning ${QUEST_TABLE}...\n`);
  const result = await dynamoDb.scan({ TableName: QUEST_TABLE }).promise();
  const quests = (result.Items || []).sort((a, b) =>
    String(a.title).localeCompare(String(b.title))
  );

  if (quests.length === 0) {
    console.error("❌ No quests found — wrong table name?");
    process.exit(1);
  }

  // Guard: the free list is matched by exact title, so a rename or typo would
  // silently mark the wrong nine quests premium. Refuse to run in that case.
  const matched = FREE_QUEST_TITLES.filter((t) =>
    quests.some((q) => q.title === t)
  );
  if (matched.length !== FREE_QUEST_TITLES.length) {
    console.error(
      `❌ Expected to match all ${FREE_QUEST_TITLES.length} free quest titles, matched ${matched.length}.`
    );
    console.error(`   Wanted: ${FREE_QUEST_TITLES.join(", ")}`);
    console.error(`   Missing: ${FREE_QUEST_TITLES.filter((t) => !matched.includes(t)).join(", ")}`);
    console.error("\n   Actual titles in the table:");
    quests.forEach((q) => console.error(`     - ${q.title}`));
    process.exit(1);
  }

  let totalArtworks = 0;
  let freeArtworks = 0;
  const plan = [];

  console.log("Current state and plan:\n");
  for (const quest of quests) {
    const count = (quest.requiredArtworks || []).length;
    const shouldBePremium = !FREE_QUEST_TITLES.includes(quest.title);
    totalArtworks += count;
    if (!shouldBePremium) freeArtworks += count;

    const changing = quest.isPremium !== shouldBePremium;
    if (changing) plan.push({ id: quest.id, isPremium: shouldBePremium });

    console.log(
      `  ${shouldBePremium ? "PREMIUM" : "FREE   "}  ${String(quest.id).padEnd(12)} ` +
        `${String(quest.title).padEnd(26)} artworks=${String(count).padEnd(2)} ` +
        `isPremium: ${String(quest.isPremium)} -> ${shouldBePremium}` +
        `${changing ? "  ⟵ change" : ""}`
    );
  }

  console.log(
    `\n📊 ${quests.length} quests · ${totalArtworks} artworks total · ` +
      `${freeArtworks} free / ${totalArtworks - freeArtworks} premium`
  );
  console.log(`📝 ${plan.length} record(s) would change.`);

  if (plan.length === 0) {
    console.log("\n✅ Already in the desired state — nothing to do.");
    return;
  }

  if (!APPLY) {
    console.log("\n🚧 DRY RUN — nothing written. Re-run with --apply to write.");
    return;
  }

  console.log("\n✍️  Applying...");
  for (const { id, isPremium } of plan) {
    await dynamoDb
      .update({
        TableName: QUEST_TABLE,
        Key: { id },
        // Written explicitly for the free quests too (not just the premium
        // ones) so the state is self-documenting and a partially-applied run
        // is detectable. The client checks `=== true`, so pre-existing nulls
        // are safe either way.
        UpdateExpression: "SET isPremium = :p",
        ExpressionAttributeValues: { ":p": isPremium },
      })
      .promise();
    console.log(`   ✓ ${id} → isPremium=${isPremium}`);
  }

  console.log("\n🔁 Re-scanning to confirm...");
  const after = await dynamoDb.scan({ TableName: QUEST_TABLE }).promise();
  (after.Items || [])
    .sort((a, b) => String(a.title).localeCompare(String(b.title)))
    .forEach((q) =>
      console.log(
        `  ${q.isPremium ? "PREMIUM" : "FREE   "}  ${String(q.title).padEnd(26)} isPremium=${q.isPremium}`
      )
    );
  console.log("\n✅ Done.");
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
