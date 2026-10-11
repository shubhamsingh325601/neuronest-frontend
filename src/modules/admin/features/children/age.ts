/** Age for display from a `YYYY-MM-DD` date of birth: "3 years", "14 months", "2 months". */
export function formatAge(dateOfBirth: string, now: Date = new Date()): string {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "—";
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) return "—";
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} years`;
}
