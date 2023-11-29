# Setup

{% hint style="info" %}
**Requirements**

* A browser that supports chrome extensions (Manifest V3), Chrome/OperaGX
* OBS or any stream software that supports browser sources
{% endhint %}

## Setting up the extension

Before starting you must create an **Instance,** instances are a way to identify you and separate clients, they store your configuration and the current state of the extension

To create an instance simply hit the **Create Instance** button in the extension options menu

{% hint style="warning" %}
Do not share your instance token as it allows to send information to your instance that might end up on your stream
{% endhint %}

#### Accessing the extension settings

Right click the extension logo and press **Options**

![](<../.gitbook/assets/image (2) (1).png>)

Once you hit the **Create Instance** button you should see the **Token** and the **Overlay Link** fields filled. The **Token** field shows your instance's token while the **Overlay Link** field shows an url to your overlay webpage.

{% hint style="info" %}
You can get a new instance at any time by clicking again the **Create Instance** button
{% endhint %}

## Setting up OBS

First create a new Browser Source

![](<../.gitbook/assets/image (4) (1).png>)

Now configure the **Browser Source** with this configuration

* URL: Your **Overlay Link**
* Width: 800
* Heigh: 400
* Shutdown source when not visible: **Yes**

{% hint style="info" %}
The Width and Height parameters represent the size of the window OBS is using, modify these values to get an overlay with the wanted dimensions
{% endhint %}

The source should appear totally transparent and will display text when using the extension
