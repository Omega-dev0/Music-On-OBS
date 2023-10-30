---
description: >-
  This page describes the process to setup the Spotify API source wich enables
  you to connect the Spotify Desktop App or the Mobile app to the extension
---

# Spotify API



## Creating your application on Spotify developers and getting your client ID and secret

{% hint style="info" %}
The application is the user used by the extension to communicate with Spotify
{% endhint %}

#### Creating your application

First, head to [https://developer.spotify.com/](https://developer.spotify.com/) and log in with your Spotify account, then access the [dashboard  ](https://developer.spotify.com/dashboard)and **create an app**

Name it and **set the Redirect URI to the one displayed in the extension,** you must also check the Web API option.





<figure><img src="../.gitbook/assets/Group 3.png" alt=""><figcaption><p>What the window should look like</p></figcaption></figure>

#### Getting the client ID and secret

After creating an app, open its settings and copy/paste the ID and secret, **make sure to save afterward.**&#x20;



<figure><img src="../.gitbook/assets/Group 2 (2).png" alt=""><figcaption></figcaption></figure>



## Linking your account to the extension

Once you have filled in the app's secret and ID, the **Log-in button** should be available, press it to start the linking process.

<figure><img src="../.gitbook/assets/image (5).png" alt=""><figcaption><p>The spotify linking window</p></figcaption></figure>

<figure><img src="../.gitbook/assets/image (6).png" alt=""><figcaption><p>You should see this text after completing the process</p></figcaption></figure>

After landing on the page above, you can close it and should see appear in the popup the Spotify API option



<figure><img src="../.gitbook/assets/image (7).png" alt=""><figcaption></figcaption></figure>

Select it and press start to listen to your Spotify desktop app/mobile app

{% hint style="info" %}
The client ID and secret are stored locally meaning no one else can access your Spotify account's data.
{% endhint %}

