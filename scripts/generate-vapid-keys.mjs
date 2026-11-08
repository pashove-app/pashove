#!/usr/bin/env node
/**
 * Génère une paire de clés VAPID pour les notifications push.
 *
 * Usage : node scripts/generate-vapid-keys.mjs
 * Copier les deux lignes dans `.env.local`, puis dans les variables Vercel.
 * La clé privée ne doit jamais être exposée au navigateur.
 */
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});

const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });

if (!pub.x || !pub.y || !priv.d) {
  throw new Error("Export JWK incomplet");
}

// Clé publique non compressée : 0x04 || X (32 octets) || Y (32 octets).
const raw = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pub.x, "base64url"),
  Buffer.from(pub.y, "base64url"),
]);

console.log(
  `# VAPID — web push (généré le ${new Date().toISOString().slice(0, 10)})`,
);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${raw.toString("base64url")}"`);
console.log(`VAPID_PRIVATE_KEY="${priv.d}"`);
