import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Rolcontrole mislukt.");
  if (!data) throw new Error("Forbidden: alleen beheerders.");
}

async function audit(
  adminId: string,
  action: string,
  target_type: string,
  target_id: string,
  details?: Record<string, unknown>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("admin_audit_log")
    .insert({ admin_id: adminId, action, target_type, target_id, details: (details ?? {}) as never });
}

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ search: z.string().max(120).optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, suspended_at, suspended_reason");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const rMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      rMap.set(r.user_id, [...(rMap.get(r.user_id) ?? []), r.role]);
    }
    const term = (data.search ?? "").trim().toLowerCase();
    return list.users
      .map((u) => {
        const p: any = pMap.get(u.id) ?? {};
        return {
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          banned_until: (u as any).banned_until ?? null,
          full_name: p.full_name ?? null,
          username: p.username ?? null,
          suspended_at: p.suspended_at ?? null,
          suspended_reason: p.suspended_reason ?? null,
          roles: rMap.get(u.id) ?? [],
        };
      })
      .filter(
        (u) =>
          !term ||
          (u.email ?? "").toLowerCase().includes(term) ||
          (u.full_name ?? "").toLowerCase().includes(term) ||
          (u.username ?? "").toLowerCase().includes(term),
      );
  });

export const adminSetSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        userId: z.string().uuid(),
        suspended: z.boolean(),
        reason: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    if (data.userId === context.userId)
      throw new Error("Je kunt je eigen beheerdersaccount niet schorsen.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspended ? "876000h" : "none",
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin
      .from("profiles")
      .update({
        suspended_at: data.suspended ? new Date().toISOString() : null,
        suspended_reason: data.suspended ? (data.reason ?? null) : null,
      })
      .eq("id", data.userId);
    await audit(context.userId, data.suspended ? "user.suspend" : "user.reactivate", "user", data.userId, {
      reason: data.reason ?? null,
    });
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ userId: z.string().uuid(), confirmEmail: z.string().min(3) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    if (data.userId === context.userId)
      throw new Error("Je kunt je eigen beheerdersaccount niet verwijderen.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: e0 } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (e0) throw new Error(e0.message);
    if ((target.user?.email ?? "").toLowerCase() !== data.confirmEmail.trim().toLowerCase())
      throw new Error("Bevestiging komt niet overeen met het e-mailadres van dit account.");
    await audit(context.userId, "user.delete", "user", data.userId, {
      email: target.user?.email ?? null,
    });
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        reportId: z.string().uuid(),
        status: z.enum(["open", "in_behandeling", "afgehandeld", "afgewezen"]),
        notes: z.string().max(2000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reports")
      .update({
        status: data.status,
        admin_notes: data.notes ?? null,
        handled_by: context.userId,
        handled_at: new Date().toISOString(),
      })
      .eq("id", data.reportId);
    if (error) throw new Error(error.message);
    await audit(context.userId, "report.update", "report", data.reportId, { status: data.status });
    return { ok: true };
  });

export const adminLogAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        action: z.string().max(80),
        targetType: z.string().max(40),
        targetId: z.string().max(80),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    await audit(context.userId, data.action, data.targetType, data.targetId, data.details);
    return { ok: true };
  });
