"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CredentialForm } from "../CredentialForm";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import type { CredentialMetadata } from "@/lib/credentials/types";
import { getCredentialSchema } from "@/lib/credentials/credentialSchemas";
import { useNodeConfig } from "@/hooks/useNodeConfig";

type Props = {
  nodeId: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};

type ActionCategory = {
  label: string;
  actions: { value: string; label: string }[];
};

const ACTION_GROUPS: ActionCategory[] = [
  {
    label: "Messages",
    actions: [
      { value: "send_message", label: "Send Message" },
      { value: "update_message", label: "Update Message" },
      { value: "delete_message", label: "Delete Message" },
      { value: "get_message", label: "Get Message" },
      { value: "list_channel_history", label: "List Channel History" },
      { value: "get_thread_replies", label: "Get Thread Replies" },
      { value: "get_permalink", label: "Get Permalink" },
    ],
  },
  {
    label: "Scheduled Messages",
    actions: [
      { value: "schedule_message", label: "Schedule Message" },
      { value: "list_scheduled_messages", label: "List Scheduled Messages" },
      { value: "delete_scheduled_message", label: "Delete Scheduled Message" },
    ],
  },
  {
    label: "Reactions",
    actions: [
      { value: "add_reaction", label: "Add Reaction" },
      { value: "remove_reaction", label: "Remove Reaction" },
      { value: "get_reactions", label: "Get Reactions" },
    ],
  },
  {
    label: "Pins",
    actions: [
      { value: "pin_message", label: "Pin Message" },
      { value: "unpin_message", label: "Unpin Message" },
      { value: "list_pins", label: "List Pins" },
    ],
  },
  {
    label: "Conversations",
    actions: [
      { value: "list_conversations", label: "List Conversations" },
      { value: "get_conversation_info", label: "Get Conversation Info" },
      { value: "open_conversation", label: "Open DM" },
      { value: "create_conversation", label: "Create Channel" },
      { value: "rename_conversation", label: "Rename Channel" },
      { value: "set_topic", label: "Set Topic" },
      { value: "set_purpose", label: "Set Purpose" },
      { value: "archive_conversation", label: "Archive Channel" },
      { value: "unarchive_conversation", label: "Unarchive Channel" },
      { value: "invite_users", label: "Invite Users" },
      { value: "kick_user", label: "Kick User" },
      { value: "join_conversation", label: "Join Channel" },
      { value: "leave_conversation", label: "Leave Channel" },
      { value: "get_members", label: "Get Members" },
    ],
  },
  {
    label: "Users",
    actions: [
      { value: "list_users", label: "List Users" },
      { value: "get_user_info", label: "Get User Info" },
      { value: "lookup_user_by_email", label: "Lookup by Email" },
      { value: "get_user_presence", label: "Get User Presence" },
    ],
  },
  {
    label: "Search",
    actions: [
      { value: "search_messages", label: "Search Messages" },
      { value: "search_files", label: "Search Files" },
    ],
  },
  {
    label: "Files",
    actions: [
      { value: "upload_file", label: "Upload File" },
      { value: "get_file_info", label: "Get File Info" },
      { value: "delete_file", label: "Delete File" },
      { value: "list_files", label: "List Files" },
    ],
  },
  {
    label: "Bookmarks",
    actions: [
      { value: "add_bookmark", label: "Add Bookmark" },
      { value: "remove_bookmark", label: "Remove Bookmark" },
      { value: "list_bookmarks", label: "List Bookmarks" },
    ],
  },
  {
    label: "Canvases",
    actions: [
      { value: "create_canvas", label: "Create Canvas" },
      { value: "edit_canvas", label: "Edit Canvas" },
      { value: "delete_canvas", label: "Delete Canvas" },
      { value: "sections_lookup", label: "Sections Lookup" },
    ],
  },
];

const ACTIONS_THAT_NEED_CHANNEL = [
  "send_message", "update_message", "delete_message", "get_message",
  "list_channel_history", "get_thread_replies", "get_permalink",
  "schedule_message", "delete_scheduled_message",
  "add_reaction", "remove_reaction", "get_reactions",
  "pin_message", "unpin_message", "list_pins",
  "invite_users", "kick_user", "get_members",
  "upload_file",
  "add_bookmark", "remove_bookmark", "list_bookmarks",
];

