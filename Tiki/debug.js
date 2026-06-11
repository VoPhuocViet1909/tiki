const puppeteer = require("puppeteer");
const readline = require("readline");

async function debugSelectors() {
  console.log("🔍 DEBUG MODE - Tìm selector cho Tiki\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  await page.goto("https://tiki.vn/customer/reward?searchredirect=1", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  console.log("✓ Đã mở trang Tiki");
  console.log("👉 Vui lòng đăng nhập và chọn provider (UrBox/Tiki)\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve) => {
    rl.question("Nhấn Enter sau khi đã đăng nhập và sẵn sàng...", () => {
      rl.close();
      resolve();
    });
  });

  console.log("\n🔍 Đang tìm tất cả input fields...\n");

  // Tìm tất cả input fields và thông tin của chúng
  const inputs = await page.evaluate(() => {
    const allInputs = document.querySelectorAll("input");
    return Array.from(allInputs).map((input, index) => ({
      index: index,
      type: input.type,
      placeholder: input.placeholder,
      name: input.name,
      id: input.id,
      className: input.className,
      value: input.value,
    }));
  });

  console.log("📋 Danh sách tất cả INPUT fields:\n");
  inputs.forEach((input) => {
    console.log(`[${input.index}]`);
    console.log(`  Type: ${input.type}`);
    console.log(`  Placeholder: "${input.placeholder}"`);
    console.log(`  Name: ${input.name}`);
    console.log(`  ID: ${input.id}`);
    console.log(`  Class: ${input.className}`);
    console.log("  ---");
  });

  console.log("\n🔍 Đang tìm tất cả buttons...\n");

  const buttons = await page.evaluate(() => {
    const allButtons = document.querySelectorAll("button");
    return Array.from(allButtons).map((btn, index) => ({
      index: index,
      type: btn.type,
      text: btn.textContent.trim(),
      className: btn.className,
      id: btn.id,
    }));
  });

  console.log("📋 Danh sách tất cả BUTTON:\n");
  buttons.forEach((btn) => {
    console.log(`[${btn.index}]`);
    console.log(`  Text: "${btn.text}"`);
    console.log(`  Type: ${btn.type}`);
    console.log(`  ID: ${btn.id}`);
    console.log(`  Class: ${btn.className}`);
    console.log("  ---");
  });

  console.log(
    "\n✅ Debug hoàn tất! Copy thông tin trên và cập nhật config.json\n",
  );
  console.log('👉 Tìm input có placeholder chứa "mã" hoặc "code"');
  console.log('👉 Tìm button có text "Đổi" hoặc "Submit"\n');

  await new Promise((resolve) => setTimeout(resolve, 30000)); // Giữ browser 30s
  await browser.close();
}

debugSelectors().catch(console.error);
