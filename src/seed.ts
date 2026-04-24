import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { uuidv7 } from "uuidv7";
import { getAgeGroup } from "./lib/classify";
import { getCountryName } from "./lib/external";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const raw = fs.readFileSync("profiles.json", "utf-8");
  const profiles = JSON.parse(raw);
  let created = 0, skipped = 0;

  for (const p of profiles) {
    const name = p.name.trim().toLowerCase();
    const existing = await prisma.profile.findUnique({ where: { name } });
    if (existing) { skipped++; continue; }
    await prisma.profile.create({
      data: {
        id: uuidv7(), name,
        gender: p.gender, gender_probability: p.gender_probability,
        age: p.age, age_group: getAgeGroup(p.age),
        country_id: p.country_id, country_name: getCountryName(p.country_id), country_probability: p.country_probability,
      },
    });
    created++;
  }
  console.log(`✅ Seeded: ${created} created, ${skipped} skipped`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
