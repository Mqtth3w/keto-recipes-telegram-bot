/**
 * @fileoverview A worker to send to hadle a Telegram bot to send breakfast, lunch and dinner receips to all its users.
 * 
 * @author Mqtth3w https://github.com/Mqtth3w
 * @license GPL-3.0
 * 
 */


export default {
	async scheduled(controller, env, ctx) {
		try {
			const { results } = await env.db.prepare("SELECT id FROM users").all();
			if (results.length > 0) {
				let breafast = await getDishByMeal(env, "breakfast");
				let lunch = await getDishByMeal(env, "lunch");
				let dinner = await getDishByMeal(env, "dinner");

				let msg = `Breakfast:\n${breafast[0].name}\n${breafast[0].time}\n${breafast[0].portions}\n` +
					`${breafast[0].nutritionFacts}\n${breafast[0].ingredients}\n${breafast[0].recipe}`;/* + 
			  
					`\n\nLunch(first):\n${lunch[0].name}\n${lunch[0].time}\n${lunch[0].portions}` +
					\n${lunch[0].nutritionFacts}\n${lunch[0].ingredients}\n${lunch[0].recipe}` +
					`\nLunch(second):\n${lunch[1].name}\n${lunch[1].time}\n${lunch[1].portions}
					\n${lunch[1].nutritionFacts}\n${lunch[1].ingredients}\n${lunch[1].recipe}` +
					`\nLunch(side):\n${lunch[2].name}\n${lunch[2].time}\n${lunch[2].portions}
					\n${lunch[2].nutritionFacts}\n${lunch[2].ingredients}\n${lunch[2].recipe}` +

					`\n\nDinner(first):\n${dinner[0].name}\n${dinner[0].time}\n${dinner[0].portions}
					\n${dinner[0].nutritionFacts}\n${dinner[0].ingredients}\n${dinner[0].recipe}` +
					`\nDinner(second):\n${dinner[1].name}\n${dinner[1].time}\n${dinner[1].portions}
					\n${dinner[1].nutritionFacts}\n${dinner[1].ingredients}\n${dinner[1].recipe}` +
					`\Dinner(side):\n${dinner[2].name}\n${dinner[2].time}\n${dinner[2].portions}
					\n${dinner[2].nutritionFacts}\n${dinner[2].ingredients}\n${dinner[2].recipe}`;*/

				let meals = [{"\n\nLunch(first):\n": lunch}, {"\nLunch(second):\n": lunch}, {"\nLunch(side):\n": lunch}, 
					{"\n\nDinner(first):\n": dinner}, {"\nDinner(second):\n": dinner}, {"\nDinner(side):\n": dinner}]
			
				let i = 0;
				for (const [key, value] of Object.entries(meals)) {
					if (i === 3) i = 0;
					msg += `${key}${value[i].name}\n${value[i].time}\n${value[i].portions}\n` + 
						`${value[i].nutritionFacts}\n${value[i].ingredients}\n${value[i].recipe}`;
					i++;
				}
			await sendBroadcastMessage(env, msg, results);
			}
		} catch (err) { await sendMessage(env, 5804269249, `error scheduled: ${err}`);}
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
				const name = payload.message.chat.first_name || "";
				const username = payload.message.chat.username || ""
				const text = payload.message.text || "";
				const command = text.split(" ")[0];
				const args = text.substring(command.length).trim();
				if (command === "/start") {
					const { results } = await env.db.prepare("SELECT * FROM users WHERE id = ?")
						.bind(chatId).all();
					if (results.length > 0) {
						await sendMessage(env, chatId, `Welcome back ${name}!`);
					} else {
						await env.db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)")
							.bind(chatId, name, username, "false").run();
						await sendMessage(env, chatId, `Hi ${name}, welcome to the KetoBot!`);
					}
				} else if (command === "/searchtime") await searchDishes(env, chatId, "/searchtime", args);
				else if (command === "/searchingr") await searchDishes(env, chatId, "/searchingr", args);
				else if (command === "/searchnfacts") await searchDishes(env, chatId, "/searchnfacts", args);
				else if (text) await searchDishes(env, chatId, "/searchname", text);
			}
		}	
    return new Response("OK", { status: 200 });
  },
};


