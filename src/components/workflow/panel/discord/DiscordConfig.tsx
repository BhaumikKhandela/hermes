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
import { ACTION_GROUPS } from "@/lib/workflow-tools/tools/discord/actionGroups";

type Props = {
  nodeId: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};



export function DiscordConfig({ nodeId, credentialId, config, credentials, loading, onClose }: Props) {
  const { save } = useNodeConfig(nodeId, onClose);
  const [selectedId, setSelectedId] = useState<string | null>(credentialId || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [action, setAction] = useState(config.action || "send_message");
  const [channelId, setChannelId] = useState(config.channelId || "");
  const [guildId, setGuildId] = useState(config.guildId || "");
  const [messageId, setMessageId] = useState(config.messageId || "");
  const [content, setContent] = useState(config.content || "");
  const [embeds, setEmbeds] = useState(config.embeds || "");
  const [components, setComponents] = useState(config.components || "");
  const [allowedMentions, setAllowedMentions] = useState(config.allowedMentions || "");
  const [userId, setUserId] = useState(config.userId || "");
  const [emoji, setEmoji] = useState(config.emoji || "");
  const [name, setName] = useState(config.name || "");
  const [limit, setLimit] = useState(config.limit || "");
  const [returnAll, setReturnAll] = useState(config.returnAll ?? false);
  const [maxItems, setMaxItems] = useState(config.maxItems || "");
  const [description, setDescription] = useState(config.description || "");
  const [topic, setTopic] = useState(config.topic || "");
  const [position, setPosition] = useState(config.position || "");
  const [archive, setArchive] = useState(config.archived ?? false);
  const [rateLimitPerUser, setRateLimitPerUser] = useState(config.rateLimitPerUser || "");
  const [nsfw, setNsfw] = useState(config.nsfw ?? false);
  const [bitrate, setBitrate] = useState(config.bitrate || "");
  const [userLimit, setUserLimit] = useState(config.userLimit || "");
  const [entityType, setEntityType] = useState(config.entityType || "3");
  const [scheduledStartTime, setScheduledStartTime] = useState(config.scheduledStartTime || "");
  const [roleId, setRoleId] = useState(config.roleId || "");
  const [webhookId, setWebhookId] = useState(config.webhookId || "");
  const [webhookToken, setWebhookToken] = useState(config.webhookToken || "");
  const [applicationId, setApplicationId] = useState(config.applicationId || "");
  const [image, setImage] = useState(config.image || "");

  const handleSave = useCallback(() => {
    const cfg: Record<string, any> = { action };
    const fields: Record<string, string | number | boolean> = {
      channelId, guildId, messageId, userId, emoji, name, description, topic, position,
      entityType, scheduledStartTime, content, embeds, components, allowedMentions,
      roleId, webhookId, webhookToken, applicationId, image,
    };
    for (const [k, v] of Object.entries(fields)) {
      if (v) cfg[k] = v;
    }
    if (limit) cfg.limit = Number(limit);
    if (maxItems) cfg.maxItems = Number(maxItems);
    if (rateLimitPerUser) cfg.rateLimitPerUser = Number(rateLimitPerUser);
    if (bitrate) cfg.bitrate = Number(bitrate);
    if (userLimit) cfg.userLimit = Number(userLimit);
    cfg.returnAll = returnAll;
    cfg.nsfw = nsfw;
    cfg.archived = archive;
    save(cfg, selectedId);
  }, [
    action, channelId, guildId, messageId, userId, emoji, name, description, topic,
    position, entityType, scheduledStartTime, content, embeds, components, allowedMentions,
    roleId, webhookId, webhookToken, applicationId, image,
    limit, maxItems, rateLimitPerUser, bitrate, userLimit,
    returnAll, nsfw, archive, selectedId, save,
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
                  <Badge variant={c.status === "active" ? "default" : "destructive"} className="ml-auto text-[10px]">
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
          <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={() => setShowCreateForm(true)}>
            Add New Credential
          </Button>
        ) : (
          <CredentialForm
            schema={getCredentialSchema("discord", "apiKey")!}
            onCreated={(id: string) => { setShowCreateForm(false); setSelectedId(id); }}
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
                <option key={act.value} value={act.value}>{act.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {["send_message", "edit_message"].includes(action) && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Message text" rows={3} className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Embeds (JSON array, optional)</Label>
            <Textarea value={embeds} onChange={(e) => setEmbeds(e.target.value)} placeholder='[{"title":"Hello","description":"World"}]' rows={3} className="rounded-xl font-mono text-xs" />
          </div>
        </>
      )}

      {["get_message", "delete_message", "crosspost_message", "pin_message", "unpin_message"].includes(action) && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <MessageIdField messageId={messageId} setMessageId={setMessageId} />
        </>
      )}

      {action === "get_channel_messages" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <HistoryFields limit={limit} setLimit={setLimit} returnAll={returnAll} setReturnAll={setReturnAll} maxItems={maxItems} setMaxItems={setMaxItems} />
        </>
      )}

      {["create_reaction", "delete_own_reaction", "delete_user_reaction", "get_reactions", "clear_reactions"].includes(action) && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <MessageIdField messageId={messageId} setMessageId={setMessageId} />
          {action !== "clear_reactions" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">Emoji</Label>
              <Input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="👍 or %F0%9F%91%8D" className="rounded-xl" />
            </div>
          )}
          {action === "delete_user_reaction" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">User ID</Label>
              <Input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="123456789" className="rounded-xl" />
            </div>
          )}
        </>
      )}

      {action === "create_thread" && (
        <>
          <ChannelField channelId={channelId} setChannelId={setChannelId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Name</Label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Thread name" className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Message ID (for public thread, optional)</Label>
            <Input type="text" value={messageId} onChange={(e) => setMessageId(e.target.value)} placeholder="Leave blank for forum" className="rounded-xl" />
          </div>
        </>
      )}

      {["get_channel", "modify_channel", "delete_channel"].includes(action) && (
        <ChannelField channelId={channelId} setChannelId={setChannelId} />
      )}

      {action === "modify_channel" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Name (optional)</Label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="new-channel-name" className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Topic (optional)</Label>
            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Channel topic" rows={2} className="rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="nsfw" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} className="rounded" />
            <Label htmlFor="nsfw" className="text-sm">NSFW</Label>
          </div>
        </>
      )}

      {["get_guild", "modify_guild"].includes(action) && (
        <GuildIdField guildId={guildId} setGuildId={setGuildId} />
      )}

      {["get_member", "modify_member", "kick_member", "remove_member_role", "get_ban", "create_ban", "remove_ban"].includes(action) && (
        <>
          <GuildIdField guildId={guildId} setGuildId={setGuildId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">User ID</Label>
            <Input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="123456789" className="rounded-xl" />
          </div>
        </>
      )}

      {action === "add_member_role" && (
        <>
          <GuildIdField guildId={guildId} setGuildId={setGuildId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">User ID</Label>
            <Input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="123456789" className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Role ID</Label>
            <Input type="text" value={roleId} onChange={(e) => setRoleId(e.target.value)} placeholder="987654321" className="rounded-xl" />
          </div>
        </>
      )}

      {["list_members", "search_members", "get_bans", "get_roles", "get_guild_voice_regions", "get_guild_invites", "get_guild_welcome_screen", "get_guild_onboarding", "get_emojis", "get_stickers", "get_guild_webhooks", "list_scheduled_events", "get_audit_log", "list_auto_mod_rules"].includes(action) && (
        <GuildIdField guildId={guildId} setGuildId={setGuildId} />
      )}

      {action === "search_members" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Query</Label>
          <Input type="text" value={content} onChange={(e) => setContent(e.target.value)} placeholder="username or nick" className="rounded-xl" />
        </div>
      )}

      {["create_role", "modify_role", "delete_role"].includes(action) && (
        <>
          <GuildIdField guildId={guildId} setGuildId={setGuildId} />
          {action !== "delete_role" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">Name</Label>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" className="rounded-xl" />
            </div>
          )}
        </>
      )}

      {action === "execute_webhook" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Webhook ID</Label>
            <Input type="text" value={webhookId} onChange={(e) => setWebhookId(e.target.value)} placeholder="123456" className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Webhook Token</Label>
            <Input type="text" value={webhookToken} onChange={(e) => setWebhookToken(e.target.value)} placeholder="secret-token" className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Message text" rows={3} className="rounded-xl" />
          </div>
        </>
      )}

      {action === "create_invite" && (
        <ChannelField channelId={channelId} setChannelId={setChannelId} />
      )}

      {action === "create_emoji" && (
        <>
          <GuildIdField guildId={guildId} setGuildId={setGuildId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Name</Label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="emoji_name" className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Image (data URI)</Label>
            <Input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="data:image/png;base64,..." className="rounded-xl" />
          </div>
        </>
      )}

      {action === "create_scheduled_event" && (
        <>
          <GuildIdField guildId={guildId} setGuildId={setGuildId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Name</Label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Entity Type</Label>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7] px-3 py-2 text-sm">
              <option value="2">Voice Channel</option>
              <option value="3">External</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Start Time (ISO)</Label>
            <Input type="text" value={scheduledStartTime} onChange={(e) => setScheduledStartTime(e.target.value)} placeholder="2025-01-01T00:00:00Z" className="rounded-xl" />
          </div>
        </>
      )}

      {["get_global_commands", "create_global_command", "get_guild_commands", "create_guild_command", "bulk_overwrite_commands"].includes(action) && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Application ID</Label>
          <Input type="text" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} placeholder="123456789" className="rounded-xl" />
        </div>
      )}

      {action === "create_global_command" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Name</Label>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="command-name" className="rounded-xl" />
          <Label className="text-[13px] font-semibold text-[#111827]">Description</Label>
          <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Command description" className="rounded-xl" />
        </div>
      )}

      {action === "create_auto_mod_rule" && (
        <>
          <GuildIdField guildId={guildId} setGuildId={setGuildId} />
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Name</Label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name" className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Actions (JSON array)</Label>
            <Textarea value={embeds} onChange={(e) => setEmbeds(e.target.value)} placeholder='[{"type":1}]' rows={3} className="rounded-xl font-mono text-xs" />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#5B5CEB] hover:bg-[#4C4DDA] text-white">Save</Button>
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F5]">Cancel</Button>
      </div>
    </div>
  );
}

