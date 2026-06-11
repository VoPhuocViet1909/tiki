const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
const csv = require("csv-parser");

// Đọc cấu hình
const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

/**
 * Đọc mã từ file codes.txt
 */
function readCodesFromTxt() {
  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync("codes.txt", "utf-8");
      const codes = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      resolve(codes);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Đọc mã từ file data.csv
 */
function readCodesFromCsv() {
  return new Promise((resolve, reject) => {
    const codes = [];
    fs.createReadStream("data.csv")
      .pipe(csv())
      .on("data", (row) => {
        if (row.code && row.code.trim()) {
          codes.push(row.code.trim());
        }
      })
      .on("end", () => {
        resolve(codes);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Đợi người dùng nhấn Enter trong terminal
 */
function waitForUserInput() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Nhấn Enter để bắt đầu nạp mã...", () => {
      rl.close();
      resolve();
    });
  });
}

/**
 * Chọn nhà cung cấp (provider)
 */
async function selectProvider(page, providerName) {
  try {
    console.log(`Đang chọn nhà cung cấp: ${providerName}...`);

    // Đợi các button provider xuất hiện
    await page.waitForSelector("button", { timeout: 5000 });

    // Tìm và click vào button provider phù hợp
    const buttons = await page.$$("button");

    for (const button of buttons) {
      const text = await page.evaluate((el) => el.textContent, button);
      if (text && text.includes(providerName)) {
        await button.click();
        console.log(`✓ Đã chọn nhà cung cấp: ${providerName}`);
        await page.waitForTimeout(1000);
        return true;
      }
    }

    console.log(
      `⚠ Không tìm thấy nhà cung cấp: ${providerName}, tiếp tục với provider mặc định`,
    );
    return false;
  } catch (error) {
    console.log(`⚠ Lỗi khi chọn provider: ${error.message}`);
    return false;
  }
}

/**
 * Xóa nội dung input
 */
async function clearInput(page, selector) {
  try {
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);
  } catch (error) {
    console.log(`⚠ Không thể xóa input: ${error.message}`);
  }
}

/**
 * Nạp một mã quà tặng
 */
async function redeemCode(page, code) {
  try {
    console.log(`\n📝 Đang xử lý mã: ${code}`);

    // Đợi input xuất hiện
    await page.waitForSelector(config.inputSelector, { timeout: 5000 });

    // Xóa input trước (phòng trường hợp còn text cũ)
    await clearInput(page, config.inputSelector);

    // Điền mã vào input
    await page.type(config.inputSelector, code, { delay: 50 });
    console.log(`  → Đã điền mã vào input`);

    // Đợi một chút để đảm bảo mã đã được nhập
    await page.waitForTimeout(500);

    // Tìm và click nút submit
    const submitButton = await page.$(config.submitButtonSelector);
    if (!submitButton) {
      throw new Error("Không tìm thấy nút submit");
    }

    await submitButton.click();
    console.log(`  → Đã click nút "Đổi Tiki Xu"`);

    // Đợi phản hồi từ server
    await page.waitForTimeout(2000);

    // Kiểm tra kết quả (có thể thêm logic kiểm tra thông báo thành công/lỗi)
    try {
      // Kiểm tra có popup thành công không
      const successPopup = await page.$(".success-heading__close");
      if (successPopup) {
        // Lấy thông tin Xu từ popup
        const successMessage = await page.evaluate(() => {
          const descElement = document.querySelector(".success-content__desc");
          return descElement ? descElement.textContent.trim() : "";
        });

        console.log(`  ✓ Thành công! ${successMessage}`);

        // Click nút X để đóng popup
        await successPopup.click();
        console.log(`  → Đã đóng popup thành công`);
        await page.waitForTimeout(500);

        return { success: true, code, message: successMessage };
      }

      // Nếu không có popup thành công, kiểm tra có thông báo lỗi không
      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll(
          '.error, .alert-error, [class*="error"], [class*="Error"]',
        );
        for (const el of errorElements) {
          if (el.textContent && el.textContent.trim()) {
            return el.textContent.trim();
          }
        }
        return null;
      });

      if (errorMessage) {
        console.log(`  ✗ Lỗi: ${errorMessage}`);
        return { success: false, code, message: errorMessage };
      }
    } catch (e) {
      // Bỏ qua lỗi khi kiểm tra message
    }

    console.log(`  ✓ Đã nạp mã thành công: ${code}`);
    return { success: true, code };
  } catch (error) {
    console.log(`  ✗ Lỗi khi nạp mã ${code}: ${error.message}`);
    return { success: false, code, message: error.message };
  }
}

/**
 * Hàm chính
 */
