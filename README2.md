
# ⚙️ DB setup 
- Go to workers & pages then to D1 SQL databases.
- Create a new database. the name doesn't really matter. Instead could be useful to set a location near to "you".
- Select the database and create a new table called "books" with the following columns and types:
    - name: text.
    - time: text.
    - portions: text.
    - ingredients: text.
    - receipe: text.
    - type: text.
    - category: text.
    - nutritionFacts: text.
    - alreadyTaken: text.

Then create another table called "users" with the following columns and types:
    - id: text.
    - name: text.
    - username: text.


- With the worker selected, go to bindings. Click add, click D1 database, choose the variable name "db" and select your database by the name you set previously. Then deploy it.

# ℹ️ DB info 
It uses the Cloudflare D1 service. The database has a free plan but it have some [limitations](https://developers.cloudflare.com/d1/platform/limits/) as the free worker. Limits are very high, so no worries.

# 🫶🏼 Support 
Donate to support my projects. 
- Crypto & others: Use the command `/support` in the [bot](https://t.me/Mqtth3w_support_bot).
- [Sponsor](https://github.com/sponsors/Mqtth3w).
- [Buy me a pizza](https://buymeacoffee.com/mqtth3w).
- [liberapay](https://liberapay.com/mqtth3w).

# ⭐ Give a Star!
Support this project by giving it a star. Thanks!
