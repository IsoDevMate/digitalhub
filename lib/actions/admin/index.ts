"use server";

import { ImplementerRole } from "@prisma/client";
import { getCurrentUserSession } from "#/app/auth";
import { db } from "#/lib/db";
import type { ActionResponse } from "#/types/actions.types";
import type { AdminSearchResult } from "./types";

export async function fetchAdminUsers(): Promise<ActionResponse<AdminSearchResult[]>> {
  try {
    const session = await getCurrentUserSession();
    if (!session?.user.id) {
      return { success: false, message: "Not authenticated" };
    }

    if (session.user.activeMembership?.role !== ImplementerRole.ADMIN) {
      return { success: false, message: "Unauthorized" };
    }

    const adminUsers = await db.adminUser.findMany({
      orderBy: { adminName: "asc" },
    });

    const adminIds = adminUsers.map((a) => a.id);

    const implementerMembers = await db.implementerMember.findMany({
      where: {
        role: ImplementerRole.ADMIN,
        identifier: { in: adminIds },
      },
      select: {
        identifier: true,
        userId: true,
      },
    });

    const memberMap = new Map(
      implementerMembers.map((member) => [member.identifier, member.userId]),
    );

    const results: AdminSearchResult[] = adminUsers
      .map((admin) => ({
        id: admin.id,
        userId: memberMap.get(admin.id) || null,
        adminName: admin.adminName,
        adminEmail: admin.email,
      }))
      .filter((admin) => admin.userId !== session.user.id);

    return { success: true, message: "Admin users fetched", data: results };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
