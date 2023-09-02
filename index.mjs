import puppeteer from 'puppeteer-extra';
import AWS from "aws-sdk";
import 'dotenv/config';
import ua from 'puppeteer-extra-plugin-anonymize-ua';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

(async () => {
  puppeteer.use(ua);
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const url = 'https://www.streetfighter.com/6/buckler/fr/auth/loginep?redirect_url=/';

  await page.goto(url);

  (await page.waitForSelector('#country')).select(process.env.SF6_COUNTRY);
  (await page.waitForSelector('#birthDay')).select(process.env.SF6_BIRTHDAY);
  (await page.waitForSelector('#birthMonth')).select(process.env.SF6_BIRTHMONTH);
  (await page.waitForSelector('#birthYear')).select(process.env.SF6_BIRTHYEAR);

  await page.locator('button').click();

  await page.waitForNavigation();

  const email = await page.waitForSelector("input[type='email']", {
    visible: true,
  });

  await email.type(process.env.SF6_LOGIN);

  const password = await page.waitForSelector("input[type='password']", {
    visible: true,
  });

  await password.type(process.env.SF6_PASSWORD);

  await page.locator('button').click();

  await page.waitForNavigation();

  const cookies = await page.cookies();

  await browser.close();

  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_ENDPOINT,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    connectTimeout: 0,
    httpOptions: { timeout: 0 }
  });

  await s3.putObject({
    Body: JSON.stringify(cookies),
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: process.env.AWS_KEY_NAME,
  }).promise();
})();