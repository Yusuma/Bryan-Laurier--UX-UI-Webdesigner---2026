# Bryan Laurier : Portfolio

Portfolio personnel de Bryan Laurier, UI/UX Web Designer, graphiste et beatmaker.

Design inspiré de [monomono.studio](https://monomono.studio) : mur de texte plein écran en bandes défilantes (marquee), panneau "Info" en overlay plein écran, esthétique monochrome noir & blanc.

## Fonctionnalités

- **Mur de texte animé** : bandes de texte défilant en boucle (alternance gauche/droite, noir/blanc) présentant le nom et les activités de Bryan
- **Panneau Info** : overlay plein écran regroupant bio, formations, expériences, travaux (cartes avec visuel) et contact
- **Fenêtre "Projet indisponible"** : modale qui s'affiche quand un projet du portfolio n'est plus accessible en ligne, avec redirection vers le profil Behance
- **Responsive** : mise en page mobile, tablette et bureau
- **Accessibilité** : navigation clavier avec focus géré dans les fenêtres, calques fermés inertes, bouton pause du défilement, `prefers-reduced-motion` respecté

## Stack technique

- HTML5 / CSS3 (variables CSS, `clamp()`, Grid, animations `@keyframes`)
- JavaScript vanilla (aucune dépendance)
- Polices : [Archivo](https://fonts.google.com/specimen/Archivo) (titres) et [Work Sans](https://fonts.google.com/specimen/Work+Sans) (texte courant), via Google Fonts

## Structure du projet

```
index.html
mentions-legales.html
404.html
sitemap.xml, robots.txt
@CSS/style.css
@JS/script.js          overlay, modales, marquee, pause
@JS/contact.js         email et téléphone assemblés côté navigateur
@RESSOURCES/travaux/   visuels des cartes de la section Travaux
cv.pdf                 à ajouter
portfolio.pdf          à ajouter
```

## Ajouter un visuel de projet

Déposer dans `@RESSOURCES/travaux/` une image WebP de 1200 x 900 px, moins de 150 Ko, nommée comme le projet : `lchs-sud-41.webp`, `toutaelle.webp`, `awaplaisir.webp`, `cwideo.webp`, `digit-back-office.webp`, `hoshikaze-2250.webp`, `la-galaxy-rp.webp`. Sans image, la carte affiche le nom du projet sur fond noir. Adapter ensuite le texte alternatif dans `index.html`.

## Utilisation Utilisation

Aucune installation nécessaire : c'est un site statique.

1. Cloner le dépôt
2. Ouvrir `index.html` dans un navigateur, ou déployer sur GitHub Pages

## Screenshot

<img width="1878" height="923" alt="Capture d'écran du portfolio (1)" src="https://github.com/user-attachments/assets/e210e664-10ec-46c8-959f-4b38f3e27107" />

<img width="1878" height="923" alt="Capture d'écran du portfolio (2)" src="https://github.com/user-attachments/assets/06037d53-0f57-4e29-b784-d5c366795c38" />

## Contact

- [Instagram](https://www.instagram.com/laurierbryan/) · [Behance](https://www.behance.net/bryanlaurierdesign) · [YouTube](https://www.youtube.com/channel/UCAXXTwDyHZvUeDOBMpdrp1Q)
