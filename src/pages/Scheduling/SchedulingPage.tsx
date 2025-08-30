import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";

import {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import dayjs from "dayjs";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getActivityByUser,
  getCalendarEvents,
  updateCalendarEvent,
} from "@/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { 
  Clock, 
  Minus, 
  ChevronDown, 
  Plus, 
  X, 
  MapPin, 
  AlignLeft, 
  Users, 
  Trash2, 
  Edit, 
  XCircle 
} from "lucide-react";
import advancedFormat from "dayjs/plugin/advancedFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localizedFormat from "dayjs/plugin/localizedFormat";

import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);


const formSchema = z.object({
  summary: z.string().min(1, { message: "Event title is required" }),
  location: z.string().optional(),
  description: z.string(),
  start: z.object({
    dateTime: z.string().min(1, { message: "Start time is required" }),
    timeZone: z.string().min(1, { message: "Timezone is required" }),
  }),
  end: z.object({
    dateTime: z.string().min(1, { message: "End time is required" }),
    timeZone: z.string().min(1, { message: "Timezone is required" }),
  }),
  attendees: z
    .array(
      z.object({
        email: z.string(),
      })
    )
    .optional(),
  recurrence: z.array(z.string()).optional(),
});

const editFormSchema = z.object({
  summary: z.string().min(1, { message: "Event title is required" }),
  location: z.string().optional(),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string().min(1, { message: "Start time is required" }),
    timeZone: z.string().min(1, { message: "Timezone is required" }),
  }),
  end: z.object({
    dateTime: z.string().min(1, { message: "End time is required" }),
    timeZone: z.string().min(1, { message: "Timezone is required" }),
  }),
  attendees: z
    .array(
      z.object({
        email: z.string(),
      })
    )
    .optional(),
  recurrence: z.array(z.string()).optional(),
});

const createRecurrencesFormSchema = z.object({
  recurrence: z.object({
    repeatFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"], {
      invalid_type_error: "Invalid frequency",
    }),
    repeatInterval: z
      .number()
      .min(1, { message: "Interval must be at least 1" }),
    repeatOnDays: z
      .array(
        z.enum(["SU", "MO", "TU", "WE", "TH", "FR", "SA"], {
          invalid_type_error: "Invalid day of the week",
        })
      )
      .optional(),
    radioOptions: z.enum(["never", "onDate", "afterOccurences"], {
      invalid_type_error: "Invalid radio option",
    }),
    endsOnDate: z.string().nullable().optional(),
    endsAfterOccurrences: z
      .string()
      .min(1, { message: "Must be at least 1 occurrence" })
      .nullable()
      .optional(),
    monthlyOption: z.string().optional(),
  }),
});

const getUserTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

const getOrdinalSuffix = (n: number) => {
  if (n === 1) return "first";
  if (n === 2) return "second";
  if (n === 3) return "third";
  if (n === 4) return "fourth";
  if (n === 5) return "fifth";
  return `${n}th`;
};

