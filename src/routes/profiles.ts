import { Router, Request, Response } from "express";
import { uuidv7 } from "uuidv7";
import prisma from "../lib/prisma";
import { fetchGenderize, fetchAgify, fetchNationalize, ExternalApiError } from "../lib/external";
import { getAgeGroup } from "../lib/classify";
import { parseNaturalLanguage } from "../lib/nlp";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    if (name !== undefined && typeof name !== "string") {
      return res.status(422).json({ status: "error", message: "name must be a string" });
    }
    return res.status(400).json({ status: "error", message: "name is required" });
  }
  const normalizedName = name.trim().toLowerCase();
  const existing = await prisma.profile.findUnique({ where: { name: normalizedName } });
  if (existing) return res.status(200).json({ status: "success", message: "Profile already exists", data: existing });

  let genderData, agifyData, nationalizeData;
  try { genderData = await fetchGenderize(normalizedName); }
  catch (err) { return res.status(err instanceof ExternalApiError ? 502 : 500).json({ status: "error", message: err instanceof Error ? err.message : "Internal server error" }); }
  try { agifyData = await fetchAgify(normalizedName); }
  catch (err) { return res.status(err instanceof ExternalApiError ? 502 : 500).json({ status: "error", message: err instanceof Error ? err.message : "Internal server error" }); }
  try { nationalizeData = await fetchNationalize(normalizedName); }
  catch (err) { return res.status(err instanceof ExternalApiError ? 502 : 500).json({ status: "error", message: err instanceof Error ? err.message : "Internal server error" }); }

  const profile = await prisma.profile.create({
    data: {
      id: uuidv7(), name: normalizedName,
      gender: genderData.gender, gender_probability: genderData.gender_probability,
      age: agifyData.age, age_group: getAgeGroup(agifyData.age),
      country_id: nationalizeData.country_id, country_name: nationalizeData.country_name, country_probability: nationalizeData.country_probability,
    },
  });
  return res.status(201).json({ status: "success", data: profile });
});

router.get("/search", async (req: Request, res: Response) => {
  const { q, page, limit } = req.query;
  if (!q || typeof q !== "string" || q.trim() === "") {
    return res.status(400).json({ status: "error", message: "q parameter is required" });
  }
  const parsed = parseNaturalLanguage(q);
  if (!parsed) return res.status(400).json({ status: "error", message: "Unable to interpret query" });

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
  const skip = (pageNum - 1) * limitNum;
  const where: Record<string, unknown> = {};
  if (parsed.gender) where.gender = parsed.gender;
  if (parsed.age_group) where.age_group = parsed.age_group;
  if (parsed.country_id) where.country_id = parsed.country_id;
  if (parsed.min_age !== undefined || parsed.max_age !== undefined) {
    where.age = {
      ...(parsed.min_age !== undefined && { gte: parsed.min_age }),
      ...(parsed.max_age !== undefined && { lte: parsed.max_age }),
    };
  }
  const [total, data] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({ where, skip, take: limitNum, orderBy: { created_at: "asc" } }),
  ]);
  return res.status(200).json({ status: "success", page: pageNum, limit: limitNum, total, data });
});

router.get("/", async (req: Request, res: Response) => {
  const { gender, country_id, age_group, min_age, max_age, min_gender_probability, min_country_probability, sort_by, order, page, limit } = req.query;
  const validSortFields = ["age", "created_at", "gender_probability"];
  const validOrders = ["asc", "desc"];
  if (sort_by && !validSortFields.includes(sort_by as string)) return res.status(400).json({ status: "error", message: "Invalid query parameters" });
  if (order && !validOrders.includes(order as string)) return res.status(400).json({ status: "error", message: "Invalid query parameters" });

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
  const skip = (pageNum - 1) * limitNum;
  const where: Record<string, unknown> = {};
  if (gender && typeof gender === "string") where.gender = gender.toLowerCase();
  if (country_id && typeof country_id === "string") where.country_id = country_id.toUpperCase();
  if (age_group && typeof age_group === "string") where.age_group = age_group.toLowerCase();
  const ageFilter: Record<string, number> = {};
  if (min_age) ageFilter.gte = parseInt(min_age as string);
  if (max_age) ageFilter.lte = parseInt(max_age as string);
  if (Object.keys(ageFilter).length) where.age = ageFilter;
  if (min_gender_probability) where.gender_probability = { gte: parseFloat(min_gender_probability as string) };
  if (min_country_probability) where.country_probability = { gte: parseFloat(min_country_probability as string) };
  const orderBy: Record<string, string> = {};
  if (sort_by) orderBy[sort_by as string] = (order as string) || "asc";
  else orderBy.created_at = "asc";

  const [total, data] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({ where, orderBy, skip, take: limitNum }),
  ]);
  return res.status(200).json({ status: "success", page: pageNum, limit: limitNum, total, data });
});

router.get("/:id", async (req: Request, res: Response) => {
  const profile = await prisma.profile.findUnique({ where: { id: req.params.id } });
  if (!profile) return res.status(404).json({ status: "error", message: "Profile not found" });
  return res.status(200).json({ status: "success", data: profile });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const profile = await prisma.profile.findUnique({ where: { id: req.params.id } });
  if (!profile) return res.status(404).json({ status: "error", message: "Profile not found" });
  await prisma.profile.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

export default router;
