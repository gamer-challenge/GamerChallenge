# Dictionnaire de données
**Projet Gamer Challenges**

---

## Introduction

Ce dictionnaire de données recense l'ensemble des tables, champs et relations du modèle logique de données (MLD) du projet Gamer Challenges. Il est rédigé à partir du MLD produit à l'aide de dbdiagram.io et sert de référence pour la création de la base de données sous Supabase (PostgreSQL).

Pour chaque table, le dictionnaire liste les champs qui la composent, leur type de données, leurs contraintes (clé primaire, clé étrangère, unicité, valeur par défaut…) ainsi qu'une description fonctionnelle.

Les types indiqués sont ceux utilisés par PostgreSQL. Les tailles VARCHAR sont données à titre indicatif et pourront être ajustées lors de l'implémentation avec Drizzle ORM.

---

## Table `users`

> Table gérée automatiquement par Supabase (`auth.users`). Elle n'est pas créée manuellement par l'application. Les champs listés ci-dessous sont ceux exploités par notre logique métier via la relation avec la table `profiles`.

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Identifiant unique de l'utilisateur (généré par Supabase) |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Adresse email de l'utilisateur, utilisée pour la connexion |
| `encrypted_password` | VARCHAR(255) | NULLABLE | Mot de passe chiffré. Null si l'inscription s'est faite via OAuth (Twitch, Google) |
| `email_confirmed_at` | TIMESTAMP | NULLABLE | Date de confirmation de l'adresse email |
| `last_sign_in_at` | TIMESTAMP | NULLABLE | Date de la dernière connexion de l'utilisateur |
| `created_at` | TIMESTAMP | NOT NULL | Date de création du compte |
| `updated_at` | TIMESTAMP | NULLABLE | Date de dernière modification du compte |

---

## Table `profiles`

> Profil public de l'utilisateur, lié en 1-1 à la table `auth.users` de Supabase. Contient toutes les données métier non sensibles.

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL, FOREIGN KEY (users.id) | Identifiant du profil, identique à celui de la table users |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Pseudonyme unique affiché publiquement |
| `avatar_url` | VARCHAR(500) | NULLABLE | URL de l'image de profil de l'utilisateur |
| `bio` | TEXT | NULLABLE | Biographie libre saisie par l'utilisateur |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT `'user'` | Rôle de l'utilisateur. Valeurs possibles : `'user'`, `'admin'` |
| `points` | INT | NOT NULL, DEFAULT `0` | Total des points gagnés via les challenges validés |
| `karma` | INT | NOT NULL, DEFAULT `0` | Score de fiabilité du joueur, utilisé pour pondérer ses votes |
| `is_banned` | BOOLEAN | NOT NULL, DEFAULT `FALSE` | Indique si l'utilisateur est banni de la plateforme |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `now()` | Date de création du profil |
| `updated_at` | TIMESTAMP | NULLABLE | Date de dernière modification du profil |

---

## Table `games`

> Référentiel des jeux vidéo disponibles sur la plateforme. Un challenge est toujours associé à un jeu.

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Identifiant unique du jeu |
| `name` | VARCHAR(150) | NOT NULL, UNIQUE | Nom officiel du jeu |
| `slug` | VARCHAR(150) | NOT NULL, UNIQUE | Version URL-friendly du nom du jeu |
| `cover_url` | VARCHAR(500) | NULLABLE | URL de la jaquette du jeu |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `now()` | Date d'ajout du jeu dans le référentiel |

---

## Table `challenges`

> Défis proposés par les utilisateurs sur un jeu donné. Chaque challenge est rattaché à un créateur (`profile`) et un jeu.

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Identifiant unique du challenge |
| `slug` | VARCHAR(200) | NOT NULL, UNIQUE | Version URL-friendly du titre, utilisée dans l'URL `/challenge/:slug` |
| `title` | VARCHAR(150) | NOT NULL | Titre affiché du challenge |
| `description` | TEXT | NOT NULL | Description générale du challenge |
| `rules` | TEXT | NOT NULL | Règles précises que les participants doivent respecter |
| `reward_points` | INT | NOT NULL, DEFAULT `0` | Nombre de points attribués au joueur en cas de validation |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'active'` | État du challenge. Valeurs possibles : `'active'`, `'closed'`, `'removed'` |
| `game_id` | INT | NOT NULL, FOREIGN KEY (games.id) | Jeu auquel se rapporte le challenge |
| `creator_id` | UUID | NOT NULL, FOREIGN KEY (profiles.id) | Utilisateur ayant créé le challenge |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `now()` | Date de création du challenge |
| `updated_at` | TIMESTAMP | NULLABLE | Date de dernière modification du challenge |

---

## Table `subscriptions`

> Table d'association entre `profiles` et `challenges` : un utilisateur peut s'abonner à plusieurs challenges, et un challenge peut être suivi par plusieurs utilisateurs. Elle traduit la relation « l'utilisateur participe à un challenge ».

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Identifiant unique de l'abonnement |
| `profile_id` | UUID | NOT NULL, FOREIGN KEY (profiles.id) | Utilisateur abonné au challenge |
| `challenge_id` | INT | NOT NULL, FOREIGN KEY (challenges.id) | Challenge concerné par l'abonnement |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `now()` | Date d'abonnement au challenge |
| `(profile_id, challenge_id)` | INDEX | UNIQUE | Contrainte d'unicité empêchant un utilisateur de s'abonner deux fois au même challenge |

---

## Table `participations`

> Soumissions des utilisateurs pour un challenge : lien vers la vidéo de complétion et compteurs de votes. Une participation est en attente de validation tant qu'elle n'a pas atteint le seuil de votes positifs.

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Identifiant unique de la participation |
| `profile_id` | UUID | NOT NULL, FOREIGN KEY (profiles.id) | Utilisateur ayant soumis la vidéo |
| `challenge_id` | INT | NOT NULL, FOREIGN KEY (challenges.id) | Challenge auquel se rapporte la soumission |
| `video_url` | VARCHAR(500) | NOT NULL | URL de la vidéo de complétion (YouTube, Twitch, etc.) |
| `screenshot_url` | VARCHAR(500) | NULLABLE | URL d'une capture d'écran facultative |
| `description` | TEXT | NULLABLE | Commentaire libre du joueur sur sa performance |
| `upvotes` | INT | NOT NULL, DEFAULT `0` | Compteur dénormalisé des votes positifs |
| `downvotes` | INT | NOT NULL, DEFAULT `0` | Compteur dénormalisé des votes négatifs |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'pending'` | État de la soumission. Valeurs : `'pending'`, `'validated'`, `'rejected'`, `'removed'` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `now()` | Date de soumission de la vidéo |
| `updated_at` | TIMESTAMP | NULLABLE | Date de dernière modification de la participation |

