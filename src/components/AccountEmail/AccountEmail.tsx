import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Send,
  Inbox,
  Search,
  Pencil,
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
  Loader2,
  ChevronDown,
  X,
  Minus,
  Square
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  replyEmail,
  replyAllEmail,
  getUser,
  getEmailForCompany,
  getNodes,
  generateOutput,
  viewGoogleEmail,
  sendGoogleEmail,
  refreshGoogleToken,
  checkGoogleUser,
  forwardGoogleEmail
} from '@/api';
import {
  convertElementsToPromptList,
  convertResponseToElements,
} from "@/utils/helpers";
import CreateTicketModal from '@/components/Model/CreateTicketModal';
import SummarizeModal from '@/components/Model/SummarizeModal';
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';

interface EmailProps {
  accountEmail?: string;
  accountOwner?: string | number;
  isLeadInOnboarding?: boolean;
}

interface Prompt {
  use_input: string;
  Input?: string;
}

const AccountEmail: React.FC<EmailProps> = ({ accountEmail, accountOwner, isLeadInOnboarding }) => {
  const [emails, setEmails] = useState<any[]>([]);
  const { loginResponse } = useApplicationContext();
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [draftEmails, setDraftEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newEmailModalVisible, setNewEmailModalVisible] = useState<boolean>(false);
  const [emailExists, setEmailExists] = useState<boolean>(false);
  const [accountOwnerEmail, setAccountOwnerEmail] = useState<string>("");
  const [userResponse, setUserResponse] = useState<any>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [to, setTo] = useState<string>("");
  const [cc, setCc] = useState<string>("");
  const [bcc, setBcc] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [replyModalVisible, setReplyModalVisible] = useState<boolean>(false);
  const [forwardModalVisible, setForwardModalVisible] = useState<boolean>(false);
  const [replyAllModalVisible, setReplyAllModalVisible] = useState<boolean>(false);
  const [createTicketModalVisible, setCreateTicketModalVisible] = useState<boolean>(false);
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null);
  const [summarizeModalVisible, setSummarizeModalVisible] = useState<boolean>(false);
  const [showCcBcc, setShowCcBcc] = useState<boolean>(false);
  const [isGeneratingAIReply, setIsGeneratingAIReply] = useState<{ emailId: string | null; loading: boolean }>({ emailId: null, loading: false });
  const [showAIGeneratedReply, setShowAIGeneratedReply] = useState<{ emailId: string | null; visible: boolean; output: string | null }>({ emailId: null, visible: false, output: null });
  const [workflowGeneratedOutput, setWorkflowGeneratedOutput] = useState<{ emailId: string | null; output: string }>({ emailId: null, output: "" });
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [composeMinimized, setComposeMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('inbox');

  const { hasAccess } = useUserPermission();
  const hasWritePermission = hasAccess("write");

  const aiGenerateReplyWorkflowId = 20;
  // Fetch user and accountOwnerEmail
  useEffect(() => {
    const loadUser = async () => {
      if (!accountOwner) return;
      try {
        const resp = await getUser({ id: accountOwner });
        setUserResponse(resp);
        setAccountOwnerEmail(resp.email);
        console.log("resp", resp);
        const chk = await checkGoogleUser({ email: resp.email });
        setEmailExists(chk.exists);
        if (chk.exists) {
          await fetchAllEmails(resp.email, accountEmail || '');
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadUser();
  }, [accountEmail, accountOwner]);

  const getValidAccessToken = async () => {
    try {
      const resp = await refreshGoogleToken({ email: accountOwnerEmail });
      return resp.accessToken;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const fetchAllEmails = async (userEmail: string, companyEmail: string) => {
    try {
      setIsLoadingInbox(true);
      setIsLoadingSent(true);
      setIsLoadingDrafts(true);
      const inbox = await getEmailForCompany({ user_email: userEmail, company_customer_email: companyEmail, label: 'INBOX' });
      const sent = await getEmailForCompany({ user_email: userEmail, company_customer_email: companyEmail, label: 'SENT' });
      const drafts = await getEmailForCompany({ user_email: userEmail, company_customer_email: companyEmail, label: 'DRAFTS' });
      setEmails(inbox);
      setSentEmails(sent);
      setDraftEmails(drafts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInbox(false);
      setIsLoadingSent(false);
      setIsLoadingDrafts(false);
    }
  };

  const cleanEmailBody = (html: string) => {
    if (!html) return "";
    const ltrMatch = html.match(/<div[^>]+dir=["']ltr["'][^>]*>[\s\S]*$/i);
    if (ltrMatch) return ltrMatch[0];
    const quoteIndex = html.indexOf('<div class="gmail_quote');
    if (quoteIndex !== -1) return html.slice(0, quoteIndex);
    if (/<div|<p|<br/.test(html)) return html;
    return html.replace(/\r\n|\n/g, "<br>");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleEmailClick = async (email: any) => {
    if (loadingEmailId) return;
    setLoadingEmailId(email.id);
    const token = await getValidAccessToken();
    if (!token) { setLoadingEmailId(null); return; }
    try {
      const resp = await viewGoogleEmail({ emailId: email.id, userEmail: accountOwnerEmail });
      const emailData = {
        id: email.id,
        subject: resp.email.subject,
        from: resp.email.from,
        to: resp.email.to,
        date: resp.email.date,
        body: cleanEmailBody(resp.email.body),
        attachments: resp.email.attachments || []
      };
      setSelectedEmail(emailData);
      setThreads(resp.thread);
      setShowAIGeneratedReply({ emailId: email.id, visible: false, output: null });
      setIsGeneratingAIReply({ emailId: email.id, loading: false });
      setModalVisible(true);
    } catch (e) { console.error(e); } finally { setLoadingEmailId(null); }
  };

  const sendEmail = async (to: string, subject: string, body: string) => {
    const token = await getValidAccessToken(); 
    if (!token) return;
    setIsSending(true);
    try {
      await sendGoogleEmail({ user_email: accountOwnerEmail!, to, cc, bcc, subject, body, account_owner: accountOwner! });
      setNewEmailModalVisible(false); 
      setComposeMinimized(false);
      toast.success("Your email has been sent successfully.");
      setTo(''); setCc(''); setBcc(''); setSubject(''); setBody('');
      await fetchAllEmails(accountOwnerEmail, accountEmail || '');
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to send email.'); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    setTo(selectedEmail.from);
    setSubject(`Re: ${selectedEmail.subject}`);
    setBody(`\n\nOn ${selectedEmail.date}, ${selectedEmail.from} wrote:\n${selectedEmail.body}`);
    setReplyModalVisible(true);
  };

  const handleReplySubmit = async () => {
    if (!selectedEmail) return;
    const token = await getValidAccessToken(); 
    if (!token) return;
    setIsSending(true);
    try {
      await replyEmail({ user_email: accountOwnerEmail!, messageId: selectedEmail.id, replyBody: body });
      toast.success('Reply sent successfully.');
      setTo(''); setCc(''); setBcc(''); setSubject(''); setBody(''); setReplyModalVisible(false);
      await fetchAllEmails(accountOwnerEmail, accountEmail || '');
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to send reply.'); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleReplyAll = () => {
    if (!selectedEmail) return;
    setTo(selectedEmail.to);
    setSubject(`Re: ${selectedEmail.subject}`);
    setBody(`\n\nOn ${selectedEmail.date}, ${selectedEmail.from} wrote:\n${selectedEmail.body}`);
    setReplyAllModalVisible(true);
  };

  const handleReplyAllSubmit = async () => {
    if (!selectedEmail) return;
    setIsSending(true);
    try {
      await replyAllEmail({ user_email: accountOwnerEmail!, messageId: selectedEmail.id, replyBody: body });
      toast.success('Reply all sent successfully.');
      setTo(''); setCc(''); setBcc(''); setSubject(''); setBody(''); setReplyAllModalVisible(false);
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to send reply all.'); 
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
        userEmail: accountOwnerEmail 
      });

      const emailData = {
        id: email.id,
        subject: response.email.subject,
        from: response.email.from,
        to: response.email.to,
        date: response.email.date,
        body: cleanEmailBody(response.email.body),
      };

      setSelectedEmail(emailData);
    } catch (error) {
      console.log("Error fetching email:", error);
    } finally {
      setLoadingSummary(null);
    }
  };

  const handleForward = () => {
    if (!selectedEmail) return;
    setTo(''); setCc(''); setBcc('');
    setSubject(`Fwd: ${selectedEmail.subject}`);
    setBody(`\n\n---------- Forwarded message ---------\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\nSubject: ${selectedEmail.subject}\nTo: ${selectedEmail.to}\n\n${selectedEmail.body}`);
    setForwardModalVisible(true);
  };

  const handleForwardSubmit = async () => {
    if (!selectedEmail) return;
    const token = await getValidAccessToken(); 
    if (!token) return;
    setIsSending(true);
    try {
      await forwardGoogleEmail({ user_email: accountOwnerEmail, messageId: selectedEmail.id, forwardTo: to, forwardBody: body });
      toast.success('Email forwarded successfully.');
      setTo(''); setCc(''); setBcc(''); setSubject(''); setBody(''); setForwardModalVisible(false);
      await fetchAllEmails(accountOwnerEmail, accountEmail || '');
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to forward email.'); 
    } finally { 
      setIsSending(false); 
    }
  };

  function stripHtmlTags(html: any) {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
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

      const elements: any[] = convertResponseToElements(response);
      const { promptList }: { promptList: Prompt[] } = convertElementsToPromptList(elements);
      const promptListWithoutRoot = promptList.filter((prompt) => prompt.use_input !== "0");
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

  const handleToggleSelectEmail = (id: string) => {
    setSelectedEmails(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };

  const handleSelectAll = (list: any[]) => {
    setSelectedEmails(sel => sel.length === list.length ? [] : list.map(e => e.id));
  };

  const handleArchiveSelected = () => { 
    toast.info('Archive functionality'); 
    setSelectedEmails([]); 
  };

  const handleDeleteSelected = () => { 
    toast.info('Delete functionality'); 
    setSelectedEmails([]); 
  };

  const handleRefresh = async () => { 
    await fetchAllEmails(accountOwnerEmail, accountEmail || ''); 
  };

  const getSenderInfo = (fromName: string) => {
    const match = fromName.match(/(.+?)\s*<(.+?)>/);
    return match ? { name: match[1], email: match[2] } : { name: fromName, email: fromName };
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (emailId: string, name: string) => {
    // Generate consistent color based on email ID or name
    const hash = emailId ? emailId.charCodeAt(0) : name.charCodeAt(0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const getAvatarBgColor = (emailId: string, name: string) => {
    // Generate a lighter background color
    const hash = emailId ? emailId.charCodeAt(0) : name.charCodeAt(0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 90%)`;
  };

  const getAvatarTextColor = (emailId: string, name: string) => {
    // Generate a darker text color for contrast
    const hash = emailId ? emailId.charCodeAt(0) : name.charCodeAt(0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 30%)`;
  };

  const filterEmailsList = (list: any[], term: string) => {
    if (!list) return [];
    if (!term) return list;
    return list.filter(e => 
      (e.subject || '').toLowerCase().includes(term.toLowerCase()) || 
      (e.snippet || '').toLowerCase().includes(term.toLowerCase()) || 
      (e.from || '').toLowerCase().includes(term.toLowerCase())
    );
  };

  const renderEmailList = (list: any[], loading: boolean) => (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-gray-50">
        <Checkbox 
          checked={selectedEmails.length === list.length && list.length > 0}
          onCheckedChange={() => handleSelectAll(list)}
        />
        {selectedEmails.length > 0 ? (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleArchiveSelected}>
                    <Archive className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleDeleteSelected}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Mail className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark as unread</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Clock className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Snooze</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Tag className="w-4 h-4" />
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
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Email List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            {filterEmailsList(list, searchTerm).length === 0 ? (
              <div className="text-center py-8 text-gray-500">No emails found</div>
            ) : (
              filterEmailsList(list, searchTerm).map((email) => {
                const senderInfo = getSenderInfo(email.fromName);
                const isUnread = email.labelIds?.includes('UNREAD');
                const isSelected = selectedEmails.includes(email.id);
                
                return (
                  <div
                    key={email.id}
                    className={`relative flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isUnread ? 'bg-blue-50' : ''
                    } ${isSelected ? 'bg-blue-100' : ''}`}
                    onClick={() => handleEmailClick(email)}
                  >
                    {loadingEmailId === email.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelectEmail(email.id)}
                      />
                      <Button variant="ghost" size="sm" className="p-1 h-auto">
                        <Star className="w-3 h-3 text-gray-400 hover:text-yellow-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 h-auto">
                        <AlertCircle className="w-3 h-3 text-gray-400 hover:text-orange-500" />
                      </Button>
                    </div>

                    <Avatar className="w-8 h-8 flex-shrink-0 border border-gray-200" 
                      style={{ 
                        backgroundColor: getAvatarBgColor(email.id, senderInfo.name),
                        color: getAvatarTextColor(email.id, senderInfo.name)
                      }}>
                      <AvatarFallback className="text-xs font-semibold">
                        {getInitials(senderInfo.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                          {senderInfo.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDate(email.internalDate)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900 truncate">
                        {email.subject || '(no subject)'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {email.snippet}
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleCreateTicket(email)} disabled={isLeadInOnboarding}>
                              <Ticket className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Create ticket</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleSummarize(email)} disabled={isLeadInOnboarding}>
                              <FileText className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Summarize</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const ComposeEmailModal = () => (
    <div className={`fixed bottom-0 right-6 w-96 bg-white border border-gray-200 shadow-xl rounded-t-lg z-50 ${composeMinimized ? 'h-12' : 'h-[500px]'}`}>
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
        <span className="text-sm font-medium">
          {composeMinimized ? 'New Message' : 'Compose'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setComposeMinimized(!composeMinimized)}
          >
            {composeMinimized ? <Square className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNewEmailModalVisible(false);
              setComposeMinimized(false);
              setTo("");
              setCc("");
              setBcc("");
              setSubject("");
              setBody("");
              setShowCcBcc(false);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {!composeMinimized && (
        <div className="p-3 space-y-3 h-full">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-8">To</span>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipients"
              className="flex-1 border-0 border-b rounded-none focus-visible:ring-0"
            />
          </div>

          {showCcBcc && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">Cc</span>
                <Input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Carbon copy"
                  className="flex-1 border-0 border-b rounded-none focus-visible:ring-0"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">Bcc</span>
                <Input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Blind carbon copy"
                  className="flex-1 border-0 border-b rounded-none focus-visible:ring-0"
                />
              </div>
            </>
          )}

          {!showCcBcc && (
            <div className="pl-10">
              <Button variant="link" size="sm" onClick={() => setShowCcBcc(true)} className="p-0 h-auto text-xs">
                Cc/Bcc
              </Button>
            </div>
          )}

          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="border-0 border-b rounded-none focus-visible:ring-0"
          />

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 min-h-[200px] border-0 resize-none focus-visible:ring-0"
            placeholder="Compose email..."
          />

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={() => sendEmail(to, subject, body)}
              disabled={isSending || !hasWritePermission || isLeadInOnboarding}
              size="sm"
            >
              {isSending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-white">
        {!emailExists ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email not configured</h2>
            <p className="text-gray-600">
              Please ask {userResponse?.first_name} {userResponse?.last_name} to connect their Google account.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search mail"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={() => setNewEmailModalVisible(true)} size="sm" disabled={isLeadInOnboarding}>
                <Pencil className="w-3 h-3 mr-2" />
                Compose
              </Button>
            </div>

            {/* Custom Professional Tab Design */}
            <div className="border-b border-gray-200">
              <div className="flex items-center space-x-8 px-4">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'inbox'
                      ? 'text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  Inbox
                  {activeTab === 'inbox' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'sent'
                      ? 'text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Sent
                  {activeTab === 'sent' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('drafts')}
                  className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'drafts'
                      ? 'text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Pencil className="w-4 h-4" />
                  Drafts
                  {activeTab === 'drafts' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              {activeTab === 'inbox' && (
                <div className="h-full">
                  {renderEmailList(emails, isLoadingInbox)}
                </div>
              )}
              
              {activeTab === 'sent' && (
                <div className="h-full">
                  {renderEmailList(sentEmails, isLoadingSent)}
                </div>
              )}
              
              {activeTab === 'drafts' && (
                <div className="h-full">
                  {renderEmailList(draftEmails, isLoadingDrafts)}
                </div>
              )}
            </div>

            {newEmailModalVisible && <ComposeEmailModal />}

            {/* Email View Dialog */}
            <Dialog open={modalVisible} onOpenChange={setModalVisible}>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="text-xl break-words">{selectedEmail?.subject}</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  {selectedEmail && (
                    <div className="space-y-4 p-1">
                      {/* Email Header */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 flex-shrink-0 border border-gray-200" 
                            style={{ 
                              backgroundColor: getAvatarBgColor(selectedEmail.id, getSenderInfo(selectedEmail.from).name),
                              color: getAvatarTextColor(selectedEmail.id, getSenderInfo(selectedEmail.from).name)
                            }}>
                            <AvatarFallback className="text-sm font-semibold">
                              {getInitials(getSenderInfo(selectedEmail.from).name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 break-words">
                              {getSenderInfo(selectedEmail.from).name}
                            </div>
                            <div className="text-sm text-gray-500 break-all">
                              {`<${getSenderInfo(selectedEmail.from).email}>`}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(selectedEmail.date).toLocaleString([], {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 break-all">
                          <span className="font-medium">to:</span> {selectedEmail.to}
                        </div>
                      </div>

                      {/* Email Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={handleReply} disabled={isLeadInOnboarding || !hasWritePermission}>
                          <Reply className="w-3 h-3 mr-2" />
                          Reply
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleReplyAll} disabled={isLeadInOnboarding || !hasWritePermission}>
                          <ReplyAll className="w-3 h-3 mr-2" />
                          Reply All
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleForward} disabled={isLeadInOnboarding || !hasWritePermission}>
                          <Share className="w-3 h-3 mr-2" />
                          Forward
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleGenerateAIReply}
                          disabled={isGeneratingAIReply.loading && isGeneratingAIReply.emailId === selectedEmail?.id || isLeadInOnboarding }
                        >
                          {isGeneratingAIReply.loading && isGeneratingAIReply.emailId === selectedEmail?.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Generating
                            </>
                          ) : showAIGeneratedReply.output ? (
                            "Regenerate AI Reply"
                          ) : (
                            "Generate AI Reply"
                          )}
                        </Button>
                      </div>

                      {/* AI Generated Reply */}
                      {showAIGeneratedReply.emailId === selectedEmail?.id && showAIGeneratedReply.output && (
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-600">AI Generated Reply</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAIGeneratedReply({
                                  ...showAIGeneratedReply,
                                  visible: !showAIGeneratedReply.visible
                                })}
                              >
                                {showAIGeneratedReply.visible ? "Hide" : "Show"}
                              </Button>
                            </div>
                          </CardHeader>
                          {showAIGeneratedReply.visible && (
                            <CardContent>
                              <div
                                className="text-sm whitespace-pre-wrap break-words"
                                dangerouslySetInnerHTML={{
                                  __html: showAIGeneratedReply.output.replace(/\n/g, "<br>")
                                }}
                              />
                            </CardContent>
                          )}
                        </Card>
                      )}

                      {/* Email Body */}
                      <div 
                        className="prose max-w-none text-sm break-words"
                        style={{ 
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                        dangerouslySetInnerHTML={{ __html: selectedEmail.body }} 
                      />

                      {/* Attachments */}
                      {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                        <Card>
                          <CardHeader>
                            <h3 className="text-sm font-medium">
                              Attachments ({selectedEmail.attachments.length})
                            </h3>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedEmail.attachments.map((attachment: any, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                  <div className="flex-shrink-0">
                                    {attachment.url.startsWith('data:image') ? (
                                      <img 
                                        src={attachment.url} 
                                        alt={attachment.name} 
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                        📎
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                                    <a 
                                      href={attachment.url} 
                                      download={attachment.name}
                                      className="text-xs text-blue-600 hover:underline break-all"
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Thread/Conversation History */}
                      {threads && threads.length > 1 && (
                        <Card>
                          <CardHeader>
                            <h3 className="text-sm font-medium">
                              Conversation History ({threads.length - 1} previous messages)
                            </h3>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="space-y-1">
                              {threads
                                .filter(message => message.id !== selectedEmail.id)
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map((message) => (
                                  <Collapsible key={message.id}>
                                    <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 text-left">
                                      <Avatar className="w-6 h-6 flex-shrink-0 border border-gray-200" 
                                        style={{ 
                                          backgroundColor: getAvatarBgColor(message.id, message.from),
                                          color: getAvatarTextColor(message.id, message.from)
                                        }}>
                                        <AvatarFallback className="text-xs font-semibold">
                                          {getInitials(message.from)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium break-words">{message.from}</span>
                                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                            {new Date(message.date).toLocaleString([], {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-3 pb-3">
                                      <div
                                        className="text-sm prose max-w-none break-words"
                                        style={{ 
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: cleanEmailBody(message.body) }}
                                      />
                                    </CollapsibleContent>
                                  </Collapsible>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Reply Dialog */}
            <Dialog open={replyModalVisible} onOpenChange={setReplyModalVisible}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Reply</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 p-1">
                  <div>
                    <label className="text-sm font-medium">To:</label>
                    <Input value={to} disabled className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject:</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={10}
                      className="mt-1 resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t flex-shrink-0">
                  <Button onClick={handleReplySubmit} disabled={isSending || isLeadInOnboarding || !hasWritePermission}>
                    {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send Reply
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Forward Dialog */}
            <Dialog open={forwardModalVisible} onOpenChange={setForwardModalVisible}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Forward Email</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 p-1">
                  <div>
                    <label className="text-sm font-medium">To:</label>
                    <Input
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject:</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={10}
                      className="mt-1 resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t flex-shrink-0">
                  <Button onClick={handleForwardSubmit} disabled={isSending || isLeadInOnboarding || !hasWritePermission}>
                    {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Forward
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Reply All Dialog */}
            <Dialog open={replyAllModalVisible} onOpenChange={setReplyAllModalVisible}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Reply All</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 p-1">
                  <div>
                    <label className="text-sm font-medium">To:</label>
                    <Input value={to} disabled className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject:</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={10}
                      className="mt-1 resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t flex-shrink-0">
                  <Button onClick={handleReplyAllSubmit} disabled={isSending || isLeadInOnboarding || !hasWritePermission}>
                    {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send to All
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Ticket Modal */}
            <CreateTicketModal
              visible={createTicketModalVisible}
              onCancel={() => setCreateTicketModalVisible(false)}
              email={selectedEmail}
            />

            {/* Summarize Modal */}
            <SummarizeModal
              visible={summarizeModalVisible}
              loadingSummary={loadingSummary}
              onCancel={() => setSummarizeModalVisible(false)}
              email={selectedEmail}
              workflowGeneratedOutput={workflowGeneratedOutput}
              setWorkflowGeneratedOutput={setWorkflowGeneratedOutput}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AccountEmail;
