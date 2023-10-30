# Installation

{% hint style="info" %}
**Prérequis**

* Un navigateur qui supporte les extensions chrome (Opera GX/Chrome)
* OBS ou n'importe quel logiciel de stream qui supporte les sources navigateur
{% endhint %}

## Installer l'extension

Avant de commencer, vous devez créer une instance, les instances sont un moyen de vous identifier et de séparer les clients, elles stockent votre configuration et l'état actuel de l'extension&#x20;

Pour créer une instance, appuyez simplement sur le bouton **Créer une instance** dans le menu des options d'extension

{% hint style="warning" %}
Ne partagez pas votre jeton d'instance car il permet d'envoyer des informations à votre instance qui pourraient se retrouver sur votre flux.
{% endhint %}

#### Accéder aux paramètres de l'extension

Faites un clic droit sur le logo de l'extension et appuyez sur **Options**

![](<../.gitbook/assets/image (4).png>)

Une fois que vous avez cliqué sur le bouton **Créer une instance**, vous devriez voir les champs **Token** et **Overlay Link** remplis. Le champ **Token** affiche le jeton de votre instance tandis que le champ **Overlay Link** affiche une URL vers la page de l'overlay.

{% hint style="info" %}
Vous pouvez obtenir une nouvelle instance à tout moment en cliquant à nouveau sur le bouton **Créer une instance**
{% endhint %}

## Installer l'overlay sur OBS

Créez d'abord une nouvelle **Source navigateur**

![](<../.gitbook/assets/image (3).png>)

Configurez maintenant la **Source  navigateur** avec cette configuration

* URL: Votre **lien d'overlay**
* Largeur: 800
* Hauteur: 400
* Arrêter la source quand non visible: **Oui**

{% hint style="info" %}
Les paramètres **Largeur** et **Hauteur** représentent la taille de la fenêtre utilisée par OBS, modifiez ces valeurs pour obtenir un overlay aux dimensions souhaitées
{% endhint %}

La source devrait apparaître totalement transparente et affichera du texte lors de l'utilisation de l'extension.
