# SYSTÈME DE PLANIFICATION ACADÉMIQUE BEM PLANNING

## Gestion automatisée de l'emploi du temps et détection des conflits

---

**Auteur:** [Votre Nom]
**Établissement:** BEM (Business Et Management)
**Année académique:** 2024-2025
**Date:** Novembre 2025

---

## SOMMAIRE

1. [GLOSSAIRE](#glossaire)
2. [INTRODUCTION GÉNÉRALE](#introduction-générale)
3. [HISTORIQUE](#historique)
4. [CONTEXTE](#contexte)
5. [PROBLÉMATIQUE](#problématique)
6. [OBJECTIF GÉNÉRAL](#objectif-général)
7. [OBJECTIFS SPÉCIFIQUES](#objectifs-spécifiques)
8. [MOTIVATIONS](#motivations)

---

## GLOSSAIRE

### Termes académiques

**CM (Cours Magistral)** : Cours théorique dispensé en amphithéâtre à un grand nombre d'étudiants.

**TD (Travaux Dirigés)** : Séances d'exercices en petits groupes pour approfondir les cours magistraux.

**TP (Travaux Pratiques)** : Séances pratiques en laboratoire ou salle informatique.

**TPE (Travail Personnel Étudiant)** : Heures de travail personnel hors présence de l'enseignant.

**VHT (Volume Horaire Total)** : Somme totale des heures d'enseignement d'un module ou programme.

**UE (Unité d'Enseignement)** : Module d'enseignement avec un contenu pédagogique défini.

**Maquette pédagogique** : Document officiel décrivant l'organisation d'un programme de formation.

**Crédit ECTS** : Système européen de transfert et d'accumulation de crédits académiques.

**Semestre académique** : Période de 4 à 5 mois constituant une moitié d'année universitaire.

### Termes techniques

**Conflit de planification** : Situation où deux ressources (intervenant, salle) sont sollicitées simultanément.

**Double booking** : Réservation simultanée d'une même ressource pour deux activités différentes.

**Chevauchement horaire** : Superposition partielle des plages horaires de deux séances.

**Contrainte calendaire** : Règle temporelle à respecter (jours ouvrables, vacances, périodes d'examens).

**Surcharge horaire** : Dépassement du nombre maximum d'heures d'enseignement autorisé.

**Planification automatique** : Génération automatisée d'emplois du temps selon des contraintes définies.

**Ressource pédagogique** : Élément nécessaire à une séance (intervenant, salle, équipement).

**Période académique** : Année universitaire avec ses dates importantes (rentrée, examens, vacances).

### Termes du système

**Intervenant** : Enseignant ou formateur dispensant des cours.

**Séance** : Occurrence planifiée d'un enseignement avec date, heure et lieu précis.

**Module** : Unité d'enseignement avec volume horaire et objectifs pédagogiques définis.

**Programme** : Ensemble cohérent de modules constituant une formation complète.

**Disponibilité** : Créneau horaire où un intervenant est disponible pour enseigner.

**Sévérité de conflit** : Niveau de criticité (BASSE, MOYENNE, HAUTE, CRITIQUE) d'un conflit détecté.

**Journal d'activités** : Historique traçant toutes les actions effectuées dans le système.

---

## INTRODUCTION GÉNÉRALE

Dans le contexte actuel de l'enseignement supérieur, la gestion efficace des emplois du temps constitue un enjeu majeur pour les établissements académiques. La planification des enseignements implique la coordination de multiples ressources (enseignants, salles, équipements) tout en respectant de nombreuses contraintes réglementaires, pédagogiques et organisationnelles.

Le projet **BEM Planning** s'inscrit dans cette perspective en proposant une solution numérique complète pour automatiser et optimiser la planification académique. Ce système vise à remplacer les processus manuels traditionnels, sources d'erreurs et de conflits, par une plateforme intelligente capable de détecter automatiquement les incompatibilités et d'assister les gestionnaires dans leurs décisions.

L'établissement BEM (Business Et Management), comme de nombreuses institutions d'enseignement supérieur, fait face à une croissance continue de ses effectifs et à une diversification de ses programmes. Cette évolution rend la gestion manuelle des plannings de plus en plus complexe et chronophage. Les coordinateurs pédagogiques consacrent actuellement plusieurs jours, voire plusieurs semaines, à l'élaboration des emplois du temps pour chaque semestre, sans garantie d'optimalité ni d'absence de conflits.

Le présent document expose la démarche méthodologique et technique adoptée pour concevoir et développer ce système de planification. Il détaille le contexte institutionnel, les problématiques identifiées, les objectifs visés ainsi que les motivations qui ont guidé la réalisation de ce projet.

L'approche retenue s'appuie sur les technologies web modernes (Next.js, React, PostgreSQL) et privilégie une architecture robuste, évolutive et conforme aux standards de l'ingénierie logicielle. Le système intègre également des mécanismes avancés de détection et de résolution de conflits, permettant une gestion proactive des contraintes de planification.

Au-delà de la simple informatisation des processus existants, BEM Planning ambitionne de transformer la manière dont l'établissement aborde la planification académique, en passant d'une logique réactive à une démarche anticipative et optimisée. Cette transformation numérique vise à améliorer significativement la qualité de service offerte aux enseignants et aux étudiants, tout en réduisant la charge administrative des équipes de gestion.

---

## HISTORIQUE

### Évolution de la gestion des plannings académiques

#### Période pré-informatique (avant 1990)

Historiquement, la planification des enseignements dans les établissements d'enseignement supérieur s'effectuait entièrement manuellement. Les coordinateurs pédagogiques utilisaient des tableaux papier, des fiches cartonnées et des grilles horaires imprimées. Ce processus artisanal nécessitait plusieurs semaines de travail intensif à chaque début de semestre.

Les conflits de planification étaient fréquents et souvent découverts tardivement, parfois seulement le jour même des cours. Les modifications impliquaient de refaire manuellement l'ensemble des plannings, générant frustrations et perte de temps pour tous les acteurs.

#### Période des tableurs informatiques (1990-2010)

L'avènement des tableurs (Excel, LibreOffice Calc) a marqué une première évolution. Les plannings passaient du papier au numérique, facilitant légèrement les modifications. Cependant, cette approche restait largement manuelle :

- Aucune détection automatique des conflits
- Absence de validation des contraintes
- Difficultés de collaboration (versions multiples des fichiers)
- Risques d'erreurs de saisie élevés
- Pas de traçabilité des modifications

#### Émergence des logiciels dédiés (2010-2020)

Des solutions logicielles spécialisées ont commencé à apparaître sur le marché, proposant des fonctionnalités plus avancées. Cependant, ces outils présentaient souvent des limitations :

- Coûts de licence élevés
- Interfaces complexes nécessitant une formation importante
- Manque de flexibilité pour s'adapter aux spécificités de chaque établissement
- Solutions non intégrées avec les autres systèmes d'information

#### Contexte actuel (2020-présent)

Aujourd'hui, le secteur de l'enseignement supérieur connaît une transformation numérique profonde. Les établissements recherchent des solutions :

- **Cloud-native** : accessibles partout, à tout moment
- **Intelligentes** : capables d'automatiser et d'optimiser
- **Intégrées** : communicant avec les autres systèmes (ERP, LMS, etc.)
- **Collaboratives** : permettant le travail d'équipe en temps réel
- **Adaptatives** : personnalisables selon les besoins spécifiques

### Évolution spécifique à BEM

**2015-2018 : Gestion manuelle sur Excel**
- Planification effectuée par un seul coordinateur
- Effectifs modérés (moins de 500 étudiants)
- Problèmes récurrents de conflits non détectés

**2019-2021 : Tentative d'utilisation d'un logiciel commercial**
- Acquisition d'une licence d'un logiciel de planification
- Abandon après 18 mois en raison de la complexité d'utilisation
- Retour aux tableurs Excel

**2022-2023 : Croissance et difficultés**
- Doublement des effectifs étudiants
- Multiplication des programmes et spécialisations
- Augmentation significative du temps consacré à la planification
- Multiplication des conflits et réclamations

**2024 : Décision de développement interne**
- Constitution d'une équipe projet
- Analyse des besoins et des processus existants
- Lancement du projet BEM Planning

**2025 : Mise en œuvre et déploiement**
- Développement du système BEM Planning
- Tests pilotes sur un programme
- Déploiement progressif à l'ensemble de l'établissement

---

## CONTEXTE

### Contexte institutionnel

**BEM (Business Et Management)** est un établissement d'enseignement supérieur privé sénégalais fondé en 2010. Il propose des formations dans les domaines du management, de l'informatique, de l'ingénierie et du commerce international.

#### Chiffres clés (année 2024-2025)
- **1 200 étudiants** répartis sur 5 niveaux (L1 à M2)
- **15 programmes** de formation (licences et masters)
- **80 intervenants** (enseignants permanents et vacataires)
- **45 modules** d'enseignement par semestre
- **25 salles** de cours (amphithéâtres, salles TD, laboratoires informatiques)
- **2 semestres** académiques par année universitaire

#### Organisation académique

L'année académique est structurée en deux semestres :
- **Semestre 1** : octobre à janvier (avec pause de Noël)
- **Semestre 2** : février à juin (avec pause de Pâques)

Chaque semestre comprend :
- 14 semaines d'enseignement
- 2 semaines d'examens terminaux
- 1 semaine de rattrapage

### Contexte organisationnel

#### Acteurs de la planification

**Direction pédagogique**
- Définit les orientations stratégiques
- Valide les maquettes pédagogiques
- Arbitre les conflits majeurs

**Coordinateurs de programme** (3 personnes)
- Responsables de la planification de leurs programmes respectifs
- Interface entre direction, enseignants et étudiants
- Gestion quotidienne des emplois du temps

**Enseignants** (80 personnes)
- Communiquent leurs disponibilités
- Signalent les problèmes de planning
- Peuvent être permanents ou vacataires

**Service scolarité**
- Gère les inscriptions étudiantes
- Communique les effectifs par groupe
- Édite et diffuse les emplois du temps

**Étudiants** (1 200 personnes)
- Consultent leurs emplois du temps
- Remontent les problèmes constatés

#### Processus actuel de planification

**Phase 1 : Préparation (2 semaines avant le semestre)**
1. Récupération des maquettes pédagogiques validées
2. Collecte des disponibilités des intervenants (par email)
3. Inventaire des salles disponibles
4. Identification des périodes spéciales (vacances, jours fériés)

**Phase 2 : Planification initiale (1 semaine)**
1. Affectation des modules aux intervenants
2. Calcul des volumes horaires par module (CM, TD, TP)
3. Création des créneaux horaires sur Excel
4. Tentative de minimisation des conflits

**Phase 3 : Ajustements (plusieurs jours)**
1. Détection manuelle des conflits
2. Négociations avec les intervenants pour modifications
3. Réaffectation de salles en cas de problème
4. Multiples itérations jusqu'à obtention d'un planning viable

**Phase 4 : Publication (1 jour)**
1. Génération de fichiers PDF par niveau
2. Envoi par email aux étudiants et enseignants
3. Affichage physique dans l'établissement

**Phase 5 : Maintenance (tout le semestre)**
1. Gestion des modifications imprévues (absences, changements de salle)
2. Communication des changements
3. Mise à jour des plannings

### Contexte technologique

#### Infrastructure existante

**Systèmes en place**
- ERP académique (gestion des inscriptions, notes)
- Plateforme LMS Moodle (cours en ligne)
- Suite bureautique Microsoft 365
- Site web institutionnel (WordPress)

**Limitations actuelles**
- Aucun système dédié à la planification
- Pas d'intégration entre les différents systèmes
- Processus largement manuels et déconnectés

#### Compétences techniques disponibles

- Équipe informatique interne (2 personnes)
- Compétences en développement web (PHP, JavaScript)
- Infrastructure d'hébergement mutualisé
- Capacité de gestion de bases de données (MySQL, PostgreSQL)

### Contexte réglementaire et pédagogique

#### Contraintes réglementaires

**Code de l'éducation sénégalais**
- Volume horaire minimal par crédit ECTS
- Durée maximale d'une séance (4 heures)
- Temps de pause obligatoire entre séances

**Réglementation du travail des enseignants**
- Charge horaire maximale hebdomadaire (18h pour permanents)
- Temps de repos minimal entre deux interventions
- Droits aux congés et autorisations d'absence

#### Contraintes pédagogiques

**Organisation des enseignements**
- Respect de la progressivité pédagogique
- Équilibrage de la charge de travail étudiante
- Alternance CM, TD et TP selon les maquettes

**Contraintes logistiques**
- Capacité d'accueil des salles adaptée aux effectifs
- Disponibilité des équipements spécialisés (laboratoires)
- Respect des préférences horaires des intervenants vacataires

---

## PROBLÉMATIQUE

### Énoncé général de la problématique

**Comment concevoir et développer un système de planification académique intelligent capable d'automatiser la génération des emplois du temps, de détecter et de résoudre les conflits de ressources, tout en garantissant le respect des contraintes réglementaires, pédagogiques et organisationnelles de l'établissement BEM ?**

### Problèmes identifiés

#### 1. Inefficacité du processus manuel

**Temps de traitement excessif**
- 2 à 3 semaines nécessaires pour établir le planning d'un semestre
- Mobilisation complète d'un coordinateur à temps plein
- Délais incompressibles retardant la communication aux étudiants

**Charge de travail répétitive**
- Ressaisie manuelle des mêmes informations chaque semestre
- Vérifications multiples et fastidieuses
- Stress important en période de planification

**Difficultés de collaboration**
- Échanges d'emails multiples et désorganisés
- Versions contradictoires des plannings en circulation
- Impossibilité de travailler simultanément sur le même planning

#### 2. Fréquence élevée des conflits

**Conflits de double réservation**
- Intervenant planifié simultanément dans deux salles différentes
- Salle réservée pour deux groupes au même moment
- Découverte tardive, parfois le jour même du cours

**Conflits de chevauchement horaire**
- Séances qui se terminent après le début de la suivante
- Temps de déplacement entre salles non pris en compte
- Absence de temps de pause pour les intervenants

**Conflits de surcharge**
- Dépassement des charges horaires maximales des enseignants
- Journées trop chargées pour les étudiants (8-10h de cours)
- Mauvaise répartition de la charge de travail sur la semaine

**Conflits calendaires**
- Cours planifiés pendant les jours fériés
- Non-respect des périodes de vacances
- Examens programmés sur des créneaux inadaptés

**Impact des conflits**
- Annulations de cours de dernière minute
- Mécontentement des étudiants et enseignants
- Perte de crédibilité de l'établissement
- Heures d'enseignement perdues

#### 3. Absence de traçabilité et d'historique

**Problèmes de suivi**
- Aucun historique des modifications effectuées
- Impossibilité de savoir qui a fait quelle modification
- Difficultés à identifier les sources d'erreurs

**Manque d'audit**
- Absence de justification des choix de planification
- Impossibilité de prouver le respect des contraintes réglementaires
- Difficultés en cas de contentieux avec un enseignant

**Perte d'information**
- Expérience et savoir-faire non capitalisés
- Dépendance forte vis-à-vis des personnes
- Risque de perte de données (fichiers corrompus, erreurs de manipulation)

#### 4. Communication inefficace

**Diffusion des plannings**
- Envoi de fichiers PDF non modifiables
- Impossibilité de rechercher ou filtrer l'information
- Nécessité de télécharger et consulter plusieurs documents

**Gestion des changements**
- Notifications par email facilement manquées
- Étudiants et enseignants non informés en temps réel
- Confusion entre anciennes et nouvelles versions

**Accessibilité limitée**
- Pas d'accès mobile pratique
- Consultation impossible sans connexion internet
- Pas de synchronisation avec les agendas personnels

#### 5. Absence d'optimisation

**Gestion empirique**
- Planification basée sur l'expérience personnelle
- Absence d'outils d'aide à la décision
- Résultats sous-optimaux en termes d'utilisation des ressources

**Inefficience des ressources**
- Salles sous-utilisées ou sur-sollicitées
- Créneaux horaires mal exploités
- Déplacements inutiles des intervenants entre différents sites

**Qualité pédagogique variable**
- Répartition déséquilibrée des cours dans la semaine
- Concentration excessive de certaines matières
- Pas de prise en compte des rythmes d'apprentissage optimaux

#### 6. Évolutivité compromise

**Rigidité du système actuel**
- Difficultés à intégrer de nouveaux programmes
- Complexité croissante avec l'augmentation des effectifs
- Solution Excel atteignant ses limites techniques

**Absence de scalabilité**
- Système ne pouvant pas gérer plus de 1500-2000 étudiants
- Temps de traitement augmentant de manière non linéaire
- Risques d'erreurs proportionnels à la complexité

### Questions de recherche

Pour répondre à la problématique centrale, plusieurs questions de recherche se posent :

**1. Modélisation et architecture**
- Comment modéliser efficacement les entités et relations d'un système de planification académique ?
- Quelle architecture logicielle permet de garantir performance, maintenabilité et évolutivité ?

**2. Détection et résolution de conflits**
- Quels algorithmes utiliser pour détecter automatiquement tous les types de conflits ?
- Comment classifier les conflits par niveau de sévérité ?
- Quelles stratégies de résolution proposer aux utilisateurs ?

**3. Interface utilisateur**
- Comment concevoir une interface intuitive accessible aux non-informaticiens ?
- Quelles visualisations favoriser pour faciliter la compréhension des plannings ?
- Comment optimiser l'expérience utilisateur sur mobile et desktop ?

**4. Intégration et interopérabilité**
- Comment intégrer le système avec l'infrastructure informatique existante ?
- Quels standards et formats adopter pour faciliter les échanges de données ?

**5. Performance et fiabilité**
- Comment garantir des temps de réponse acceptables avec 1000+ utilisateurs simultanés ?
- Quels mécanismes mettre en place pour assurer la disponibilité du service ?

---

## OBJECTIF GÉNÉRAL

**Concevoir, développer et déployer une plateforme web complète de gestion automatisée de la planification académique pour l'établissement BEM, permettant d'optimiser l'allocation des ressources pédagogiques (intervenants, salles, créneaux horaires), de détecter et résoudre automatiquement les conflits de planification, et d'améliorer significativement l'efficacité opérationnelle tout en garantissant une expérience utilisateur optimale pour l'ensemble des acteurs de la communauté académique.**

---

## OBJECTIFS SPÉCIFIQUES

### 1. Objectifs fonctionnels

#### OS1 : Gestion complète des ressources pédagogiques

**Sous-objectifs :**
- Créer un module de gestion des intervenants avec leurs profils, disponibilités et contraintes horaires
- Développer un système de gestion des salles avec leurs caractéristiques et équipements
- Implémenter la gestion des programmes et modules d'enseignement avec leurs maquettes pédagogiques
- Établir un référentiel des périodes académiques avec calendrier détaillé

**Indicateurs de réussite :**
- 100% des intervenants enregistrés dans le système
- 100% des salles répertoriées avec leurs caractéristiques
- Toutes les maquettes pédagogiques digitalisées

#### OS2 : Automatisation de la planification

**Sous-objectifs :**
- Développer un algorithme de planification automatique respectant l'ensemble des contraintes
- Implémenter un système de planification manuelle assistée avec suggestions intelligentes
- Créer des modèles de planning réutilisables d'un semestre à l'autre
- Permettre la duplication et l'adaptation de plannings existants

**Indicateurs de réussite :**
- Réduction de 70% du temps de planification initiale
- Taux de satisfaction des coordinateurs ≥ 85%
- Génération automatique d'un planning viable en moins de 5 minutes

#### OS3 : Détection et gestion des conflits

**Sous-objectifs :**
- Développer un moteur de détection de conflits multi-critères
- Implémenter une classification des conflits par type et sévérité
- Créer un système de notification en temps réel des conflits détectés
- Proposer des suggestions de résolution automatique

**Types de conflits à détecter :**
- Double booking d'intervenants (CRITIQUE)
- Double booking de salles (HAUTE)
- Chevauchements horaires (MOYENNE)
- Surcharges horaires (MOYENNE)
- Contraintes calendaires (BASSE)
- Incompatibilités avec disponibilités déclarées (HAUTE)

**Indicateurs de réussite :**
- 100% des conflits détectés automatiquement
- Temps de détection < 1 seconde
- Réduction de 90% des conflits non détectés découverts en cours de semestre

#### OS4 : Traçabilité et audit

**Sous-objectifs :**
- Implémenter un journal d'activités exhaustif
- Enregistrer toutes les actions utilisateurs avec horodatage
- Permettre la consultation de l'historique des modifications
- Générer des rapports d'audit détaillés

**Indicateurs de réussite :**
- 100% des actions tracées dans le journal
- Capacité à reconstituer l'historique complet d'un planning
- Génération de rapports d'audit en moins de 10 secondes

#### OS5 : Communication et diffusion

**Sous-objectifs :**
- Développer un système de consultation des plannings en ligne
- Implémenter des notifications automatiques en cas de modification
- Permettre l'export dans différents formats (PDF, Excel, iCal)
- Créer une API pour l'intégration avec d'autres systèmes

**Indicateurs de réussite :**
- Réduction de 80% du temps de diffusion des plannings
- Taux de consultation en ligne ≥ 90%
- Temps de synchronisation avec agenda personnel < 5 minutes

### 2. Objectifs techniques

#### OS6 : Architecture et performance

**Sous-objectifs :**
- Concevoir une architecture scalable supportant 2000+ utilisateurs
- Garantir des temps de réponse < 2 secondes pour 95% des requêtes
- Assurer une disponibilité du service ≥ 99%
- Implémenter un système de cache efficace

**Indicateurs de réussite :**
- Tests de charge validés avec 500 utilisateurs simultanés
- Temps de réponse moyen < 1 seconde
- Aucune interruption de service non planifiée

#### OS7 : Sécurité et confidentialité

**Sous-objectifs :**
- Implémenter un système d'authentification sécurisé
- Définir des rôles et permissions granulaires
- Protéger les données personnelles (RGPD compliant)
- Assurer la sauvegarde régulière des données

**Indicateurs de réussite :**
- Authentification multi-facteurs disponible
- Audit de sécurité sans faille critique
- Sauvegardes automatiques quotidiennes testées

#### OS8 : Expérience utilisateur (UX)

**Sous-objectifs :**
- Concevoir une interface intuitive ne nécessitant pas de formation
- Assurer la compatibilité mobile (responsive design)
- Implémenter des visualisations graphiques des plannings
- Proposer des fonctionnalités de recherche et filtrage avancées

**Indicateurs de réussite :**
- Taux d'adoption ≥ 80% dans les 2 mois suivant le déploiement
- Score de satisfaction utilisateur ≥ 4/5
- Taux d'abandon des formulaires < 10%

#### OS9 : Maintenabilité et évolutivité

**Sous-objectifs :**
- Adopter une architecture modulaire et découplée
- Documenter le code et l'architecture
- Mettre en place des tests automatisés (unitaires, intégration)
- Utiliser des technologies standards et pérennes

**Indicateurs de réussite :**
- Couverture de tests ≥ 70%
- Documentation technique complète
- Temps d'ajout d'une nouvelle fonctionnalité < 5 jours

### 3. Objectifs organisationnels

#### OS10 : Formation et accompagnement

**Sous-objectifs :**
- Élaborer des supports de formation (guides, tutoriels vidéo)
- Former les coordinateurs pédagogiques à l'utilisation du système
- Mettre en place un support utilisateur (hotline, FAQ)
- Organiser des sessions de démonstration

**Indicateurs de réussite :**
- 100% des coordinateurs formés avant le déploiement
- Support utilisateur opérationnel dès J1
- Taux de satisfaction formation ≥ 85%

#### OS11 : Adoption et conduite du changement

**Sous-objectifs :**
- Communiquer sur les bénéfices du nouveau système
- Organiser un déploiement progressif (pilote puis généralisation)
- Collecter et traiter les retours utilisateurs
- Ajuster le système selon les besoins remontés

**Indicateurs de réussite :**
- Phase pilote réussie sur un programme
- Taux d'adoption global ≥ 90% après 3 mois
- Moins de 5% de demandes de retour au système précédent

---

## MOTIVATIONS

### 1. Motivations institutionnelles

#### Amélioration de l'efficacité opérationnelle

L'établissement BEM consacre actuellement des ressources humaines considérables à la planification académique. Le développement de BEM Planning répond à un besoin d'optimisation des processus administratifs :

- **Réduction des coûts** : libération de temps des coordinateurs pour des tâches à plus forte valeur ajoutée
- **Gain de productivité** : passage de 2-3 semaines à quelques jours pour la planification d'un semestre
- **Réaffectation des ressources** : équipe administrative disponible pour d'autres missions

#### Amélioration de la qualité de service

La satisfaction des étudiants et enseignants constitue une priorité stratégique pour l'établissement. Le nouveau système vise à :

- **Réduire les annulations et changements de dernière minute**
- **Communiquer plus rapidement et efficacement** les emplois du temps
- **Offrir une meilleure accessibilité** de l'information (consultation en ligne, mobile)
- **Respecter davantage les contraintes** de chacun (disponibilités enseignants, équilibre charge étudiante)

#### Préparation de la croissance

BEM connaît une croissance soutenue de ses effectifs et de son offre de formation. Le système actuel atteint ses limites :

- **Scalabilité** : capacité à gérer 2000 étudiants et plus dans les 3 prochaines années
- **Nouveaux programmes** : facilité d'intégration de nouvelles formations
- **Multi-sites** : possibilité de gérer plusieurs campus
- **Internationalisation** : support de plannings complexes avec mobilités étudiantes

#### Conformité réglementaire

Le secteur de l'enseignement supérieur est soumis à des exigences réglementaires strictes :

- **Traçabilité** : obligation de pouvoir justifier les heures d'enseignement effectuées
- **Respect du code du travail** : garantie du respect des charges maximales des enseignants
- **Qualité pédagogique** : respect des maquettes officielles validées par le ministère
- **Audit** : capacité à produire rapidement des rapports pour les instances de contrôle

### 2. Motivations pédagogiques

#### Optimisation de l'apprentissage

La recherche en sciences de l'éducation a démontré l'importance de l'organisation temporelle des enseignements sur l'efficacité de l'apprentissage :

- **Répartition équilibrée** : éviter les journées trop chargées ou les semaines déséquilibrées
- **Alternance appropriée** : respecter l'alternance CM/TD/TP pour favoriser l'assimilation
- **Respect des rythmes circadiens** : privilégier les matières exigeantes le matin
- **Espacement des examens** : permettre une préparation adéquate

#### Cohérence pédagogique

Le système permet d'assurer une meilleure cohérence dans l'organisation des enseignements :

- **Progression logique** : s'assurer que les prérequis sont enseignés avant les modules avancés
- **Coordination inter-modules** : éviter les chevauchements de contenus
- **Suivi individualisé** : faciliter l'accompagnement personnalisé des étudiants en difficulté

#### Valorisation des enseignants

Un planning bien conçu améliore les conditions de travail des enseignants :

- **Respect des disponibilités** : prise en compte systématique des contraintes personnelles
- **Réduction des déplacements** : optimisation des créneaux pour limiter les va-et-vient
- **Prévisibilité** : communication anticipée permettant une meilleure organisation personnelle
- **Équité** : répartition objective de la charge d'enseignement

### 3. Motivations technologiques

#### Modernisation du système d'information

BEM s'inscrit dans une démarche de transformation numérique de ses processus :

- **Cohérence de l'écosystème** : intégration avec les autres outils (ERP, LMS)
- **Données centralisées** : constitution d'un référentiel unique et fiable
- **Interopérabilité** : capacité à échanger des données avec des systèmes tiers
- **Innovation** : positionnement comme établissement technologiquement avancé

#### Capitalisation des données

Le système génère des données précieuses pour le pilotage de l'établissement :

- **Statistiques d'utilisation** : taux d'occupation des salles, charge réelle des enseignants
- **Indicateurs de performance** : respect des plannings, taux d'annulation
- **Aide à la décision** : données pour optimiser les investissements (nouvelles salles, recrutements)
- **Recherche institutionnelle** : analyse de l'impact de l'organisation temporelle sur la réussite étudiante

#### Développement de compétences internes

Le développement d'un projet d'envergure renforce les compétences de l'équipe IT :

- **Maîtrise de technologies modernes** : Next.js, React, PostgreSQL, Prisma
- **Méthodologies agiles** : expérience en gestion de projet IT
- **Architecture logicielle** : conception de systèmes complexes et scalables
- **DevOps** : mise en place de pipelines CI/CD, monitoring, déploiement

### 4. Motivations personnelles et académiques

#### Application des connaissances théoriques

Ce projet constitue une opportunité d'appliquer concrètement les concepts étudiés durant le cursus académique :

- **Génie logiciel** : analyse des besoins, conception UML, patterns de conception
- **Bases de données** : modélisation relationnelle, optimisation de requêtes, transactions
- **Développement web** : architectures modernes, frameworks full-stack, API REST
- **Algorithmique** : résolution de problèmes de planification sous contraintes
- **Gestion de projet** : planification, suivi, gestion des risques

#### Développement de compétences professionnelles

Le projet permet d'acquérir des compétences très demandées sur le marché du travail :

- **Technologies recherchées** : stack moderne (Next.js, React, TypeScript, PostgreSQL)
- **Méthodologies professionnelles** : Git, tests automatisés, documentation
- **Soft skills** : communication avec les utilisateurs, travail en équipe, gestion du temps
- **Vision produit** : compréhension des besoins métier, conception UX

#### Contribution à la communauté

Le développement d'un système open source ou partageable bénéficie à :

- **Autres établissements** : solution réutilisable par d'autres universités
- **Communauté du développement** : retour d'expérience, partage de bonnes pratiques
- **Écosystème éducatif sénégalais** : contribution à la modernisation du secteur

#### Résolution d'un problème réel

La motivation principale réside dans l'impact concret du projet :

- **Problème authentique** : besoin avéré et urgent de l'établissement
- **Utilisateurs réels** : plus de 1000 bénéficiaires directs du système
- **Valeur créée** : amélioration mesurable de l'efficacité et de la satisfaction
- **Fierté professionnelle** : contribution significative au fonctionnement de l'institution

### 5. Motivations économiques

#### Économies directes

Le système génère des économies quantifiables :

- **Réduction du temps de planification** : 150+ heures économisées par semestre
- **Diminution des annulations** : moins d'heures perdues et de cours à rattraper
- **Optimisation des ressources** : meilleur taux d'occupation des salles (gain de 15-20%)
- **Réduction des litiges** : moins de contentieux avec les enseignants

#### Retour sur investissement

L'investissement dans le développement du système est rapidement rentabilisé :

- **Coût de développement** : équivalent à 3-4 mois de salaire d'un développeur
- **Économie annuelle estimée** : équivalent à 6-8 mois de salaire d'un coordinateur
- **ROI attendu** : retour sur investissement en moins de 12 mois

#### Évitement de coûts futurs

Le système évite des dépenses qui auraient été nécessaires sans lui :

- **Recrutement évité** : pas besoin d'un coordinateur supplémentaire malgré la croissance
- **Licence logicielle** : économie de 5000-10000€ par an de licence d'un outil commercial
- **Maintenance** : coûts de maintenance inférieurs grâce à l'internalisation

---

## CONCLUSION

Le projet BEM Planning s'inscrit dans une vision stratégique de modernisation et d'optimisation des processus académiques de l'établissement. En répondant à une problématique concrète et urgente, il vise à transformer radicalement la manière dont la planification des enseignements est conçue et gérée.

Les objectifs fixés, qu'ils soient fonctionnels, techniques ou organisationnels, convergent vers une ambition commune : améliorer significativement l'efficacité opérationnelle tout en garantissant une meilleure qualité de service pour l'ensemble de la communauté académique.

Les motivations multiples qui sous-tendent ce projet - institutionnelles, pédagogiques, technologiques, personnelles et économiques - témoignent de sa pertinence et de son caractère structurant pour l'avenir de BEM.

La suite de ce document présentera la méthodologie adoptée, l'architecture technique retenue, les fonctionnalités développées, ainsi que les résultats obtenus et les perspectives d'évolution du système.

---

**Document rédigé le 25 novembre 2025**
**Version 1.0**
