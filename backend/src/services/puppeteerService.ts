import puppeteer from "puppeteer";

export interface RawAuditData {
  title: string;
  metaDescription: string | null;
  h1Count: number;
  imagesWithoutAlt: number;
  links: number;
}

export const scanPage = async (url: string): Promise<RawAuditData> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--single-process",
    ],
  });

  const page = await browser.newPage();

  // Block heavy resources to prevent memory leaks and timeouts
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resourceType = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const data = await page.evaluate(() => {
      const title = document.title;
      const metaDescTag = document.querySelector('meta[name="description"]');
      const metaDescription = metaDescTag
        ? metaDescTag.getAttribute("content")
        : null;
      const h1Count = document.querySelectorAll("h1").length;
      const imagesWithoutAlt = Array.from(
        document.querySelectorAll("img"),
      ).filter((img) => !img.hasAttribute("alt")).length;
      const links = document.querySelectorAll("a").length;

      return { title, metaDescription, h1Count, imagesWithoutAlt, links };
    });

    return data;
  } finally {
    await browser.close();
  }
};
