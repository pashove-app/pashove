#!/usr/bin/env node
/**
 * AUDIT E2E PASHOVE — script de diagnostic (à exécuter avec la clé service).
 *
 * Ce script crée un jeu de données de test préfixé `audit-`, exécute les RPC
 * réelles utilisées par l'application, vérifie la base et le ledger, puis
 * suspend la boutique de test. Il ne supprime pas les commandes/écritures du
 * ledger : le rapport liste les identifiants pour un nettoyage manuel avant
 * lancement.
 *
 * Usage :
 *   SB_URL=... SB_ANON=... SB_SERVICE=... node scripts/audit/e2e.mjs
 */

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SB_URL;
const ANON = process.env.SB_ANON;
const SERVICE = process.env.SB_SERVICE;

if (!URL || !ANON || !SERVICE) {
  console.error("SB_URL, SB_ANON et SB_SERVICE sont requis.");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stamp = Date.now().toString(36);
const findings = [];
const cleanupState = {
  storeId: null,
  storeClient: null,
  merchantEmail: null,
  courierClient: null,
  courierEmail: null,
  adminUserId: null,
};
const result = {
  stamp,
  startedAt: new Date().toISOString(),
  merchant: null,
  store: null,
  product: null,
  admin: null,
  zones: null,
  cod: null,
  online: null,
  courier: null,
  delivery: null,
  ledger: null,
  rls: null,
  findings,
  cleanup: null,
};

function note(level, area, message, data = null) {
  findings.push({ level, area, message, data });
  console.log(`[${level}] ${area}: ${message}`, data ? JSON.stringify(data) : "");
}

function errorText(error) {
  if (!error) return null;
  return {
    code: error.code ?? null,
    message: error.message ?? String(error),
    details: error.details ?? null,
  };
}

function randomPassword() {
  return `Audit-${randomUUID()}-aA1!`;
}

async function createUser(label, fullName) {
  const email = `audit-${label}-${stamp}@example.com`;
  const password = randomPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser ${label}: ${error.message}`);
  return { id: data.user.id, email, password };
}

async function signIn(account) {
  const client = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  if (error) throw new Error(`signIn ${account.email}: ${error.message}`);
  return client;
}

async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) return { ok: false, error: errorText(error), data: null };
  return { ok: true, error: null, data };
}

async function openCart(slug) {
  const { data, error } = await anon.rpc("cart_open", {
    p_slug: slug,
    p_token: null,
  });
  if (error) throw new Error(`cart_open: ${error.message}`);
  return data;
}

async function addToCart(token, productId) {
  const { error } = await anon.rpc("cart_add", {
    p_token: token,
    p_product_id: productId,
    p_variant_id: null,
    p_quantity: 1,
  });
  if (error) throw new Error(`cart_add: ${error.message}`);
}

async function cleanup() {
  try {
    if (cleanupState.courierClient) {
      await cleanupState.courierClient.rpc("set_courier_online", { p_online: false });
    }
    if (cleanupState.storeClient && cleanupState.storeId) {
      const { error } = await cleanupState.storeClient
        .from("stores")
        .update({ status: "suspended" })
        .eq("id", cleanupState.storeId);
      if (error) note("ERROR", "cleanup", "Suspension boutique de test", errorText(error));
    }
    if (cleanupState.adminUserId) {
      await admin.from("platform_admins").delete().eq("user_id", cleanupState.adminUserId);
      await admin.auth.admin.deleteUser(cleanupState.adminUserId);
    }
    result.cleanup = {
      testStoreSlug: result.store?.slug ?? null,
      testStoreId: cleanupState.storeId,
      merchantEmail: cleanupState.merchantEmail,
      courierEmail: cleanupState.courierEmail,
      adminRemoved: Boolean(cleanupState.adminUserId),
      note: "Boutique suspendue ; utilisateurs/commandes/ledger de test conservés pour inspection.",
    };
  } catch (error) {
    note("ERROR", "cleanup", "Nettoyage incomplet", errorText(error));
  }
}

async function main() {
  /* ---------------- 1. Marchand ---------------- */
  const merchantAccount = await createUser("merchant", "Audit Marchand");
  const merchant = await signIn(merchantAccount);
  result.merchant = { id: merchantAccount.id, email: merchantAccount.email };

  const slug = `audit-${stamp}`;
  const storeResult = await rpc(merchant, "create_store", {
    p_name: "Audit Test",
    p_slug: slug,
    p_country: "ML",
    p_currency: "XOF",
  });
  if (!storeResult.ok) throw new Error(`create_store: ${storeResult.error.message}`);
  const createdStore = storeResult.data;
  const storeId =
    typeof createdStore === "string" ? createdStore : createdStore?.id ?? null;
  if (!storeId) throw new Error("create_store n'a pas renvoyé d'identifiant");
  result.store = { id: storeId, slug };
  cleanupState.storeId = storeId;
  cleanupState.storeClient = merchant;
  cleanupState.merchantEmail = merchantAccount.email;

  await merchant.from("profiles").update({
    full_name: "Audit Marchand",
    phone: "+22370000000",
    country: "ML",
  }).eq("id", merchantAccount.id);

  const { error: storeUpdateError } = await merchant
    .from("stores")
    .update({
      product_types: ["physical"],
      status: "active",
      launched_at: new Date().toISOString(),
      cod_enabled: true,
      delivery_mode: "pashove",
      delivery_countries: ["ML", "GH"],
      address: "Hamdallaye ACI 2000, Bamako, Mali",
      latitude: 12.6392,
      longitude: -8.0029,
      shipping_flat_amount: 0,
    })
    .eq("id", storeId);
  if (storeUpdateError) note("ERROR", "merchant", "Activation boutique", errorText(storeUpdateError));

  const productSlug = `sac-audit-${stamp}`;
  const { data: product, error: productError } = await merchant
    .from("products")
    .insert({
      store_id: storeId,
      name: "Sac Audit",
      slug: productSlug,
      description: "Produit créé par l'audit E2E.",
      price_amount: 10000,
      status: "published",
      published_at: new Date().toISOString(),
      product_type: "physical",
      stock_quantity: 20,
      weight_grams: 500,
      shipping_countries: ["ML", "GH"],
      options: [],
      tags: ["audit"],
    })
    .select("id")
    .single();
  if (productError) throw new Error(`product insert: ${productError.message}`);
  result.product = { id: product.id, slug: productSlug, price: 10000 };

  const markets = await rpc(merchant, "save_store_markets", {
    p_store_id: storeId,
    p_codes: ["ML-XOF", "GH-GHS"],
    p_cod_enabled: true,
    p_fee_charge_mode: "merchant",
  });
  if (!markets.ok) note("ERROR", "merchant", "save_store_markets", markets.error);

  const delivery = await rpc(merchant, "save_delivery_settings", {
    p_store_id: storeId,
    p_mode: "pashove",
    p_countries: ["ML", "GH"],
  });
  if (!delivery.ok) note("ERROR", "merchant", "save_delivery_settings", delivery.error);

  /* ---------------- 2. Admin de test + zones ---------------- */
  const adminAccount = await createUser("admin", "Audit Admin");
  const { error: adminRoleError } = await admin.from("platform_admins").insert({
    user_id: adminAccount.id,
    role: "super_admin",
  });
  if (adminRoleError) note("ERROR", "admin", "Insertion platform_admins", errorText(adminRoleError));
  cleanupState.adminUserId = adminAccount.id;
  const testAdmin = await signIn(adminAccount);
  result.admin = { id: adminAccount.id, email: adminAccount.email };

  const ghZone = await rpc(testAdmin, "save_delivery_zone", {
    p_id: null,
    p_country: "GH",
    p_name: "Accra (audit)",
    p_fee: 2000,
    p_currency: "GHS",
    p_is_default: true,
  });
  if (!ghZone.ok) note("ERROR", "admin", "save_delivery_zone GH", ghZone.error);

  const { data: zones } = await admin
    .from("delivery_zones")
    .select("id, country_code, currency, fee_amount, is_active");
  result.zones = zones ?? [];

  /* ---------------- 3. Pashove Delivery + Ghana (XOF) ---------------- */
  const publicZones = await anon.rpc("public_delivery_zones", { p_slug: slug });
  if (publicZones.error) {
    note("ERROR", "checkout", "public_delivery_zones", errorText(publicZones.error));
  } else {
    result.pashoveGhanaZones = publicZones.data;
    if (Array.isArray(publicZones.data)) {
      note(
        "CRITICAL",
        "checkout",
        "public_delivery_zones ne renvoie que les zones du pays de la boutique ; la livraison Pashove vers un autre marché du checkout (GH) est impossible.",
        { zones: publicZones.data },
      );
    }
  }

  const quote = await anon.rpc("public_fx_quote", {
    p_from: "XOF",
    p_to: "GHS",
  });
  result.fx = quote.error ? { error: errorText(quote.error) } : quote.data;
  if (quote.error) note("ERROR", "fx", "public_fx_quote XOF→GHS", errorText(quote.error));

  /* ---------------- 4. COD Ghana en livraison autonome ---------------- */
  const selfDelivery = await rpc(merchant, "save_delivery_settings", {
    p_store_id: storeId,
    p_mode: "self",
    p_countries: ["ML", "GH"],
  });
  if (!selfDelivery.ok) note("ERROR", "merchant", "Passage self delivery", selfDelivery.error);

  const cart = await openCart(slug);
  await addToCart(cart.token, product.id);
  if (!cart.checkoutKey) {
    note("ERROR", "checkout", "cart_open n'a pas renvoyé checkoutKey", cart);
  }
  const codCustomer = {
    name: "Client Audit",
    email: `audit-client-${stamp}@example.com`,
    phone: "+233200000000",
    country: "GH",
    city: "Accra",
    address: "12 Independence Avenue",
    extra: "",
    notes: "Commande audit COD",
  };
  const codOrder = await anon.rpc("place_cod_order", {
    p_token: cart.token,
    p_customer: codCustomer,
    p_idempotency_key: cart.checkoutKey,
  });
  if (codOrder.error) {
    note("ERROR", "checkout", "place_cod_order (self, GH)", errorText(codOrder.error));
  } else {
    const token = codOrder.data?.token;
    const { data: order } = await admin
      .from("orders")
      .select("id, number, public_token, payment_status, status, currency, subtotal_amount, shipping_amount, total_amount, shipping_country")
      .eq("public_token", token)
      .maybeSingle();
    result.cod = { response: codOrder.data, order };
    if (order && order.shipping_country !== "GH") {
      note("ERROR", "checkout", "Pays de livraison COD inattendu", order);
    }
  }

  /* ---------------- 5. Commande en ligne Mali + livraison ---------------- */
  const pashove = await rpc(merchant, "save_delivery_settings", {
    p_store_id: storeId,
    p_mode: "pashove",
    p_countries: ["ML", "GH"],
  });
  if (!pashove.ok) note("ERROR", "merchant", "Retour Pashove delivery", pashove.error);

  const mlZone = (zones ?? []).find(
    (zone) => zone.country_code === "ML" && zone.currency === "XOF" && zone.is_active,
  );

  const cart2 = await openCart(slug);
  await addToCart(cart2.token, product.id);
  if (!cart2.checkoutKey) {
    note("ERROR", "checkout", "cart_open n'a pas renvoyé checkoutKey (online)", cart2);
  }
  const onlineCustomer = {
    name: "Client Audit Livraison",
    email: `audit-delivery-${stamp}@example.com`,
    phone: "+22370000001",
    country: "ML",
    city: "Bamako",
    address: "Hamdallaye ACI 2000",
    extra: "Immeuble B",
    notes: "Commande audit Pashove Delivery",
  };
  const onlineOrder = await anon.rpc("place_online_order", {
    p_token: cart2.token,
    p_customer: onlineCustomer,
    p_idempotency_key: cart2.checkoutKey,
    p_method: "mobile_money",
    p_provider: "saspay",
  });
  let onlineToken = null;
  if (onlineOrder.error) {
    note("ERROR", "checkout", "place_online_order (ML)", errorText(onlineOrder.error));
  } else {
    onlineToken = onlineOrder.data?.token;
    result.online = { response: onlineOrder.data };
    if (!mlZone) {
      note("CRITICAL", "delivery", "Aucune zone ML/XOF active pour la livraison Pashove.");
    } else {
      const zone = await anon.rpc("apply_delivery_zone", {
        p_order_token: onlineToken,
        p_zone_id: mlZone.id,
      });
      if (zone.error) note("ERROR", "delivery", "apply_delivery_zone ML", errorText(zone.error));
      result.online.zone = zone.data;

      const { data: order } = await admin
        .from("orders")
        .select("id, number, public_token, payment_status, status, currency, total_amount, shipping_amount")
        .eq("public_token", onlineToken)
        .maybeSingle();
      result.online.order = order;

      const reference = `AUDIT-${stamp}-${randomUUID().slice(0, 8)}`;
      const fx = await admin.rpc("set_order_fx", {
        p_order_token: onlineToken,
        p_payment_currency: "XOF",
        p_payment_amount: Number(order?.total_amount ?? 0),
        p_fx_rate: 1,
        p_fx_source: "identity",
      });
      if (fx.error) note("ERROR", "payment", "set_order_fx", errorText(fx.error));

      const intent = await admin.rpc("record_saspay_intent", {
        p_order_token: onlineToken,
        p_reference: reference,
        p_method: "mobile_money",
        p_network: "orange_money",
        p_redirect_url: "https://pashove.com/audit",
        p_country: "ML",
      });
      if (intent.error) note("ERROR", "payment", "record_saspay_intent", errorText(intent.error));

      const amount = Number(order?.total_amount ?? 0);
      const confirm = await admin.rpc("confirm_saspay_payment", {
        p_reference: reference,
        p_amount: amount,
        p_currency: "XOF",
        p_fee: 0,
        p_net: amount,
      });
      if (confirm.error) {
        note("ERROR", "payment", "confirm_saspay_payment", errorText(confirm.error));
      } else {
        result.online.confirm = confirm.data;
      }

      const { data: paidOrder } = await admin
        .from("orders")
        .select("id, number, public_token, payment_status, status, total_amount, shipping_amount, payout_hold_amount, payout_available_at")
        .eq("public_token", onlineToken)
        .maybeSingle();
      result.online.paidOrder = paidOrder;

      const { data: deliveryRow } = await admin
        .from("deliveries")
        .select("id, status, fee_amount, currency, courier_id, offer_expires_at, started_at, pickup_latitude, pickup_longitude")
        .eq("order_id", paidOrder?.id ?? "00000000-0000-0000-0000-000000000000")
        .maybeSingle();
      result.delivery = deliveryRow;
      if (!deliveryRow) note("CRITICAL", "delivery", "Aucune livraison créée après paiement.");
    }

    /* ---------------- 6. Livreur ---------------- */
    if (onlineToken) {
      const courierAccount = await createUser("courier", "Audit Livreur");
      const courier = await signIn(courierAccount);
      result.courier = { id: courierAccount.id, email: courierAccount.email };
      cleanupState.courierClient = courier;
      cleanupState.courierEmail = courierAccount.email;

      const application = await rpc(courier, "submit_courier_application", {
        p_full_name: "Audit Livreur",
        p_phone: "+22370000002",
        p_email: courierAccount.email,
        p_id_key: `audit/${stamp}/id.jpg`,
        p_selfie_key: `audit/${stamp}/selfie.jpg`,
        p_country: "ML",
      });
      if (!application.ok) note("ERROR", "courier", "submit_courier_application", application.error);

      const { data: courierRow } = await admin
        .from("couriers")
        .select("id, status, country")
        .eq("user_id", courierAccount.id)
        .maybeSingle();
      result.courier.row = courierRow;

      if (courierRow) {
        const review = await rpc(testAdmin, "review_courier", {
          p_id: courierRow.id,
          p_status: "approved",
        });
        if (!review.ok) note("ERROR", "courier", "review_courier", review.error);

        const { data: reviewedCourier } = await admin
          .from("couriers")
          .select("id, status, country")
          .eq("id", courierRow.id)
          .maybeSingle();
        result.courier.reviewed = reviewedCourier;
        result.courier.review = review.data;

        const online = await rpc(courier, "set_courier_online", { p_online: true });
        if (!online.ok) note("ERROR", "courier", "set_courier_online", online.error);
      }

      /* Le paiement a déjà confirmé la commande ; on redispatch pour le livreur
         qui vient d'être approuvé (le déclencheur initial n'avait personne). */
      await admin.rpc("dispatch_waiting_deliveries");

      const offers = await rpc(courier, "my_courier_deliveries", {});
      if (!offers.ok) note("ERROR", "courier", "my_courier_deliveries", offers.error);
      const offer = offers.data?.offer ?? null;
      result.courier.offer = offer;

      if (offer) {
        const accept = await rpc(courier, "accept_delivery", { p_delivery_id: offer.id });
        if (!accept.ok) note("ERROR", "courier", "accept_delivery", accept.error);

        const otp = await admin.rpc("issue_delivery_otp", { p_delivery_id: offer.id });
        if (otp.error) {
          note("CRITICAL", "delivery", "issue_delivery_otp indisponible", errorText(otp.error));
        } else {
          result.delivery.otpIssued = Boolean(otp.data?.code);
        }

        const start = await rpc(courier, "start_delivery", {
          p_delivery_id: offer.id,
          p_latitude: 12.65,
          p_longitude: -8.01,
        });
        if (!start.ok) note("ERROR", "delivery", "start_delivery", start.error);

        const location = await rpc(courier, "update_delivery_location", {
          p_delivery_id: offer.id,
          p_latitude: 12.641,
          p_longitude: -8.003,
          p_accuracy: 12,
          p_heading: 90,
          p_speed: 4,
        });
        if (!location.ok) note("ERROR", "delivery", "update_delivery_location", location.error);

        if (onlineToken) {
          const tracking = await anon.rpc("public_tracking", { p_token: onlineToken });
          result.tracking = tracking.error ? errorText(tracking.error) : tracking.data;
          if (tracking.error) note("ERROR", "tracking", "public_tracking", errorText(tracking.error));
        }

        const deliver = await rpc(courier, "deliver_delivery", {
          p_delivery_id: offer.id,
          p_otp: String(otp.data?.code ?? "0000"),
        });
        if (!deliver.ok) {
          note("CRITICAL", "delivery", "deliver_delivery indisponible ou refusé", deliver.error);
        }

        const settle = await admin.rpc("settle_delivery", { p_delivery_id: offer.id });
        if (settle.error) {
          note("ERROR", "ledger", "settle_delivery (simulation)", errorText(settle.error));
        } else {
          note("WARNING", "ledger", "Règlement exécuté manuellement (OTP indisponible).");
        }

        result.delivery.final = (
          await admin
            .from("deliveries")
            .select("id, status, fee_amount, currency, pickup_latitude, pickup_longitude, started_at, delivered_at")
            .eq("id", offer.id)
            .maybeSingle()
        ).data;
      } else {
        note("ERROR", "courier", "Aucune offre reçue après mise en ligne.");
      }

      await rpc(courier, "set_courier_online", { p_online: false });
    }
  }

  /* ---------------- 7. Ledger ---------------- */
  const { data: ledgerRows } = await admin
    .from("ledger_entries")
    .select("store_id, account_code, direction, amount, currency, created_at, metadata")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true })
    .limit(500);
  result.ledger = { storeEntries: ledgerRows ?? [] };

  const balances = await rpc(merchant, "store_balances", { p_store_id: storeId });
  result.ledger.balances = balances.ok ? balances.data : balances.error;

  /* ---------------- 8. RLS ---------------- */
  const otherStoreId = "d0c9e315-d340-453d-9297-0e8c259cd9e9";
  const [otherOrders, ownOrders, otherLedger, ownLedger] = await Promise.all([
    merchant.from("orders").select("id").eq("store_id", otherStoreId).limit(50),
    merchant.from("orders").select("id").eq("store_id", storeId).limit(50),
    merchant.from("ledger_entries").select("id").eq("store_id", otherStoreId).limit(50),
    merchant.from("ledger_entries").select("id").eq("store_id", storeId).limit(50),
  ]);
  result.rls = {
    merchantOtherOrders: otherOrders.data?.length ?? null,
    merchantOtherOrdersError: otherOrders.error ? errorText(otherOrders.error) : null,
    merchantOwnOrders: ownOrders.data?.length ?? null,
    merchantOtherLedger: otherLedger.data?.length ?? null,
    merchantOtherLedgerError: otherLedger.error ? errorText(otherLedger.error) : null,
    merchantOwnLedger: ownLedger.data?.length ?? null,
  };

  const anonProbes = {};
  for (const table of [
    "push_subscriptions",
    "delivery_locations",
    "delivery_push_jobs",
    "couriers",
    "deliveries",
    "orders",
    "ledger_entries",
    "store_domains",
  ]) {
    const column = table === "delivery_locations" ? "delivery_id" : "id";
    const { data, error } = await anon.from(table).select(column).limit(1);
    anonProbes[table] = {
      rows: data?.length ?? null,
      code: error?.code ?? null,
    };
  }
  result.rls.anon = anonProbes;

  /* ---------------- 9. Nettoyage contrôlé ---------------- */
  await cleanup();
  result.finishedAt = new Date().toISOString();
}

main()
  .catch(async (error) => {
    console.error("AUDIT FAILED", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!result.cleanup) await cleanup();
    console.log("\n=== RESULTAT ===");
    console.log(JSON.stringify(result, null, 2));
  });
