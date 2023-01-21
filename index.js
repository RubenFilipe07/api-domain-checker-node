const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 443;

app.get('/:domainName', async (req, res) => {

    const browser = await puppeteer.launch({
        headless: true,
    });
    const page = await browser.newPage();
    const domain = req.params.domainName;
    await page.goto('https://www.whois.com/whois/' + domain);


    const rawData = await page.evaluate(() => {

        const data = document.querySelector('#registryData') === null ? "No data" : document.querySelector('#registryData').innerHTML;
        return data;
    });

    const available = !rawData.includes("Domain Name:");

    await browser.close();

    res.send({
            "domain": domain,
            "available": available,
            "data": available ? "No data" : {
                "domainName": rawData.includes("Domain Name:") ? rawData.split("Domain Name:")[1].split("Registry Domain ID:")[0].trim() : "No data",
                "registryDomainId": rawData.includes("Registry Domain ID:") ? rawData.split("Registry Domain ID:")[1].split("Registrar WHOIS Server:")[0].trim() : "No data",
                "creationDate": rawData.includes("Creation Date:") ? rawData.split("Creation Date:")[1].split("\nRegistry Expiry Date:")[0].trim() : "No data",
                "registryExpiryDate": rawData.includes("Registry Expiry Date:") ? rawData.split("Registry Expiry Date:")[1].split("\nRegistrar Registration Expiration Date:")[0].trim() : "No data",
                "updatedDate": rawData.includes("Updated Date:") ? rawData.split("Updated Date:")[1].split("Creation Date:")[0].trim() : "No data",
                "country": rawData.includes("Country:") ? rawData.split("Country:")[1].split("\nName Server:")[0].trim() : "No data",
                "registrar": rawData.includes("Registrar URL:") ? rawData.split("Registrar URL:")[1].split("Updated Date:")[0].trim() : "No data",
            },
            "rawData": rawData
        });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));