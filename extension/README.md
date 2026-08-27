# overcum site blocker

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked** and select this `extension` folder.
4. Open the extension's **Details** page and enable **Allow access to file URLs** while testing the local `file:///.../Public` app.
5. Open the extension popup and enter the same domains saved in overcum Settings, for example `youtube.com, reddit.com`.
6. After changing extension files, press **Reload** on the extension card.

The extension watches completed tab navigations, including direct visits and subdomains, then closes matching tabs. It also resets an open overcum dashboard by adding a one-time reset signal to its URL. A normal website cannot do this by itself because browser pages cannot monitor or close unrelated tabs.
