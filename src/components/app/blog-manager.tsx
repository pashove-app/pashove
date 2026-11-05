"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import {
  saveBlogPostAction,
  type BlogFormState,
} from "@/lib/storefront/blog-actions";
import type { BlogPost } from "@/lib/storefront/blog";
import type { StoreAdminCopy } from "@/lib/storefront/admin-copy";

const INITIAL: BlogFormState = { status: "idle" };

export function BlogManager({
  locale,
  slug,
  posts,
  editing,
  labels,
}: {
  locale: string;
  slug: string;
  posts: BlogPost[];
  editing: BlogPost | null;
  labels: StoreAdminCopy["blog"];
}) {
  const [state, action, pending] = useActionState(saveBlogPostAction, INITIAL);

  return (
    <div className="mt-6 space-y-5">
      <form
        action={action}
        className="rounded-3xl border border-border bg-surface p-5 sm:p-6"
      >
        <input type="hidden" name="locale" value={locale} />
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <h2 className="text-[1rem] font-medium text-fg">
          {editing ? labels.editPost : labels.newPost}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            name="title"
            label={labels.titleLabel}
            defaultValue={editing?.title ?? ""}
            maxLength={140}
          />
          <TextField
            name="slug"
            label={labels.slugLabel}
            defaultValue={editing?.slug ?? ""}
            maxLength={59}
            dir="ltr"
            help="mon-article"
          />
          <div className="sm:col-span-2">
            <TextField
              name="excerpt"
              label={labels.excerptLabel}
              defaultValue={editing?.excerpt ?? ""}
              maxLength={300}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              name="body"
              label={labels.bodyLabel}
              defaultValue={editing?.body ?? ""}
              rows={12}
              maxLength={30000}
              help="Markdown : # titre, **gras**, [lien](https://…), listes avec -."
            />
          </div>
          <TextField
            name="coverKey"
            label={labels.coverLabel}
            defaultValue={editing?.cover_key ?? ""}
            maxLength={500}
            dir="ltr"
            placeholder="https://…"
          />
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
            {labels.error}
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
              href={`/${locale}/app/online-store/blog`}
              className="text-[0.8125rem] font-medium text-subtle hover:text-fg"
            >
              {labels.cancel}
            </Link>
          ) : null}
        </div>
      </form>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[1rem] font-medium text-fg">{labels.title}</h2>
        {posts.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] text-subtle">{labels.empty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.875rem] font-medium text-fg">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    /blog/{post.slug} ·{" "}
                    {post.status === "published"
                      ? labels.statusPublished
                      : labels.statusDraft}
                  </p>
                </div>
                {post.status === "published" ? (
                  <Link
                    href={`/${locale}/store/${slug}/blog/${post.slug}`}
                    className="text-[0.75rem] font-medium text-accent hover:underline"
                  >
                    {labels.view}
                  </Link>
                ) : null}
                <Link
                  href={`/${locale}/app/online-store/blog?edit=${post.id}`}
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
