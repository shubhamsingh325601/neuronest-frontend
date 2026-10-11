import type {
  CallLog,
  ChildRecordsApi,
  Media,
  Plan,
  PlanDetail,
  PlanNote,
} from "@/modules/admin/features/child-records/api/types";
import { MOCK_LATENCY_MS, delay, mockError, paginate } from "./_factory";

// TEMPORARY sample records (plan 0001 §18), shown only when the data-source flags select mock data for
// "child-records". Children themselves come from the live children API, so every child gets the same samples
// (re-stamped with its id). Playback URLs are placeholders that point nowhere.
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const dateOnly = (days: number) => ago(days).slice(0, 10);

const plansFor = (childId: string): Plan[] => [
  { id: "p-3", childId, planTemplateId: "t-1", status: "ACTIVE", origin: "MANUAL", startDate: dateOnly(5), createdById: "c-1", createdAt: ago(5), updatedAt: ago(1) },
  { id: "p-2", childId, planTemplateId: "t-2", status: "COMPLETED", origin: "AI", startDate: dateOnly(40), createdById: "c-1", createdAt: ago(40), updatedAt: ago(12) },
  { id: "p-1", childId, planTemplateId: "t-1", status: "ARCHIVED", origin: "MANUAL", startDate: dateOnly(90), createdById: "c-3", createdAt: ago(90), updatedAt: ago(45) },
];

const notFound = () => mockError(404, "PLAN_NOT_FOUND", "Plan not found.");

function detailOf(id: string): PlanDetail {
  const base = plansFor("mock-child").find((plan) => plan.id === id);
  if (!base) throw notFound();
  return {
    ...base,
    sections: [
      { id: "s-1", title: "Getting started", position: 1 },
      { id: "s-2", title: "Building routines", position: 2 },
    ],
    days: [
      { id: "d-1", dayNumber: 1, title: "Name the feeling", instructions: "Pick one moment today and name the feeling out loud together.", sectionId: "s-1", updatedAt: ago(5) },
      { id: "d-2", dayNumber: 2, title: "Two-minute calm corner", instructions: "Set up a quiet spot and practise sitting there for two minutes.", sectionId: "s-1", updatedAt: ago(5) },
      { id: "d-3", dayNumber: 3, title: "Visual schedule", instructions: "Draw tomorrow's three main events and review them before bed.", sectionId: "s-2", updatedAt: ago(5) },
      { id: "d-4", dayNumber: 4, title: "Free choice", instructions: "Let your child choose the activity. Note what they pick.", sectionId: null, updatedAt: ago(5) },
    ],
  };
}

const notes = (): PlanNote[] =>
  Array.from({ length: 25 }, (_, index) => ({
    id: `n-${index + 1}`,
    planId: "p-3",
    authorId: index % 3 === 0 ? "c-3" : "c-1",
    note: `Coordination note ${index + 1}: reviewed progress with the family and agreed the next step.`,
    createdAt: ago(25 - index),
  }));

const mediaFor = (childId: string): Media[] => [
  { id: "m-1", childId, uploadedById: "u-1", type: "VIDEO", provider: "CLOUDINARY", status: "UPLOADED", mimeType: "video/mp4", durationSeconds: 48, sizeBytes: 9_400_000, context: "Bedtime routine", createdAt: ago(2), updatedAt: ago(2), playbackUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4" },
  { id: "m-2", childId, uploadedById: "u-1", type: "PHOTO", provider: "CLOUDINARY", status: "UPLOADED", mimeType: "image/jpeg", durationSeconds: null, sizeBytes: 2_100_000, context: null, createdAt: ago(6), updatedAt: ago(6), playbackUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg" },
  { id: "m-3", childId, uploadedById: "u-1", type: "VIDEO", provider: "CLOUDINARY", status: "PENDING", mimeType: null, durationSeconds: null, sizeBytes: null, context: "Mealtime", createdAt: ago(1), updatedAt: ago(1), playbackUrl: null },
  { id: "m-4", childId, uploadedById: "u-1", type: "PHOTO", provider: "CLOUDINARY", status: "FAILED", mimeType: "image/png", durationSeconds: null, sizeBytes: null, context: "Play corner", createdAt: ago(9), updatedAt: ago(9), playbackUrl: null },
];

const callsFor = (childId: string): CallLog[] => [
  { id: "l-1", childId, clinicianId: "c-1", calledAt: ago(3), notes: "Sleep improving; keep the evening routine. Next call in four weeks.", createdAt: ago(3) },
  { id: "l-2", childId, clinicianId: "c-3", calledAt: ago(33), notes: null, createdAt: ago(33) },
  { id: "l-3", childId, clinicianId: "c-1", calledAt: ago(63), notes: "Introduced the visual schedule.", createdAt: ago(63) },
];

export const mockChildRecordsApi: ChildRecordsApi = {
  async plans(childId, { cursor, limit, status }, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return paginate(plansFor(childId).filter((plan) => !status || plan.status === status), { cursor, limit });
  },
  async plan(id, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return detailOf(id);
  },
  async notes(planId, { cursor, limit }, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return paginate(notes().map((note) => ({ ...note, planId })), { cursor, limit });
  },
  async media(childId, { cursor, limit }, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return paginate(mediaFor(childId), { cursor, limit });
  },
  async callLogs(childId, { cursor, limit }, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return paginate(callsFor(childId), { cursor, limit });
  },
};