const ACTIONS_THAT_NEED_TEXT = ["send_message", "schedule_message", "update_message"];

const ACTIONS_THAT_SUPPORT_BLOCKS = ["send_message", "update_message", "schedule_message"];

export function SlackConfig({ nodeId, credentialId, config, credentials, loading, onClose }: Props) {
  const { save } = useNodeConfig(nodeId, onClose);
  const [selectedId, setSelectedId] = useState<string | null>(credentialId || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [action, setAction] = useState(config.action || "send_message");
  const [channelId, setChannelId] = useState(config.channelId || "");
  const [text, setText] = useState(config.text || "");
  const [messageTs, setMessageTs] = useState(config.messageTs || "");
  const [threadTs, setThreadTs] = useState(config.threadTs || "");
  const [compositionMode, setCompositionMode] = useState(config.compositionMode || "text");
  const [blocks, setBlocks] = useState(config.blocks || "");
  const [fallbackText, setFallbackText] = useState(config.fallbackText || "");
  const [query, setQuery] = useState(config.query || "");
  const [name, setName] = useState(config.name || "");
  const [topic, setTopic] = useState(config.topic || "");
  const [purpose, setPurpose] = useState(config.purpose || "");
  const [isPrivate, setIsPrivate] = useState(config.isPrivate ?? true);
  const [users, setUsers] = useState(config.users || "");
  const [userId, setUserId] = useState(config.userId || "");
  const [email, setEmail] = useState(config.email || "");
  const [reaction, setReaction] = useState(config.reaction || "");
  const [filename, setFilename] = useState(config.filename || "");
  const [fileContent, setFileContent] = useState(config.content || "");
  const [fileId, setFileId] = useState(config.fileId || "");
  const [initialComment, setInitialComment] = useState(config.initialComment || "");
  const [altText, setAltText] = useState(config.altText || "");
  const [link, setLink] = useState(config.link || "");
  const [title, setTitle] = useState(config.title || "");
  const [emoji, setEmoji] = useState(config.emoji || "");
  const [bookmarkId, setBookmarkId] = useState(config.bookmarkId || "");
  const [canvasId, setCanvasId] = useState(config.canvasId || "");
  const [canvasContent, setCanvasContent] = useState(config.canvasContent || "");
  const [scheduledMessageId, setScheduledMessageId] = useState(config.scheduledMessageId || "");
  const [postAt, setPostAt] = useState(config.postAt || "");
  const [limit, setLimit] = useState(config.limit || "");
  const [returnAll, setReturnAll] = useState(config.returnAll ?? false);
  const [maxItems, setMaxItems] = useState(config.maxItems || "");
  const [oldest, setOldest] = useState(config.oldest || "");
  const [latest, setLatest] = useState(config.latest || "");
  const [sort, setSort] = useState(config.sort || "score");
  const [sortDir, setSortDir] = useState(config.sortDir || "desc");
  const [types, setTypes] = useState(config.types || "");
  const [count, setCount] = useState(config.count || "");
  const [excludeArchived, setExcludeArchived] = useState(config.excludeArchived ?? false);
  const [includeNumMembers, setIncludeNumMembers] = useState(config.includeNumMembers ?? false);

  const handleSave = useCallback(() => {
    const cfg: Record<string, any> = { action };
    if (channelId) cfg.channelId = channelId;
    if (text) cfg.text = text;
    if (messageTs) cfg.messageTs = messageTs;
    if (threadTs) cfg.threadTs = threadTs;
    if (compositionMode) cfg.compositionMode = compositionMode;
    if (blocks) cfg.blocks = blocks;
    if (fallbackText) cfg.fallbackText = fallbackText;
    if (query) cfg.query = query;
    if (name) cfg.name = name;
    if (types) cfg.types = types;
    if (topic) cfg.topic = topic;
    if (purpose) cfg.purpose = purpose;
    cfg.isPrivate = isPrivate;
    if (users) cfg.users = users;
    if (userId) cfg.userId = userId;
    if (email) cfg.email = email;
    if (reaction) cfg.reaction = reaction;
    if (filename) cfg.filename = filename;
    if (fileContent) cfg.content = fileContent;
    if (fileId) cfg.fileId = fileId;
    if (initialComment) cfg.initialComment = initialComment;
    if (altText) cfg.altText = altText;
    if (link) cfg.link = link;
    if (title) cfg.title = title;
    if (emoji) cfg.emoji = emoji;
    if (bookmarkId) cfg.bookmarkId = bookmarkId;
    if (canvasId) cfg.canvasId = canvasId;
    if (canvasContent) cfg.canvasContent = canvasContent;
    if (scheduledMessageId) cfg.scheduledMessageId = scheduledMessageId;
    if (postAt) cfg.postAt = Number(postAt);
    if (limit) cfg.limit = Number(limit);
    if (count) cfg.count = Number(count);
    cfg.returnAll = returnAll;
    if (maxItems) cfg.maxItems = Number(maxItems);
    if (oldest) cfg.oldest = oldest;
    if (latest) cfg.latest = latest;
    if (sort) cfg.sort = sort;
    if (sortDir) cfg.sortDir = sortDir;
    cfg.excludeArchived = excludeArchived;
    cfg.includeNumMembers = includeNumMembers;
    save(cfg, selectedId);
  }, [
    action, channelId, text, messageTs, threadTs, compositionMode,
    blocks, fallbackText, query, name, types, topic, purpose, isPrivate,
    users, userId, email, reaction, filename, fileContent, fileId,
    initialComment, altText, link, title, emoji, bookmarkId,
    canvasId, canvasContent, scheduledMessageId, postAt, limit, count,
    returnAll, maxItems, oldest, latest, sort, sortDir,
    excludeArchived, includeNumMembers, selectedId, save,
  ]);

  const selectedCred = credentials.find((c) => c._id === selectedId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Credential</Label>
        <Combobox value={selectedId || ""} onValueChange={setSelectedId}>
          <ComboboxInput placeholder="Search credentials..." className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]" />
          <ComboboxContent>
            <ComboboxList>
              {loading && <div className="p-2 text-sm text-[#6B7280]">Loading...</div>}
              <ComboboxEmpty>No credentials found</ComboboxEmpty>
              {credentials.map((c) => (
                <ComboboxItem key={c._id} value={c._id}>
                  <div className="flex flex-col">
                    <span>{c.name}</span>
                    {c.providerAccountId && (
                      <span className="text-xs text-[#6B7280]">{c.providerAccountId}</span>
                    )}
                  </div>
                  <Badge
                    variant={c.status === "active" ? "default" : "destructive"}
                    className="ml-auto text-[10px]"
                  >
                    {c.status}
                  </Badge>
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {selectedCred && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-1">
            <Badge variant="outline" className="text-[10px] rounded-full">{selectedCred.provider}</Badge>
            <span>{selectedCred.authMethod}</span>
          </div>
        )}
        {!showCreateForm ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => setShowCreateForm(true)}
          >
            Add New Credential
          </Button>
        ) : (
          <CredentialForm
            schema={getCredentialSchema("slack", "apiKey")!}
            onCreated={(id: string) => {
              setShowCreateForm(false);
              setSelectedId(id);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Action</Label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7] px-3 py-2 text-sm"
        >
          {ACTION_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.actions.map((act) => (
                <option key={act.value} value={act.value}>
                  {act.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {action === "send_message" && (
        <MessageFields
          compositionMode={compositionMode}
          setCompositionMode={setCompositionMode}
          channelId={channelId}
          setChannelId={setChannelId}
          text={text}
          setText={setText}
          blocks={blocks}
          setBlocks={setBlocks}
          fallbackText={fallbackText}
          setFallbackText={setFallbackText}
          threadTs={threadTs}
          setThreadTs={setThreadTs}
        />
      )}

      {action === "schedule_message" && (
        <>
          <MessageFields
            compositionMode={compositionMode}
            setCompositionMode={setCompositionMode}
            channelId={channelId}
            setChannelId={setChannelId}
            text={text}
            setText={setText}
            blocks={blocks}
            setBlocks={setBlocks}
            fallbackText={fallbackText}
            setFallbackText={setFallbackText}
            threadTs={threadTs}
            setThreadTs={setThreadTs}
          />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Post At (Unix timestamp)</Label>
            <Input
              type="number"
              value={postAt}
              onChange={(e) => setPostAt(e.target.value)}
              placeholder="1712000000"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "update_message" && (
        <>
          <MessageFields
            compositionMode={compositionMode}
            setCompositionMode={setCompositionMode}
            channelId={channelId}
            setChannelId={setChannelId}
            text={text}
            setText={setText}
            blocks={blocks}
            setBlocks={setBlocks}
            fallbackText={fallbackText}
            setFallbackText={setFallbackText}
          />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Message Timestamp</Label>
            <Input
              type="text"
              value={messageTs}
              onChange={(e) => setMessageTs(e.target.value)}
              placeholder="1712000000.000100"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "delete_message" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Message Timestamp</Label>
            <Input
              type="text"
              value={messageTs}
              onChange={(e) => setMessageTs(e.target.value)}
              placeholder="1712000000.000100"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "get_message" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Message Timestamp</Label>
            <Input
              type="text"
              value={messageTs}
              onChange={(e) => setMessageTs(e.target.value)}
              placeholder="1712000000.000100"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "list_channel_history" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <HistoryFields
            limit={limit}
            setLimit={setLimit}
            returnAll={returnAll}
            setReturnAll={setReturnAll}
            maxItems={maxItems}
            setMaxItems={setMaxItems}
            oldest={oldest}
            setOldest={setOldest}
            latest={latest}
            setLatest={setLatest}
          />
        </>
      )}

      {action === "get_thread_replies" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Parent Message Timestamp</Label>
            <Input
              type="text"
              value={messageTs}
              onChange={(e) => setMessageTs(e.target.value)}
              placeholder="1712000000.000100"
              className="rounded-xl"
            />
          </div>
          <HistoryFields
            limit={limit}
            setLimit={setLimit}
            returnAll={returnAll}
            setReturnAll={setReturnAll}
            maxItems={maxItems}
            setMaxItems={setMaxItems}
            oldest={oldest}
            setOldest={setOldest}
            latest={latest}
            setLatest={setLatest}
          />
        </>
      )}

      {action === "get_permalink" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Message Timestamp</Label>
            <Input
              type="text"
              value={messageTs}
              onChange={(e) => setMessageTs(e.target.value)}
              placeholder="1712000000.000100"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "list_scheduled_messages" && (
        <ChannelField channelId={channelId} setChannelId={setChannelId} />
      )}

      {action === "delete_scheduled_message" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Scheduled Message ID</Label>
            <Input
              type="text"
              value={scheduledMessageId}
              onChange={(e) => setScheduledMessageId(e.target.value)}
              placeholder="Q123ABC"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {["add_reaction", "remove_reaction"].includes(action) && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Message Timestamp</Label>
            <Input
              type="text"
              value={messageTs}
              onChange={(e) => setMessageTs(e.target.value)}
              placeholder="1712000000.000100"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Reaction (emoji name)</Label>
            <Input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="thumbsup"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "get_reactions" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Message Timestamp</Label>
            <Input
              type="text"
              value={messageTs}
              onChange={(e) => setMessageTs(e.target.value)}
              placeholder="1712000000.000100"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {["pin_message", "unpin_message"].includes(action) && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Message Timestamp</Label>
            <Input
              type="text"
              value={messageTs}
              onChange={(e) => setMessageTs(e.target.value)}
              placeholder="1712000000.000100"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "list_pins" && (
        <ChannelField channelId={channelId} setChannelId={setChannelId} />
      )}

      {action === "list_conversations" && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Types (comma-separated)</Label>
            <Input
              type="text"
              value={types}
              onChange={(e) => setTypes(e.target.value)}
              placeholder="public_channel,private_channel"
              className="rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="excludeArchived"
              checked={excludeArchived}
              onChange={(e) => setExcludeArchived(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="excludeArchived" className="text-sm">Exclude archived</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="incNumMembers"
              checked={includeNumMembers}
              onChange={(e) => setIncludeNumMembers(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="incNumMembers" className="text-sm">Include member count</Label>
          </div>
        </div>
      )}

      {action === "get_conversation_info" && (
        <ChannelField channelId={channelId} setChannelId={setChannelId} />
      )}

      {action === "open_conversation" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Users (comma-separated IDs)</Label>
          <Input
            type="text"
            value={users}
            onChange={(e) => setUsers(e.target.value)}
            placeholder="U123ABC,U456DEF"
            className="rounded-xl"
          />
        </div>
      )}

      {action === "create_conversation" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-channel"
              className="rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isPrivate" className="text-sm">Private channel</Label>
          </div>
        </>
      )}

      {action === "rename_conversation" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">New Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-name"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "set_topic" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Topic</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Channel topic"
              rows={2}
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "set_purpose" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Purpose</Label>
            <Textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Channel purpose"
              rows={2}
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {["archive_conversation", "unarchive_conversation", "leave_conversation", "join_conversation"].includes(action) && (
        <ChannelField channelId={channelId} setChannelId={setChannelId} />
      )}

      {action === "invite_users" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">User IDs (comma-separated)</Label>
            <Input
              type="text"
              value={users}
              onChange={(e) => setUsers(e.target.value)}
              placeholder="U123ABC,U456DEF"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "kick_user" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">User ID</Label>
            <Input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="U123ABC"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "get_members" && (
        <ChannelField channelId={channelId} setChannelId={setChannelId} />
      )}

      {action === "list_users" && null}

      {action === "get_user_info" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">User ID</Label>
          <Input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="U123ABC"
            className="rounded-xl"
          />
        </div>
      )}

      {action === "lookup_user_by_email" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="rounded-xl"
          />
        </div>
      )}

      {action === "get_user_presence" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">User ID</Label>
          <Input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="U123ABC"
            className="rounded-xl"
          />
        </div>
      )}

      {action === "search_messages" && (
        <SearchFields
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortDir={sortDir}
          setSortDir={setSortDir}
          count={count}
          setCount={setCount}
        />
      )}

      {action === "search_files" && (
        <SearchFields
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortDir={sortDir}
          setSortDir={setSortDir}
          count={count}
          setCount={setCount}
        />
      )}

      {action === "upload_file" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Filename</Label>
            <Input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="report.csv"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Content (text)</Label>
            <Textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="File content..."
              rows={4}
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Title (optional)</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q4 Report"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Initial Comment (optional)</Label>
            <Input
              type="text"
              value={initialComment}
              onChange={(e) => setInitialComment(e.target.value)}
              placeholder="Here's the latest report"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Alt Text (optional)</Label>
            <Input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Description for accessibility"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "get_file_info" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">File ID</Label>
          <Input
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="F123ABC"
            className="rounded-xl"
          />
        </div>
      )}

      {action === "delete_file" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">File ID</Label>
          <Input
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="F123ABC"
            className="rounded-xl"
          />
        </div>
      )}

      {action === "list_files" && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Channel ID (optional)</Label>
            <Input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="C123ABC"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">User ID (optional)</Label>
            <Input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="U123ABC"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Limit</Label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="100"
              className="rounded-xl"
            />
          </div>
        </div>
      )}

      {action === "add_bookmark" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Title</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Important Link"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Link</Label>
            <Input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Emoji (optional)</Label>
            <Input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="star"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "remove_bookmark" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Bookmark ID</Label>
            <Input
              type="text"
              value={bookmarkId}
              onChange={(e) => setBookmarkId(e.target.value)}
              placeholder="Bk123ABC"
              className="rounded-xl"
            />
          </div>
        </>
      )}

      {action === "list_bookmarks" && (
        <ChannelField channelId={channelId} setChannelId={setChannelId} />
      )}

      {action === "create_canvas" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Title</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting Notes"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Content (Canvas document)</Label>
            <Textarea
              value={canvasContent}
              onChange={(e) => setCanvasContent(e.target.value)}
              placeholder='[{"type":"section","children":[{"type":"text","text":"Hello"}]}]'
              rows={6}
              className="rounded-xl font-mono text-xs"
            />
          </div>
        </>
      )}

      {action === "edit_canvas" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Canvas ID</Label>
            <Input
              type="text"
              value={canvasId}
              onChange={(e) => setCanvasId(e.target.value)}
              placeholder="Cvs123ABC"
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Content (Canvas document)</Label>
            <Textarea
              value={canvasContent}
              onChange={(e) => setCanvasContent(e.target.value)}
              placeholder='[{"type":"section","children":[{"type":"text","text":"Hello"}]}]'
              rows={6}
              className="rounded-xl font-mono text-xs"
            />
          </div>
        </>
      )}

      {action === "delete_canvas" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Canvas ID</Label>
          <Input
            type="text"
            value={canvasId}
            onChange={(e) => setCanvasId(e.target.value)}
            placeholder="Cvs123ABC"
            className="rounded-xl"
          />
        </div>
      )}

      {action === "sections_lookup" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Canvas ID</Label>
          <Input
            type="text"
            value={canvasId}
            onChange={(e) => setCanvasId(e.target.value)}
            placeholder="Cvs123ABC"
            className="rounded-xl"
          />
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#5B5CEB] hover:bg-[#4C4DDA] text-white">
          Save
        </Button>
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F5]">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ChannelField({ channelId, setChannelId }: { channelId: string; setChannelId: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-semibold text-[#111827]">Channel ID</Label>
      <Input
        type="text"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        placeholder="C123ABC"
        className="rounded-xl"
      />
    </div>
  );
}

function MessageFields({
  compositionMode, setCompositionMode,
  channelId, setChannelId,
  text, setText,
  blocks, setBlocks,
  fallbackText, setFallbackText,
  threadTs, setThreadTs,
}: {
  compositionMode: string; setCompositionMode: (v: string) => void;
  channelId: string; setChannelId: (v: string) => void;
  text: string; setText: (v: string) => void;
  blocks: string; setBlocks: (v: string) => void;
  fallbackText: string; setFallbackText: (v: string) => void;
  threadTs: string; setThreadTs: (v: string) => void;
}) {
  return (
    <>
      <ChannelField channelId={channelId} setChannelId={setChannelId} />
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Composition Mode</Label>
        <select
          value={compositionMode}
          onChange={(e) => setCompositionMode(e.target.value)}
          className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7] px-3 py-2 text-sm"
        >
          <option value="text">Text (mrkdwn)</option>
          <option value="blocks">Block Kit (JSON)</option>
        </select>
      </div>
      {compositionMode === "text" ? (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Message Text</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Hello, world!"
            rows={3}
            className="rounded-xl"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Block Kit JSON</Label>
            <Textarea
              value={blocks}
              onChange={(e) => setBlocks(e.target.value)}
              placeholder='[{"type":"section","text":{"type":"mrkdwn","text":"Hello"}}]'
              rows={6}
              className="rounded-xl font-mono text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Fallback Text</Label>
            <Input
              type="text"
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              placeholder="Notification text for non-Block Kit clients"
              className="rounded-xl"
            />
          </div>
        </>
      )}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Thread TS (optional)</Label>
        <Input
          type="text"
          value={threadTs}
          onChange={(e) => setThreadTs(e.target.value)}
          placeholder="1712000000.000100"
          className="rounded-xl"
        />
      </div>
    </>
  );
}

