import { geminiService } from './geminiService';

async function testAI() {
  console.log("--- Testing AI Oracle (Hairstyle Generation) ---");
  try {
    // Test with missing key simulation or real key if available
    const result = await geminiService.generateHairstyle("base64data", "Classic Pompadour");
    if (result) {
      console.log("✅ Hairstyle transformation successful (or mock fallback triggered)");
    } else {
      console.log("❌ Hairstyle transformation failed");
    }
  } catch (err) {
    console.error("❌ Hairstyle transformation error:", err);
  }

  console.log("\n--- Testing Inventory Insights ---");
  try {
    const mockInventory = {
      data: [
        { name: "Low Stock Oil", current_stock: 2, min_stock_level: 5, sell_price: 1500 },
        { name: "High Stock Shampoo", current_stock: 50, min_stock_level: 10, sell_price: 1200 }
      ]
    };
    const insights = await geminiService.getInventoryInsights(mockInventory.data);
    if (insights && insights.reorderAlerts) {
      console.log("✅ Inventory insights generated successfully");
      console.log("Strategy:", insights.stockStrategy);
      console.table(insights.reorderAlerts);
    } else {
      console.log("❌ Inventory insights generation failed");
    }
  } catch (err) {
    console.error("❌ Inventory insights error:", err);
  }
}

testAI();
