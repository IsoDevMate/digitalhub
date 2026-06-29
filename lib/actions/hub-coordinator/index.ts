"use server";

import { ImplementerRole } from "@prisma/client";
import { getCurrentUserSession } from "#/app/auth";
import { db } from "#/lib/db";
import type { ActionResponse } from "#/types/actions.types";
import type { HubCoordinatorSearchResult } from "./types";
import { FetchHubCoordinatorsSchema } from "./types";

export async function fetchHubCoordinators(
  hubId: string,
): Promise<ActionResponse<HubCoordinatorSearchResult[]>> {
  try {
    const session = await getCurrentUserSession();
    if (!session?.user.id) {
      return { success: false, message: "Not authenticated" };
    }

    if (session.user.activeMembership?.role !== ImplementerRole.HUB_COORDINATOR) {
      return { success: false, message: "Unauthorized" };
    }

    const validatedData = FetchHubCoordinatorsSchema.parse({ hubId });

    const hubCoordinators = await db.hubCoordinator.findMany({
      where: {
        assignedHubId: validatedData.hubId,
        archivedAt: null,
      },
      orderBy: { coordinatorName: "asc" },
    });

    const hubCoordinatorIds = hubCoordinators.map((hc) => hc.id);

    const implementerMembers = await db.implementerMember.findMany({
      where: {
        role: ImplementerRole.HUB_COORDINATOR,
        identifier: { in: hubCoordinatorIds },
      },
      select: {
        identifier: true,
        userId: true,
      },
    });

    const memberMap = new Map(
      implementerMembers.map((member) => [member.identifier, member.userId]),
    );

    const results: HubCoordinatorSearchResult[] = hubCoordinators
      .map((hc) => ({
        id: hc.id,
        userId: memberMap.get(hc.id) || null,
        coordinatorName: hc.coordinatorName,
        coordinatorEmail: hc.coordinatorEmail,
        visibleId: hc.visibleId,
      }))
      .filter((hc) => hc.userId !== session.user.id);

    return { success: true, message: "Hub coordinators fetched", data: results };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