function HistoryFields({
  limit, setLimit, returnAll, setReturnAll, maxItems, setMaxItems, oldest, setOldest, latest, setLatest,
}: {
  limit: string; setLimit: (v: string) => void;
  returnAll: boolean; setReturnAll: (v: boolean) => void;
  maxItems: string; setMaxItems: (v: string) => void;
  oldest: string; setOldest: (v: string) => void;
  latest: string; setLatest: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Limit (per page)</Label>
        <Input
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="100"
          className="rounded-xl"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="returnAll"
          checked={returnAll}
          onChange={(e) => setReturnAll(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="returnAll" className="text-sm">Return all (auto-paginate)</Label>
      </div>
      {returnAll && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Max Items</Label>
          <Input
            type="number"
            value={maxItems}
            onChange={(e) => setMaxItems(e.target.value)}
            placeholder="10000"
            className="rounded-xl"
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Oldest (optional, timestamp)</Label>
        <Input
          type="text"
          value={oldest}
          onChange={(e) => setOldest(e.target.value)}
          placeholder="1712000000"
          className="rounded-xl"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Latest (optional, timestamp)</Label>
        <Input
          type="text"
          value={latest}
          onChange={(e) => setLatest(e.target.value)}
          placeholder="1712000000"
          className="rounded-xl"
        />
      </div>
    </div>
  );
}

function SearchFields({
  query, setQuery, sort, setSort, sortDir, setSortDir, count, setCount,
}: {
  query: string; setQuery: (v: string) => void;
  sort: string; setSort: (v: string) => void;
  sortDir: string; setSortDir: (v: string) => void;
  count: string; setCount: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Query</Label>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search terms"
          className="rounded-xl"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Sort</Label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7] px-3 py-2 text-sm"
        >
          <option value="score">Score</option>
          <option value="timestamp">Timestamp</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Sort Direction</Label>
        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
          className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7] px-3 py-2 text-sm"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Count</Label>
        <Input
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="20"
          className="rounded-xl"
        />
      </div>
    </div>
  );
}
