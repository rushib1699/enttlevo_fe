import React, { useEffect, useState } from 'react'
import {
    createActivity,
    getActivityByLeads,
    updateActivityStatus, 
    updateActivity,
} from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Plus, CheckCircle2, Clock, Edit, Trash2, Calendar, Mail, Phone, MessageSquare, Users, User, Loader2 } from "lucide-react";
import { format } from "date-fns";

type TasksType = "call" | "meeting" | "followup" | "mail" | "message";

interface Tasks {
    id: number;
    title: string;
    date: string;
    time: string;
    is_complete: boolean;
    description: string;
    type: TasksType;
}

interface TasksProps {
    accountId?: string;
    companyId?: number;
    user_id?: number;
    isLeadInOnboarding?: boolean;
}

const SalesTasksTab = ({ accountId, companyId, user_id, isLeadInOnboarding }: TasksProps) => {
    const [tasks, setTasks] = useState<Tasks[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Tasks | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);

    const now = new Date();
    const currentDate = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm");

    const createForm = useForm({
        defaultValues: {
            title: "",
            date: currentDate,
            time: currentTime,
            type: "call" as TasksType,
            description: ""
        }
    });

    const editForm = useForm({
        defaultValues: {
            title: "",
            date: currentDate,
            time: currentTime,
            type: "call" as TasksType,
            description: ""
        }
    });

    const getTaskIcon = (type: TasksType) => {
        switch (type) {
            case 'call': return <Phone className="h-4 w-4" />;
            case 'meeting': return <Users className="h-4 w-4" />;
            case 'mail': return <Mail className="h-4 w-4" />;
            case 'message': return <MessageSquare className="h-4 w-4" />;
            case 'followup': return <User className="h-4 w-4" />;
            default: return <Calendar className="h-4 w-4" />;
        }
    }

    const getTypeColor = (type: TasksType) => {
        switch (type) {
            case 'call': return 'bg-green-100 text-green-700';
            case 'meeting': return 'bg-blue-100 text-blue-700';
            case 'mail': return 'bg-orange-100 text-orange-700';
            case 'message': return 'bg-purple-100 text-purple-700';
            case 'followup': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await getActivityByLeads({
                leads_id: Number(accountId),
                company_id: Number(companyId),
                company_customer_id: Number(accountId)
            });

            const mappedTasks = response.map((task: any) => ({
                id: task.id,
                title: task.activity,
                date: task.date,
                time: task.time,
                is_complete: Boolean(task.is_complete),
                description: task.description,
                type: task.type as TasksType
            }));

            setTasks(mappedTasks);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleCreateTask = async (data: any) => {
        setIsCreating(true);
        try {
            const dateTime = new Date(`${data.date}T${data.time}`);
            
            await createActivity({
                activity: data.title,
                user_id: user_id,
                leads_id: Number(accountId),
                date: dateTime.toISOString(),
                time: dateTime.toISOString(),
                type: data.type,
                description: data.description,
                company_id: companyId,
                customer_company_id_id: Number(accountId),
            });
            await fetchTasks();
            setIsCreateOpen(false);
            createForm.reset({
                title: "",
                date: currentDate,
                time: currentTime,
                type: "call",
                description: ""
            });
        } catch (error) {
            console.error("Error creating task:", error);
        } finally {
            setIsCreating(false);
        }
    }

    const handleUpdateStatus = async (taskId: number) => {
        setIsStatusUpdating(taskId);
        try {
            await updateActivityStatus({
                activity_id: taskId,
                user_id: user_id,
                status: true,
            });
            fetchTasks();
        } catch (error) {
            console.error("Error updating status:", error);
        } finally {
            setIsStatusUpdating(null);
        }
    }

    const handleUpdateTask = async (data: any) => {
        if (!editingTask) return;
        
        setIsUpdating(true);
        try {
            await updateActivity({
                activity_id: editingTask.id,
                activity: data.title,
                user_id: user_id,
                leads_id: Number(accountId),
                date: data.date,
                time: data.time,
                type: data.type,
                description: data.description,
                company_id: companyId,
                customer_company_id_id: Number(accountId),
                status: editingTask.is_complete
            });
            
            await fetchTasks();
            setIsEditOpen(false);
            setEditingTask(null);
            editForm.reset({
                title: "",
                date: currentDate,
                time: currentTime,
                type: "call",
                description: ""
            });
        } catch (error) {
            console.error("Error updating task:", error);
        } finally {
            setIsUpdating(false);
        }
    }

    const handleEditClick = (task: Tasks) => {
        setEditingTask(task);
        editForm.reset({
            title: task.title,
            date: format(new Date(task.date), "yyyy-MM-dd"),
            time: task.time,
            type: task.type,
            description: task.description
        });
        setIsEditOpen(true);
    }

    useEffect(() => {
        if (accountId && companyId) {
            fetchTasks();
        }
    }, [accountId, companyId]);

    const pendingTasks = tasks.filter(task => !task.is_complete);
    const completedTasks = tasks.filter(task => task.is_complete);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-500">Loading tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    if (!open) {
                        createForm.reset({
                            title: "",
                            date: currentDate,
                            time: currentTime,
                            type: "call",
                            description: ""
                        });
                    }
                    setIsCreateOpen(open);
                }}>
                    <DialogTrigger asChild>
                        <Button variant="default" disabled={isLeadInOnboarding}>
                            <Plus className="h-4 w-4 mr-2" />
                            Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
                        </DialogHeader>
                        <Form {...createForm}>
                            <form onSubmit={createForm.handleSubmit(handleCreateTask)} className="space-y-4">
                                <FormField
                                    control={createForm.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Task Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter task title" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={createForm.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Task Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select task type">
                                                            {field.value && (
                                                                <div className="flex items-center gap-2">
                                                                    {getTaskIcon(field.value as TasksType)}
                                                                    <span className="capitalize">{field.value}</span>
                                                                </div>
                                                            )}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="call">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4" />
                                                            <span>Call</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="meeting">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span>Meeting</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="followup">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            <span>Follow Up</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="mail">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4" />
                                                            <span>Mail</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="message">
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4" />
                                                            <span>Message</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Enter task description" rows={3} {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="flex gap-2 pt-4 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="w-auto">
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        variant="default"
                                        className="w-auto"
                                        disabled={isCreating || isLeadInOnboarding}
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Task'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Task Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    editForm.reset({
                        title: "",
                        date: currentDate,
                        time: currentTime,
                        type: "call",
                        description: ""
                    });
                    setEditingTask(null);
                }
                setIsEditOpen(open);
            }}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleUpdateTask)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Task Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter task title" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={editForm.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={editForm.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Task Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select task type">
                                                        {field.value && (
                                                            <div className="flex items-center gap-2">
                                                                {getTaskIcon(field.value as TasksType)}
                                                                <span className="capitalize">{field.value}</span>
                                                            </div>
                                                        )}
                                                    </SelectValue>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="call">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4" />
                                                        <span>Call</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="meeting">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4" />
                                                        <span>Meeting</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="followup">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        <span>Follow Up</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="mail">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        <span>Mail</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="message">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4" />
                                                        <span>Message</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Enter task description" rows={3} {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1 "
                                    disabled={isUpdating || isLeadInOnboarding}
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Task'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Tasks */}
                <Card className='bg-white rounded-lg'>
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-gray-700">Pending Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingTasks.length > 0 ? (
                            pendingTasks.map(task => (
                                <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className={getTypeColor(task.type)}>
                                                <div className="flex items-center gap-1">
                                                    {getTaskIcon(task.type)}
                                                    <span className="capitalize">{task.type}</span>
                                                </div>
                                            </Badge>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(task)}
                                                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                                disabled={isStatusUpdating === task.id}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUpdateStatus(task.id)}
                                                className="h-8 w-8 text-green-500 hover:text-green-700"
                                                disabled={isStatusUpdating === task.id}
                                            >
                                                {isStatusUpdating === task.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(task.date), "MMM dd, yyyy")}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {task.time}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No pending tasks</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Completed Tasks */}
                <Card className='bg-white rounded-lg'>
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-gray-700">Completed Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {completedTasks.length > 0 ? (
                            completedTasks.map(task => (
                                <div key={task.id} className="bg-green-50 border border-green-200 rounded-lg p-4 opacity-75">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className="bg-green-100 text-green-700">
                                                <div className="flex items-center gap-1">
                                                    {getTaskIcon(task.type)}
                                                    <span className="capitalize">{task.type}</span>
                                                </div>
                                            </Badge>
                                            <Badge className="bg-green-200 text-green-800">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Completed
                                            </Badge>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUpdateStatus(task.id)}
                                                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                                disabled={isStatusUpdating === task.id}
                                            >
                                                {isStatusUpdating === task.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Clock className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-medium text-gray-700 mb-1 line-through">{task.title}</h3>
                                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(task.date), "MMM dd, yyyy")}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {task.time}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No completed tasks</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default SalesTasksTab;