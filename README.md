# Keto recipes Telegram bot [![Awesome](https://cdn.jsdelivr.net/gh/sindresorhus/awesome@d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg)](https://github.com/Mqtth3w/keto-receips-Telegram-bot)

A Telegram bot to receive ketogenic recipes for breakfast, lunch and dinner every day. I called it "keto" because I based my implementation on a database of 120 ketogenic dishes. But it can be used with any type of dishes by adding/changing them in your database.

This bot is dedicated to Silvia.

## How to deploy the bot completely free ([Cloudflare](https://www.cloudflare.com/) based)
It can handle 100k requests for free per day (Cloudflare limits).

<details closed>
<summary><b>Click here to expand the deployment. </b></summary>
  
 The deployment only takes less than 10 minutes.
  
- Create a new bot on telegram with [@BotFather](https://telegram.me/BotFather). Save the api token for future use.
- Create a Cloudflare account.
- Go to workers & pages then create a new worker so deploy it.
- Click edit so replace the code with the content of [KetoBot.js](./KetoBot.js). Deploy it.
- Click configure worker, go to setting, go to variables.
- Add the variable API_KEY (secret type). Which is the bot api token.
- Add the variable SECRET_TOKEN (secret type). Generate its value through the script [gen_token.py](https://github.com/Mqtth3w/library-Telegram-bot/blob/main/gen_token.py). You can also type it with your hands (1-256 characters. Only characters `A-Z`, `a-z`, `0-9`, `_` and `-` are allowed). Save it for future use..
- Encrypt (set the secrect type!) all variables and save.
- Go to "Trigger Events" in the worker settings then add a new event "Cron Triggers" with this cron expression `0 5 * * 1-7`. It means every day at 5 am, feel free to chnage the 5. Then add it.

- ### DB setup
  Follow the instructions in the DB setup [file](./README2.md).

- ### Webhook
  Open the following link after substitution to configure webhook.
  ```
  https://api.telegram.org/bot<replace with your bot api token>/setWebhook?url=<replace with your worker url>&secret_token=<replace with your secret token>
  ```
  You should see something like {"ok":true,"result":true,"description":"Webhook was set"} then the bot works.
  <br><br>
  If you filled wrong info or need to update info you can delete webhook and then you can set it again. Open the following link after substitution to delete webhook.
  ```
  https://api.telegram.org/bot<replace with your bot api token>/deleteWebhook
  ```

</details>

### 🤌 [Try it!](https://t.me/Mqthh3w_keto_bot) 


# 📜 User guide 

- Send any text to search a dish by name.
- Every day the bot will send you meals for all the day.
- `/searchtime <time>` searchs dishes by their cooking/preparing time, e.g., `/searchtime 10 min`.
- `/searchingr <ingredients>` searchs dishes by their ingredients.
- `/searchnfacts <nutrition facts>` searchs dishes by their nutrition facts.


# 🛠️ To do 
- More commands
- More recipes
- More languages

# 💭 Discussion 
For any comment or to request a new feature you can either use the [Discussions](https://github.com/Mqtth3w/keto-receips-telegram-bot/discussions) section or contact me through this [bot](https://t.me/Mqtth3w_support_bot).

# 🫶 Support 
Donate to support my projects. 
- Crypto & others: Use the command `/support` in the [bot](https://t.me/Mqtth3w_support_bot).
- [Sponsor](https://github.com/sponsors/Mqtth3w).
- [Buy me a pizza](https://buymeacoffee.com/mqtth3w).
- [liberapay](https://liberapay.com/mqtth3w).

# ⭐ Give a Star!
Support this project by giving it a star. Thanks!
