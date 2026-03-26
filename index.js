require('dotenv').config();
const fs = require('fs').promises;
const axios = require('axios');

function generateApology(name, city, weather) {
    const messages = {
        Rain: `Hi ${name}, your order to ${city} is delayed due to heavy rain. We appreciate your patience!`,
        Snow: `Hi ${name}, the snow in ${city} is slowing us down. Your order is safe and will arrive soon!`,
        Smoke: `Hi ${name}, visibility in ${city} is low due to smoke/haze. We've delayed your delivery for safety.`,
        Extreme: `Hi ${name}, extreme weather in ${city} has caused a temporary delay. Stay safe!`,
        Clouds: `Hi ${name}, it's a bit cloudy in ${city}, but we're still moving!`
    };
    
    return messages[weather] || `Hi ${name}, we're processing your order to ${city}. Current weather: ${weather}`;
}

async function processOrders() {
    try {
        
        const data = await fs.readFile('orders.json', 'utf8');
        let orders = JSON.parse(data);
        const apiKey = process.env.OPENWEATHER_API_KEY;

        console.log(`Starting weather check for ${orders.length} orders...\n`);

        
        const weatherPromises = orders.map(async (order) => {
            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${order.city}&appid=${apiKey}&units=metric`;
                const response = await axios.get(url);
                const mainWeather = response.data.weather[0].main;

                
                const delayConditions = ["Rain", "Snow", "Extreme", "Smoke"]; 
                
                if (delayConditions.includes(mainWeather)) {
                    order.status = "Delayed"; // Update the status
                    order.ai_apology = generateApology(order.customer, order.city, mainWeather);
                } else {
                    order.ai_apology = `Everything looks good in ${order.city}!`;
                }

                return order;
            } catch (error) {
                
                console.error(`❌ Error for ${order.city}: ${error.response?.data?.message || "City Not Found"}`);
                order.status = "Error: City Not Found";
                return order;
            }
        });

        
        const updatedOrders = await Promise.all(weatherPromises);

        
        await fs.writeFile('updated_orders.json', JSON.stringify(updatedOrders, null, 2));
        
        console.log("\n✨ Mission Complete! Open 'updated_orders.json' to see the apologies.");

    } catch (err) {
        console.error("Critical System Error:", err);
    }
}


processOrders();