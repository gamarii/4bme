import type admin from "firebase-admin";

export type RecommendationRequest = {
  taskId: string;
  deviceName: string;
  deviceType: string;
  location: string;
  requiredSkills: string[];
  urgency: "low" | "medium" | "high" | "critical";
};

type EngineerRecord = {
  id: string;
  name: string;
  email: string;
  role?: string;
  skills: string[];
  certifications: string[];
  location: string;
  isActive?: boolean;
};

export type RecommendationOption = {
  engineerId: string;
  engineerName: string;
  totalScore: number;
  breakdown: {
    skillMatch: number;
    workload: number;
    proximity: number;
  };
  explanation: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function scoreSkillMatch(requiredSkills: string[], engineerSkills: string[]) {
  const req = requiredSkills.map(normalize);
  const eng = engineerSkills.map(normalize);

  if (req.length === 0) return 40;

  const matches = req.filter((skill) => eng.includes(skill)).length;
  return Math.round((matches / req.length) * 50);
}

function scoreWorkload(activeTaskCount: number) {
  if (activeTaskCount <= 0) return 30;
  return Math.max(0, 30 - activeTaskCount * 5);
}

function scoreProximity(taskLocation: string, engineerLocation: string) {
  return normalize(taskLocation) === normalize(engineerLocation) ? 20 : 8;
}

function buildExplanation(params: {
  engineerName: string;
  requiredSkills: string[];
  engineerSkills: string[];
  workloadCount: number;
  taskLocation: string;
  engineerLocation: string;
}) {
  const matchedSkills = params.requiredSkills.filter((skill) =>
    params.engineerSkills.map(normalize).includes(normalize(skill))
  );

  const skillText =
    matchedSkills.length > 0
      ? `Matched skills: ${matchedSkills.join(", ")}.`
      : "No strong direct skill keyword match, but still a viable alternative.";

  const workloadText = `Current active workload: ${params.workloadCount} task${
    params.workloadCount === 1 ? "" : "s"
  }.`;

  const proximityText =
    normalize(params.taskLocation) === normalize(params.engineerLocation)
      ? `Located in the same department/location: ${params.taskLocation}.`
      : `Located in ${params.engineerLocation}, task is in ${params.taskLocation}.`;

  return `${params.engineerName} was recommended based on skill match, workload, and proximity. ${skillText} ${workloadText} ${proximityText}`;
}

export async function recommendEngineers(
  db: admin.firestore.Firestore,
  input: RecommendationRequest
): Promise<RecommendationOption[]> {
  const engineersSnap = await db
    .collection("engineers")
    .where("isActive", "==", true)
    .get();

  const workOrdersSnap = await db.collection("workOrders").get();

  const activeStatuses = new Set(["Open", "Scheduled", "In progress", "Blocked"]);
  const workloadMap = new Map<string, number>();

  workOrdersSnap.docs.forEach((doc) => {
    const data = doc.data();
    const assignedEngineerId = data.assignedEngineerId as string | undefined;
    const status = data.status as string | undefined;

    if (!assignedEngineerId || !status) return;
    if (!activeStatuses.has(status)) return;

    workloadMap.set(
      assignedEngineerId,
      (workloadMap.get(assignedEngineerId) ?? 0) + 1
    );
  });

  const engineers: EngineerRecord[] = engineersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name ?? "",
      email: data.email ?? "",
      role: data.role,
      skills: Array.isArray(data.skills) ? data.skills : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      location: data.location ?? "",
      isActive: data.isActive ?? true,
    };
  });

  return engineers
    .map((eng) => {
      const activeTaskCount = workloadMap.get(eng.id) ?? 0;

      const skillMatch = scoreSkillMatch(input.requiredSkills, eng.skills);
      const workload = scoreWorkload(activeTaskCount);
      const proximity = scoreProximity(input.location, eng.location);
      const totalScore = skillMatch + workload + proximity;

      return {
        engineerId: eng.id,
        engineerName: eng.name,
        totalScore,
        breakdown: {
          skillMatch,
          workload,
          proximity,
        },
        explanation: buildExplanation({
          engineerName: eng.name,
          requiredSkills: input.requiredSkills,
          engineerSkills: eng.skills,
          workloadCount: activeTaskCount,
          taskLocation: input.location,
          engineerLocation: eng.location,
        }),
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);
}