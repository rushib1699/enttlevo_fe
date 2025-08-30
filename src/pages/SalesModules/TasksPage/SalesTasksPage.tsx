import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import {
    createActivity,
    getActivityByUser,
    updateActivityStatus,
    updateActivity,
} from "@/api";

// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

// Icons
import {
    Calendar as CalendarIcon,
    Clock,
    Plus,
    CheckCircle2,
    ListTodo,
    Edit3,
    Check,
    Phone,
    Users,
    RefreshCw,
    Mail,
    MessageSquare,
    Loader2,
    User,
    Target,
} from 'lucide-react';

// Types
type ActivityType = "call" | "meeting" | "followup" | "mail" | "message" | "task";

interface Activity {
    id: number;
    title: string;
    date: string;
    time: string;
    is_complete: boolean;
    leads_id: number;
    type: ActivityType;
    description: string;
    created_by: string;
    created_at: string;
}

interface ActivityFormData {
    title: string;
    type: ActivityType;
    description: string;
    date: Date | null;
    time: string;
}

// Activity Type Configuration
const ACTIVITY_TYPES: Record<ActivityType, {
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    label: string;
}> = {
    call: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: <Phone className="w-4 h-4" />,
        label: 'Call'
    },
    meeting: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: <Users className="w-4 h-4" />,
        label: 'Meeting'
    },
    followup: {
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        icon: <RefreshCw className="w-4 h-4" />,
        label: 'Follow Up'
    },
    mail: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: <Mail className="w-4 h-4" />,
        label: 'Email'
    },
    message: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: <MessageSquare className="w-4 h-4" />,
        label: 'Message'
    },
    task: {
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        icon: <ListTodo className="w-4 h-4" />,
        label: 'Task'
    }
};