---

## Table `votes`

> Vote d'un utilisateur sur la participation d'un autre utilisateur. Le champ `value` vaut `+1` (upvote) ou `-1` (downvote). La contrainte d'unicité empêche un utilisateur de voter plusieurs fois sur la même soumission.

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Identifiant unique du vote |
| `participation_id` | INT | NOT NULL, FOREIGN KEY (participations.id) | Participation sur laquelle porte le vote |
| `profile_id` | UUID | NOT NULL, FOREIGN KEY (profiles.id) | Utilisateur ayant émis le vote |
| `value` | SMALLINT | NOT NULL | Valeur du vote : `1` pour un vote positif, `-1` pour un vote négatif |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `now()` | Date d'émission du vote |
| `(participation_id, profile_id)` | INDEX | UNIQUE | Contrainte d'unicité empêchant le double vote d'un utilisateur sur une même soumission |

---

## Table `badges`

> Référentiel des badges que peuvent obtenir les utilisateurs. Un badge représente une récompense symbolique liée à un accomplissement (classement, premier à compléter un challenge, etc.).

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Identifiant unique du badge |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Nom du badge |
| `description` | TEXT | NOT NULL | Description des conditions d'obtention du badge |
| `icon_url` | VARCHAR(500) | NULLABLE | URL de l'icône représentant le badge |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `now()` | Date d'ajout du badge dans le référentiel |

---

## Table `user_badges`

> Table d'association entre `profiles`, `badges` et `challenges`. Elle enregistre l'attribution d'un badge à un utilisateur, éventuellement liée à un challenge particulier (par exemple pour « premier à compléter ce challenge »).

| Champ | Type | Spécificités | Description |
|-------|------|--------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Identifiant unique de l'attribution |
| `profile_id` | UUID | NOT NULL, FOREIGN KEY (profiles.id) | Utilisateur récompensé |
| `badge_id` | INT | NOT NULL, FOREIGN KEY (badges.id) | Badge attribué |
| `challenge_id` | INT | NULLABLE, FOREIGN KEY (challenges.id) | Challenge à l'origine de l'attribution (null pour les badges globaux) |
| `awarded_at` | TIMESTAMP | NOT NULL, DEFAULT `now()` | Date d'attribution du badge |
| `(profile_id, badge_id, challenge_id)` | INDEX | UNIQUE | Contrainte d'unicité empêchant l'attribution multiple d'un même badge pour un même contexte |

---

## Relations entre les tables

> Les cardinalités sont exprimées selon la notation Merise : `(min, max)` côté table source — `(min, max)` côté table cible.

| Table source | Table cible | Cardinalités | Description |
|--------------|-------------|--------------|-------------|
| `profiles` | `users` | 1,1 — 1,1 | `profiles.id` référence `users.id` (profil créé à l'inscription) |
| `challenges` | `games` | 1,n — 1,1 | Un jeu contient plusieurs challenges. `challenges.game_id` référence `games.id` |
| `challenges` | `profiles` | 1,n — 1,1 | Un utilisateur peut créer plusieurs challenges. `challenges.creator_id` référence `profiles.id` |
| `subscriptions` | `profiles` | 0,n — 1,1 | Un utilisateur peut être abonné à plusieurs challenges. `subscriptions.profile_id` référence `profiles.id` |
| `subscriptions` | `challenges` | 0,n — 1,1 | Un challenge peut avoir plusieurs abonnés. `subscriptions.challenge_id` référence `challenges.id` |
| `participations` | `profiles` | 0,n — 1,1 | Un utilisateur peut soumettre plusieurs participations. `participations.profile_id` référence `profiles.id` |
| `participations` | `challenges` | 0,n — 1,1 | Un challenge peut recevoir plusieurs participations. `participations.challenge_id` référence `challenges.id` |
| `votes` | `participations` | 0,n — 1,1 | Une participation peut recevoir plusieurs votes. `votes.participation_id` référence `participations.id` |
| `votes` | `profiles` | 0,n — 1,1 | Un utilisateur peut émettre plusieurs votes. `votes.profile_id` référence `profiles.id` |
| `user_badges` | `profiles` | 0,n — 1,1 | Un utilisateur peut obtenir plusieurs badges. `user_badges.profile_id` référence `profiles.id` |
| `user_badges` | `badges` | 0,n — 1,1 | Un badge peut être attribué à plusieurs utilisateurs. `user_badges.badge_id` référence `badges.id` |
| `user_badges` | `challenges` | 0,n — 0,1 | Un challenge peut donner lieu à plusieurs attributions de badge (relation facultative) |