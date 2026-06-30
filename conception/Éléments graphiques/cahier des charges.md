# Cahier des charges

## Projet : Gamer Challenges

---

## Sommaire

- [Présentation du projet](#1-présentation-du-projet)
- [Définition des besoins & objectifs](#2-définition-des-besoins--objectifs)
- [Spécifications fonctionnelles](#3-spécifications-fonctionnelles)
  - [MVP](#31-le-mvp)
  - [Évolutions potentielles](#32-évolutions-potentielles)
- [Choix et justifications de l'architecture](#4-choix-et-justification-de-larchitecture)
- [Spécifications techniques](#5-spécifications-techniques)
- [Définition de la cible](#6-définition-de-la-cible-du-projet)
- [Navigateurs compatibles](#7-navigateurs-compatibles)
- [Arborescence de l'application](#8-arborescence-de-lapplication)
- [Liste des routes prévues](#9-liste-des-routes-prévues)
- [User stories](#10-user-stories)
- [Analyse des risques](#11-analyse-des-risques)
- [Rôles de chacun](#12-rôles-de-chacun)

---

## 1. Présentation du projet

Le projet **Gamer Challenge** est une plateforme dédiée aux défis de jeux vidéo, permettant aux utilisateurs de proposer et relever des challenges sur différents jeux.

Cette application vise à rassembler les passionnés de jeux vidéo autour d'une communauté dynamique et compétitive.

- Les défis pourront être créés par n'importe quel utilisateur inscrit et connecté.
- Les résolutions de défis seront auto-évaluées par la communauté via un système de votes positifs ou négatifs.
- Un tableau des leaders mettra en avant les joueurs les plus actifs et les mieux notés.

---

## 2. Définition des besoins & objectifs

L'objectif de cette application est de rassembler les passionnés d'une communauté et de raviver l'intérêt pour certains jeux vidéo.

Elle permettra de mettre en relation des membres d'une même communauté afin qu'ils se challengent via différents défis.

Afin d'arriver à ces objectifs, il faudra mettre des récompenses plus ou moins élevées en fonction des jeux concernés.

Pour atteindre ces objectifs, l'application devra proposer constamment de nouveaux défis et également un suivi des différents évènements esport.

---

## 3. Spécifications fonctionnelles

### 3.1 Le MVP

- **Système d'authentification** (email, Twitch, Google)
- **Challenge**
  - Création de challenge
  - S'abonner au challenge
  - Liens vers vidéos de complétion du challenge
  - Vote sur les vidéos
- **Réception des récompenses**
  - Points
  - Badges (ex : classement, premier à réaliser le challenge)
- **Leaderboard**
  - Global
  - Par challenge

### 3.2 Évolutions potentielles

- Suivi évènement eSport / jeux vidéo
- Création de challenges officiels par les admins de l'app
- Récompenses particulières (badges collector, gain de points accrus)
- Commentaires sous soumissions des vidéos de complétion
- Espace forum
- Recherche de joueurs (trouver un joueur avec qui réaliser un challenge)
- Notifications

---

## 4. Choix et justification de l'architecture

Pour l'architecture de notre projet, nous avons choisi une architecture de type **client-serveur avec API**.

### À quoi ça correspond ?

L'application est séparée en deux parties distinctes :

- un **front-end** (interface utilisateur) développé avec ReactJS,
- un **back-end** qui expose une API (interface de communication) développée avec Hono.

Le front-end envoie des requêtes au back-end (par exemple : récupérer les challenges, envoyer une participation), et le back-end répond avec des données (souvent au format JSON).

### Pourquoi ce choix ?

- **Séparation des responsabilités** : le front gère l'affichage, le back gère les données et la logique métier.
- **Meilleure maintenabilité** : chaque partie peut évoluer indépendamment sans impacter l'autre.
- **Scalabilité** : l'API peut être utilisée par d'autres clients (ex : application mobile).
- **Adapté aux applications modernes** : ce type d'architecture est aujourd'hui standard pour les applications web dynamiques.

---

## 5. Spécifications techniques

### DevOps

| Technologie | À quoi ça sert | Pourquoi ce choix |
|-------------|----------------|-------------------|
| **Docker** | Docker est un outil qui permet de créer des environnements de développement standardisés. Concrètement, cela signifie que toute l'équipe travaille dans les mêmes conditions, évitant les bugs liés aux différences de configuration entre les machines. Il permet également de faciliter le déploiement de l'application sur un serveur. | Docker est utilisé pour le Front-end et le Back-end afin de garantir une cohérence entre les environnements de développement et de production. La base de données n'est pas conteneurisée car Supabase fournit déjà une solution prête à l'emploi. |

### Base de Données (BDD)

| Technologie | À quoi ça sert | Pourquoi ce choix |
|-------------|----------------|-------------------|
| **Supabase** | Supabase est un service qui permet de stocker et gérer les données de l'application (utilisateurs, challenges, votes, etc.). Il propose également des fonctionnalités intégrées comme : l'authentification des utilisateurs (connexion sécurisée), la gestion des accès aux données, l'exécution de tâches automatiques (ex : suppression ou mise à jour régulière de données). | Supabase est une solution clé en main, sécurisée et rapide à mettre en place, ce qui permet de se concentrer sur le développement des fonctionnalités plutôt que sur la gestion technique d'une base de données. |

### Back-end

| Technologie | À quoi ça sert | Pourquoi ce choix |
|-------------|----------------|-------------------|
| **Hono + Bun + Drizzle** | Le back-end est la partie "invisible" de l'application. Il gère la logique métier (ex : création d'un challenge), la communication avec la base de données, et la sécurité (vérification des utilisateurs). Les outils utilisés : **Hono** (framework qui permet de créer les routes API), **Bun** (environnement d'exécution rapide pour exécuter le code serveur), **Drizzle** (outil qui facilite les échanges avec la base de données). | Ces technologies sont choisies pour leur rapidité, leur légèreté et leurs bonnes performances, ce qui permet de développer une application réactive et moderne. |

### Front-end

| Technologie | À quoi ça sert | Pourquoi ce choix |
|-------------|----------------|-------------------|
| **ReactJS** | Le front-end est la partie visible de l'application, celle avec laquelle l'utilisateur interagit (pages, boutons, formulaires…). ReactJS permet de créer des interfaces dynamiques et fluides. | React est très populaire, bien documenté et permet de développer rapidement des interfaces performantes et évolutives. |

---

## 6. Définition de la cible du projet

L'application vise principalement un public de joueurs aguerris comme amateurs mais également des personnes souhaitant s'introduire à ce milieu.

---

## 7. Navigateurs compatibles

L'application sera testée et approuvée sur les navigateurs suivants :

- **Chrome** (version 147.0.7727.102+)
- **Mozilla Firefox** (version 149.0.2+)

---

## 8. Arborescence de l'application

*(À compléter — diagramme d'arborescence)*

---

## 9. Liste des routes prévues

### Front

| Route | Description |
|-------|-------------|
| `/home` | Page d'accueil |
| `/about` | « À propos » qui expliquera le concept de l'application |
| `/contact` | Permet de contacter le support de l'application |
| `/terms-of-privacy` | Recensement des mentions légales |
| `/sign-up` | Inscription |
| `/sign-in` | Connexion |
| `/challenges` | Liste de tous les challenges triés par ordre de création par défaut |
| `/challenge/:slug` | Un challenge en particulier |
| `/account` | Détails de compte de l'utilisateur connecté |
| `/account/setting` | Paramètres du compte de l'utilisateur connecté |

### API

| Route | Description |
|-------|-------------|
| `/api/v1/challenges` | Liste de tous les challenges |
| `/api/v1/challenges/:id` | Données d'un challenge |
| `/api/v1/users` | Liste des utilisateurs |
| `/api/v1/users/:id` | Données d'un utilisateur |
| `/api/v1/leaderboard` | Données du tableau de score |
| `/api/v1/leaderboard/:challengeid` | Données du leaderboard d'un challenge |
| `/api/v1/vote` | Ajoute un upvote ou un downvote |
| `/api/v1/auth/logout` | Déconnexion |
| `/api/v1/auth/sign-up` | Inscription |
| `/api/v1/auth/sign-in` | Connexion |

---

## 10. User stories

### Visiteur

| En tant que | Je dois pouvoir | Afin de |
|-------------|-----------------|---------|
| Visiteur | Consulter la page d'accueil | Découvrir le concept de l'application |
| Visiteur | Consulter la page « À propos » | Comprendre le fonctionnement de la plateforme |
| Visiteur | Consulter le support | Poser une question ou signaler un problème |
| Visiteur | Consulter les mentions légales | Connaître mes droits et les conditions d'utilisation |
| Visiteur | M'inscrire (email, Twitch ou Google) | Créer un compte et accéder aux fonctionnalités |
| Visiteur | Me connecter | Accéder à mon espace personnel |
| Visiteur | Consulter la liste des challenges | Découvrir les défis disponibles |
| Visiteur | Consulter le détail d'un challenge | En comprendre les règles et la récompense |
| Visiteur | Visionner les vidéos de complétion | Voir comment d'autres joueurs ont réussi un défi |
| Visiteur | Consulter le leaderboard global | Voir les meilleurs joueurs de la plateforme |
| Visiteur | Consulter le leaderboard d'un challenge | Voir les joueurs l'ayant complété |

### User

| En tant que | Je dois pouvoir | Afin de |
|-------------|-----------------|---------|
| User | Me déconnecter | Sécuriser mon compte |
| User | Consulter mon compte | Voir mes informations personnelles |
| User | Modifier les paramètres de mon compte | Mettre à jour mes informations |
| User | Changer mon mot de passe | Garantir la sécurité de mon compte |
| User | Supprimer mon compte | Retirer mes données de la plateforme |
| User | M'abonner à un challenge | Participer à celui-ci |
| User | Me désabonner d'un challenge | L'abandonner |
| User | Soumettre un lien vers ma vidéo de complétion | Prouver que j'ai réussi le challenge |
| User | Voter positivement sur une vidéo | Valider la réussite du challenge par un autre joueur |
| User | Voter négativement sur une vidéo | Invalider une soumission non conforme |
| User | Consulter mes points | Suivre ma progression |
| User | Consulter mes badges | Visualiser mes récompenses obtenues |
| User | Voir ma position dans le leaderboard | Me situer par rapport aux autres joueurs |
| User | Consulter la liste de mes challenges en cours | Suivre mes participations |
| User | Consulter l'historique de mes challenges complétés | Garder une trace de mes accomplissements |
| User | Créer un nouveau challenge | Proposer un défi à la communauté |
| User | Définir les règles d'un challenge | Que les participants sachent ce qu'ils doivent accomplir |
| User | Associer mon challenge à un jeu vidéo | Qu'il soit correctement catégorisé |
| User | Définir la récompense en points | Inciter les joueurs à relever le défi |
| User | Modifier mon challenge | Corriger ou préciser les règles |
| User | Supprimer mon challenge | Le retirer de la plateforme |
| User | Consulter la liste des participants à mon challenge | Suivre son engouement |
| User | Consulter les soumissions de vidéos sur mon challenge | Voir comment les joueurs l'ont réussi |

### Admin

| En tant que | Je dois pouvoir | Afin de |
|-------------|-----------------|---------|
| Admin | Accéder à une interface d'administration | Gérer la plateforme |
| Admin | Consulter la liste des utilisateurs | Superviser la communauté |
| Admin | Bannir un utilisateur | Sanctionner un comportement inapproprié |
| Admin | Supprimer un challenge | Retirer un contenu non conforme |
| Admin | Supprimer une soumission de vidéo | Retirer un contenu inapproprié |
| Admin | Modérer les votes | Détecter et corriger les abus |
| Admin | Consulter les signalements | Traiter les plaintes des utilisateurs |
| Admin | Attribuer manuellement des badges | Récompenser des comportements spécifiques |
| Admin | Consulter des statistiques de la plateforme | Suivre son activité |

---

## 11. Analyse des risques

Voici une liste des potentiels risques à envisager :

| Risque | Mesures | Niveau de risque |
|--------|---------|:----------------:|
| Vol de session / JWT non sécurisé | Utiliser des cookies HttpOnly, Secure, SameSite. Expiration courte + refresh tokens | 🔴 Élevé |
| Injection SQL | Requêtes préparées (ORM ou statements paramétrés). Validation et sanitation des entrées. Principe du moindre privilège pour la BDD | 🔴 Élevé |
| Faille XSS | Échapper/sanitiser toutes les entrées utilisateur. Utiliser un Content Security Policy (CSP). Éviter `innerHTML`, préférer des APIs sûres | 🔴 Élevé |
| Soumission de liens vidéos malveillants / morts | Valider les URLs (whitelist de domaines). Vérifier disponibilité (HEAD request) | 🔴 Élevé |
| Données personnelles non chiffrées en BDD | Chiffrement au repos (AES-256). Hash des mots de passe (bcrypt/argon2) | 🔴 Élevé |
| Surcharge BDD sur leaderboard global | Mise en cache (Redis). Pagination / limitation des requêtes. Indexation + pré-calcul (batch jobs) | 🟠 Moyen |
| Perte de données sans backup | Backups automatiques réguliers. Stockage hors site (cloud) | 🔴 Élevé |
| Indisponibilité si perte de trafic | Rate limiting / CDN | 🟠 Moyen |
| Transfert de données hors UE (OAuth tiers) | Vérifier conformité RGPD (SCC, DPA). Minimiser les données envoyées. Informer les utilisateurs et obtenir consentement | 🟠 Moyen |

---

## 12. Rôles de chacun

| Rôle | Nom |
|------|-----|
| Product Owner | Maël Colomé |
| Scrum Master | Samy Khelfa |
| Git Master | Marco Santarossa |
| Lead Dev Front | Gwendal Nogues |
| Lead Dev Backend | Maël Colomé |