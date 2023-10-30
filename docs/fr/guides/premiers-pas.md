# Premiers pas

### Explication du popup

![](<../.gitbook/assets/Frame 3 (1).png>)

{% hint style="info" %}
Les onglets ne s'afficheront dans la liste des onglets sélectionnables que s'ils figurent dans la liste des plates-formes prises en charge (music.youtube.com, youtube.com, soundcloud.com, open.spotify.com, play.pretzel.rocks)
{% endhint %}

### Test guidé

1 - Allez sur cette [vidéo youtube](https://www.youtube.com/watch?v=QiZnHeQfIAc\&feature=youtu.be)

2 - Ouvrez la fenêtre contextuelle de l'extension et sélectionnez l'onglet

<figure><img src="../.gitbook/assets/Capture d&#x27;écran 2023-09-02 181917.png" alt=""><figcaption></figcaption></figure>

3 - Appuyez sur le bouton **Démarrer**

{% hint style="info" %}
Vous devriez voir le champ d'aperçu se mettre à jour avec les informations correctes, si le texte affiché est **false** ou **undefined**, essayez d'attendre que la page soit complètement chargée ou de recharger la page
{% endhint %}

4 - Copiez votre **lien d'Overlay** dans les paramètres de l'extension et collez-le dans un nouvel onglet de votre navigateur

{% hint style="info" %}
Si vous obtenez un texte indiquant **Instance not found**, créez une nouvelle instance dans les paramètres de l'extension et ouvrez de nouveau le **lien d'overlay**
{% endhint %}

5 - Assurez-vous que la vidéo n'est pas en pause et appuyez sur le bouton **Mettre à jour** dans la fenêtre contextuelle de l'extension, cela forcera une mise à jour faisant apparaître le texte sur votre écran

![Le résultat attendu](<../.gitbook/assets/Capture d'écran 2023-09-02 182220.png>)

{% hint style="info" %}
OBS simule un navigateur ouvert sur votre **lien d'overlay** afin d'afficher votre overlay sur le flux
{% endhint %}
