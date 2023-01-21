const express = require('express');
const { isNull } = require('lodash');
const puppeteer = require('puppeteer');

const app = express();
const port = 443;

app.get('/', (req, res) => res.redirect('/api'));
app.get('/api', (req, res) => res.send('use /api/{domainName} to check info about domain. Example: /api/google.com'));


app.get('/api/:domainName', async (req, res) => {

    const browser = await puppeteer.launch({
        headless: true,
    });
    const page = await browser.newPage();
    const domain = req.params.domainName.toLowerCase();
    await page.goto('https://www.whois.com/whois/' + domain);


    const rawData = await page.evaluate(() => {

        const data = document.querySelector('.df-raw') === null ? null : document.querySelector('.df-raw').innerText;
        return data;
    });

    const available = isNull(rawData);

    await browser.close();

    res.send({
            "domain": domain,
            "available": available,
            "data": available ? "No data" : {
                "domainName": rawData.includes("Domain Name:") ? rawData.split("Domain Name:")[1].split("Registry Domain ID:")[0].trim() : "No data",
                "registryDomainId": rawData.includes("Registry Domain ID:") ? rawData.split("Registry Domain ID:")[1].split("Registrar WHOIS Server:")[0].trim() : "No data",
                "creationDate": rawData.includes("Creation Date:") ? rawData.split("Creation Date:")[1].split("\n")[0].trim() : "No data",
                "expirationDate": rawData.includes("Registry Expiry Date:") ? rawData.split("Registry Expiry Date:")[1].split("\n")[0].trim() : rawData.includes("Registrar Registration Expiration Date:") ?  rawData.split("Registrar Registration Expiration Date:")[1].split("\n")[0].trim() :  "No data",
                "updatedDate": rawData.includes("Updated Date:") ? rawData.split("Updated Date:")[1].split("Creation Date:")[0].trim() : "No data",
                "country": rawData.includes("Country:") ? rawData.split("Country:")[1].split("\n")[0].trim() : "No data",
                "registrar": rawData.includes("Registrar URL:") ? rawData.split("Registrar URL:")[1].split("Updated Date:")[0].trim() : "No data",
            },
            "rawData": available ? "No data" : rawData
        });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));