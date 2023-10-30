---
description: >-
  Cette page décrit le processus pour configurer la source de l'API Spotify, qui vous permet de connecter l'application Spotify Desktop ou l'application mobile à l'extension
---

# API Spotify

## Création de votre application sur les développeurs Spotify et obtention de votre ID client et de votre clé secrète

{% hint style="info" %}
L'application est l'utilisateur utilisé par l'extension pour communiquer avec Spotify.
{% endhint %}

#### Création de votre application

Tout d'abord, rendez-vous sur [https://developer.spotify.com/](https://developer.spotify.com/) et connectez-vous avec votre compte Spotify, puis accédez au [tableau de bord](https://developer.spotify.com/dashboard) et **créez une application**.

Donnez-lui un nom et **définissez l'URI de redirection comme celle affichée dans l'extension**, assurez-vous également de cocher l'option API Web.

<figure><img src="../.gitbook/assets/Group 3.png" alt=""><figcaption><p>À quoi la fenêtre devrait ressembler</p></figcaption></figure>

#### Obtention de l'ID client et de la clé secrète

Après avoir créé une application, ouvrez ses paramètres et copiez/collez l'ID et la clé secrète, **assurez-vous de les enregistrer par la suite.**

<figure><img src="../.gitbook/assets/Group 2 (2).png" alt=""><figcaption></figcaption></figure>

## Lier votre compte à l'extension

Une fois que vous avez rempli le secret et l'ID de l'application, le bouton de **connexion** devrait être disponible, appuyez dessus pour démarrer le processus de liaison.

<figure><img src="../.gitbook/assets/image (5).png" alt=""><figcaption><p>La fenêtre de liaison Spotify</p></figcaption></figure>

<figure><img src="../.gitbook/assets/image (6).png" alt=""><figcaption><p>Vous devriez voir ce texte après avoir terminé le processus</p></figcaption></figure>

Après être arrivé sur la page ci-dessus, vous pouvez la fermer et vous devriez voir apparaître dans la fenêtre contextuelle l'option API Spotify.

<figure><img src="../.gitbook/assets/image (7).png" alt=""><figcaption></figcaption></figure>

Sélectionnez-la et appuyez sur Démarrer pour écouter votre application Spotify Desktop/Spotify Mobile.

{% hint style="info" %}
L'ID client et la clé secrète sont stockés localement, ce qui signifie que personne d'autre ne peut accéder aux données de votre compte Spotify.
{% endhint %}
