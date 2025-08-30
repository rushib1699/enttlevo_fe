import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  Inbox,
  Search,
  PenTool,
  Reply,
  Share,
  Ticket,
  FileText,
  ReplyAll,
  Star,
  Trash,
  Archive,
  Clock,
  Tag,
  RefreshCw,
  Mail,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  MoreHorizontal,
  Loader2,
  Bookmark
} from "lucide-react";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  replyEmail,
  replyAllEmail,
  getNodes,
  generateOutput,
  checkGoogleUser,
  refreshGoogleToken,
  getListofEmails,
  forwardGoogleEmail,
  viewGoogleEmail,
  sendGoogleEmail
} from "@/api";
import CreateTicketModal from "@/components/Model/CreateTicketModal";
import SummarizeModal from "@/components/Model/SummarizeModal";
import { useNavigate } from "react-router-dom";
// import {
//   convertElementsToPromptList,
//   convertResponseToElements,
// } from "@/utils/helpers";
// import { Prompt } from "@/types";
import { toast } from "sonner";
import { convertElementsToPromptList, convertResponseToElements } from "@/utils/helpers";
import { Prompt } from "@/types";


const GoogleEmailPage: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [emails, setEmails] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [draftEmails, setDraftEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newEmailModalVisible, setNewEmailModalVisible] = useState<boolean>(false);
  const [emailExists, setEmailExists] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [to, setTo] = useState<string>("");
  const [cc, setCc] = useState<string>("");
  const [bcc, setBcc] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [replyModalVisible, setReplyModalVisible] = useState<boolean>(false);
  const [forwardModalVisible, setForwardModalVisible] = useState<boolean>(false);
  const [createTicketModalVisible, setCreateTicketModalVisible] = useState<boolean>(false);
  const [summarizeModalVisible, setSummarizeModalVisible] = useState<boolean>(false);
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);
  const [replyAllModalVisible, setReplyAllModalVisible] = useState<boolean>(false);
  const [showCcBcc, setShowCcBcc] = useState<boolean>(false);
  const [isGeneratingAIReply, setIsGeneratingAIReply] = useState({
    emailId: null,
    loading: false,
  });
  const [showAIGeneratedReply, setShowAIGeneratedReply] = useState<{
    emailId: string | null;
    visible: boolean;
    output: string | null;
  }>({
    emailId: null,
    visible: false,
    output: null,
  });
  const [workflowGeneratedOutput, setWorkflowGeneratedOutput] = useState<{
    emailId: null | string;
    output: string;
  }>({
    emailId: null,
    output: "",
  });
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [composeMinimized, setComposeMinimized] = useState<boolean>(false);


  // Compose form state - kept separate to prevent re-renders
  const [composeForm, setComposeForm] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: ""
  });

  const navigate = useNavigate();


  const aiGenerateReplyWorkflowId = 20


  const checkUserExists = async () => {
    const email = sessionStorage.getItem("googleEmail");
    if (!email) return;
    try {
      const response = await checkGoogleUser({ email });
      setEmailExists(response.exists);
      if (response.exists) {
        await fetchAllEmails(email);
      }

    } catch (error) {
      console.error("Error checking user existence:", error);
    }
  };

  const fetchAllEmails = async (email: string) => {
    try {
      setIsLoadingInbox(true);
      setIsLoadingSent(true);
      setIsLoadingDrafts(true);

      const inboxEmails = await fetchEmails(email, "INBOX");
      const sentEmails = await fetchEmails(email, "SENT");
      const draftEmails = await fetchEmails(email, "DRAFTS");

      setEmails(inboxEmails || []);
      setSentEmails(sentEmails || []);
      setDraftEmails(draftEmails || []);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setIsLoadingInbox(false);
      setIsLoadingSent(false);
      setIsLoadingDrafts(false);
    }
  };

  const getValidAccessToken = async () => {
    const email = sessionStorage.getItem("googleEmail");
    try {
      const response = await refreshGoogleToken({ email: email! });
      return response.accessToken;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return null;
    }
  };

  const fetchEmails = async (email: string, label: string) => {
    try {
      const response = await getListofEmails({
        user_email: email,
        label: label,
      });
      return response;
    } catch (error) {
      console.error("Error listing emails:", error);
    }
  };

  function stripHtmlTags(html: any) {
    if (!html) return '';
    // Create a temporary DOM element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Get only text content
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  const handleGenerateAIReply = async () => {
    setIsGeneratingAIReply({
      emailId: selectedEmail.id,
      loading: true,
    });
    const workflowId = aiGenerateReplyWorkflowId;
    try {
      const response = await getNodes({
        company_id: loginResponse?.company_id!,
        workflow_id: workflowId,
        is_template: 0,
      });

      console.log(`nodes`, response)
      const elements: any[] = convertResponseToElements(response);
      console.log(`elemets`, elements)

      const { promptList }: { promptList: Prompt[] } =
        convertElementsToPromptList(elements);

      const promptListWithoutRoot = promptList.filter(
        (prompt) => prompt.use_input !== "0"
      );
      console.log(`pl`, promptListWithoutRoot)

      const rootNode = promptList.find((prompt) => prompt.use_input === "0");
      if (!rootNode) {
        toast.error("Something went wrong. Please try again later.");
        return;
      }
      rootNode.Input = stripHtmlTags(selectedEmail.body);
      const updatedPromptList = [...promptListWithoutRoot, rootNode];

      const payload = { promptList: updatedPromptList };
      try {
        const response = await generateOutput(payload);
        const output = response.content;
        setShowAIGeneratedReply({
          emailId: selectedEmail.id,
          visible: true,
          output,
        });
      } catch (e) {
        toast.error("Something went wrong. Please try again later.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsGeneratingAIReply({
        emailId: selectedEmail.id,
        loading: false,
      });
    }
  };

  const cleanEmailBody = (html: any) => {


    if (!html) return "";

    // 1. If HTML contains div[dir="ltr"], return only that forward message
    const ltrMatch = html.match(/<div[^>]+dir=["']ltr["'][^>]*>[\s\S]*$/i);
    if (ltrMatch) return ltrMatch[0];

    // 2. If HTML contains .gmail_quote, extract only up to that point
    const quoteIndex = html.indexOf('<div class="gmail_quote');
    if (quoteIndex !== -1) return html.slice(0, quoteIndex);

    // 3. If it has HTML tags, assume it's valid HTML
    if (html.includes("<div") || html.includes("<p") || html.includes("<br")) return html;

    // 4. Fallback: convert plain text \r\n to <br>
    return html.replace(/\r\n|\n/g, "<br>");


  };

  // Update compose form fields individually to prevent re-rendering entire component
  const updateComposeField = useCallback((field: string, value: string) => {
    setComposeForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const resetComposeForm = useCallback(() => {
    setComposeForm({
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: ""
    });
    setShowCcBcc(false);
  }, []);


  const handleEmailClick = async (email: any) => {
    if (loadingEmailId) return;
    setLoadingEmailId(email.id);
    const token = await getValidAccessToken();
    if (!token) {
      setLoadingEmailId(null);
      return;
    }

    try {
      const response = await viewGoogleEmail({
        emailId: email.id,
        userEmail: sessionStorage.getItem("googleEmail")!,
      });

      //const safeHtml = DOMPurify.sanitize(selectedEmail.body);

      const emailData = {
        id: email.id,
        subject: response.email.subject,
        from: response.email.from,
        to: response.email.to,
        date: response.email.date,
        body: cleanEmailBody(response.email.body),
        attachments: response.email.attachments || []
      };

      console.log(response.thread)
      setSelectedEmail(emailData);
      setThreads(response.thread || []);
      setShowAIGeneratedReply({
        emailId: email.id,
        visible: false,
        output: null,
      });
      setIsGeneratingAIReply({
        emailId: email.id,
        loading: false,
      });
      setModalVisible(true);
    } catch (error) {
      console.error("Error fetching email:", error);
    } finally {
      setLoadingEmailId(null);
    }
  };

  const sendEmail = async (to: string, subject: string, body: string) => {
    const token = await getValidAccessToken();
    if (!token) return;

    setIsSending(true);

    try {
      await sendGoogleEmail({
        user_email: sessionStorage.getItem("googleEmail")!,
        to: to,
        subject: subject,
        body: body,
        account_owner: loginResponse?.company_id || 1,
      });
      setNewEmailModalVisible(false);
      setComposeMinimized(false);
      toast.success("Your email has been sent successfully.");
      // Reset form fields after successful send
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setBody("");

      // Refresh email lists
      const email = sessionStorage.getItem("googleEmail");
      if (email) {
        await fetchAllEmails(email);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    checkUserExists();
  }, [userEmail]);

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    const now = new Date();

    // If the email is from today, show only the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If the email is from this year, show the month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Otherwise show the full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filterEmails = (emails: any[] | null | undefined, term: string) => {
    if (!emails) return [];
    if (!term) return emails;
    return emails.filter(
      (email) =>
        email.snippet?.toLowerCase().includes(term.toLowerCase()) ||
        email.subject?.toLowerCase().includes(term.toLowerCase()) ||
        email.from?.toLowerCase().includes(term.toLowerCase())
    );
  };

  

  const handleReplySubmit = async () => {
    if (!selectedEmail) return;

    const token = await getValidAccessToken();
    if (!token) return;

    setIsSending(true);
    try {
      await replyEmail({
        user_email: sessionStorage.getItem("googleEmail")!,
        messageId: selectedEmail.id,
        replyBody: body,
      });
      toast.success("Reply sent successfully.");
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setBody("");
      setReplyModalVisible(false);

      // Refresh email lists
      const email = sessionStorage.getItem("googleEmail");
      if (email) {
        await fetchAllEmails(email);
      }
    } catch (error) {
      console.error("Error replying to email:", error);
      toast.error("Failed to send reply.");
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedEmail) return;

    setTo(selectedEmail.from);
    setSubject(`Re: ${selectedEmail.subject}`);
    setBody(
      `\n\nOn ${selectedEmail.date}, ${selectedEmail.from} wrote:\n${selectedEmail.body}`
    );
    setReplyModalVisible(true);
  };

  const handleForward = async () => {
    if (!selectedEmail) return;

    setTo("");
    setCc("");
    setBcc("");
    setSubject(`Fwd: ${selectedEmail.subject}`);
    const forwardBody = `\n\n---------- Forwarded message ---------\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\nSubject: ${selectedEmail.subject}\nTo: ${selectedEmail.to}\n\n${selectedEmail.body}`;
    setBody(forwardBody);
    setForwardModalVisible(true);
  };

  const handleForwardSubmit = async (
    to: string,
    subject: string,
    body: string
  ) => {
    setIsSending(true);
    try {
      await forwardGoogleEmail({
        user_email: sessionStorage.getItem("googleEmail")!,
        messageId: selectedEmail.id,
        forwardTo: to,
        forwardBody: body,
      });
      setForwardModalVisible(false);
      toast.success("Email forwarded successfully.");
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setBody("");

      // Refresh emails after forwarding
      const email = sessionStorage.getItem("googleEmail");
      if (email) {
        await fetchAllEmails(email);
      }
    } catch (error) {
      console.error("Error forwarding email:", error);
      toast.error("Failed to forward email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = (email: any) => {
    setSelectedEmail(email);
    setCreateTicketModalVisible(true);
  };

  const handleSummarize = async (email: any) => {
    setWorkflowGeneratedOutput({
      emailId: email.id,
      output: "",
    });
    setSummarizeModalVisible(true);
    setLoadingSummary(email.id);
    const token = await getValidAccessToken();
    if (!token) {
      setLoadingSummary(null);
      return;
    }

    try {
      const response = await viewGoogleEmail({
        emailId: email.id,
        userEmail: sessionStorage.getItem("googleEmail")!,
      });

      const emailData = {
        id: email.id,
        subject: response.email.subject,
        from: response.email.from,
        to: response.email.to,
        date: response.email.date,
        body: cleanEmailBody(response.email.body),
      };
      //console.log(emailData)

      setSelectedEmail(emailData);
    } catch (error) {
      console.log("Error fetching email:", error);
    } finally {
      setLoadingSummary(null);
    }
  };

  const handleReplyAll = async () => {
    if (!selectedEmail) return;

    setTo(selectedEmail.to); // This should include all original recipients
    setSubject(`Re: ${selectedEmail.subject}`);
    setBody(
      `\n\nOn ${selectedEmail.date}, ${selectedEmail.from} wrote:\n${selectedEmail.body}`
    );
    setReplyAllModalVisible(true);
  };

  const handleReplyAllSubmit = async () => {
    if (!selectedEmail) return;

    setIsSending(true);
    try {
      await replyAllEmail({
        user_email: sessionStorage.getItem("googleEmail")!,
        messageId: selectedEmail.id,
        replyBody: body,
      });
      toast.success("Reply all sent successfully.");
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setBody("");
      setReplyAllModalVisible(false);
    } catch (error) {
      console.error("Error replying to all:", error);
      toast.error("Failed to send reply all.");
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleSelectEmail = (emailId: string) => {
    if (selectedEmails.includes(emailId)) {
      setSelectedEmails(selectedEmails.filter(id => id !== emailId));
    } else {
      setSelectedEmails([...selectedEmails, emailId]);
    }
  };

  const handleSelectAll = (emailList: any[]) => {
    if (selectedEmails.length === emailList.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emailList.map(email => email.id));
    }
  };

  const handleDeleteSelected = async () => {
    // Implementation for deleting selected emails
    toast.info("Delete functionality would go here");
    setSelectedEmails([]);
  };

  const handleArchiveSelected = () => {
    // Implementation for archiving selected emails
    toast.info("Archive functionality would go here");
    setSelectedEmails([]);
  };

  const handleRefresh = async () => {
    const email = sessionStorage.getItem("googleEmail");
    if (email) {
      setIsLoadingInbox(true);
      setIsLoadingSent(true);
      setIsLoadingDrafts(true);
      await fetchAllEmails(email);
    }
  };

  const getSenderInfo = (from: any) => {
    try {
      if (!from) return { name: 'Unknown', email: '' };

      // Check if it has a name part "<email>" format
      const match = from.match(/(.+?)\s*<(.+?)>/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      }

      // If just an email
      return { name: from, email: from };
    } catch (error) {
      return { name: from || 'Unknown', email: '' };
    }
  };

  const getInitials = (name: any) => {
    try {
      return name.split(' ').map((part: any) => part[0]).join('').toUpperCase().substring(0, 2);
    } catch (error) {
      return '?';
    }
  };

  
  const renderEmailList = (emailList: any, isLoading: any) => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Gmail-style toolbar */}
      <div className="border-b bg-white p-2 sm:p-3 flex items-center gap-2 flex-shrink-0 overflow-x-auto">
        <Checkbox
          checked={emailList && emailList.length > 0 && selectedEmails.length === emailList.length}
          onCheckedChange={() => handleSelectAll(emailList || [])}
          className="flex-shrink-0"
        />

        {selectedEmails.length > 0 ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleArchiveSelected}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleDeleteSelected}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark as unread</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Clock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Snooze</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Tag className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Labels</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex-shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8 flex-1">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-200">
            {filterEmails(emailList, searchTerm).map((email) => {
              const senderInfo = getSenderInfo(email.from);
              const isUnread = email.labelIds && email.labelIds.includes('UNREAD');
              const isSelected = selectedEmails.includes(email.id);

              return (
                <div
                  key={email.id}
                  className={`flex items-center px-2 sm:px-4 py-3 cursor-pointer transition-colors border-l-4 min-w-0 ${isUnread ? 'border-l-blue-500 bg-blue-50' : 'border-l-transparent'
                    } ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                  onClick={() => handleEmailClick(email)}
                >
                  {loadingEmailId === email.id && (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2 flex-shrink-0" />
                  )}

                  <div className="flex items-center space-x-2 mr-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSelectEmail(email.id)}
                    />
                    <Button variant="ghost" size="sm" className="p-0 h-auto hidden sm:block">
                      <Star className="h-4 w-4 text-yellow-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-0 h-auto hidden sm:block">
                      <Bookmark className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>


                  <Avatar className="w-8 h-8 mr-2 sm:mr-3 flex-shrink-0">
                    <AvatarFallback style={{ backgroundColor: `hsl(${email.id.charCodeAt(0) % 360}, 70%, 50%)` }}>
                      {getInitials(email.fromName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Email Details */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between min-w-0">
                      <span className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'} pr-2`}>
                        {email.fromName}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDate(email.internalDate)}
                      </span>
                    </div>
                    <div className="min-w-0 mt-1">
                      <div className="flex items-start gap-1 min-w-0">
                        <span className={`text-sm ${isUnread ? 'font-medium text-gray-900' : 'text-gray-700'} truncate flex-shrink-0`}>
                          {email.subject || '(no subject)'}
                        </span>
                        <span className="text-xs text-gray-500 truncate flex-1 max-w-xs break-words">
                          — {email.snippet}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateTicket(email);
                            }}
                            className="p-1 h-8 w-8 flex items-center justify-center"
                          >
                            <Ticket className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Create ticket</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSummarize(email);
                            }}
                            className="p-1 h-8 w-8 flex items-center justify-center"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Summarize</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              );
            })}
            {filterEmails(emailList, searchTerm).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No emails found
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const ComposeEmailModal = useMemo(() => {
    if (!newEmailModalVisible) return null;

    return (
      <div className={`fixed bottom-0 right-2 sm:right-6 w-full sm:w-96 max-w-96 z-50 shadow-lg bg-white border rounded-t-lg ${composeMinimized ? 'h-12' : 'h-auto'} overflow-hidden`}>
        {/* Header */}
        <div className="p-3 border-b flex-shrink-0 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium truncate">
              {composeMinimized ? 'New Message' : 'Compose'}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                className="p-1 hover:bg-gray-200 rounded"
                onClick={() => setComposeMinimized(!composeMinimized)}
              >
                {composeMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button
                className="p-1 hover:bg-gray-200 rounded"
                onClick={() => {
                  setNewEmailModalVisible(false);
                  setComposeMinimized(false);
                  resetComposeForm();
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!composeMinimized && (
          <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* To field */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium w-8 flex-shrink-0">To</span>
              <input
                type="email"
                value={composeForm.to}
                onChange={(e) => updateComposeField('to', e.target.value)}
                placeholder="Recipients"
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* CC/BCC fields */}
            {showCcBcc && (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium w-8 flex-shrink-0">Cc</span>
                  <input
                    type="email"
                    value={composeForm.cc}
                    onChange={(e) => updateComposeField('cc', e.target.value)}
                    placeholder="Carbon copy"
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium w-8 flex-shrink-0">Bcc</span>
                  <input
                    type="email"
                    value={composeForm.bcc}
                    onChange={(e) => updateComposeField('bcc', e.target.value)}
                    placeholder="Blind carbon copy"
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {!showCcBcc && (
              <div className="text-right">
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setShowCcBcc(true)}
                >
                  Cc/Bcc
                </button>
              </div>
            )}

            {/* Subject field */}
            <div className="border-t pt-3">
              <input
                type="text"
                value={composeForm.subject}
                onChange={(e) => updateComposeField('subject', e.target.value)}
                placeholder="Subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Message body */}
            <div>
              <textarea
                value={composeForm.body}
                onChange={(e) => updateComposeField('body', e.target.value)}
                placeholder="Compose email..."
                className="w-full min-h-[150px] sm:min-h-[200px] resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => sendEmail(composeForm.to, composeForm.subject, composeForm.body)}
                disabled={isSending || !composeForm.to || !composeForm.subject}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setNewEmailModalVisible(false);
                    setComposeMinimized(false);
                    resetComposeForm();
                  }}
                className="p-2 hover:bg-gray-200 rounded">
                  <Trash className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [newEmailModalVisible, composeMinimized, composeForm, isSending, showCcBcc, updateComposeField, resetComposeForm, sendEmail]);


  return (
    <div className="bg-gray-50 flex flex-col h-screen overflow-hidden">
      {/* Gmail Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 max-w-full">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Mail className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-medium text-gray-900 hidden sm:block">Email</span>
          </div>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search mail"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-100 border-gray-300 rounded-lg w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => setNewEmailModalVisible(true)}
              className=" text-white rounded-lg px-4 sm:px-6"
              disabled={!emailExists}
            >
              <PenTool className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Compose</span>
            </Button>
          </div>
        </div>
      </div>

      {!emailExists ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="p-8 text-center w-full ">
            <CardContent className="space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Email not configured</h2>
              <p className="text-muted-foreground">Configure your email settings to use this feature</p>
              <Button
                onClick={() => navigate("/settings/profile")}
                className="mt-4"
              >
                <Send className="mr-2 h-4 w-4" />
                Go to Profile Settings
              </Button>
            </CardContent>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 bg-white overflow-hidden">
            <Tabs defaultValue="inbox" className="h-full flex flex-col">
              <TabsList className="bg-gray-100 border-b w-full justify-start rounded-none flex-shrink-0">
                <TabsTrigger value="inbox" className="flex items-center gap-2 rounded-none px-3 sm:px-4">
                  <Inbox className="h-4 w-4" />
                  <span className="hidden sm:inline">Inbox</span>
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2 rounded-none px-3 sm:px-4">
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Sent</span>
                </TabsTrigger>
                <TabsTrigger value="drafts" className="flex items-center gap-2 rounded-none px-3 sm:px-4">
                  <PenTool className="h-4 w-4" />
                  <span className="hidden sm:inline">Drafts</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inbox" className="mt-0 flex-1 overflow-hidden">
                {renderEmailList(emails, isLoadingInbox)}
              </TabsContent>

              <TabsContent value="sent" className="mt-0 flex-1 overflow-hidden">
                {renderEmailList(sentEmails, isLoadingSent)}
              </TabsContent>

              <TabsContent value="drafts" className="mt-0 flex-1 overflow-hidden">
                {renderEmailList(draftEmails, isLoadingDrafts)}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {newEmailModalVisible && ComposeEmailModal }

      {/* Email view modal */}
      <Dialog open={modalVisible} onOpenChange={() => setModalVisible(false)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          {selectedEmail && (
            <div className="space-y-6">
              {/* Email Header */}
              <div className="space-y-4 border-b pb-4">
                <h2 className="text-xl font-semibold leading-tight">{selectedEmail.subject}</h2>

                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0" style={{ backgroundColor: `hsl(${selectedEmail.id.charCodeAt(0) % 360}, 70%, 50%)` }}>
                    <AvatarFallback>{getInitials(getSenderInfo(selectedEmail.from).name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium truncate">{getSenderInfo(selectedEmail.from).name}</span>
                      <span className="text-sm text-muted-foreground flex-shrink-0">
                        {new Date(selectedEmail.date).toLocaleString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {`<${getSenderInfo(selectedEmail.from).email}>`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      to <span className="text-foreground">{selectedEmail.to}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" onClick={handleReply} size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" onClick={handleReplyAll} size="sm">
                    <ReplyAll className="h-4 w-4 mr-2" />
                    Reply All
                  </Button>
                  <Button variant="outline" onClick={handleForward} size="sm">
                    <Share className="h-4 w-4 mr-2" />
                    Forward
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAIReply}
                    disabled={isGeneratingAIReply.loading && isGeneratingAIReply.emailId === selectedEmail?.id}
                  >
                    {isGeneratingAIReply.loading && isGeneratingAIReply.emailId === selectedEmail?.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {showAIGeneratedReply.output ? "Regenerate Reply" : "Generate AI Reply"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* AI Generated Reply */}
              {showAIGeneratedReply.emailId === selectedEmail?.id && showAIGeneratedReply.output && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">AI Generated Reply</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAIGeneratedReply({
                        ...showAIGeneratedReply,
                        visible: !showAIGeneratedReply.visible
                      })}
                    >
                      {showAIGeneratedReply.visible ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {showAIGeneratedReply.visible && (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                      __html: showAIGeneratedReply.output ? String(showAIGeneratedReply.output).replace(/\n/g, "<br>") : ""
                    }} />
                  )}
                </div>
              )}

              {/* Email Body */}
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />

              {/* Attachments */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Attachments ({selectedEmail.attachments.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEmail.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          {attachment.url.startsWith('data:image') ? (
                            <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover rounded" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Thread */}
              {threads && threads.length > 1 && (
                <div className="border-t pt-4">
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                      <ChevronDown className="h-4 w-4" />
                      {threads.length - 1} earlier messages
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4">
                      {threads
                        .filter(message => message.id !== selectedEmail.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((message) => (
                          <div key={message.id} className="border-t pt-4">
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback style={{ backgroundColor: `hsl(${message.id.charCodeAt(0) % 360}, 70%, 50%)` }}>
                                  {getInitials(message.from)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="font-medium truncate">{message.from}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(message.date).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="prose prose-sm max-w-none mt-2"
                                  dangerouslySetInnerHTML={{ __html: cleanEmailBody(message.body) }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply modal */}
      <Dialog open={replyModalVisible} onOpenChange={() => setReplyModalVisible(false)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reply</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-20 flex-shrink-0">To:</span>
              <Input value={to} disabled className="flex-1 min-w-0" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="w-20 flex-shrink-0">Subject:</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 min-w-0"
              />
            </div>

            <div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleReplySubmit}
                disabled={isSending}
              >
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Other modals */}
      <Dialog open={forwardModalVisible} onOpenChange={() => setForwardModalVisible(false)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Forward Email</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-20 flex-shrink-0">To:</span>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 min-w-0"
              />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="w-20 flex-shrink-0">Subject:</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 min-w-0"
              />
            </div>

            <div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => handleForwardSubmit(to, subject, body)}
                disabled={isSending}
              >
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Forward
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={replyAllModalVisible} onOpenChange={() => setReplyAllModalVisible(false)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reply All</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-20 flex-shrink-0">To:</span>
              <Input value={to} disabled className="flex-1 min-w-0" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="w-20 flex-shrink-0">Subject:</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 min-w-0"
              />
            </div>

            <div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleReplyAllSubmit}
                disabled={isSending}
              >
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send to All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateTicketModal
        visible={createTicketModalVisible}
        onCancel={() => setCreateTicketModalVisible(false)}
        email={selectedEmail}
      />

      <SummarizeModal
        visible={summarizeModalVisible}
        loadingSummary={loadingSummary}
        onCancel={() => setSummarizeModalVisible(false)}
        email={selectedEmail}
        workflowGeneratedOutput={workflowGeneratedOutput}
        setWorkflowGeneratedOutput={setWorkflowGeneratedOutput}
      />
    </div>
  );
};

export default GoogleEmailPage;

