const mongoose = require('mongoose')
const puppeteer = require('puppeteer')
const Spiders = mongoose.model('spiders')

module.exports = {
    play: async (req, res, next) => {

        const { id } = req.params
        try {

            req.body.status = 'running'
            req.body.message = ''
            const spider = await Spiders.findByIdAndUpdate(id, req.body)
            console.log(spider);
            if (spider === null) {
                return res.status(404).json({ message: "spider not found" })
            }
            if (!spider.sourceUrl) {
                return res.status(500).json({ message: "no spider sourceUrl" })
            }
            console.log('begin', spider.name, "...");

            // Launch the browser and open a new blank page
            const browser = await puppeteer.launch({
                headless: true
            });

            // -----------------------------------------------

            const page = await browser.newPage();
            await page.setViewport({ width: 1080, height: 1024 });
            await page.goto(spider.sourceUrl);

            var jobs = []
            var companies = []

            if (spider.sourceUrl.includes('labonnealternance.apprentissage.beta.gouv.fr')) {

                // search
                console.log("searching ...");
                await page.waitForSelector('#headerFormJobField-input')
                await page.type('#headerFormJobField-input', spider.query.q)
                await page.waitForSelector('#headerFormJobField-item-0')
                await page.click('#headerFormJobField-item-0')

                await page.waitForSelector('#headerFormPlaceField-input')
                await page.type('#headerFormPlaceField-input', spider.query.location)
                await page.waitForSelector('#headerFormPlaceField-item-0')
                await page.click('#headerFormPlaceField-item-0')

                await page.click('form[data-testid="widget-form"] button[type="submit"]')

                await page.waitForNavigation()

                // scrap jobs
                console.log("extract jobs ...");
                await page.waitForSelector('#jobList a.chakra-link.resultCard h2.css-ne8rdc')
                const jobElements = await page.$$('#jobList a.chakra-link.resultCard')
                console.log(jobElements.length, ' jobs to scrap !');
                console.log('creating items ...');
                for (const jobElement of jobElements) {

                    const location = {
                        address: await jobElement.$eval('div.css-18psits', el => el.textContent)
                    }
                    const company = {
                        name: await jobElement.$eval('h3.css-jqzkck', el => el.textContent),
                        location,
                        links: {}
                    }
                    const job = {
                        name: await jobElement.$eval('h2.css-ne8rdc', el => el.textContent),
                        links: {
                            website: (await (await jobElement.getProperty('href')).jsonValue()).replace('JSHandle:', '')
                        },
                        location
                    }

                    jobs.push(job)
                    companies.push(company)

                }

                jobElements[0].click()
                console.log('enriching items ...');
                var lastIndex = jobElements.length - 1

                for (let index = 0; index < jobs.length; index++) {

                    // scrap job

                    try {
                        await page.waitForSelector('#itemDetailColumn .css-rz1orx > div', { timeout: 15000 })
                    } catch (error) {
                        console.log('Error: failed loading');
                        lastIndex = index
                        break
                    }

                    const infoBoxes = await page.$$('#itemDetailColumn .css-rz1orx > div')
                    for (const infoBox of infoBoxes) {
                        const textContent = (await infoBox.getProperty('textContent')).toString().replace('JSHandle:', '')
                        if (textContent.includes("Début du contrat")) {
                            const dateString = textContent.replace('Début du contrat :', '')
                            jobs[index].start_date = new Date(dateString)
                        }
                    }
                    try {
                        await page.waitForSelector('#itemDetailColumn .css-rltemf span.chakra-text', { timeout: 1000 })
                        jobs[index].description = await page.$eval('#itemDetailColumn .css-rltemf span.chakra-text', el => el.textContent)
                    } catch (error) { jobs[index].description = '' }

                    try {
                        await page.waitForSelector('#itemDetailColumn .css-odb6sc > .chakra-link.css-1k2m9cd', { timeout: 1000 })
                        companies[index].phone = await page.$eval('#itemDetailColumn .css-odb6sc > .chakra-link.css-1k2m9cd', el => el.textContent)
                    } catch (error) { }
                    try {
                        await page.waitForSelector('#itemDetailColumn .chakra-text > .chakra-link.css-1k2m9cd', { timeout: 1000 })
                        companies[index].links.website = await page.$eval('#itemDetailColumn .chakra-text > .chakra-link.css-1k2m9cd', el => el.href)
                    } catch (error) { }

                    if (index < jobs.length)
                        try {
                            await page.waitForSelector('.chakra-button.css-pcqbll', { timeout: 2000 })
                            const nextButtons = await page.$$('.chakra-button.css-pcqbll')
                            nextButtons[1].click()
                        } catch (error) {
                            console.log('Error: no next button');
                            lastIndex = index
                            break
                        }

                    console.log(`${index + 1}/${jobs.length} completly enriched`);

                }


            } else if (spider.sourceUrl.includes('candidat.francetravail.fr/offres/recherche')) {
            } else if (spider.sourceUrl.includes('linkedin.com/jobs/search')) {
            } else {
            }

            companies = companies.slice(0, lastIndex)
            console.log(companies.length, ' companies to save');
            console.log('saving', companies.length, ' companies ...');
            var companiesSavedCount = 0
            var jobsSavedCount = 0

            for (var company of companies) {

                const index = companies.indexOf(company)
                var job = jobs[index]

                if (!company.phone) {
                    console.log('no phone');
                    continue
                }

                try {
                    company.phone = company.phone.replace(' ', '')
                    company = await mongoose.model('companies').findOneAndUpdate({
                        phone: company.phone,
                    }, company, {
                        new: true,
                        upsert: true
                    })
                    companies[index] = company
                    companiesSavedCount++
                } catch (error) {
                    console.log('failed to sync company');
                    continue
                }

                if (job) {

                    try {
                        if (!job.links.website && !job.location.address) continue
                        job.companies = [company._id]
                        job.source = 'scrapping'
                        job.recruiters = company.recruiters
                        job = await mongoose.model('jobs').findOneAndUpdate({
                            name: job.name,
                            $or: [
                                { "links.website": job.links.website },
                                { "location.address": job.location.address },
                            ]
                        }, job, {
                            new: true,
                            upsert: true
                        })
                        jobs[index] = job
                        jobsSavedCount++
                    } catch (error) {
                        console.log('failed to sync job');
                        continue
                    }

                    if (!company.jobs) company.jobs = []
                    await company.jobs.addToSet(job._id)
                    await company.save()
                    companies[index] = company

                }

                console.log(`${index + 1}/${companies.length} companies saved`);

            }

            const stats = { jobsSavedCount, companiesSavedCount }
            console.log(stats);

            spider.message = `${jobsSavedCount} jobs have been scrapped`
            spider.status = 'finished'
            res.json({ stats, spider: await spider.save(), companies, jobs })

        } catch (error) {

            res.status(500).json({ message: error.message })

        }

    },
    pause: async (req, res) => { },
    stop: async (req, res) => { },
}