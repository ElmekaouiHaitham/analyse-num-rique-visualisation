# Analyse Numérique : Méthode de Newton-Raphson

Une application web interactive et éducative permettant de visualiser la méthode de Newton-Raphson pour trouver numériquement les racines d'une équation. Développée avec Next.js et React, avec un moteur graphique performant sur-mesure utilisant l'API Canvas HTML5.

## Fonctionnalités

*   **Visualisation Graphique Interactive** : Un graphique complet développé avec HTML5 Canvas, supportant le zoom (molette de la souris) centré sur le curseur et le déplacement (cliquer-glisser) fluide, avec une grille adaptative.
*   **Algorithme Pas-à-Pas** : Suivez l'exécution de l'algorithme de Newton itération par itération en utilisant les boutons "Suivant" et "Précédent". L'application trace la courbe, le point actuel, et la droite tangente menant à la prochaine itération.
*   **Calculs Détaillés en Temps Réel** : Visualisez les formules exactes et les valeurs calculées à chaque étape ($x_n$, $f(x_n)$, $f'(x_n)$, $x_{n+1}$ et l'erreur relative).
*   **Dérivation Numérique Haute Précision** : L'application utilise une méthode de différenciation numérique ultra-précise ($h = 10^{-7}$) pour calculer les dérivées à la volée, éliminant ainsi le besoin pour l'utilisateur de saisir manuellement les dérivées.
*   **Design Éducatif** : Interface inspirée des supports de cours universitaires de mathématiques, intégrant la présentation claire du théorème de convergence.

## Technologies Utilisées

*   **Framework** : Next.js (App Router)
*   **Langage** : TypeScript
*   **Style** : Vanilla CSS (sans framework) avec un thème "Light/Dark Purple" personnalisé.
*   **Rendu Graphique** : HTML5 `<canvas>` (sans aucune bibliothèque externe de graphiques).

## Installation et Utilisation

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/ElmekaouiHaitham/analyse-num-rique-visualisation.git
    cd analyse-num-rique-visualisation
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

3.  **Lancer le serveur de développement :**
    ```bash
    npm run dev
    ```

4.  **Accéder à l'application :**
    Ouvrez `http://localhost:3000` (ou le port indiqué par la console) dans votre navigateur web.

## Utilisation de l'outil

*   **Fonction $f(x)$** : Entrez n'importe quelle expression mathématique valide en JavaScript (ex: `Math.sin(x) * x`, `Math.pow(x, 2) - 2`, `Math.exp(x) - 5`).
*   **Point de départ ($x_0$)** : Choisissez votre estimation initiale.
*   **Tolérance** : La condition d'arrêt basée sur l'erreur relative entre deux itérations consécutives.
*   **Contrôles du graphique** :
    *   **Scroll** : Zoomer/Dézoomer.
    *   **Drag & Drop** : Se déplacer librement.
    *   **Bouton "Recentrer la vue"** : Ramène le focus visuel sur l'itération en cours d'analyse.