const SchedulingPage: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [events, setEvents] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [eventsInfoModal, setEventsInfoModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { isCollapsed } = useSidebar((state) => state);
  const [formattedDisplayDate, setFormattedDisplayDate] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [newEventDate, setNewEventDate] = useState<any>(null);
  const [listView, setListView] = useState<boolean>(true);
  const [editListView, setEditListView] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [disableRecurrenceDate, setDisableRecurrenceDate] = useState(true);
  const [disableOccurencs, setDisableOccurencs] = useState(true);
  const [recurrenceCreateModal, setCreateRecurrenceModal] = useState(false);
  const [monthlyOptions, setMonthlyOptions] = useState<string[]>([]);
  const [toCreateRecurrence, setToCreateRecurrence] = useState<string[]>([]);
  const [showMonthlyDropdown, setShowMonthlyDropdown] = useState(false);
  const [editRecurrenceString, setEditRecurrenceString] = useState("");
  const [multipleEvents, setMultipleEvents] = useState(false);
  const [showUpdateConfirmDialog, setShowUpdateConfirmDialog] = useState(false);
  const [infoStartStr, setInfoStartStr] = useState<Date>(new Date());
  const [infoEndStr, setInfoEndStr] = useState<Date>(new Date());
  const [deleteRecurring, setDeleteRecurring] = useState<undefined | string>(
    "this"
  );
  const [isAttendeesCollapsed, setIsAttendeesCollapsed] = useState(false);

  if (!loginResponse) return null;

  const collapsedAnimation = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
    show: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      summary: "",
      location: "",
      description: "",
      start: {
        dateTime: "",
        timeZone: getUserTimeZone(),
      },
      end: {
        dateTime: "",
        timeZone: getUserTimeZone(),
      },
      attendees: [{ email: "" }],
    },
  });
  
  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      summary: "",
      location: "",
      description: "",
      start: {
        dateTime: "",
        timeZone: getUserTimeZone(),
      },
      end: {
        dateTime: "",
        timeZone: getUserTimeZone(),
      },
      attendees: [{ email: "" }],
      recurrence: [],
    },
  });

  const createRecurrenceForm = useForm<
    z.infer<typeof createRecurrencesFormSchema>
  >({
    resolver: zodResolver(createRecurrencesFormSchema),
    defaultValues: {
      recurrence: {
        repeatFrequency: "WEEKLY",
        repeatInterval: 1,
        repeatOnDays: [],
        endsOnDate: null,
        endsAfterOccurrences: null,
        monthlyOption: "",
      },
    },
  });

  const {
    register: registerCreateRecurrence,
    setValue: setValueCreateRecurrence,
    handleSubmit: handleSubmitCreateRecurrence,
    watch: watchCreateRecurrence,
    reset: resetCreateRecurrence,
  } = createRecurrenceForm;

  const recurrenceValues = watchCreateRecurrence("recurrence");

  const {
    setValue: setEditFormValue,
    getValues: getEditValues,
    watch: watchEditForm,
  } = editForm;

  const editStartValues = watchEditForm("start");
  const { setValue: setFormValue, getValues: getCreateValues } = form;
  const {
    fields: createFields,
    append: createAppend,
    remove: createRemove,
  } = useFieldArray({
    control: form.control,
    name: "attendees",
  });

  const {
    fields: editFields,
    append: editAppend,
    remove: editRemove,
  } = useFieldArray({
    control: editForm.control,
    name: "attendees",
  });

  const isCreateFormLoading = form.formState.isSubmitting;
  const isEditFormLoading = editForm.formState.isSubmitting;

  const handleEditClick = () => {
    setIsAttendeesCollapsed(true);
    setEditFormValue("start.dateTime", selectedEvent.start);
    setEditFormValue("end.dateTime", selectedEvent.end);
    setEditFormValue("summary", selectedEvent.title);
    setEditFormValue("location", selectedEvent.extendedProps.location);
    setEditFormValue("description", selectedEvent.extendedProps.description);
    setEditFormValue("attendees", selectedEvent.extendedProps.attendees);
    if (selectedEvent.recurrence) {
      setEditFormValue("recurrence", selectedEvent.recurrence);

      const selectedDay = dayjs(editStartValues.dateTime).date();
      const dayOfWeek = dayjs(editStartValues.dateTime).day();
      const nthWeekday = Math.ceil(selectedDay / 7);
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const mOptions = [
        `Monthly on day ${selectedDay}`,
        `Monthly on the ${getOrdinalSuffix(nthWeekday)} ${dayNames[dayOfWeek]}`,
      ];
      setMonthlyOptions(mOptions);
    }
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setEditFormValue("start.dateTime", "");
    setEditFormValue("end.dateTime", "");
    setEditFormValue("summary", "");
    setEditFormValue("location", "");
    setEditFormValue("description", "");
    setEditFormValue("attendees", [{ email: "" }]);

    setIsEditing(false);
  };

  const onFrequencyChange = (
    value: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
  ) => {
    setValueCreateRecurrence("recurrence.repeatFrequency", value);

    if (value === "DAILY" || value === "YEARLY") {
      setValueCreateRecurrence("recurrence.repeatOnDays", []);
      setShowMonthlyDropdown(false);
      setValueCreateRecurrence("recurrence.monthlyOption", "");
    } else if (value === "MONTHLY") {
      setValueCreateRecurrence("recurrence.repeatOnDays", []);
      setShowMonthlyDropdown(true);
      setValueCreateRecurrence(
        "recurrence.monthlyOption",
        monthlyOptions[0] || ""
      );
    } else {
      setShowMonthlyDropdown(false);
      setValueCreateRecurrence("recurrence.monthlyOption", "");
    }
  };

  const onDone = (data: z.infer<typeof createRecurrencesFormSchema>) => {
    const {
      repeatFrequency,
      repeatInterval,
      repeatOnDays,
      endsOnDate,
      endsAfterOccurrences,
      monthlyOption,
    } = data.recurrence;

    let rrule = `FREQ=${repeatFrequency};INTERVAL=${repeatInterval}`;

    if (repeatOnDays && repeatOnDays.length > 0) {
      rrule += `;BYDAY=${repeatOnDays.join(",")}`;
    }

    if (
      repeatFrequency === "MONTHLY" &&
      monthlyOption &&
      recurrenceValues.monthlyOption
    ) {
      if (recurrenceValues.monthlyOption.startsWith("Monthly on day")) {
        const splittedDays = recurrenceValues.monthlyOption.split(" ");
        var day = splittedDays[splittedDays.length - 1];
        rrule += `;BYMONTHDAY=${day}`;
      } else if (recurrenceValues.monthlyOption.startsWith("Monthly on the")) {
        const parts = recurrenceValues.monthlyOption.split(" ");
        const occurrence = parts[3];
        const weekday = parts.slice(4).join(" ");
        const weekdayMap: { [key: string]: string } = {
          Sunday: "SU",
          Monday: "MO",
          Tuesday: "TU",
          Wednesday: "WE",
          Thursday: "TH",
          Friday: "FR",
          Saturday: "SA",
        };

        const occurrenceMap: { [key: string]: number } = {
          first: 1,
          second: 2,
          third: 3,
          fourth: 4,
          fifth: 5,
        };

        const setPos = occurrenceMap[occurrence];
        if (!setPos) {
          console.error(`Occurrence position for "${occurrence}" not found.`);
          return;
        }

        const weekdayAbbr = weekdayMap[weekday];
        if (!weekdayAbbr) {
          console.error(`Weekday abbreviation for "${weekday}" not found.`);
          return;
        }

        rrule += `;BYSETPOS=${setPos};BYDAY=${weekdayAbbr}`;
      }
    }

    if (endsOnDate) {
      const formattedDate =
        dayjs(endsOnDate).utc().format("YYYYMMDDTHHmmss") + "Z";
      rrule += `;UNTIL=${formattedDate}`;
    } else if (endsAfterOccurrences) {
      rrule += `;COUNT=${endsAfterOccurrences}`;
    }

    const recurrence = [`RRULE:${rrule}`];
    if (eventsInfoModal) {
      setSelectedEvent((prev: any) => ({ ...prev, recurrence }));
    }
    setToCreateRecurrence(recurrence);
    setCreateRecurrenceModal(false);
  };

  function parseRRule(rrule: string): string {
    const part = rrule.split(":");
    const ruleParts = part[1].split(";");
    let frequency = "";
    let interval = 1;
    let days: string[] = [];
    let untilDate = "";
    let occurrences = 0;
    let monthlyOption = "";

    ruleParts.forEach((part) => {
      const [key, value] = part.split("=");
      switch (key) {
        case "FREQ":
          switch (value) {
            case "DAILY":
              frequency = "day";
              break;
            case "WEEKLY":
              frequency = "week";
              break;
            case "MONTHLY":
              frequency = "month";
              break;
            case "YEARLY":
              frequency = "year";
              break;
          }
          break;
        case "INTERVAL":
          interval = parseInt(value);
          break;
        case "BYDAY":
          days = value.split(",");
          break;
        case "UNTIL":
          const parsedDate = dayjs(value, "YYYYMMDDTHHmmss[Z]", true);
          untilDate = parsedDate.isValid()
            ? parsedDate.format("MMM D, YYYY")
            : "";
          break;
        case "COUNT":
          occurrences = parseInt(value);
          break;
        case "BYMONTHDAY":
          monthlyOption = `Monthly on day ${value}`;
          break;
        case "BYSETPOS":
          const setPos = parseInt(value);
          const weekday = ruleParts
            .find((part) => part.startsWith("BYDAY"))
            ?.split("=")[1];
          const weekdayMap: { [key: string]: string } = {
            MO: "Monday",
            TU: "Tuesday",
            WE: "Wednesday",
            TH: "Thursday",
            FR: "Friday",
            SA: "Saturday",
            SU: "Sunday",
          };
          if (weekday) {
            monthlyOption = `Monthly on the ${
              ["first", "second", "third", "fourth", "fifth"][setPos - 1]
            } ${weekdayMap[weekday]}`;
          }
          break;
      }
    });

    const daysMap: { [key: string]: string } = {
      MO: "Monday",
      TU: "Tuesday",
      WE: "Wednesday",
      TH: "Thursday",
      FR: "Friday",
      SA: "Saturday",
      SU: "Sunday",
    };

    const formattedDays = days.map((day) => daysMap[day]).join(", ");

    let recurrenceString = "";

    if (monthlyOption) {
      recurrenceString = monthlyOption;
    } else {
      if (frequency) {
        recurrenceString = `Every ${
          interval > 1 ? interval + " " : ""
        }${frequency}`;
        if (formattedDays) {
          recurrenceString += ` on ${formattedDays}`;
        }
      }
    }

    if (untilDate) {
      recurrenceString += `, until ${untilDate}`;
    } else if (occurrences > 0) {
      recurrenceString += `, ${occurrences} times`;
    }

    return recurrenceString.charAt(0).toUpperCase() + recurrenceString.slice(1);
  }

  const formatEventDate = (start: string, end: string, timezone: string) => {
    const startDate = dayjs(start).tz(timezone);
    const endDate = dayjs(end).tz(timezone);

    const isSameDay = startDate.isSame(endDate, "day");
    const isSameMonth = startDate.isSame(endDate, "month");
    const isSameYear = startDate.isSame(endDate, "year");

    const dayFormat = "dddd, MMMM D";
    const timeFormat = "h:mm A";

    const timeRange = `${startDate.format(timeFormat)} – ${endDate.format(
      timeFormat
    )}`;

    let dateRange;

    if (isSameDay) {
      dateRange = `${startDate.format(dayFormat)}`;
    } else {
      dateRange = `${startDate.format("dddd, MMMM D")} – ${endDate.format(
        "MMMM D"
      )}`;
    }

    return `${dateRange}: ${timeRange}`;
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setIsAttendeesCollapsed(true);
    setCreateRecurrenceModal(false);
    setEditRecurrenceString("");
    setModalVisible(false);
    var selectedId = clickInfo.event._def.publicId;
    var selectedEvent = events.find((event) => event.id === selectedId);
    var formattedDate = formatEventDate(
      selectedEvent.start,
      selectedEvent.end,
      selectedEvent.start.timeZone
    );
    setFormattedDisplayDate(formattedDate);
    setSelectedEvent(selectedEvent);
    setEventsInfoModal(true);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setCreateRecurrenceModal(false);
    setEditRecurrenceString("");
    setEventsInfoModal(false);
    setIsEditing(false);
    setSelectedEvent(null);
    const selectedDate = dayjs(selectInfo.startStr)
      .tz(getUserTimeZone())
      .toISOString();

    const selectedDay = dayjs(selectInfo.startStr).date();
    const dayOfWeek = dayjs(selectInfo.startStr).day();
    const nthWeekday = Math.ceil(selectedDay / 7);

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const mOptions = [
      `Monthly on day ${selectedDay}`,
      `Monthly on the ${getOrdinalSuffix(nthWeekday)} ${dayNames[dayOfWeek]}`,
    ];
    setMonthlyOptions(mOptions);
    setNewEventDate(selectedDate);
    setFormValue("start.dateTime", selectedDate);
    setModalVisible(true);
  };

  const handleStartDateChange = (date: any) => {
    const userTimeZone = getUserTimeZone();
    const rfc3339Date = dayjs(date).second(0).tz(userTimeZone).format();
    setFormValue("start.dateTime", rfc3339Date);

    const selectedDay = dayjs(date).date();
    const dayOfWeek = dayjs(date).day();
    const nthWeekday = Math.ceil(selectedDay / 7);

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const mOptions = [
      `Monthly on day ${selectedDay}`,
      `Monthly on the ${getOrdinalSuffix(nthWeekday)} ${dayNames[dayOfWeek]}`,
    ];
    setMonthlyOptions(mOptions);

    setValueCreateRecurrence("recurrence.monthlyOption", mOptions[0]);
  };

  const handleEndDateChange = (date: any) => {
    const userTimeZone = getUserTimeZone();
    const rfc3339Date = dayjs(date).second(0).tz(userTimeZone).format();
    setFormValue("end.dateTime", rfc3339Date);
  };

  const handleEditStartDateChange = (date: any) => {
    const userTimeZone = getUserTimeZone();
    const rfc3339Date = dayjs(date).second(0).tz(userTimeZone).format();
    setEditFormValue("start.dateTime", rfc3339Date);
    const selectedDay = dayjs(date).date();
    const dayOfWeek = dayjs(date).day();
    const nthWeekday = Math.ceil(selectedDay / 7);

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const mOptions = [
      `Monthly on day ${selectedDay}`,
      `Monthly on the ${getOrdinalSuffix(nthWeekday)} ${dayNames[dayOfWeek]}`,
    ];
    setMonthlyOptions(mOptions);

    setValueCreateRecurrence("recurrence.monthlyOption", mOptions[0]);
  };

  const handleEditEndDateChange = (date: any) => {
    const userTimeZone = getUserTimeZone();
    const rfc3339Date = dayjs(date).second(0).tz(userTimeZone).format();
    setEditFormValue("end.dateTime", rfc3339Date);
  };

  const handleAddAttendee = () => {
    const newEmail = getCreateValues(
      `attendees.${createFields.length - 1}.email`
    );
    if (validateEmail(newEmail)) {
      createAppend({ email: "" });
      setListView(true);
    } else {
      toast.error("Please enter a valid email!");
      return;
    }
  };

  const handleEditAddAttendee = () => {
    const newEmail = getEditValues(`attendees.${editFields.length - 1}.email`);
    if (validateEmail(newEmail)) {
      editAppend({ email: "" });
      setEditListView(true);
    } else {
      toast.error("Please enter a valid email!");
      return;
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const renderEventContent = (eventContent: EventContentArg) => {
    console.log(eventContent);
  return (
      <>
        <div
          className={`flex items-center gap-1 w-full h-full rounded-md px-1 hover:cursor-pointer group transition-all duration-100`}
          style={{ backgroundColor: eventContent.backgroundColor }}
        >
          <b className="text-white/80 group-hover:text-white transition-all duration-100">
            {eventContent?.timeText}
          </b>
          <p className="truncate text-white/80 group-hover:text-white transition-all duration-100 font-medium">
            {eventContent.event.title}
          </p>
        </div>
      </>
    );
  };

  const convertToUserTimezone = (dateTime: string, userTimezone: string) => {
    return dayjs.tz(dateTime, "UTC").tz(userTimezone).format();
  };

  const fetchEvents = useCallback(async () => {
    try {
      const currentMonth = dayjs(infoStartStr).month() + 1;
      const currentYear = dayjs(infoStartStr).year();

      let formattedEvents: any[] = [];

      try {
        const updatedEvents = await getCalendarEvents({
          user_email: sessionStorage.getItem("googleEmail") || "",
          month: currentMonth,
          year: currentYear,
        });

        formattedEvents = updatedEvents.map((event: any) => ({
          id: event.id,
          title: event.summary,
          start: convertToUserTimezone(
            event.start.dateTime,
            event.start.timeZone
          ),
          color: "#4285F4",
          end: convertToUserTimezone(event.end.dateTime, event.end.timeZone),
          extendedProps: {
            location: event.location,
            description: event.description,
            attendees: event.attendees,
          },
          recurrence: event.recurrence,
        }));
      } catch (error) {
        console.warn("Google Calendar events could not be fetched:", error);
      }

      const response = await getActivityByUser({
        user_id: Number(loginResponse.id),
        company_id: Number(loginResponse.company_id),
        role_id: Number(loginResponse.role_id), 
        customer_company_id: 0,
      });

      const formattedActivityEvents = response
        .map((activity: any) => {
          //@ts-ignore
          const startDateTime = dayjs(activity.date).set({
            hour: Number(activity.time.split(":")[0]),
            minute: Number(activity.time.split(":")[1]),
            second: Number(activity.time.split(":")[2] || 0),
          });

          if (!startDateTime.isValid()) {
            console.error("Invalid date/time format for activity:", activity);
            return null;
          }

          return {
            id: `activity-${activity.id}`,
            title: activity.activity,
            start: startDateTime.toISOString(),
            end: startDateTime.add(1, "hour").toISOString(),
            color: "#34A853",
            extendedProps: {
              description: activity.description,
              created_by: activity.created_by,
              type: activity.type,
              is_complete: activity.is_complete,
            },
          };
        })
        .filter(Boolean);

      setEvents((events) => [
        ...events,
        ...formattedEvents,
        ...formattedActivityEvents,
      ]);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }, [sessionStorage.getItem("googleEmail"), infoStartStr]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDeleteEvent = async () => {
    try {
      setIsDeleting(true);
      const payload = {
        user_email: sessionStorage.getItem("googleEmail") || "",
        eventId: selectedEvent.id,
        recurringEvent: deleteRecurring === "all" ? true : false,
      };

      await deleteCalendarEvent(payload);
      setIsDeleting(false);
      setDeleteModal(false);
      setEventsInfoModal(false);
      setSelectedEvent(null);
      toast.success("Event deleted successfully!");
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleteRecurring("this");
      setEvents([]);
      await fetchEvents();
    }
  };

  const handleDeleteClick = () => {
    setDeleteModal(true);
  };

  const handleUpdateEvent = async (values: z.infer<typeof editFormSchema>) => {
    try {
      setShowUpdateConfirmDialog(false);
      const emails =
        //@ts-ignore
        values.attendees?.filter((item) => item.email.length > 0) || [];
      const payload = {
        user_email: sessionStorage.getItem("googleEmail") || "",
        eventId: selectedEvent.id,
        updateAllInstances: multipleEvents,
        eventDetails: {
          summary: values.summary,
          location: values.location,
          description: values.description,
          start: values.start,
          end: values.end,
          attendees: emails,
          //TO BE UPDATED once backend is fixed
          recurrence: toCreateRecurrence || [],
          // recurrence: [],
        },
      };
      await updateCalendarEvent(payload);
      toast.success("Event updated successfully!");
      handleEditCancel();
      setEventsInfoModal(false);
      setToCreateRecurrence([]);
      resetCreateRecurrence();
      setSelectedEvent(null);
      setMultipleEvents(false);
      await fetchEvents();
    } catch (error) {
      toast.error("Failed to updated event");
      console.log(error);
    } finally {
    }
  };

  const handleEditRecurrenceClick = () => {
    setCreateRecurrenceModal(true);
    resetCreateRecurrence();
  };

  const handleCreateEvent = async (values: z.infer<typeof formSchema>) => {
    try {
      //@ts-ignore
      const emails = values.attendees.filter((item) => item.email.length > 0);
      const payload = {
        user_email: sessionStorage.getItem("googleEmail") || "",
        eventDetails: {
          ...values,
          attendees: emails,
          recurrence: toCreateRecurrence || [],
        },
      };
      await createCalendarEvent(payload);
      setModalVisible(false);
      toast.success("Event created successfully!");
      await fetchEvents();
    } catch (error) {
      toast.error("Failed to create event");
      console.log(error);
    }
  };

  return (
    <>
      <div
        className={cn(
          "w-full h-[50px] flex items-center border-b border-b-gray-200/75 bg-gray-50",
          isCollapsed ? "px-8" : "px-4 "
        )}
      >
        <Button variant="default" onClick={() => setModalVisible(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      <div
        className={cn(
          "w-full",
          isCollapsed ? "px-8 pt-4 pb-6" : "pt-4 pb-6 px-4"
        )}
        style={{ height: `calc(100vh - 50px)` }}
      >
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
          }}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          nowIndicator={true}
          selectable={true}
          height="100%"
          editable={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          eventColor="green"
          datesSet={(info) => {
            // console.log(info);
            setInfoStartStr(info.view.currentStart);
            setInfoEndStr(info.view.currentEnd);
          }}
        />
        
        {/* Recurrence Modal - converted to shadcn Dialog */}
        <Dialog open={recurrenceCreateModal} onOpenChange={setCreateRecurrenceModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Custom Recurrence</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-5 w-full"
              onSubmit={handleSubmitCreateRecurrence(onDone)}
            >
              <div className="mt-4 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-slate-600 text-base">Repeat every</p>
                  <Input
                    type="number"
                    className="max-w-[60px] border-none hover:border-none hover:outline-none hover:outline-offset-0 bg-gray-100 focus-visible:outline-none focus-visible:outline-offset-0 ring-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-none py-[5px] ml-2"
                    value={recurrenceValues.repeatInterval}
                    onChange={(e) =>
                      setValueCreateRecurrence(
                        "recurrence.repeatInterval",
                        Number(e.target.value)
                      )
                    }
                  />

                  <Select
                    value={recurrenceValues.repeatFrequency}
                    onValueChange={(value) =>
                      onFrequencyChange(
                        value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
                      )
                    }
                  >
                    <SelectTrigger className="w-[100px] py-[5px] bg-gray-100">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Day</SelectItem>
                      <SelectItem value="WEEKLY">Week</SelectItem>
                      <SelectItem value="MONTHLY">Month</SelectItem>
                      <SelectItem value="YEARLY">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                {showMonthlyDropdown &&
                recurrenceValues.repeatFrequency === "MONTHLY" ? (
                  <>
                    <Select
                      value={recurrenceValues.monthlyOption || ""}
                      onValueChange={(value) =>
                        setValueCreateRecurrence(
                          "recurrence.monthlyOption",
                          value
                        )
                      }
                    >
                      <SelectTrigger className="w-[80%] py-[5px] bg-gray-100">
                        <SelectValue placeholder="Select Monthly Option" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthlyOptions.map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : recurrenceValues.repeatFrequency === "WEEKLY" ? (
                  <>
                    <p className="text-slate-600 text-base">Repeat on</p>
                    <div className="flex space-x-2">
                      {[
                        { value: "SU", label: "S" },
                        { value: "MO", label: "M" },
                        { value: "TU", label: "T" },
                        { value: "WE", label: "W" },
                        { value: "TH", label: "T" },
                        { value: "FR", label: "F" },
                        { value: "SA", label: "S" },
                      ].map(({ value, label }) => (
                        <div
                          key={value}
                          className={`cursor-pointer rounded-full p-2 w-8 h-8 flex items-center justify-center ${
                            //@ts-ignore
                            recurrenceValues.repeatOnDays.includes(value)
                              ? "bg-blue-500 text-white"
                              : " text-slate-600 bg-gray-100"
                          }`}
                          onClick={() => {
                            const currentDays =
                              recurrenceValues.repeatOnDays || [];
                            //@ts-ignore
                            if (currentDays.includes(value)) {
                              setValueCreateRecurrence(
                                "recurrence.repeatOnDays",
                                currentDays.filter((d) => d !== value)
                              );
                            } else {
                              setValueCreateRecurrence(
                                "recurrence.repeatOnDays",
                                [
                                  ...currentDays,
                                  value as
                                    | "SU"
                                    | "MO"
                                    | "TU"
                                    | "WE"
                                    | "TH"
                                    | "FR"
                                    | "SA",
                                ]
                              );
                            }
                          }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
    <div>
                <div className="flex flex-col gap-4 mt-6">
                  <p className="text-base text-slate-600">Ends</p>
                  <div className="">
                    <RadioGroup
                      defaultValue={recurrenceValues.radioOptions}
                      onValueChange={(value) => {
                        if (value === "never") {
                          setValueCreateRecurrence(
                            "recurrence.radioOptions",
                            "never"
                          );
                          setDisableRecurrenceDate(true);
                          setDisableOccurencs(true);
                          setValueCreateRecurrence(
                            "recurrence.endsOnDate",
                            null
                          );
                          setValueCreateRecurrence(
                            "recurrence.endsAfterOccurrences",
                            null
                          );
                        } else if (value === "onDate") {
                          setValueCreateRecurrence(
                            "recurrence.radioOptions",
                            "onDate"
                          );
                          setDisableRecurrenceDate(false);
                          setDisableOccurencs(true);
                          setValueCreateRecurrence(
                            "recurrence.endsAfterOccurrences",
                            null
                          );
                        } else if (value === "afterOccurences") {
                          setValueCreateRecurrence(
                            "recurrence.radioOptions",
                            "afterOccurences"
                          );
                          setDisableRecurrenceDate(true);
                          setDisableOccurencs(false);
                          setValueCreateRecurrence(
                            "recurrence.endsOnDate",
                            null
                          );
                        }
                      }}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="never" id="never-one" />
                        <Label htmlFor="never-one">Never</Label>
    </div>
                      <div className="grid grid-cols-3">
                        <div className="flex items-center space-x-2 col-span-1">
                          <RadioGroupItem value="onDate" id="ondate-one" />
                          <Label htmlFor="ondate-one">On</Label>
                        </div>
                        <div className="col-span-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "ml-2 w-[75%] justify-start text-left font-normal bg-gray-100",
                                  !recurrenceValues.endsOnDate && "text-muted-foreground",
                                  disableRecurrenceDate && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={disableRecurrenceDate}
                              >
                                {recurrenceValues.endsOnDate
                                  ? dayjs(recurrenceValues.endsOnDate).format("MM/DD/YYYY")
                                  : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={
                                  recurrenceValues.endsOnDate
                                    ? new Date(recurrenceValues.endsOnDate)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  setValueCreateRecurrence(
                                    "recurrence.endsOnDate",
                                    date ? date.toISOString() : null
                                  )
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="flex items-center space-x-2 col-span-1">
                          <RadioGroupItem
                            value="afterOccurences"
                            id="afteroccurences-one"
                          />
                          <Label htmlFor="afteroccurences-one">After</Label>
                        </div>
                        <div className="bg-gray-100 flex items-center gap-1 col-span-2 justify-between px-2 pb-[2px] w-[75%] ml-2 rounded-md pt-[1px]">
                          <p className="text-slate-600">Occurences:</p>
                          <input
                            type="number"
                            className="focus-visible:border-none focus-visible:outline-none ml-2 bg-gray-100 rounded-md w-[50px] text-slate-600 disabled:cursor-not-allowed flex-1"
                            {...registerCreateRecurrence(
                              "recurrence.endsAfterOccurrences"
                            )}
                            disabled={
                              !recurrenceValues.endsAfterOccurrences &&
                              disableOccurencs
                            }
                          />
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-transparent hover:bg-gray-100"
                  onClick={() => {
                    setCreateRecurrenceModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className=""
                  size="sm"
                >
                  Done
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Events Info Modal - converted to shadcn Dialog */}
        <Dialog open={eventsInfoModal} onOpenChange={setEventsInfoModal}>
          <DialogContent className={cn(
            "w-full max-w-lg pb-4 overflow-hidden",
            isEditing ? "bg-background" : "bg-slate-50"
          )}>
            <DialogHeader>
              <div className="flex items-center justify-start gap-3 flex-row-reverse">
                {selectedEvent?.id?.includes("activity") ? null : (
                  <div className="hover:bg-gray-200 transition-all duration-100 cursor-pointer px-1 py-1 rounded-full">
                    <Trash2
                      className="h-5 w-5 text-gray-600"
                      onClick={handleDeleteClick}
                    />
                  </div>
                )}
                {selectedEvent?.id?.includes(
                  "activity"
                ) ? null : !isEditing ? (
                  <div className="hover:bg-gray-200 transition-all duration-100 cursor-pointer px-1 py-1 rounded-full">
                    <Edit
                      className="h-5 w-5 text-gray-600"
                      onClick={handleEditClick}
                    />
                  </div>
                ) : (
                  <div className="hover:bg-gray-200 transition-all duration-100 cursor-pointer px-1 py-1 rounded-full">
                    <XCircle
                      className="h-5 w-5 text-gray-600"
                      onClick={handleEditCancel}
                    />
                  </div>
                )}
              </div>
            </DialogHeader>
            <div className="flex flex-col items-start mt-3 pb-3 overflow-hidden">
              {isEditing ? (
                <>
                  <Form {...editForm}>
                    <form
                      onSubmit={editForm.handleSubmit(handleUpdateEvent)}
                      className="space-y-5 w-full relative pb-10"
                    >
                      <FormField
                        control={editForm.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="w-full pl-20 pr-6">
                                <input
                                  className="border-b-2 border-gray-500 w-full focus-visible:outline-none focus-visible:border-blue-500 transition-colors duration-100 pr-1 leading-2 text-2xl placeholder-gray-500 focus-visible:placeholder-gray-400 pb-[1px] disabled:cursor-not-allowed "
                                  placeholder="Edit title"
                                  {...field}
                                  disabled={isEditFormLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="pl-20" />
                          </FormItem>
                        )}
                      />

                      <div className="mt-8 flex flex-col gap-y-4">
                        <div className="flex flex-col w-full gap-y-4">
                          <div className="w-[90%] flex flex-row items-center gap-1">
                            <div className="flex items-center justify-center min-w-[80px] w-[80px]">
                              <div className="rounded-full h-4 w-4 object-cover text-gray-600">
                                <Clock className="h-4 w-4" />
                              </div>
                            </div>
                            <FormField
                              control={editForm.control}
                              name="start.dateTime"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <div className="flex items-center">
                                    <FormControl>
                                      <DateTimePicker
                                        value={field.value}
                                        onChange={(date) => {
                                          if (date === null) {
                                            editForm.setValue("start.dateTime", "");
                                          } else if (date && dayjs(date).isValid()) {
                                            const endDate = editForm.getValues("end.dateTime");
                                            if (endDate && dayjs(date).isAfter(dayjs(endDate))) {
                                              toast.error("Start date cannot be after the end date.");
                                            } else {
                                              handleEditStartDateChange(date);
                                            }
                                          }
                                        }}
                                        disabled={isEditFormLoading}
                                        placeholder="Start Date"
                                      />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex items-center justify-center h-4 w-4 object-cover mr-1">
                              <Minus className="h-4 w-4" />
                            </div>

                            <FormField
                              control={editForm.control}
                              name="end.dateTime"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl className="w-full">
                                    <DateTimePicker
                                      value={field.value}
                                      onChange={(date) => {
                                        if (date === null) {
                                          editForm.setValue("end.dateTime", "");
                                        } else if (date && dayjs(date).isValid()) {
                                          const startDate = editForm.getValues("start.dateTime");
                                          if (startDate && dayjs(date).isBefore(dayjs(startDate))) {
                                            toast.error("End date cannot be before the start date.");
                                          } else {
                                            handleEditEndDateChange(date);
                                          }
                                        }
                                      }}
                                      disabled={isEditFormLoading}
                                      placeholder="End Date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div
                            className="ml-[80px] py-[2px] rounded-sm px-2 text-slate-500 hover:bg-gray-200 hover:cursor-pointer hover:text-slate-700 transition-all flex items-center justify-center -mt-2 w-fit"
                            onClick={handleEditRecurrenceClick}
                            role="button"
                          >
                            <p>
                              {selectedEvent?.recurrence?.length > 0
                                ? parseRRule(selectedEvent.recurrence[0])
                                : "Custom"}
                            </p>
                          </div>
                          <FormField
                            control={editForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center">
                                  <div className="flex items-center justify-center min-w-[80px] w-[80px]">
                                    <div className="object-cover">
                                      <MapPin className="h-5 w-5 text-gray-600" />
                                    </div>
                                  </div>
                                  <FormControl>
                                    <input
                                      disabled={isEditFormLoading}
                                      {...field}
                                      className="border-b-none focus-visible:outline-none placeholder:py-auto placeholder-gray-500 focus-visible:placeholder-gray-400 text-base py-1 focus-visible:border-b-2 focus:border-b focus-visible:border-b-blue-400 transition-colors duration-100 w-[55%] hover:cursor-pointer hover:bg-gray-200 hover:rounded-sm hover:placeholder:px-1 
                              placeholder:px-1 focus-visible:placeholder:px-0 focus-visible:bg-transparent focus-visible:cursor-auto focus-visible:rounded-none placeholder-text-base disabled:cursor-not-allowed"
                                      placeholder="Edit Location"
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage className="pl-[80px]" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center">
                                  <div className="flex items-center justify-center min-w-[80px] w-[80px]">
                                    <div className="object-cover">
                                      <AlignLeft className="h-5 w-5 text-gray-600" />
                                    </div>
                                  </div>
                                  <FormControl>
                                    <input
                                      {...field}
                                      className="border-b-none focus-visible:outline-none placeholder:py-auto placeholder-gray-500 focus-visible:placeholder-gray-400 text-base py-1 focus-visible:border-b-2 focus:border-b focus-visible:border-b-blue-400 transition-colors duration-100 w-[55%] hover:cursor-pointer hover:bg-gray-200 hover:rounded-sm hover:placeholder:px-1 
                              placeholder:px-1 focus-visible:placeholder:px-0 focus-visible:bg-transparent focus-visible:cursor-auto focus-visible:rounded-none placeholder-text-base disabled:cursor-not-allowed "
                                      placeholder="Edit description"
                                      disabled={isEditFormLoading}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="w-full flex items-center overflow-hidden">
                            <div className="flex items-center justify-center min-w-[80px] w-[80px]">
                              <div className="rounded-full h-5 w-5 object-cover text-gray-600">
                                <Users className="h-5 w-5" />
                              </div>
                            </div>
                            {editListView ? (
                              <>
                                <div className="flex items-center w-full relative justify-between overflow-hidden pr-8">
                                  <div className="max-w-[90%] flex items-center gap-1 min-w-[90%] w-[90%] overflow-x-hidden">
                                    <div className="w-full overflow-x-auto flex mr-8">
                                      {editFields.map((item, idx) => {
                                        if (!item.email) return null;
                                        return (
                                          <div
                                            key={idx}
                                            className="relative w-fit rounded-lg bg-gray-200/80 px-[8px] py-[2px]"
                                          >
                                            <p className="text-sm text-gray-600">
                                              {item.email}
                                            </p>
                                            <div
                                              role="button"
                                              aria-disabled={
                                                isEditFormLoading
                                              }
                                              className="h-1 w-1 absolute -top-[2px] right-[4px] disabled:cursor-not-allowed disabled:bg-gray-200"
                                              onClick={() =>
                                                editRemove(idx)
                                              }
                                            >
                                              <X className="text-gray-600 h-3 w-3" />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <button
                                    className="hover:bg-gray-300/60 rounded-full px-[2px] py-[2px] disabled:cursor-not-allowed disabled:bg-gray-200"
                                    disabled={isEditFormLoading}
                                    onClick={() => {
                                      setEditListView(false);
                                      editAppend({ email: "" });
                                    }}
                                  >
                                    <Plus className="h-5 w-5 text-gray-600" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between w-full pr-8">
                                <FormField
                                  key={
                                    editFields[editFields.length - 1]?.id
                                  }
                                  control={editForm.control}
                                  name={`attendees.${
                                    editFields.length - 1
                                  }.email`}
                                  render={({ field }) => (
                                    <FormItem className="w-full">
                                      <FormControl>
                                        <input
                                          type="email"
                                          disabled={isEditFormLoading}
                                          {...field}
                                          className="border-b-none focus-visible:outline-none placeholder:py-auto placeholder-gray-500 focus-visible:placeholder-gray-400 text-base py-1 focus-visible:border-b-2 focus:border-b focus-visible:border-b-blue-400 transition-colors duration-100 w-[80%] hover:cursor-pointer hover:bg-gray-200 hover:rounded-sm hover:placeholder:px-1 
                              placeholder:px-1 focus-visible:placeholder:px-0 focus-visible:bg-transparent focus-visible:cursor-auto focus-visible:rounded-none placeholder-text-base disabled:cursor-not-allowed "
                                          placeholder="Add attendee"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <button
                                  className="bg-blue-500 py-[1px] rounded-md text-white text-xs px-4 hover:bg-blue-600 transition-all duration-100 disabled:cursor-not-allowed disabled:bg-blue-400"
                                  type="button"
                                  disabled={isEditFormLoading}
                                  onClick={handleEditAddAttendee}
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowUpdateConfirmDialog(true);
                        }}
                        type="button"
                        className="absolute bottom-0 right-8 bg-blue-500 py-[1px] rounded-md text-white text-lg px-4 hover:bg-blue-600 transition-all duration-100 disabled:cursor-not-allowed disabled:bg-blue-400"
                        disabled={isEditFormLoading}
                      >
                        {isEditFormLoading ? "Updating..." : "Update"}
                      </button>
                      <Dialog
                        open={showUpdateConfirmDialog}
                        onOpenChange={() =>
                          setShowUpdateConfirmDialog(false)
                        }
                      >
                        <DialogContent className="max-w-[300px]">
                          <div className="flex flex-col gap-2">
                            <p className="text-gray-700 text-lg">
                              Edit recurring event
                            </p>
                            <div className="mt-4">
                              <RadioGroup
                                onValueChange={(value) => {
                                  if (value === "THIS") {
                                    setMultipleEvents(false);
                                  } else {
                                    setMultipleEvents(true);
                                  }
                                }}
                                disabled={isEditFormLoading}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="THIS"
                                    id="this-event"
                                  />
                                  <Label htmlFor="this-event">
                                    This event
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <RadioGroupItem
                                    value="ALL"
                                    id="all-events"
                                  />
                                  <Label htmlFor="all-events">
                                    All events
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                            <p className="text-sm">
                              Note: Changed recurrence? Select All events
                            </p>
                            <div className="mt-2">
                              <div className="flex flex-row items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="hover:bg-gray-200"
                                  onClick={() => {
                                    setShowUpdateConfirmDialog(false);
                                    setMultipleEvents(false);
                                  }}
                                  disabled={isEditFormLoading}
                                  type="button"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  type="submit"
                                  disabled={isEditFormLoading}
                                  onClick={() => {
                                    editForm.trigger();
                                    if (editForm.formState.isValid)
                                      handleUpdateEvent(
                                        editForm.getValues()
                                      );
                                  }}
                                >
                                  OK
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </form>
                  </Form>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2 items-start mt-3 pb-3 overflow-hidden w-full">
                    <div className="flex items-start">
                      <div className="min-w-[60px] flex items-center justify-center mt-2">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-sm",
                            selectedEvent?.id?.includes("activity")
                              ? "bg-green-600"
                              : "bg-blue-600"
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col">
                          <p className="text-2xl text-gray-800">
                            {selectedEvent?.title}
                          </p>
                          <p className="text-base mt-1 text-gray-600">
                            {formattedDisplayDate}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!selectedEvent?.id?.includes("activity") && (
                      <>
                        <div className="flex items-center">
                          <div className="min-w-[60px] flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            {selectedEvent?.extendedProps?.location ? (
                              <p className="text-base text-gray-700">
                                {selectedEvent.extendedProps.location}
                              </p>
                            ) : (
                              <div className="text-sm px-2 py-1 bg-gray-200/40 text-gray-600 rounded-md">
                                Not provided
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start mt-2 w-full">
                          <div className="min-w-[60px] flex items-center justify-center mt-[6px]">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1 flex flex-row flex-wrap gap-2">
                            {selectedEvent?.extendedProps?.attendees && (
                              <div className="w-[90%] flex flex-col">
                                <div
                                  className="px-2 w-full bg-gray-200/40 text-gray-600 hover:text-gray-700 rounded-sm py-1 hover:cursor-pointer hover:bg-gray-200/60 transition-all duration-200 flex items-center justify-between group"
                                  role="button"
                                  onClick={() =>
                                    setIsAttendeesCollapsed((prev) => !prev)
                                  }
                                >
                                  <p className="select-none">
                                    {
                                      selectedEvent.extendedProps?.attendees
                                        ?.length
                                    }{" "}
                                    attendees
                                  </p>
                                  <div className="h-5 w-5">
                                    <ChevronDown
                                      className={cn(
                                        "h-5 w-5  transtion-all duration-300 text-gray-600 group-hover:text-gray-700",
                                        isAttendeesCollapsed
                                          ? "-rotate-90"
                                          : "rotate-0"
                                      )}
                                    />
                                  </div>
                                </div>
                                {!isAttendeesCollapsed && (
                                  <div className="flex flex-col gap-1 px-2 pt-1 bg-gray-200/40 border-t border-gray-400">
                                    {selectedEvent.extendedProps
                                      ?.attendees && (
                                      <p className="text-gray-600">
                                        {selectedEvent.extendedProps.attendees
                                          .map(
                                            (attendee: any) =>
                                              attendee.email
                                          )
                                          .join(", ")}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {!selectedEvent?.extendedProps?.attendees
                              ?.length && (
                              <div className="text-sm px-2 py-1 bg-gray-200/40 text-gray-600 rounded-md">
                                No attendees
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Event Modal - converted to shadcn Dialog */}
        <Dialog open={modalVisible} onOpenChange={setModalVisible}>
          <DialogContent className="w-full max-w-lg pb-4 overflow-hidden">
            <DialogHeader>
              <div className="h-7 bg-gray-200 w-full relative">
                <div
                  role="button"
                  aria-disabled={isCreateFormLoading}
                  className="absolute top-[50%] -translate-y-[50%] right-2"
                >
                  <X
                    className="h-5 w-5 text-gray-700 cursor-pointer"
                    onClick={() => {
                      setModalVisible(false);
                      setMonthlyOptions([]);
                      setToCreateRecurrence([]);

                      resetCreateRecurrence();
                      form.reset();
                    }}
                  />
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-col items-start mt-3 pb-3 overflow-hidden">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateEvent)}
                  className="space-y-5 w-full relative pb-10"
                >
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="w-full pl-20 pr-6">
                            <input
                              disabled={isCreateFormLoading}
                              className="border-b-2 border-gray-500 w-full focus-visible:outline-none focus-visible:border-blue-500 transition-colors duration-100 pr-1 leading-2 text-2xl placeholder-gray-500 focus-visible:placeholder-gray-400 pb-[1px] disabled:cursor-not-allowed "
                              placeholder="Add Title"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="pl-20" />
                      </FormItem>
                    )}
                  />
                  <div className="mt-8 flex flex-col gap-y-4">
                    <div className="flex flex-col w-full gap-y-4">
                      <div className="w-[90%] flex flex-row items-center gap-1">
                        <div className="flex items-center justify-center min-w-[80px] w-[80px]">
                          <div className="rounded-full h-4 w-4 object-cover text-gray-600">
                            <Clock className="h-4 w-4" />
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name="start.dateTime"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <div className="flex items-center">
                                <FormControl>
                                  <DateTimePicker
                                    value={field.value || newEventDate}
                                    onChange={(date) => {
                                      if (date === null) {
                                        setNewEventDate(null);
                                        form.setValue("start.dateTime", "");
                                      } else if (date && dayjs(date).isValid()) {
                                        const endDate = form.getValues("end.dateTime");
                                        if (endDate && dayjs(date).isAfter(dayjs(endDate))) {
                                          toast.error("Start date cannot be after the end date.");
                                        } else {
                                          handleStartDateChange(date);
                                        }
                                      }
                                    }}
                                    disabled={isCreateFormLoading}
                                    placeholder="Start Date"
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-center justify-center h-4 w-4 object-cover mr-1">
                          <Minus className="h-4 w-4" />
                        </div>

                        <FormField
                          control={form.control}
                          name="end.dateTime"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl className="w-full">
                                <DateTimePicker
                                  value={field.value}
                                  onChange={(date) => {
                                    if (date === null) {
                                      setNewEventDate(null);
                                      form.setValue("end.dateTime", "");
                                    } else if (date && dayjs(date).isValid()) {
                                      const startDate = form.getValues("start.dateTime");
                                      if (startDate && dayjs(date).isBefore(dayjs(startDate))) {
                                        toast.error("End date cannot be before the start date.");
                                      } else {
                                        handleEndDateChange(date);
                                      }
                                    }
                                  }}
                                  disabled={isCreateFormLoading}
                                  placeholder="End Date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div
                        className={cn(
                          "ml-[80px] py-[2px] rounded-sm px-2 text-slate-500 hover:bg-gray-200 hover:cursor-pointer transition-all flex items-center justify-center -mt-2 w-fit",
                          toCreateRecurrence?.length > 0
                            ? "text-slate-500 hover:bg-gray-200 hover:text-slate-700"
                            : "bg-cyan-600 text-white hover:bg-cyan-700"
                        )}
                        onClick={() => {
                          setCreateRecurrenceModal(true);
                        }}
                        role="button"
                      >
                        <p>
                          {toCreateRecurrence?.length > 0
                            ? parseRRule(toCreateRecurrence[0])
                            : "Custom"}
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center">
                              <div className="flex items-center justify-center min-w-[80px] w-[80px]">
                                <div className="object-cover">
                                  <MapPin className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  disabled={isCreateFormLoading}
                                  {...field}
                                  className="border-b-none focus-visible:outline-none placeholder:py-auto placeholder-gray-500 focus-visible:placeholder-gray-400 text-base py-1 focus-visible:border-b-2 focus:border-b focus-visible:border-b-blue-400 transition-colors duration-100 w-[55%] hover:cursor-pointer hover:bg-gray-200 hover:rounded-sm hover:placeholder:px-1 
                              placeholder:px-1 focus-visible:placeholder:px-0 focus-visible:bg-transparent focus-visible:cursor-auto focus-visible:rounded-none placeholder-text-base disabled:cursor-not-allowed"
                                  placeholder="Add Location"
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="pl-[80px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center">
                              <div className="flex items-center justify-center min-w-[80px] w-[80px]">
                                <div className="object-cover">
                                  <AlignLeft className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  {...field}
                                  className="border-b-none focus-visible:outline-none placeholder:py-auto placeholder-gray-500 focus-visible:placeholder-gray-400 text-base py-1 focus-visible:border-b-2 focus:border-b focus-visible:border-b-blue-400 transition-colors duration-100 w-[55%] hover:cursor-pointer hover:bg-gray-200 hover:rounded-sm hover:placeholder:px-1 
                              placeholder:px-1 focus-visible:placeholder:px-0 focus-visible:bg-transparent focus-visible:cursor-auto focus-visible:rounded-none placeholder-text-base disabled:cursor-not-allowed "
                                  placeholder="Add description"
                                  disabled={isCreateFormLoading}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="w-full flex items-center overflow-hidden">
                        <div className="flex items-center justify-center min-w-[80px] w-[80px]">
                          <div className="rounded-full h-5 w-5 object-cover text-gray-600">
                            <Users className="h-5 w-5" />
                          </div>
                        </div>
                        {listView ? (
                          <>
                            <div className="flex items-center w-full relative justify-between overflow-hidden pr-8">
                              <div className="max-w-[90%] flex items-center gap-1 min-w-[90%] w-[90%] overflow-x-hidden">
                                <div className="w-full overflow-x-auto flex mr-8">
                                  {createFields.map((item, idx) => {
                                    if (!item.email) return null;
                                    return (
                                      <div
                                        key={idx}
                                        className="relative w-fit rounded-lg bg-gray-200/80 px-[8px] py-[2px]"
                                      >
                                        <p className="text-sm text-gray-600">
                                          {item.email}
                                        </p>
                                        <div
                                          role="button"
                                          aria-disabled={
                                            isCreateFormLoading
                                          }
                                          className="h-1 w-1 absolute -top-[2px] right-[4px] disabled:cursor-not-allowed disabled:bg-gray-200"
                                          onClick={() => createRemove(idx)}
                                        >
                                          <X className="text-gray-600 h-3 w-3" />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <button
                                className="hover:bg-gray-300/60 rounded-full px-[2px] py-[2px] disabled:cursor-not-allowed disabled:bg-gray-200"
                                disabled={isCreateFormLoading}
                                onClick={() => {
                                  setListView(false);
                                  createAppend({ email: "" });
                                }}
                              >
                                <Plus className="h-5 w-5 text-gray-600" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between w-full pr-8">
                            <FormField
                              key={
                                createFields[createFields.length - 1]?.id
                              }
                              control={form.control}
                              name={`attendees.${
                                createFields.length - 1
                              }.email`}
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormControl>
                                    <input
                                      disabled={isCreateFormLoading}
                                      type="email"
                                      {...field}
                                      className="border-b-none focus-visible:outline-none placeholder:py-auto placeholder-gray-500 focus-visible:placeholder-gray-400 text-base py-1 focus-visible:border-b-2 focus:border-b focus-visible:border-b-blue-400 transition-colors duration-100 w-[80%] hover:cursor-pointer hover:bg-gray-200 hover:rounded-sm hover:placeholder:px-1 
                              placeholder:px-1 focus-visible:placeholder:px-0 focus-visible:bg-transparent focus-visible:cursor-auto focus-visible:rounded-none placeholder-text-base disabled:cursor-not-allowed"
                                      placeholder="Add attendee"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <button
                              className="bg-blue-500 py-[1px] rounded-md text-white text-xs px-4 hover:bg-blue-600 transition-all duration-100 disabled:cursor-not-allowed disabled:bg-blue-400"
                              type="button"
                              disabled={isCreateFormLoading}
                              onClick={handleAddAttendee}
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="absolute bottom-0 right-8 bg-blue-500 py-[1px] rounded-md text-white text-lg px-4 hover:bg-blue-600 transition-all duration-100"
                    disabled={isCreateFormLoading}
                  >
                    {isCreateFormLoading ? "Saving..." : "Save"}
                  </button>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteModal} onOpenChange={() => setDeleteModal(false)}>
          <DialogContent className="bg-white text-black overflow-hidden p-0">
            <DialogHeader className="pt-8 px-6">
              <DialogTitle className="text-2xl text-center font-bold">
                Delete Event
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-700">
                Are you sure you want to do this? <br />
                This event will be permanently deleted.
              </DialogDescription>
              {selectedEvent?.recurrence?.length > 0 && (
                <div>
                  <Select
                    value={deleteRecurring}
                    defaultValue="this"
                    onValueChange={(e) => setDeleteRecurring(e)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select events to delete" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={"this"}>This event</SelectItem>
                      <SelectItem value={"all"}>
                        All recurring events of this type
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </DialogHeader>
            <DialogFooter className="bg-gray-100 px-3 py-2">
              <div className="flex items-center justify-between w-full">
                <Button
                  disabled={isDeleting}
                  onClick={() => setDeleteModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isDeleting}
                  onClick={handleDeleteEvent}
                  size="sm"
                >
                  Confirm
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default SchedulingPage;