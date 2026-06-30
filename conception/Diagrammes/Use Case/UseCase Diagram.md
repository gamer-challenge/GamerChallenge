```graph LR
    Visiteur((Visiteur))
    User((User))
    Admin((Admin))
    subgraph CONSULTATION[Consultation publique]
        UC1[Consulter page d'accueil]
        UC2[Consulter A propos]
        UC3[Consulter support]
        UC4[Consulter mentions legales]
        UC5[Consulter liste challenges]
        UC6[Consulter detail challenge]
        UC7[Visionner videos de completion]
        UC8[Consulter leaderboard global]
        UC9[Consulter leaderboard challenge]
    end
    subgraph AUTH[Authentification]
        UC10[S'inscrire]
        UC11[Se connecter]
        UC12[Se deconnecter]
    end
    subgraph COMPTE[Gestion du compte]
        UC13[Consulter mon compte]
        UC14[Modifier parametres]
        UC15[Changer mot de passe]
        UC16[Supprimer mon compte]
        UC17[Consulter mes points]
        UC18[Consulter mes badges]
        UC19[Consulter ma position leaderboard]
        UC20[Consulter mes challenges en cours]
        UC21[Consulter historique challenges]
    end
    subgraph PARTICIPATION[Participation aux challenges]
        UC22[S'abonner a un challenge]
        UC23[Se desabonner d'un challenge]
        UC24[Soumettre video de completion]
        UC25[Voter positivement]
        UC26[Voter negativement]
    end
    subgraph CREATION[Gestion de mes challenges]
        UC27[Creer un challenge]
        UC28[Modifier mon challenge]
        UC29[Supprimer mon challenge]
        UC30[Consulter participants]
        UC31[Consulter soumissions]
    end
    subgraph ADMINISTRATION[Administration]
        UC32[Acceder interface admin]
        UC33[Consulter liste utilisateurs]
        UC34[Bannir un utilisateur]
        UC35[Supprimer un challenge]
        UC36[Supprimer une soumission]
        UC37[Moderer les votes]
        UC38[Consulter signalements]
        UC39[Attribuer badges manuellement]
        UC40[Consulter statistiques]
    end
    %% ===== Associations acteurs =====
    Visiteur --> UC1
    Visiteur --> UC2
    Visiteur --> UC3
    Visiteur --> UC4
    Visiteur --> UC5
    Visiteur --> UC6
    Visiteur --> UC8
    Visiteur --> UC9
    Visiteur --> UC10
    Visiteur --> UC11
    User --> UC12
    User --> UC13
    User --> UC22
    User --> UC23
    User --> UC24
    User --> UC25
    User --> UC26
    User --> UC27
    User --> UC28
    User --> UC29
    Admin --> UC32
    Admin --> UC34
    Admin --> UC35
    Admin --> UC36
    Admin --> UC37
    Admin --> UC38
    Admin --> UC39
    Admin --> UC40
    %% ===== Héritage entre acteurs =====
    User -.->|hérite de| Visiteur
    Admin -.->|hérite de| User
    %% ===== Relations INCLUDE (dépendances obligatoires) =====
    UC16 -.->|"«include»"| UC11
    UC24 -.->|"«include»"| UC22
    UC27 -.->|"«include»"| UC11
    UC28 -.->|"«include»"| UC31
    UC29 -.->|"«include»"| UC30
    UC32 -.->|"«include»"| UC33
    %% ===== Relations EXTENDS (possibilités optionnelles) =====
    %% Depuis "Consulter mon compte", on peut accéder à ces sections
    UC17 -.->|"«extends»"| UC13
    UC18 -.->|"«extends»"| UC13
    UC19 -.->|"«extends»"| UC13
    UC20 -.->|"«extends»"| UC13
    UC21 -.->|"«extends»"| UC13
    %% Depuis "Modifier parametres", on peut changer son mdp
    UC15 -.->|"«extends»"| UC14
    %% Depuis le détail d'un challenge
    UC7 -.->|"«extends»"| UC6
    UC9 -.->|"«extends»"| UC6
    %% Depuis la liste des challenges
    UC22 -.->|"«extends»"| UC5
    %% Depuis une soumission
    UC25 -.->|"«extends»"| UC24
    UC26 -.->|"«extends»"| UC24
    %% Depuis "Créer un challenge"
    UC30 -.->|"«extends»"| UC27
    UC31 -.->|"«extends»"| UC27
    %% Depuis la liste des utilisateurs
    UC34 -.->|"«extends»"| UC33
    %% Depuis la modération des votes
    UC36 -.->|"«extends»"| UC37
    %% Depuis les signalements
    UC38 -.->|"«extends»"| UC34
    UC38 -.->|"«extends»"| UC35
    UC38 -.->|"«extends»"| UC36

```