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


    const { data, valid } = await page.evaluate(() => {
        const data = document.querySelector('.df-raw') === null ? null : document.querySelector('.df-raw').innerText;
        const valid = document.querySelector('.whois_errorbox') === null ? true : false;
        return { data, valid };
    });

    await browser.close();

    const available = isNull(data);

    valid ?
        res.send({
            "domain": domain,
            "available": available,
            "valid": valid,
            "data": available ? "No data" : {
                "domainName": data.includes("Domain Name:") ? data.split("Domain Name:")[1].split("Registry Domain ID:")[0].trim() : "No data",
                "registryDomainId": data.includes("Registry Domain ID:") ? data.split("Registry Domain ID:")[1].split("Registrar WHOIS Server:")[0].trim() : "No data",
                "creationDate": data.includes("Creation Date:") ? data.split("Creation Date:")[1].split("\n")[0].trim() : "No data",
                "expirationDate": data.includes("Registry Expiry Date:") ? data.split("Registry Expiry Date:")[1].split("\n")[0].trim() : data.includes("Registrar Registration Expiration Date:") ? data.split("Registrar Registration Expiration Date:")[1].split("\n")[0].trim() : "No data",
                "updatedDate": data.includes("Updated Date:") ? data.split("Updated Date:")[1].split("Creation Date:")[0].trim() : "No data",
                "country": data.includes("Country:") ? data.split("Country:")[1].split("\n")[0].trim() : "No data",
                "registrar": data.includes("Registrar URL:") ? data.split("Registrar URL:")[1].split("Updated Date:")[0].trim() : "No data",
            },
            "rawData": available ? "No data" : data
        }) : res.send({ "data": "Invalid domain", "valid": valid, data: "No data", "rawData": "No data" });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));