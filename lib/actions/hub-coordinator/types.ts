import { z } from "zod";

export const FetchHubCoordinatorsSchema = z.object({
  hubId: z.string().min(1, "Hub ID is required"),
});

export type FetchHubCoordinatorsInput = z.infer<typeof FetchHubCoordinatorsSchema>;

export type HubCoordinatorSearchResult = {
  id: string;
  userId: string | null;
  coordinatorName: string;
  coordinatorEmail: string | null;
  visibleId: string;
};
