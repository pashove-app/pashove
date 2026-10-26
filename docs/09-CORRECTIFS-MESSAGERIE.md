# PASHOVE — Correctifs du 26/10/2026 et messagerie

> Commits : `8156370` (rattachement et livraison numérique), `237efe3`
> (messagerie texte), puis le lot pièces jointes.
> Vérifications faites en base et dans un navigateur réel (Chrome headless).

---

## 1. Commande numérique invisible dans l’espace client

### Cause

La commande #1019 avait été passée avec `ibrahimes132@gmail.com`, alors que
l’espace client était ouvert avec le compte marchand `ibrahime@pashove.com`.
`claim_guest_orders()` ne rapproche que les e-mails identiques : la commande
restait donc avec `customer_user_id = null` et les compteurs affichaient 0.

### Correctif

- **Rattachement à la session** : `link_order_to_customer(p_token)` rattache une
  commande au compte connecté à partir du jeton public remis au seul acheteur.
  Appelé après le checkout si une session existe, et à la connexion/inscription.
- **Cookie d’achat invité** : `pashove_orders` (HttpOnly, 1 an, 12 jetons max)
  mémorise les commandes passées dans le navigateur. À l’ouverture de l’espace
  client, `claimCustomerOrders()` les rattache même si l’e-mail diffère.
- Le rattachement est idempotent et refuse une commande déjà rattachée à un
  autre compte.
- La commande #1019 a été rattachée au compte marchand pour la démonstration.

### Vérifications

- Commande #1020 créée en invité, puis compte créé avec **un autre e-mail** :
  la commande et le téléchargement apparaissent (1 commande, 1 téléchargement).
- Téléchargement signé R2 accessible, quota 3, fichier PDF servi.
- Un client non propriétaire reçoit une redirection « indisponible ».

---

## 2. Commandes numériques traitées comme des commandes physiques

### Correctif

- Le checkout masque **toute l’étape adresse** quand le panier ne contient que
  du numérique ou des services. Le serveur ne demande plus ville/adresse et
  vide les champs de livraison de la commande.
- `place_cod_order` passe directement la commande en **`delivered`** quand elle
  n’a aucun objet physique ; le rendez-vous et le droit numérique sont créés par
  le trigger d’encaissement.
- `advance_order_status` saute les étapes préparation/expédition pour ces
  commandes.
- Le dashboard masque « Préparer », « Expédier », le suivi et l’adresse de
  livraison. L’action rapide d’expédition disparaît de la liste.
- La page de succès affiche un accès direct aux téléchargements ou aux
  rendez-vous, et plus de bloc livraison inutile.
- Les anciennes commandes #1016 à #1018 ont été remises en `delivered` avec un
  événement `automatic: true`.

### Vérifications

- Commande #1020 : statut `delivered`, `payment_status = paid`,
  `shipping_amount = 0`, adresse vide, droit numérique créé.
- Fiche marchand #1019 : aucune action physique, aucune adresse.
- Panier mobile : plus de débordement horizontal ; en-tête rééquilibré.

---

## 3. Code promo repliable

- Le champ est replié derrière « J’ai un code promo » avec chevron.
- Il s’ouvre automatiquement quand une remise est déjà appliquée.
- Test réel : `PROMO20260` applique −1 000 FCFA, total 9 000 FCFA sur un panier
  de 10 000 FCFA ; le retrait remet le total initial.

---

## 4. Messagerie

### Modèle

- `conversations` : une par boutique pour le support, une par client connecté
  pour les conversations clients. Contraintes d’unicité partielles.
- `messages` : texte (4 000 caractères) et/ou pièce jointe. Rôles
  `customer`, `merchant`, `platform`.
- Aucune lecture directe des tables : tout passe par des RPC `security definer`
  qui vérifient l’appartenance (client propriétaire, membre de la boutique,
  administrateur plateforme).
- Pièces jointes : images (JPEG, PNG, WebP, AVIF), vidéos courtes (MP4, WebM) et
  PDF, **25 Mo maximum**, stockées dans le bucket R2 privé. Lecture par URL
  signée d’une heure, mise en cache côté serveur pour éviter le rechargement à
  chaque rafraîchissement.

### Interfaces

- **Client** : bulle de discussion en bas à droite de la vitrine. Un invité est
  invité à se connecter ; un client connecté discute avec la boutique.
- **Marchand** : `/app/support` (entrée « Support » de la sidebar) avec le fil
  Support Pashove et les conversations clients.
- **Plateforme** : `/platform-admin/messages` pour répondre aux marchands.
- Rafraîchissement par interrogation toutes les 6 secondes ; envoi optimiste
  côté fil après confirmation serveur.

### Vérifications

- Client `Client Photo` : message texte puis image envoyés depuis la vitrine ;
  l’image s’affiche depuis une URL R2 signée.
- Marchand : conversation client visible, réponse envoyée depuis `/app/support`,
  reçue côté client par le rafraîchissement.
- Support : message marchand et réponse plateforme dans le même fil, rôles
  affichés correctement.
- Aucun accès croisé : un client ne voit que sa conversation ; un marchand ne
  voit que les conversations de ses boutiques ; la portée plateforme exige
  `is_platform_admin()`.
- `tsc`, eslint et `npm run build` verts.

---

## 5. Ce qui reste dans le module messagerie

- Compteur de non-lus et notifications (e-mail/push).
- Temps réel (Supabase Realtime ou SSE) à la place de l’interrogation.
- Chat invité sans compte, avec jeton de conversation.
- Modération, signalement, suppression, pièces jointes multiples.
- Tickets, SLA, macros et base de connaissances côté plateforme.
- Recherche et pagination des conversations.

---

## 6. Correctif d’interface du 26/10 (deuxième passage)

### Cause de l’alignement faux

`mine` était calculé en base avec `sender_user_id = auth.uid()`. Or le compte
marchand est aussi administrateur plateforme : dans la vue plateforme, un
message envoyé par le marchand avait le même `sender_user_id` que l’admin et
s’affichait donc à droite, en bleu. Le rôle réel dans le fil n’était pas pris en
compte.

### Correction

- L’alignement et la couleur sont décidés côté client par
  `senderRole === viewerRole` (`customer`, `merchant`, `platform`), jamais par
  l’identifiant utilisateur.
- Avatars à initiales pour le client et le marchand ; icône bouclier pour la
  plateforme.
- Nom de l’expéditeur au-dessus des messages reçus ; heure dans chaque bulle.
- Liste : avatar, nom, e-mail ou **numéro de commande**, dernier message et
  date/heure ; rafraîchissement toutes les 8 s.
- Vue plateforme : nom de la boutique et nom du marchand.
- État de chargement explicite au lieu d’afficher « Dis bonjour » avant l’arrivée
  des messages.
- Relance automatique de `chat_messages` et `chat_send_message` après une
  migration (cache PostgREST), pour éviter le faux échec d’envoi.
- Le fil est remonté par `key={conversation.id}` pour ne pas conserver l’état du
  fil précédent.

### Tests réels

1. **Client → marchand → client** : Awa Traoré envoie, le marchand voit le
   message à gauche et répond ; Awa voit la réponse à gauche et son message à
   droite.
2. **Marchand → support → plateforme** : message marchand à droite, réponse
   plateforme à gauche avec le bouclier Pashove dans la vue marchand ; la vue
   plateforme applique le miroir par le rôle `platform`.
3. **Deux clients** : Awa Traoré, Moussa Diarra et Test Envoi apparaissent dans
   trois fils distincts, avec leur e-mail ou `Commande #1020`, leur dernier
   message et leur heure.
