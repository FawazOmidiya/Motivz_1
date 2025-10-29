"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { format } from "date-fns";

interface DatePickerScreenProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  onCancel: () => void;
  title: string;
  minDate?: Date;
}

export default function DatePickerScreen({
  selectedDate,
  onDateSelect,
  onCancel,
  title,
  minDate,
}: DatePickerScreenProps) {
  const [tempDate, setTempDate] = useState<Date | undefined>(selectedDate);

  const handleConfirm = () => {
    if (tempDate) {
      onDateSelect(tempDate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Calendar
            mode="single"
            selected={tempDate}
            onSelect={setTempDate}
            disabled={minDate ? (date) => date < minDate : undefined}
            className="rounded-md border w-full"
            initialFocus
          />

          {tempDate && (
            <div className="text-center text-sm text-muted-foreground">
              Selected: {format(tempDate, "PPP")}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!tempDate}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
