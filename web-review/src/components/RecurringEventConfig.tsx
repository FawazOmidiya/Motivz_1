"use client";

// import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { RecurringConfig } from "@/types/recurring-events";

interface RecurringEventConfigProps {
  isRecurring: boolean;
  onRecurringChange: (isRecurring: boolean) => void;
  recurringConfig: RecurringConfig;
  onConfigChange: (config: RecurringConfig) => void;
}

export default function RecurringEventConfig({
  isRecurring,
  onRecurringChange,
  recurringConfig,
  onConfigChange,
}: RecurringEventConfigProps) {
  const handleConfigUpdate = (updates: Partial<RecurringConfig>) => {
    onConfigChange({ ...recurringConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
            className="rounded"
          />
          Make this a recurring event
        </Label>
        <p className="text-sm text-muted-foreground">
          Create multiple instances of this event automatically
        </p>
      </div>

      {isRecurring && (
        <div className="p-4 bg-blue-50 rounded-lg space-y-4">
          <div className="space-y-2">
            <Label>Recurrence Frequency</Label>
            <Select
              value={recurringConfig.frequency}
              onValueChange={(value: "weekly" | "monthly" | "daily") =>
                handleConfigUpdate({ frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurringConfig.frequency === "weekly" && (
            <div className="space-y-2">
              <Label>Days of the Week</Label>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day, index) => (
                    <Button
                      key={day}
                      type="button"
                      variant={
                        recurringConfig.days_of_week?.includes(index)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        const currentDays = recurringConfig.days_of_week || [];
                        const newDays = currentDays.includes(index)
                          ? currentDays.filter((d) => d !== index)
                          : [...currentDays, index];
                        handleConfigUpdate({ days_of_week: newDays });
                      }}
                      className="text-xs"
                    >
                      {day}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recurringConfig.end_date
                      ? format(new Date(recurringConfig.end_date), "PPP")
                      : "No end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      recurringConfig.end_date
                        ? new Date(recurringConfig.end_date)
                        : undefined
                    }
                    onSelect={(date) =>
                      handleConfigUpdate({
                        end_date: date ? date.toISOString() : undefined,
                      })
                    }
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Maximum Occurrences</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={recurringConfig.max_occurrences || 12}
                onChange={(e) =>
                  handleConfigUpdate({
                    max_occurrences: parseInt(e.target.value) || 12,
                  })
                }
                placeholder="12"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Recurring events will be automatically
              generated based on your settings. You can manage and edit
              individual instances from the events list.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