async function getDish(env, field, fieldVal) {
	try {
		let { results } = await env.db.prepare(
			`SELECT rowid, * FROM dishes WHERE alreadyTaken LIKE 'false' AND ${field} LIKE ? LIMIT 1`)
			.bind(`%${fieldVal}%`).all();
			await sendMessage(env, 5804269249, `results 1 ${results[0].rowid}`);
		if (results.length > 0) {
			await env.db.prepare("UPDATE dishes SET alreadyTaken = 'true' WHERE rowid = ?")
				.bind(result[0].rowid).run();
		} else {
			await env.db.prepare(`UPDATE dishes SET alreadyTaken = 'false' WHERE ${field} LIKE ?`)
				.bind(`%${fieldVal}%`).run();
			results = await env.db.prepare(`SELECT rowid, * FROM dishes WHERE alreadyTaken = 'false' AND ${field} LIKE ? LIMIT 1`)
				.bind(`%${fieldVal}%`).all();
			await sendMessage(env, 5804269249, `results 2 ${results[0].toString()}`);
			await env.db.prepare("UPDATE dishes SET alreadyTaken = 'true' WHERE rowid = ?")
				.bind(results[0].rowid).run();
		}
		return results;
	} catch (err) { await sendMessage(env, 5804269249, `error getDish: ${err}`);}
}


async function getDishByMeal(env, meal) {
	try {
		let results = {};
		if (meal === "breakfast") {
			results = await getDish(env, "meal", meal);
		} else {
			results[0] = await getDish(env, "type", "first");
			results[1] = await getDish(env, "type", "second");
			results[2] = await getDish(env, "type", "side");
		}
		return results;
	} catch (err) { await sendMessage(env, 5804269249, `error getDishByMeal: ${err}`);}
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
		await new Promise(resolve => setTimeout(resolve, 31)); // Avoid hitting rate limits (30 messages/second)     
	}
};

/** 
 * Search for all receips that match a specified field.
 * 
 * @param {object} env - The environment object containing runtime information, such as bindings.
 * @param {number|string} chatId - The chat ID of the user who requested the service.
 * @param {string} command - The command that indicates the filed for search.
 * @param {string} data - The data to be searched.
 * @returns {Promise<void>} This function does not return a value.
 */
async function searchDishes(env, chatId, command, data) {
	const fieldMap = {
		"/searchname": "name",
		"/searchtime": "time",
		"/searchingr": "ingredients",
		"/searchnfacts": "nutritionFacts"
	};
    const { results } = await env.db.prepare(`SELECT * FROM dishes WHERE ${fieldMap[command]} LIKE ?`)
		.bind(`%${data}%`).all();
    if (results.length === 0) return await sendMessage(env, chatId, `No data`);
    let total = 0;
	let message = "";
	const batchSize = 5;
	for (let i = 0; i < results.length; i++) {
		const dish = results[i];
		total++;
		message += `Dish name: ${dish.name}\n` +
			`Cooking time: ${dish.time}\n` +
			`Nutrition facts: ${dish.nutritionFacts}\n` +
			`Ingredients: ${dish.ingredients}\n` +
			`Recipe: ${dish.recipe}\n` +
			`Type: ${dish.type}\n` +
			`Category: ${dish.category}\n` +
			`Already taken: ${dish.alreadyTaken}\n` +
			`Meal: ${dish.meal}\n\n`;
		if ((total % batchSize === 0) || (i === results.length - 1)) {
			if (i === results.length - 1) {
				message += `Total dishes matched: ${total}`;
			}
			await sendMessage(env, chatId, message);
			await new Promise(resolve => setTimeout(resolve, 31));
			message = ""; 
		}
	}
};
