export function getAgeGroup(age: number): string {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
}
