
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
			const { users } = await env.db.prepare("SELECT id FROM users").all();
			if (users.length > 0) {
				let meals = ["breakfast", "lunch", "dinner"];
				let types = ["first", "second", "side"];
				let msg = "";
				for (const meal of meals) {
					for (let i = 0; i < 3; i++) {

						let { results } = await env.db.prepare(
											`SELECT rowid, * FROM dishes WHERE alreadyTaken LIKE 'false' AND ${meal === "breakfast" ? "meal" : "type"} LIKE ? LIMIT 1`)
											.bind(`%${meal === "breakfast" ? "breakfast" : types[i]}%`).all();
						if (results.length > 0) {
							await env.db.prepare("UPDATE dishes SET alreadyTaken = 'true' WHERE rowid = ?")
								.bind(results[0].rowid).run();
						} else {
							await env.db.prepare(`UPDATE dishes SET alreadyTaken = 'false' WHERE ${meal === "breakfast" ? "meal" : "type"} LIKE ?`)
								.bind(`%${meal === "breakfast" ? "breakfast" : types[i]}%`).run();
							results = await env.db.prepare(`SELECT rowid, * FROM dishes WHERE alreadyTaken = 'false' AND ${meal === "breakfast" ? "meal" : "type"} LIKE ? LIMIT 1`)
										.bind(`%${meal === "breakfast" ? "breakfast" : types[i]}%`).all();
							await env.db.prepare("UPDATE dishes SET alreadyTaken = 'true' WHERE rowid = ?")
								.bind(results[0].rowid).run();
						}

						msg += `${meal}${meal === "breakfast" ? "" : "(" + types[i] + ")"}:\nDish name: ${results[0].name}\nCooking time: ${results[0].time}\nNutrition facts: ${results[0].nutritionFacts}\nIngredients: ${results[0].ingredients}\nRecipe: ${results[0].recipe}\nType: ${results[0].type}\nCategory: ${results[0].category}\nAlready taken: ${results[0].alreadyTaken}\nMeal: ${results[0].meal}\n\n`;

						if (meal === "breakfast") break;
					}
				}
				await sendBroadcastMessage(env, msg, users.map(user => user.id));
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
		message += `Dish name: ${dish.name}\nCooking time: ${dish.time}\nNutrition facts: ${dish.nutritionFacts}\nIngredients: ${dish.ingredients}\nRecipe: ${dish.recipe}\nType: ${dish.type}\nCategory: ${dish.category}\nAlready taken: ${dish.alreadyTaken}\nMeal: ${dish.meal}\n\n`;
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