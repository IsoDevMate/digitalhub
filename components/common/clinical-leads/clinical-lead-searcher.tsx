"use client";

import { CaretSortIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "#/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { fetchClinicalLeads } from "#/lib/actions/clinical-lead";
import type { ClinicalLeadSearchResult } from "#/lib/actions/clinical-lead/types";

interface ClinicalLeadSearcherProps {
  hubId: string;
  onSelect: (lead: ClinicalLeadSearchResult) => void;
  disabled?: boolean;
}

export function ClinicalLeadSearcher({ hubId, onSelect, disabled }: ClinicalLeadSearcherProps) {
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<ClinicalLeadSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLeads = async () => {
      if (!hubId) return;
      setLoading(true);
      try {
        const result = await fetchClinicalLeads(hubId);
        if (result.success && result.data) {
          setLeads(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch clinical leads:", error);
      } finally {
        setLoading(false);
      }
    };
    void loadLeads();
  }, [hubId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white"
          disabled={disabled || loading || !hubId}
        >
          {loading ? (
            <span className="text-muted-foreground">Loading clinical leads...</span>
          ) : (
            <span>Select clinical lead</span>
          )}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search clinical leads..." />
          <CommandEmpty>No clinical leads found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-scroll">
            {leads.map((lead) => (
              <CommandItem
                key={lead.id}
                value={lead.clinicalLeadName}
                onSelect={() => {
                  onSelect(lead);
                  setOpen(false);
                }}
                className="flex items-center justify-between gap-3 rounded-none border-b px-3 py-2 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{lead.clinicalLeadName}</span>
                  {lead.clinicalLeadEmail && (
                    <span className="text-xs text-muted-foreground">
                      {lead.clinicalLeadEmail}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
