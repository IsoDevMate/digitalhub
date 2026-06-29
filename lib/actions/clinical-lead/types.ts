import { z } from "zod";

export const FetchClinicalLeadsSchema = z.object({
  hubId: z.string().min(1, "Hub ID is required"),
});

export type FetchClinicalLeadsInput = z.infer<typeof FetchClinicalLeadsSchema>;

export type ClinicalLeadSearchResult = {
  id: string;
  userId: string | null;
  clinicalLeadName: string;
  clinicalLeadEmail: string | null;
};
