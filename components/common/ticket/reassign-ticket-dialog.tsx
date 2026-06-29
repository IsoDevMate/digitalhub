"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSearcher } from "#/components/common/admins";
import { ClinicalLeadSearcher } from "#/components/common/clinical-leads";
import { HubCoordinatorSearcher } from "#/components/common/hub-coordinators";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Separator } from "#/components/ui/separator";
import { toast } from "#/components/ui/use-toast";
import type { AdminSearchResult } from "#/lib/actions/admin/types";
import type { ClinicalLeadSearchResult } from "#/lib/actions/clinical-lead/types";
import type { HubCoordinatorSearchResult } from "#/lib/actions/hub-coordinator/types";
import { reassignTicket } from "#/lib/actions/ticket";
import type { ReassignmentInitiatorRole } from "#/lib/actions/ticket/types";
import type { TicketData } from "./columns";

type ReassignmentSearchResult =
  | HubCoordinatorSearchResult
  | ClinicalLeadSearchResult
  | AdminSearchResult;

interface ReassignTicketDialogProps {
  ticket: TicketData | undefined;
  hubId?: string;
  role: ReassignmentInitiatorRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReassignTicketDialog({
  ticket,
  hubId,
  role,
  open,
  onOpenChange,
}: ReassignTicketDialogProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<ReassignmentSearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = role === "ADMIN";
  const isHubCoordinator = role === "HUB_COORDINATOR";
  const searcherLabel = isAdmin ? "Admin" : isHubCoordinator ? "Hub Coordinator" : "Clinical Lead";

  const selectedName = isAdmin
    ? (selectedUser as AdminSearchResult | null)?.adminName
    : isHubCoordinator
      ? (selectedUser as HubCoordinatorSearchResult | null)?.coordinatorName
      : (selectedUser as ClinicalLeadSearchResult | null)?.clinicalLeadName;

  const onSubmit = async () => {
    if (!ticket?.id || !selectedUser?.userId) return;

    setIsSubmitting(true);
    try {
      const result = await reassignTicket(ticket.id, selectedUser.userId);
      if (!result.success) {
        toast({
          variant: "destructive",
          description: result.message ?? "Failed to reassign ticket",
        });
        return;
      }

      toast({
        description: result.message ?? "Ticket reassigned successfully",
      });
      router.refresh();
      onOpenChange(false);
      setSelectedUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  const renderSearcher = () => {
    if (!role) {
      return (
        <div className="rounded-md border bg-red-bg border-red-border p-3">
          <p className="text-sm text-red-base">
            Unable to reassign: your role could not be determined. Please refresh and try again.
          </p>
        </div>
      );
    }

    if (isAdmin) {
      return <AdminSearcher onSelect={(admin) => setSelectedUser(admin)} disabled={isSubmitting} />;
    }

    if (!hubId) {
      return (
        <div className="rounded-md border bg-red-bg border-red-border p-3">
          <p className="text-sm text-red-base">
            Unable to reassign: no hub is assigned to your account. Please contact an administrator.
          </p>
        </div>
      );
    }

    if (isHubCoordinator) {
      return (
        <HubCoordinatorSearcher
          hubId={hubId}
          onSelect={(coordinator) => setSelectedUser(coordinator)}
          disabled={isSubmitting}
        />
      );
    }

    return (
      <ClinicalLeadSearcher
        hubId={hubId}
        onSelect={(lead) => setSelectedUser(lead)}
        disabled={isSubmitting}
      />
    );
  };

  const hasError = !role || (!isAdmin && !hubId);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Reassign Ticket to {searcherLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="reassign-select">
              Select {searcherLabel} <span className="text-shamiri-light-red">*</span>
            </label>
            {renderSearcher()}
          </div>

          {selectedUser && (
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-sm">
                Selected: <span className="font-medium">{selectedName}</span>
              </p>
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            type="button"
            onClick={onSubmit}
            disabled={hasError || !selectedUser || isSubmitting}
            loading={isSubmitting}
          >
            Reassign Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
