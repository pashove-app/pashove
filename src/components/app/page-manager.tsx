"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import {
  saveCustomPageAction,
  type CustomPageFormState,
} from "@/lib/storefront/custom-page-actions";
import type { CustomPage } from "@/lib/storefront/custom-pages";
import type { StoreAdminCopy } from "@/lib/storefront/admin-copy";

const INITIAL: CustomPageFormState = { status: "idle" };

export function PageManager({
  locale,
  slug,
  pages,
  editing,
  labels,
}: {
  locale: string;
  slug: string;
  pages: CustomPage[];
  editing: CustomPage | null;
  labels: StoreAdminCopy["pages"];
}) {
  const [state, action, pending] = useActionState(
    saveCustomPageAction,
    INITIAL,
  );

  const fieldError = (key: string) =>
    state.fieldErrors?.[key]
      ? labels.required
      : state.status === "error" && state.messageKey === "pageSlugTaken"
        ? labels.slugTaken
        : undefined;

  return (
    <div className="mt-6 space-y-5">
      <form
        action={action}
        className="rounded-3xl border border-border bg-surface p-5 sm:p-6"
      >
        <input type="hidden" name="locale" value={locale} />
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <h2 className="text-[1rem] font-medium text-fg">
          {editing ? labels.editPage : labels.newPage}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            name="title"
            label={labels.titleLabel}
            defaultValue={editing?.title ?? ""}
            maxLength={120}
            error={fieldError("title")}
          />
          <TextField
            name="slug"
            label={labels.slugLabel}
            defaultValue={editing?.slug ?? ""}
            maxLength={49}
            dir="ltr"
            help="about, faq, contact…"
            error={fieldError("slug")}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              name="body"
              label={labels.bodyLabel}
              defaultValue={editing?.body ?? ""}
              rows={8}
              maxLength={20000}
              help={labels.bodyHint}
              error={fieldError("body")}
            />
          </div>
          <SelectField
            name="status"
            label="Statut"
            defaultValue={editing?.status ?? "draft"}
          >
            <option value="draft">{labels.statusDraft}</option>
            <option value="published">{labels.statusPublished}</option>
          </SelectField>
        </div>

        {state.status === "error" ? (
          <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] text-red-600 dark:text-red-400">
            {state.messageKey === "pageSlugTaken"
              ? labels.slugTaken
              : labels.error}
          </p>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            {pending ? labels.saving : labels.save}
          </button>
          {editing ? (
            <Link
              href={`/${locale}/app/online-store/pages`}
              className="text-[0.8125rem] font-medium text-subtle hover:text-fg"
            >
              {labels.cancel}
            </Link>
          ) : null}
        </div>
      </form>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[1rem] font-medium text-fg">{labels.title}</h2>

        {pages.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] text-subtle">{labels.empty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline">
            {pages.map((page) => (
              <li key={page.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.875rem] font-medium text-fg">
                    {page.title}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    /pages/{page.slug} ·{" "}
                    {page.status === "published"
                      ? labels.statusPublished
                      : labels.statusDraft}
                  </p>
                </div>
                {page.status === "published" ? (
                  <Link
                    href={`/${locale}/store/${slug}/pages/${page.slug}`}
                    className="text-[0.75rem] font-medium text-accent hover:underline"
                  >
                    {labels.view}
                  </Link>
                ) : null}
                <Link
                  href={`/${locale}/app/online-store/pages?edit=${page.id}`}
                  className="text-[0.75rem] font-medium text-subtle hover:text-fg"
                >
                  {labels.edit}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
