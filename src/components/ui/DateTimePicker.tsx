import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Custom DateTimePicker component
interface DateTimePickerProps {
    value?: string;
    onChange?: (date: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}
  
  

const DateTimePicker: React.FC<DateTimePickerProps> = ({
    value,
    onChange,
    placeholder = "Pick a date and time",
    disabled = false,
    className
  }) => {
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
      value ? new Date(value) : undefined
    );
    const [timeValue, setTimeValue] = useState(
      value ? dayjs(value).format("HH:mm") : "09:00"
    );
  
    const handleDateSelect = (date: Date | undefined) => {
      if (date) {
        setSelectedDate(date);
        const [hours, minutes] = timeValue.split(":");
        const newDateTime = dayjs(date)
          .hour(parseInt(hours))
          .minute(parseInt(minutes))
          .second(0);
        onChange?.(newDateTime.toISOString());
      }
    };
  
    const handleTimeChange = (time: string) => {
      setTimeValue(time);
      if (selectedDate) {
        const [hours, minutes] = time.split(":");
        const newDateTime = dayjs(selectedDate)
          .hour(parseInt(hours))
          .minute(parseInt(minutes))
          .second(0);
        onChange?.(newDateTime.toISOString());
      }
    };
  
    const formatDisplayValue = () => {
      if (!value) return placeholder;
      return dayjs(value).format("DD/MM/YYYY HH:mm");
    };
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {formatDisplayValue()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabled}
            />
            <div className="flex items-center space-x-2">
              <Label htmlFor="time">Time:</Label>
              <Input
                id="time"
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-32"
                disabled={disabled}
              />
            </div>
            <Button
              onClick={() => setOpen(false)}
              className="w-full"
              size="sm"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };


  export default DateTimePicker;