// Activity Form Component
const ActivityForm: React.FC<{
    initialValues?: Activity;
    onSubmit: (formData: ActivityFormData) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}> = ({ initialValues, onSubmit, onCancel, isSubmitting }) => {
    const [formData, setFormData] = useState<ActivityFormData>({
        title: initialValues?.title || "",
        type: initialValues?.type || "task",
        description: initialValues?.description || "",
        date: initialValues?.date ? moment(initialValues.date).toDate() : new Date(),
        time: initialValues?.time || moment().format("HH:mm"), // Default to current time in 24-hour format
    });

    // Reset form when initialValues changes
    useEffect(() => {
        setFormData({
            title: initialValues?.title || "",
            type: initialValues?.type || "task",
            description: initialValues?.description || "",
            date: initialValues?.date ? moment(initialValues.date).toDate() : new Date(),
            time: initialValues?.time || moment().format("HH:mm"),
        });
    }, [initialValues]);

    const handleSubmit = () => {
        console.log('Form data on submit:', formData); // Debug log

        // More specific validation with better error messages
        if (!formData.title.trim()) {
            toast.error("Please enter a title");
            return;
        }
        if (!formData.date) {
            toast.error("Please select a date");
            return;
        }
        if (!formData.time.trim()) {
            toast.error("Please select a time");
            return;
        }

        onSubmit(formData);
    };

    // Get today's date for minimum date constraint
    const today = new Date();

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="type">Task Type *</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value: ActivityType) =>
                            setFormData(prev => ({ ...prev, type: value }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(ACTIVITY_TYPES).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                    <div className="flex items-center space-x-2">
                                        <span className={value.color}>{value.icon}</span>
                                        <span>{value.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                        id="title"
                        placeholder="What's this task about?"
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Add more details about this task..."
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            min={today.toISOString().split('T')[0]}
                            value={formData.date ? formData.date.toISOString().split('T')[0] : today.toISOString().split('T')[0]}
                            onChange={e => {
                                const selectedDate = e.target.value ? new Date(e.target.value) : null;
                                setFormData(prev => ({ ...prev, date: selectedDate }));
                            }}
                        />
                    </div>

                    <div>
                        <Label htmlFor="time">Time *</Label>
                        <Input
                            id="time"
                            type="time"
                            value={formData.time}
                            onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                    {initialValues ? (
                        <>
                            Update
                        </>
                    ) : (
                        <>
                            Create
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

// Compact Stats Card Component
const CompactStatsCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: string;
}> = ({ icon, label, value, color = "blue" }) => (
    <Card className="hover:shadow-md transition-all duration-200 rounded-lg">
        <CardContent className="p-4">
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-${color}-50`}>
                    <div className={`text-${color}-600`}>{icon}</div>
                </div>
                <div>
                    <div className="text-lg font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                </div>
            </div>
        </CardContent>
    </Card>
);

// Main SalesTasksPage Component
const SalesTasksPage: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [loadingActivities, setLoadingActivities] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { loginResponse } = useApplicationContext();

    // Categorized activities
    const { pendingActivities, completedActivities, todayActivities } = useMemo(() => {
        const pending = activities.filter(a => !a.is_complete);
        const completed = activities.filter(a => a.is_complete);
        const today = activities.filter(a =>
            moment(a.date).isSame(moment(), 'day') && !a.is_complete
        );

        return {
            pendingActivities: pending,
            completedActivities: completed,
            todayActivities: today
        };
    }, [activities]);

    // Fetch activities
    const fetchActivities = async () => {
        try {
            setIsLoading(true);
            const response = await getActivityByUser({
                user_id: Number(loginResponse?.id),
                company_id: Number(loginResponse?.company_id),
                customer_company_id: 0,
                role_id: loginResponse?.role_id
            });

            const transformedActivities: Activity[] = response.map((activity: any) => ({
                id: activity.id,
                title: activity.activity,
                date: activity.date,
                time: activity.time
                    ? moment.utc(activity.time, "HH:mm:ss").local().format("HH:mm")
                    : "",
                is_complete: activity.is_complete || false,
                leads_id: activity.leads_id || 0,
                type: activity.type || "task",
                description: activity.description || "",
                created_by: activity.created_by || "",
                created_at: activity.created_at,
            }));

            setActivities(transformedActivities);
        } catch (error) {
            toast.error("Failed to fetch activities");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    // Reset editingActivity when sheet is closed
    useEffect(() => {
        if (!isSheetOpen) {
            setEditingActivity(null);
        }
    }, [isSheetOpen]);

    // Handlers
    const handleSubmit = async (formData: ActivityFormData) => {
        try {
            setIsSubmitting(true);

            if (editingActivity) {
                await updateActivity({
                    activity_id: editingActivity.id,
                    user_id: Number(loginResponse?.id),
                    description: formData.description,
                    date: moment(formData.date).format("YYYY-MM-DD"),
                    time: formData.time,
                    type: formData.type,
                    status: editingActivity.is_complete,
                    activity: formData.title,
                });
                toast.success("Task updated successfully!");
            } else {
                await createActivity({
                    activity: formData.title,
                    user_id: loginResponse?.id,
                    leads_id: 0,
                    date: formData.date?.toISOString(),
                    time: formData.date?.toISOString(),
                    type: formData.type,
                    description: formData.description,
                    company_id: loginResponse?.company_id,
                });
                toast.success("Task created successfully!");
            }

            setIsSheetOpen(false);
            setEditingActivity(null);
            fetchActivities();
        } catch (error) {
            toast.error(editingActivity ? "Failed to update task" : "Failed to create task");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleComplete = async (activityId: number) => {
        try {
            setLoadingActivities(prev => [...prev, activityId]);

            await updateActivityStatus({
                activity_id: activityId,
                user_id: loginResponse?.id,
                status: true,
            });

            toast.success("Task marked as completed!");
            fetchActivities();
        } catch (error) {
            toast.error("Failed to mark task as completed");
        } finally {
            setLoadingActivities(prev => prev.filter(id => id !== activityId));
        }
    };

    const handleEdit = (activity: Activity) => {
        setEditingActivity(activity);
        setIsSheetOpen(true);
    };

    // Compact Activity Card Component
    const CompactActivityCard: React.FC<{ activity: Activity }> = ({ activity }) => {
        const typeConfig = ACTIVITY_TYPES[activity.type];

        return (
            <div className="group border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white p-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                            <div className={typeConfig.color}>{typeConfig.icon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">{activity.title}</h3>
                                <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                                    {typeConfig.label}
                                </Badge>
                            </div>

                            {activity.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{activity.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    {moment(activity.date).format('MMM DD, YYYY')}
                                </span>
                                <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {activity.time}
                                </span>
                                <span className="flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    {activity.created_by}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(activity)}
                        >
                            <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleComplete(activity.id)}
                            disabled={loadingActivities.includes(activity.id)}
                        >
                            {loadingActivities.includes(activity.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Check className="w-3 h-3" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // Completed Activity Card Component
    const CompletedActivityCard: React.FC<{ activity: Activity }> = ({ activity }) => (
        <div className="p-3 border border-gray-100 rounded-lg bg-gray-50">
            <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-700 line-through text-sm">{activity.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                        Completed on {moment(activity.date).format('MMM DD, YYYY')}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-50">
                <div className="">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Task Manager</h1>
                            <p className="mt-1 text-xs text-gray-500">Track and organize your daily tasks</p>
                        </div>

                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Task
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[500px] sm:w-[540px] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>{editingActivity ? 'Edit Task' : 'New Task'}</SheetTitle>
                                </SheetHeader>
                                <div className="mt-6">
                                    <ActivityForm
                                        initialValues={editingActivity}
                                        onSubmit={handleSubmit}
                                        onCancel={() => {
                                            setIsSheetOpen(false);
                                            setEditingActivity(null);
                                        }}
                                        isSubmitting={isSubmitting}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            <div className="mx-auto py-4">
                {/* Compact Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <CompactStatsCard
                        icon={<ListTodo className="h-4 w-4" />}
                        label="Active Tasks"
                        value={pendingActivities.length}
                        color="blue"
                    />
                    <CompactStatsCard
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Completed Today"
                        value={activities.filter(a =>
                            moment(a.date).isSame(moment(), 'day') && a.is_complete
                        ).length}
                        color="green"
                    />
                    <CompactStatsCard
                        icon={<Clock className="h-4 w-4" />}
                        label="Today's Tasks"
                        value={todayActivities.length}
                        color="purple"
                    />
                    <CompactStatsCard
                        icon={<Target className="h-4 w-4" />}
                        label="Total Completed"
                        value={completedActivities.length}
                        color="amber"
                    />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    {/* Left Column - Active Tasks */}
                    <div className="lg:col-span-2">
                        <Card className="rounded-lg">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Active Tasks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                    </div>
                                ) : pendingActivities.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ListTodo className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <h3 className="text-sm font-medium text-gray-900 mb-1">No active tasks</h3>
                                        <p className="text-xs text-gray-500">Create your first task to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingActivities.map(activity => (
                                            <CompactActivityCard key={activity.id} activity={activity} />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Completed Tasks */}
                    <div>
                        <Card className="rounded-lg">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Completed</CardTitle>
                                    <span className="text-sm text-gray-500">{completedActivities.length} tasks</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {completedActivities.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">No completed tasks</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 overflow-y-auto">
                                        {completedActivities.map(activity => (
                                            <CompletedActivityCard key={activity.id} activity={activity} />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesTasksPage;