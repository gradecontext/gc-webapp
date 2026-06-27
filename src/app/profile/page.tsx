"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  updateUserProfile,
  type BackendUserResponse,
  type Gender,
  type UpdateProfilePayload,
} from "@/lib/auth-api";

// The backend's exact gender enum isn't documented anywhere this app has
// access to — only "PREFER_NOT_TO_SAY" appeared as an example value. If the
// real zod enum differs, a 400 here will surface inline; fix this list to match.
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

type FormState = {
  name: string;
  title: string;
  display_name: string;
  user_name: string;
  image_url: string;
  user_image: string;
  user_image_cover: string;
  user_bio_detail: string;
  user_bio_brief: string;
  gender: Gender | "";
};

function toFormState(user: BackendUserResponse | null): FormState {
  return {
    name: user?.name ?? "",
    title: user?.title ?? "",
    display_name: user?.display_name ?? "",
    user_name: user?.user_name ?? "",
    image_url: user?.image_url ?? "",
    user_image: user?.user_image ?? "",
    user_image_cover: user?.user_image_cover ?? "",
    user_bio_detail: user?.user_bio_detail ?? "",
    user_bio_brief: user?.user_bio_brief ?? "",
    gender: user?.gender ?? "",
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function ProfilePage() {
  const { session, backendUser, setBackendUser, memberships, activeMembership } = useAuth();
  const accessToken = session?.access_token;

  const [form, setForm] = useState<FormState>(() => toFormState(backendUser));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm(toFormState(backendUser));
  }, [backendUser]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !backendUser) return;

    const original = toFormState(backendUser);
    const payload: UpdateProfilePayload = {};
    for (const key of Object.keys(form) as (keyof FormState)[]) {
      if (form[key] === original[key]) continue;
      if (key === "gender") {
        if (form.gender) payload.gender = form.gender;
      } else {
        payload[key] = form[key];
      }
    }
    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateUserProfile(backendUser.id, payload, accessToken);
      setBackendUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!backendUser) {
    return (
      <AppShell>
        <Card className="p-6">
          <p className="text-sm text-ink-300">Loading profile…</p>
        </Card>
      </AppShell>
    );
  }

  const avatarUrl = form.image_url || backendUser.image_url || backendUser.user_image;
  const activeOrgs = memberships.filter((m) => m.status === "ACTIVE");

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Profile</p>
          <h1 className="text-3xl font-semibold text-ink-900">Your account</h1>
          <p className="text-sm text-ink-300">Manage how you appear across ContextGrade.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-accent text-white shadow-sm">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-ink-900">
                  {form.display_name || form.name || backendUser.email}
                </p>
                <p className="text-sm text-ink-300">{backendUser.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={backendUser.active ? "mint" : "haze"}>
                    {backendUser.active ? "Active" : "Inactive"}
                  </Badge>
                  {backendUser.verified && <Badge variant="ink">Verified</Badge>}
                </div>
              </div>
            </div>

            {activeOrgs.length > 0 && (
              <div className="mt-5 border-t border-haze-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
                  {activeOrgs.length > 1 ? "Your organizations" : "Organization"}
                </p>
                <div className="mt-3 space-y-2">
                  {activeOrgs.map((m) => (
                    <div
                      key={m.client.id}
                      className="flex items-center justify-between rounded-2xl border border-haze-200 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink-900">
                          {m.client.name}
                          {m.client.id === activeMembership?.client.id && (
                            <span className="ml-2 text-xs font-normal text-ink-300">(current)</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-300">{m.client.plan}</p>
                      </div>
                      <Badge variant={m.role === "ADMIN" ? "ink" : "haze"}>{m.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-4 p-6">
            <p className="section-title">Basic info</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
              </Field>
              <Field label="Title">
                <Input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Founder"
                />
              </Field>
              <Field label="Display name">
                <Input
                  value={form.display_name}
                  onChange={(e) => update("display_name", e.target.value)}
                />
              </Field>
              <Field label="Username">
                <Input
                  value={form.user_name}
                  onChange={(e) => update("user_name", e.target.value)}
                  placeholder="e.g. irfyhaq"
                />
              </Field>
              <Field label="Gender">
                <Select
                  value={form.gender || "unspecified"}
                  onValueChange={(v) => update("gender", v === "unspecified" ? "" : (v as Gender))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unspecified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Unspecified</SelectItem>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <p className="section-title">Images</p>
            <Field label="Avatar URL (image_url)">
              <Input
                value={form.image_url}
                onChange={(e) => update("image_url", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Profile image URL (user_image)">
              <Input
                value={form.user_image}
                onChange={(e) => update("user_image", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Cover image URL (user_image_cover)">
              <Input
                value={form.user_image_cover}
                onChange={(e) => update("user_image_cover", e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </Card>

          <Card className="space-y-4 p-6">
            <p className="section-title">Bio</p>
            <Field label={`Short tagline (${form.user_bio_brief.length}/255)`}>
              <Input
                value={form.user_bio_brief}
                maxLength={255}
                onChange={(e) => update("user_bio_brief", e.target.value)}
                placeholder="e.g. Founder @ ContextGrade"
              />
            </Field>
            <Field label="Long-form bio">
              <Textarea
                value={form.user_bio_detail}
                onChange={(e) => update("user_bio_detail", e.target.value)}
                placeholder="Tell your team a bit about yourself."
              />
            </Field>
          </Card>

          <Card className="space-y-2 p-6">
            <p className="section-title">Email</p>
            <p className="text-sm text-ink-700">{backendUser.email}</p>
            <p className="text-xs text-ink-300">
              Email changes aren&apos;t supported yet — that requires a verification flow tied to
              your sign-in provider.
            </p>
          </Card>

          {error && (
            <div className="rounded-2xl bg-ember-50 px-4 py-3 text-sm text-ember-600">{error}</div>
          )}
          {success && (
            <div className="rounded-2xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
              Profile updated.
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
