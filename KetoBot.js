/**
 * @fileoverview A worker to send to hadle a Telegram bot to send breakfast, lunch and dinner receips to all its users.
 * 
 * @author Mqtth3w https://github.com/Mqtth3w
 * @license GPL-3.0
 * 
 */


export default {
  async scheduled(controller, env, ctx) {
      //console.log("cron processed");

      const { users } = await env.db.prepare(
        "SELECT id FROM users"
        ).all();

      if (users.lenght > 0) {
        let breafast = await getDishByMeal(env, "breakfast");
        let lunch = await getDishByMeal(env, "lunch");
        let dinner = await getDishByMeal(env, "dinner");

        let msg = `Breakfast:\n${breafast[0].name}\n${breafast[0].time}\n${breafast[0].portions}
          \n${breafast[0].nutritionFacts}\n${breafast[0].ingredients}\n${breafast[0].receipe}`;/* + 
          
          `\n\nLunch(first):\n${lunch[0].name}\n${lunch[0].time}\n${lunch[0].portions}
          \n${lunch[0].nutritionFacts}\n${lunch[0].ingredients}\n${lunch[0].receipe}` +
          `\nLunch(second):\n${lunch[1].name}\n${lunch[1].time}\n${lunch[1].portions}
          \n${lunch[1].nutritionFacts}\n${lunch[1].ingredients}\n${lunch[1].receipe}` +
          `\nLunch(side):\n${lunch[2].name}\n${lunch[2].time}\n${lunch[2].portions}
          \n${lunch[2].nutritionFacts}\n${lunch[2].ingredients}\n${lunch[2].receipe}` +

          `\n\nDinner(first):\n${dinner[0].name}\n${dinner[0].time}\n${dinner[0].portions}
          \n${dinner[0].nutritionFacts}\n${dinner[0].ingredients}\n${dinner[0].receipe}` +
          `\nDinner(second):\n${dinner[1].name}\n${dinner[1].time}\n${dinner[1].portions}
          \n${dinner[1].nutritionFacts}\n${dinner[1].ingredients}\n${dinner[1].receipe}` +
          `\Dinner(side):\n${dinner[2].name}\n${dinner[2].time}\n${dinner[2].portions}
          \n${dinner[2].nutritionFacts}\n${dinner[2].ingredients}\n${dinner[2].receipe}`;*/

        let meals = [{"\n\nLunch(first):\n": lunch}, {"\nLunch(second):\n": lunch}, {"\nLunch(side):\n": lunch}, 
        {"\n\nDinner(first):\n": dinner}, {"\nDinner(second):\n": dinner}, {"\nDinner(side):\n": dinner}]
        
        let i = 0;
        for (const [key, value] of Object.entries(meals)) {
          if (i === 3) i = 0;
          msg += `${key}${value[i].name}\n${value[i].time}\n${value[i].portions}
          \n${value[i].nutritionFacts}\n${value[i].ingredients}\n${value[i].receipe}`;
          i++;
        }

        await sendBroadcastMessage(env, msg, users);
      }


  },

  async fetch(request, env, ctx) {
    const secret_token = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
		if (secret_token !== env.SECRET_TOKEN) {
			return new Response("Authentication Failed.", { status: 403 });
		}
		if (request.method === "POST") {
			const payload = await request.json();
			if ('message' in payload) {
				const chatId = payload.message.chat.id.toString();
        const name = payload.message.chat.name || "";
        const username = payload.message.chat.username || ""
				const text = payload.message.text || "";
				const command = text.split(" ")[0];
				//const args = text.substring(command.length).trim();
				
        if (command === "/start") {
          await sendMessage(env, chatId, "msg");
          const { result } = await env.db.prepare(
            "SELECT * FROM users WHERE id = ?"
            ).bind(chatId).all();
            await sendMessage(env, chatId, "msg2");
          if (result.length > 0) {
            await sendMessage(env, chatId, "msg3");
            let msg = `Welcome back ${name}!`;
            await sendMessage(env, chatId, msg);
          } else {
            await sendMessage(env, chatId, "msg4");
            await env.db.prepare(
              "INSERT INTO users (?, ?, ?)"
              ).bind(chatId, name, username).all();
            
            let msg = `Hi ${name}, welcome to the KetoBot!`;
            await sendMessage(env, chatId, msg);
          }
        } else {
          await sendMessage(env, chatId, "Work in progress...");
        }
      }
    }
    return new Response("OK", { status: 200 });
  },
};


async function getDish(env, field, fieldVal) {
  let { result } = await env.db.prepare(
    `SELECT * FROM dishes WHERE alreadyTaken LIKE 'false' AND ${field} LIKE ? LIMIT 1`
    ).bind(fieldVal).all();
  if (result.lenght > 0) {
    await env.db.prepare(
      "UPDATE dishes SET alreadyTaken = 'true' WHERE rowid = ?"
      ).bind(result[0].rowid).all();
  } else {
    await env.db.prepare(
      `UPDATE dishes SET alreadyTaken = 'false' WHERE ${field} = ?`
      ).bind(fieldVal).all();
    result = await env.db.prepare(
      `SELECT * FROM dishes WHERE alreadyTaken LIKE 'false' AND ${field} LIKE ? LIMIT 1`
      ).bind(fieldVal).all();
    await env.db.prepare(
      "UPDATE dishes SET alreadyTaken = 'true' WHERE rowid = ?"
      ).bind(result[0].rowid).all();
  }
  return result;
}


async function getDishByMeal(env, meal) {
  let result;
  if (meal === "breakfast") {
    result = await getDish(env, "meal", meal);
  } else if (meal === "lunch" || meal === "dinner") {
    result = await getDish(env, "type", "first");
    result.append(await getDish(env, "type", "second"));
    result.append(await getDish(env, "type", "side"));
  }
  return result;
};

/**
 * Sends a text message to a specified user via a Telegram bot.
 *
 * @param {object} env - The environment object containing runtime information, such as bindings.
 * @param {number|string} chatId - The chat ID of the user who requested the service.
 * @param {string} text - The message to send.
 * @returns {Promise<void>} - This function does not return a value.
 */
async function sendMessage(env, chatId, text) {
  const url = `https://api.telegram.org/bot${env.API_KEY}/sendMessage`;
  await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
  });
};

/**
 * Sends a broadcast message to a list of users, handling errors and avoiding rate limits.
 * If an error occurs while sending a message to a user, it sends an error notification to the specified destination.
 *
 * @param {object} env - The environment object containing runtime information, such as bindings.
 * @param {string} msg - The message to be sent to each user.
 * @param {Array<number|string>} users - An array of user IDs to whom the message will be sent.
 * @returns {Promise<void>} - This function does not return a value.
 */
async function sendBroadcastMessage(env, msg, users) {
  for (const userId of users) {
    await sendMessage(env, userId, msg);
    await new Promise(resolve => setTimeout(resolve, 33)); // Avoid hitting rate limits (30 messages/second      
  }
};