"use server";

import { ImplementerRole } from "@prisma/client";
import { getCurrentUserSession } from "#/app/auth";
import { db } from "#/lib/db";
import type { ActionResponse } from "#/types/actions.types";
import type { ClinicalLeadSearchResult } from "./types";
import { FetchClinicalLeadsSchema } from "./types";

export async function fetchClinicalLeads(
  hubId: string,
): Promise<ActionResponse<ClinicalLeadSearchResult[]>> {
  try {
    const session = await getCurrentUserSession();
    if (!session?.user.id) {
      return { success: false, message: "Not authenticated" };
    }

    if (session.user.activeMembership?.role !== ImplementerRole.CLINICAL_LEAD) {
      return { success: false, message: "Unauthorized" };
    }

    const validatedData = FetchClinicalLeadsSchema.parse({ hubId });

    console.log("hub idd", hubId)
    const clinicalLeads = await db.clinicalLead.findMany({
      where: {
        assignedHubId: validatedData.hubId,
      },
      orderBy: { clinicalLeadName: "asc" },
    });

    const clinicalLeadIds = clinicalLeads.map((cl) => cl.id);

    const implementerMembers = await db.implementerMember.findMany({
      where: {
        role: ImplementerRole.CLINICAL_LEAD,
        identifier: { in: clinicalLeadIds },
      },
      select: {
        identifier: true,
        userId: true,
      },
    });

    const memberMap = new Map(
      implementerMembers.map((member) => [member.identifier, member.userId]),
    );

    const results: ClinicalLeadSearchResult[] = clinicalLeads
      .map((cl) => ({
        id: cl.id,
        userId: memberMap.get(cl.id) || null,
        clinicalLeadName: cl.clinicalLeadName,
        clinicalLeadEmail: cl.clinicalLeadEmail,
      }))
      .filter((cl) => cl.userId !== session.user.id);

    return { success: true, message: "Clinical leads fetched", data: results };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
