import { discordActions } from "./schema";

export interface ActionGroup {
  label: string;
  actions: { value: string; label: string }[];
}

export const ACTION_GROUPS: readonly ActionGroup[] = [
  {
    label: "Messages",
    actions: [
      { value: "send_message", label: "Send Message" },
      { value: "get_message", label: "Get Message" },
      { value: "edit_message", label: "Edit Message" },
      { value: "delete_message", label: "Delete Message" },
      { value: "bulk_delete_messages", label: "Bulk Delete Messages" },
      { value: "get_channel_messages", label: "Get Channel Messages" },
      { value: "get_pinned_messages", label: "Get Pinned Messages" },
      { value: "pin_message", label: "Pin Message" },
      { value: "unpin_message", label: "Unpin Message" },
      { value: "crosspost_message", label: "Crosspost Message" },
    ],
  },
  {
    label: "Reactions",
    actions: [
      { value: "create_reaction", label: "Add Reaction" },
      { value: "delete_own_reaction", label: "Remove Own Reaction" },
      { value: "delete_user_reaction", label: "Remove User Reaction" },
      { value: "get_reactions", label: "Get Reactions" },
      { value: "clear_reactions", label: "Clear All Reactions" },
    ],
  },
  {
    label: "Threads",
    actions: [
      { value: "create_thread", label: "Create Thread" },
      { value: "join_thread", label: "Join Thread" },
      { value: "leave_thread", label: "Leave Thread" },
      { value: "add_thread_member", label: "Add Thread Member" },
      { value: "remove_thread_member", label: "Remove Thread Member" },
      { value: "get_thread_member", label: "Get Thread Member" },
      { value: "list_thread_members", label: "List Thread Members" },
      { value: "list_active_threads", label: "List Active Threads" },
      { value: "list_public_archived_threads", label: "List Public Archived Threads" },
      { value: "list_private_archived_threads", label: "List Private Archived Threads" },
      { value: "list_joined_archived_threads", label: "List Joined Archived Threads" },
    ],
  },
  {
    label: "Channels",
    actions: [
      { value: "get_channel", label: "Get Channel" },
      { value: "modify_channel", label: "Modify Channel" },
      { value: "delete_channel", label: "Delete Channel" },
    ],
  },
  {
    label: "Guilds",
    actions: [
      { value: "get_guild", label: "Get Guild" },
      { value: "get_guild_preview", label: "Get Guild Preview" },
      { value: "modify_guild", label: "Modify Guild" },
      { value: "get_guild_prune_count", label: "Get Prune Count" },
      { value: "begin_guild_prune", label: "Begin Guild Prune" },
      { value: "get_guild_voice_regions", label: "Get Voice Regions" },
      { value: "get_guild_invites", label: "Get Guild Invites" },
      { value: "get_guild_widget", label: "Get Guild Widget" },
      { value: "get_guild_vanity_url", label: "Get Vanity URL" },
      { value: "get_guild_welcome_screen", label: "Get Welcome Screen" },
      { value: "update_guild_welcome_screen", label: "Update Welcome Screen" },
      { value: "get_guild_onboarding", label: "Get Onboarding" },
      { value: "update_guild_onboarding", label: "Update Onboarding" },
    ],
  },
  {
    label: "Members",
    actions: [
      { value: "get_member", label: "Get Member" },
      { value: "list_members", label: "List Members" },
      { value: "search_members", label: "Search Members" },
      { value: "modify_member", label: "Modify Member" },
      { value: "add_member_role", label: "Add Member Role" },
      { value: "remove_member_role", label: "Remove Member Role" },
      { value: "kick_member", label: "Kick Member" },
      { value: "get_bans", label: "Get Bans" },
      { value: "get_ban", label: "Get Ban" },
      { value: "create_ban", label: "Create Ban" },
      { value: "remove_ban", label: "Remove Ban" },
    ],
  },
  {
    label: "Users",
    actions: [
      { value: "get_user", label: "Get User" },
      { value: "get_current_user", label: "Get Current User" },
    ],
  },
  {
    label: "Roles",
    actions: [
      { value: "get_roles", label: "Get Roles" },
      { value: "create_role", label: "Create Role" },
      { value: "modify_role", label: "Modify Role" },
      { value: "modify_role_positions", label: "Modify Role Positions" },
      { value: "delete_role", label: "Delete Role" },
    ],
  },
  {
    label: "Webhooks",
    actions: [
      { value: "execute_webhook", label: "Execute Webhook" },
      { value: "create_webhook", label: "Create Webhook" },
      { value: "modify_webhook", label: "Modify Webhook" },
      { value: "delete_webhook", label: "Delete Webhook" },
      { value: "get_channel_webhooks", label: "Get Channel Webhooks" },
      { value: "get_guild_webhooks", label: "Get Guild Webhooks" },
    ],
  },
  {
    label: "Invites",
    actions: [
      { value: "get_channel_invites", label: "Get Channel Invites" },
      { value: "create_invite", label: "Create Invite" },
      { value: "delete_invite", label: "Delete Invite" },
    ],
  },
  {
    label: "Scheduled Events",
    actions: [
      { value: "list_scheduled_events", label: "List Events" },
      { value: "create_scheduled_event", label: "Create Event" },
      { value: "get_scheduled_event", label: "Get Event" },
      { value: "modify_scheduled_event", label: "Modify Event" },
      { value: "delete_scheduled_event", label: "Delete Event" },
      { value: "get_scheduled_event_users", label: "Get Event Users" },
    ],
  },
  {
    label: "Emojis & Stickers",
    actions: [
      { value: "get_emojis", label: "Get Emojis" },
      { value: "get_emoji", label: "Get Emoji" },
      { value: "create_emoji", label: "Create Emoji" },
      { value: "modify_emoji", label: "Modify Emoji" },
      { value: "delete_emoji", label: "Delete Emoji" },
      { value: "get_stickers", label: "Get Stickers" },
      { value: "get_sticker", label: "Get Sticker" },
      { value: "create_sticker", label: "Create Sticker" },
      { value: "modify_sticker", label: "Modify Sticker" },
      { value: "delete_sticker", label: "Delete Sticker" },
    ],
  },
  {
    label: "Auto Moderation",
    actions: [
      { value: "list_auto_mod_rules", label: "List Rules" },
      { value: "get_auto_mod_rule", label: "Get Rule" },
      { value: "create_auto_mod_rule", label: "Create Rule" },
      { value: "modify_auto_mod_rule", label: "Modify Rule" },
      { value: "delete_auto_mod_rule", label: "Delete Rule" },
    ],
  },
  {
    label: "Stage Instances",
    actions: [
      { value: "create_stage_instance", label: "Create Instance" },
      { value: "get_stage_instance", label: "Get Instance" },
      { value: "modify_stage_instance", label: "Modify Instance" },
      { value: "delete_stage_instance", label: "Delete Instance" },
    ],
  },
  {
    label: "Application Commands",
    actions: [
      { value: "get_global_commands", label: "Get Global Commands" },
      { value: "create_global_command", label: "Create Global Command" },
      { value: "get_guild_commands", label: "Get Guild Commands" },
      { value: "create_guild_command", label: "Create Guild Command" },
      { value: "bulk_overwrite_commands", label: "Bulk Overwrite Commands" },
    ],
  },
  {
    label: "Audit Log",
    actions: [
      { value: "get_audit_log", label: "Get Audit Log" },
    ],
  },
];

export function getAllSelectableActions(): string[] {
  return ACTION_GROUPS.flatMap((g) => g.actions.map((a) => a.value));
}

export function verifyActionCoverage(): void {
  const selectable: string[] = getAllSelectableActions();
  const declared: string[] = [...discordActions];
  const missing = declared.filter((a) => !selectable.includes(a));
  const extra = selectable.filter((a) => !declared.includes(a));
  const duplicates = selectable.filter((a, i) => selectable.indexOf(a) !== i);
  const errors: string[] = [];
  if (missing.length) errors.push(`UI missing actions: ${missing.join(", ")}`);
  if (extra.length) errors.push(`UI extra actions: ${extra.join(", ")}`);
  if (duplicates.length) errors.push(`UI duplicate actions: ${duplicates.join(", ")}`);
  if (errors.length) throw new Error(errors.join("\n"));
}
