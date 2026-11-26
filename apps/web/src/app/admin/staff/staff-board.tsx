"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Search, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

// Shop staff are accounts with Better Auth's "admin" role; everyone else is a customer.
// Everything here goes through Better Auth's admin endpoints, which check the role themselves.

type Account = { id: string; name: string; email: string; role?: string | null; createdAt: Date | string };

const isAdmin = (role: string | null | undefined) => (role ?? "").split(",").some((r) => r.trim() === "admin");
const STAFF_KEY = ["admin", "staff"] as const;

async function unwrap<T>(promise: Promise<{ data: T | null; error: { message?: string; statusText?: string } | null }>) {
  const { data, error } = await promise;
  if (error || !data) throw new Error(error?.message || error?.statusText || "Something went wrong.");
  return data;
}

export function StaffBoard({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [show, setShow] = useState<"staff" | "everyone">("staff");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const accounts = useQuery({
    queryKey: [...STAFF_KEY, show, search],
    queryFn: () =>
      unwrap(
        authClient.admin.listUsers({
          query: {
            limit: 200,
            sortBy: "createdAt",
            sortDirection: "desc",
            ...(search && { searchValue: search, searchField: "email", searchOperator: "contains" }),
            ...(show === "staff" && { filterField: "role", filterValue: "admin", filterOperator: "contains" }),
          },
        })
      ),
  });
  const reload = () => queryClient.invalidateQueries({ queryKey: STAFF_KEY });

  const run = async (id: string, action: () => Promise<unknown>, done: string) => {
    setBusy(id);
    try {
      await action();
      toast.success(done);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const setRole = (user: Account, admin: boolean) =>
    run(
      user.id,
      () => unwrap(authClient.admin.setRole({ userId: user.id, role: admin ? "admin" : "user" })),
      admin ? `${user.name} can now open the admin.` : `${user.name} is no longer staff.`
    );

  const resetPassword = (user: Account) => {
    const newPassword = window.prompt(`New password for ${user.email} (at least 8 characters):`);
    if (!newPassword) return;
    if (newPassword.length < 8) return toast.error("Use at least 8 characters.");
    run(user.id, () => unwrap(authClient.admin.setUserPassword({ userId: user.id, newPassword })), `Password changed for ${user.email}.`);
  };

  const users = (accounts.data?.users ?? []) as Account[];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-3xl">Staff</h1>
          <p className="mt-1 text-sm text-subtle">Admins can see every order and manage staff. Customers&apos; accounts only see their own.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-line bg-card p-1">
            {(["staff", "everyone"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setShow(v)}
                aria-pressed={show === v}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold cursor-pointer ${show === v ? "bg-brand-deep text-cream" : "text-ink"}`}
              >
                {v === "staff" ? "Staff" : "All accounts"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by email"
              aria-label="Search accounts by email"
              className="w-full rounded-full bg-card border border-line pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
        </div>

        {accounts.isError ? (
          <p className="rounded-2xl bg-tomato-soft px-4 py-3 text-sm">{accounts.error.message}</p>
        ) : accounts.isPending ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-subtle" />
          </div>
        ) : users.length === 0 ? (
          <p className="rounded-[22px] border border-dashed border-line py-12 text-center text-sm text-subtle">No accounts found.</p>
        ) : (
          <ul className="divide-y divide-line rounded-[22px] border border-line bg-card">
            {users.map((user) => {
              const admin = isAdmin(user.role);
              const me = user.id === currentUserId;
              return (
                <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {user.name}
                      {me && <span className="ml-2 text-xs font-normal text-subtle">(you)</span>}
                    </p>
                    <p className="text-sm text-subtle truncate">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${admin ? "bg-brand-deep text-cream" : "bg-tint text-ink"}`}
                    >
                      {admin ? "Admin" : "Customer"}
                    </span>
                    {busy === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-subtle" />
                    ) : (
                      <>
                        {/* Nobody can demote themselves, so there's always at least one admin. */}
                        {!me && (
                          <button
                            type="button"
                            onClick={() => setRole(user, !admin)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-tint cursor-pointer"
                          >
                            {admin ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            {admin ? "Remove admin" : "Make admin"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => resetPassword(user)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-tint cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Set password
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AddStaff onAdded={reload} />
    </div>
  );
}

function AddStaff({ onAdded }: { onAdded: () => Promise<unknown> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use a password of at least 8 characters.");
    setSaving(true);
    try {
      await unwrap(authClient.admin.createUser({ name: name.trim(), email: email.trim(), password, role: "admin" }));
      toast.success(`${name.trim()} can now sign in to the admin.`);
      setName("");
      setEmail("");
      setPassword("");
      await onAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add them.");
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full rounded-xl bg-paper border border-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40";

  return (
    <form onSubmit={submit} className="self-start rounded-[22px] border border-line bg-card p-5 space-y-3">
      <h2 className="font-display text-xl flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        Add staff
      </h2>
      <p className="text-sm text-subtle">
        Creates an admin account. Share the password with them privately. If they already have a customer account, use
        &ldquo;Make admin&rdquo; instead.
      </p>
      <label className="block space-y-1">
        <span className="text-xs font-semibold">Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="off" />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold">Email</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="off" />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold">Password</span>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
          autoComplete="new-password"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-deep text-cream font-semibold px-5 py-3 disabled:opacity-60 cursor-pointer"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Add staff member
      </button>
    </form>
  );
}