async function napTikiXu() {
  console.log("=================================================");
  console.log("   🎁 TIKI GIFT CODE AUTOMATION 🎁");
  console.log("=================================================\n");

  let browser = null;

  try {
    // Đọc danh sách mã
    console.log("📂 Đang đọc danh sách mã...");
    let codes = [];

    if (
      config.dataSource === "codes.txt" ||
      config.dataSource.endsWith(".txt")
    ) {
      codes = await readCodesFromTxt();
      console.log(`✓ Đã đọc ${codes.length} mã từ codes.txt\n`);
    } else if (config.dataSource.endsWith(".csv")) {
      codes = await readCodesFromCsv();
      console.log(`✓ Đã đọc ${codes.length} mã từ data.csv\n`);
    } else {
      throw new Error(
        "Định dạng file không hỗ trợ. Vui lòng sử dụng .txt hoặc .csv",
      );
    }

    if (codes.length === 0) {
      console.log("⚠ Không có mã nào để nạp!");
      return;
    }

    // Khởi chạy trình duyệt
    console.log("🌐 Đang khởi động trình duyệt...");
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        "--start-maximized",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

    // Đi đến trang nạp mã
    console.log(`🔗 Đang truy cập: ${config.url}`);
    await page.goto(config.url, { waitUntil: "networkidle2", timeout: 30000 });

    console.log("\n⏸️  VUI LÒNG ĐĂNG NHẬP THỦ CÔNG VÀO TIKI");
    console.log("=================================================\n");

    // Đợi người dùng đăng nhập và nhấn Enter
    await waitForUserInput();

    console.log("\n🚀 Bắt đầu quá trình nạp mã...\n");

    // Chọn provider nếu có
    if (config.provider) {
      await selectProvider(page, config.provider);
    }

    // Thống kê
    const results = {
      total: codes.length,
      success: 0,
      failed: 0,
      successList: [],
      errors: [],
    };

    // Lặp qua từng mã
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      console.log(
        `\n[${i + 1}/${codes.length}] ========================================`,
      );

      const result = await redeemCode(page, code);

      if (result.success) {
        results.success++;
        results.successList.push({
          code: result.code,
          message: result.message || "Nạp mã thành công",
        });

        // Kiểm tra số dư hiện tại từ message
        if (result.message) {
          const balanceMatch = result.message.match(
            /Số dư hiện tại là ([\d.,]+) Xu/,
          );
          if (balanceMatch) {
            const currentBalance = parseInt(
              balanceMatch[1].replace(/[.,]/g, ""),
            );
            console.log(
              `💰 Số dư hiện tại: ${currentBalance.toLocaleString("vi-VN")} Xu`,
            );

            // Dừng nếu số dư >= 75 triệu
            if (currentBalance >= 75000000) {
              console.log(
                `\n🎯 Đã đạt mức số dư mục tiêu (>= 75 triệu Xu), dừng script!`,
              );
              break;
            }
          }
        }

        // Kiểm tra nếu đã nhập thành công 2 mã
        if (results.success % 2 === 0 && i < codes.length - 1) {
          console.log(
            `\n⏸️  Đã nhập thành công ${results.success} mã, dừng 45 giây...`,
          );
          await page.waitForTimeout(45000);
        }
      } else {
        results.failed++;
        results.errors.push({ code: result.code, message: result.message });
      }

      // Delay giữa các mã để tránh bị chặn
      if (i < codes.length - 1) {
        const delay = config.delayBetweenCodes || 5000;
        console.log(
          `⏳ Đợi ${delay / 1000} giây trước khi nạp mã tiếp theo...`,
        );
        await page.waitForTimeout(delay);
      }
    }

    // Báo cáo kết quả
    console.log("\n\n=================================================");
    console.log("              📊 KẾT QUẢ TỔNG HỢP");
    console.log("=================================================");
    console.log(`✓ Tổng số mã:        ${results.total}`);
    console.log(`✓ Thành công:        ${results.success}`);
    console.log(`✗ Thất bại:          ${results.failed}`);

    if (results.successList.length > 0) {
      console.log("\n✅ Danh sách mã thành công:");
      results.successList.forEach((item, idx) => {
        console.log(
          `   ${idx + 1}. ${item.code} - ${item.message || "Nạp mã thành công"}`,
        );
      });
    }

    if (results.errors.length > 0) {
      console.log("\n❌ Danh sách mã lỗi:");
      results.errors.forEach((err, idx) => {
        console.log(
          `   ${idx + 1}. ${err.code} - ${err.message || "Unknown error"}`,
        );
      });
    }

    console.log("=================================================\n");

    // Ghi log vào file
    const logContent = `
=================================================
TIKI GIFT CODE AUTOMATION - LOG
Thời gian: ${new Date().toLocaleString("vi-VN")}
=================================================

Tổng số mã: ${results.total}
Thành công: ${results.success}
Thất bại: ${results.failed}

${results.successList.length > 0 ? "Danh sách mã thành công:\n" + results.successList.map((item, idx) => `${idx + 1}. ${item.code} - ${item.message || "Nạp mã thành công"}`).join("\n") + "\n" : ""}
${results.errors.length > 0 ? "Danh sách mã lỗi:\n" + results.errors.map((err, idx) => `${idx + 1}. ${err.code} - ${err.message || "Unknown error"}`).join("\n") : "Không có lỗi"}

=================================================
`;

    fs.writeFileSync("log.txt", logContent, "utf-8");
    console.log("📄 Đã lưu log vào file log.txt\n");
  } catch (error) {
    console.error("\n❌ LỖI NGHIÊM TRỌNG:", error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      console.log("\n⏳ Đóng trình duyệt sau 5 giây...");
      await new Promise((r) => setTimeout(r, 5000));
      await browser.close();
      console.log("✓ Đã đóng trình duyệt\n");
    }
  }
}

// Chạy script
napTikiXu().catch(console.error);