function ChannelField({ channelId, setChannelId }: { channelId: string; setChannelId: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-semibold text-[#111827]">Channel ID</Label>
      <Input type="text" value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="123456789" className="rounded-xl" />
    </div>
  );
}

function GuildIdField({ guildId, setGuildId }: { guildId: string; setGuildId: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-semibold text-[#111827]">Guild ID</Label>
      <Input type="text" value={guildId} onChange={(e) => setGuildId(e.target.value)} placeholder="123456789" className="rounded-xl" />
    </div>
  );
}

function MessageIdField({ messageId, setMessageId }: { messageId: string; setMessageId: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-semibold text-[#111827]">Message ID</Label>
      <Input type="text" value={messageId} onChange={(e) => setMessageId(e.target.value)} placeholder="987654321" className="rounded-xl" />
    </div>
  );
}

function HistoryFields({
  limit, setLimit, returnAll, setReturnAll, maxItems, setMaxItems,
}: {
  limit: string; setLimit: (v: string) => void;
  returnAll: boolean; setReturnAll: (v: boolean) => void;
  maxItems: string; setMaxItems: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Limit (per page)</Label>
        <Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="100" className="rounded-xl" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="returnAll" checked={returnAll} onChange={(e) => setReturnAll(e.target.checked)} className="rounded" />
        <Label htmlFor="returnAll" className="text-sm">Return all (auto-paginate)</Label>
      </div>
      {returnAll && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Max Items</Label>
          <Input type="number" value={maxItems} onChange={(e) => setMaxItems(e.target.value)} placeholder="10000" className="rounded-xl" />
        </div>
      )}
    </div>
  );
}
