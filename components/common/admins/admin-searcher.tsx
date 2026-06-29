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
import { fetchAdminUsers } from "#/lib/actions/admin";
import type { AdminSearchResult } from "#/lib/actions/admin/types";

interface AdminSearcherProps {
  onSelect: (admin: AdminSearchResult) => void;
  disabled?: boolean;
}

export function AdminSearcher({ onSelect, disabled }: AdminSearcherProps) {
  const [open, setOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAdmins = async () => {
      setLoading(true);
      try {
        const result = await fetchAdminUsers();
        if (result.success && result.data) {
          setAdmins(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch admin users:", error);
      } finally {
        setLoading(false);
      }
    };
    void loadAdmins();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white"
          disabled={disabled || loading}
        >
          {loading ? (
            <span className="text-muted-foreground">Loading admins...</span>
          ) : (
            <span>Select admin</span>
          )}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search admins..." />
          <CommandEmpty>No admins found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-scroll">
            {admins.map((admin) => (
              <CommandItem
                key={admin.id}
                value={admin.adminName}
                onSelect={() => {
                  onSelect(admin);
                  setOpen(false);
                }}
                className="flex items-center justify-between gap-3 rounded-none border-b px-3 py-2 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{admin.adminName}</span>
                  {admin.adminEmail && (
                    <span className="text-xs text-muted-foreground">{admin.adminEmail}</span>
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
