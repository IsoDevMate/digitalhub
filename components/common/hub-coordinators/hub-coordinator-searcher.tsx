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
import { fetchHubCoordinators } from "#/lib/actions/hub-coordinator";
import type { HubCoordinatorSearchResult } from "#/lib/actions/hub-coordinator/types";

interface HubCoordinatorSearcherProps {
  hubId: string;
  onSelect: (coordinator: HubCoordinatorSearchResult) => void;
  disabled?: boolean;
}

export function HubCoordinatorSearcher({ hubId, onSelect, disabled }: HubCoordinatorSearcherProps) {
  const [open, setOpen] = useState(false);
  const [coordinators, setCoordinators] = useState<HubCoordinatorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCoordinators = async () => {
      if (!hubId) return;
      setLoading(true);
      try {
        const result = await fetchHubCoordinators(hubId);
        if (result.success && result.data) {
          setCoordinators(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch hub coordinators:", error);
      } finally {
        setLoading(false);
      }
    };
    void loadCoordinators();
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
            <span className="text-muted-foreground">Loading coordinators...</span>
          ) : (
            <span>Select hub coordinator</span>
          )}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search coordinators..." />
          <CommandEmpty>No coordinators found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-scroll">
            {coordinators.map((coordinator) => (
              <CommandItem
                key={coordinator.id}
                value={coordinator.coordinatorName}
                onSelect={() => {
                  onSelect(coordinator);
                  setOpen(false);
                }}
                className="flex items-center justify-between gap-3 rounded-none border-b px-3 py-2 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{coordinator.coordinatorName}</span>
                  {coordinator.coordinatorEmail && (
                    <span className="text-xs text-muted-foreground">
                      {coordinator.coordinatorEmail}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {coordinator.visibleId}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
