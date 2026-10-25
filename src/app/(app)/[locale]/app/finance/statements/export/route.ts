import { NextResponse } from "next/server";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStatement, monthRange } from "@/lib/finance/statements";
import { formatMoney } from "@/lib/money";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

function cell(value: string | number): string {
  const text = String(value);
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await context.params;
  const locale = resolveLocale(raw);
  const url = new URL(request.url);
  const range = monthRange(url.searchParams.get("month") ?? undefined, LOCALE_META[locale].tag);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const store = await currentStore();
  if (!store) {
    return new NextResponse("Boutique introuvable", { status: 404 });
  }

  const [statement, t] = await Promise.all([
    getStatement(store.id, range.from, range.to),
    getDictionary(locale),
  ]);

  const labels = t.dashboard.finance;
  const tag = LOCALE_META[locale].tag;
  const money = (amount: number) =>
    formatMoney(Math.abs(amount), store.currency, tag);

  const lines: string[] = [
    ["Relevé de compte", store.name],
    ["Boutique", store.slug],
    ["Période", range.label],
    ["Devise", store.currency],
    [],
    [labels.statementSales, money(statement.sales)],
    [labels.statementCommissions, money(statement.commissions)],
    [labels.statementPayouts, money(statement.payouts)],
    [labels.statementAvailable, money(statement.balances.available)],
    [labels.statementPending, money(statement.balances.pending)],
    [labels.statementReserved, money(statement.balances.reserved)],
    [labels.statementCommissionDue, money(statement.balances.commissionDue)],
    [],
    [labels.columnDate, labels.columnType, labels.columnReference, labels.columnAmount],
    ...statement.rows.map((row) => [
      new Intl.DateTimeFormat(tag, { dateStyle: "short" }).format(
        new Date(row.occurred_at),
      ),
      labels[`kind${row.kind
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")}` as Exclude<keyof typeof labels, "errors">] ?? row.kind,
      row.orderNumber ? `#${row.orderNumber}` : "",
      `${row.signed < 0 ? "-" : "+"}${money(row.signed)}`,
    ]),
  ].map((line) => line.map(cell).join(";"));

  const csv = `﻿${lines.join("\r\n")}\r\n`;
  const filename = `releve-${store.slug}-${range.month}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
