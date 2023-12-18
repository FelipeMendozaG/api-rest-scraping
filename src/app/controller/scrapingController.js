const { webs, matches: matchesModel, scraping } = require("../model")
const { ResponseException, ResponseOk } = require("../utils/ApiResponse")
const { chromium } = require("playwright");
const GetWebs = async (req, res) => {
    try {
        const Webs = await webs.find({});
        return ResponseOk(res, 200, Webs)
    } catch (err) {
        return ResponseException(res, 500, err.message)
    }
}
const PostScraping = async (req, res) => {
    const { urls } = await webs.findOne().where({ title: 'Footbalia' })
    const browser = await chromium.launch({ headless: false, timeout: 50000 });
    const context = await browser.newContext();
    // const page = await browser.newPage();
    /* const pageMatches = await browser.newPage(); */
    try {
        const domain = 'https://footballia.net';
        for (let item of urls) {

            const { url } = item;
            const page = await context.newPage()
            await page.goto(url);
            await page.waitForLoadState('load');
            const closeButton = await page.$('button.btn-close');
            if (closeButton) {
                await closeButton.click();
                console.log('Se hizo clic en el botón de cierre');
            } else {
                console.error('No se pudo encontrar el botón de cierre');
            }

            const signInLink = await page.$('a:has-text("Sign in")');
            if (signInLink) {
                await signInLink.click();
                console.log('Se hizo clic en el enlace "Sign in"');
            } else {
                console.error('No se pudo encontrar el enlace "Sign in"');
            }

            await page.fill('input#user_email', 'felipe188.mendoza@gmail.com')
            await page.fill('input#user_password', 'chepita123789')

            const submitButton = await page.$('.form-actions input[type="submit"]');
            if (submitButton) {
                await submitButton.click();
                console.log('Se hizo clic en el botón "Sign in"');
            } else {
                console.error('No se pudo encontrar el botón "Sign in"');
            }

            // OBTENER PAGINACION
            await page.waitForLoadState('load');
            await page.waitForSelector('.pagination');
            const paginationList = await page.$('ul.pagination');
            let lastPage = 0;
            if (paginationList) {
                const pageLinks = await paginationList.$$('li:not(.prev):not(.next) a');
                // Obtén el penúltimo enlace y extrae su texto
                if (pageLinks.length >= 2) {
                    lastPage = await pageLinks[pageLinks.length - 1].innerText();
                    console.log('Penúltimo valor de la lista de paginación:', lastPage);
                } else {
                    console.error('No hay suficientes enlaces en la lista de paginación.');
                }
            } else {
                console.error('No se pudo encontrar la lista de paginación.');
            }
            // CREAMOS UN SCRAPING
            if (!(await scraping.findOne().where({ cod: 'FOOTBALLIA_1' }))) {
                console.log('NO EXISTE NINGUN INDEX SCRAPING');
                // CREAMOS
                await scraping.create({
                    date: new Date().getUTCFullYear(),
                    name: 'SCRAPING-V1',
                    status: 'Proceso',
                    isValid: true,
                    pageTotal: lastPage,
                    cod: 'FOOTBALLIA_1',
                    pageCurrent: 0
                })
            }
            const objScraping = await scraping.findOne().where({ cod: 'FOOTBALLIA_1' })
            for (let item = 1; item <= parseInt(lastPage); item++) {
                try {
                    console.log(`${url}?page=${item}`);
                    const page1 = await context.newPage();
                    await page1.goto(`${url}?page=${item}`, { waitUntil: 'domcontentloaded', timeout: 600000 });
                    await page1.waitForLoadState('load',{timeout:600000});
                    await page1.waitForSelector('table');
                    // Realiza más acciones según sea necesario
                    const urls = await page1.evaluate(() => {
                        let urls = [];
                        const matchElements = document.querySelectorAll('td.match a');
                        matchElements.forEach((element) => {
                            const url = element.getAttribute('href');
                            if (url) {
                                urls.push(url);
                            }
                        });
                        urls = [... new Set(urls)];
                        return urls;
                    });

                    for (let urlpath of urls) {
                        // 
                        const pagematch = await context.newPage();
                        await pagematch.goto(domain + urlpath, { waitUntil: 'domcontentloaded', timeout: 600000 });
                        if (!pagematch.isClosed()) {
                            await pagematch.goto(domain + urlpath, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        }

                        await pagematch.waitForLoadState('load',{ timeout: 600000 });
                        // Obtiene el texto del elemento
                        const season = await pagematch.$eval('h2', (h2) => h2.innerText.split(' ')[2]);
                        const language = await pagematch.$eval('.language', (span) => span.innerText);
                        const title = await pagematch.$eval('.current', (span) => span.innerText);
                        const instance = await pagematch.$eval('.stage', (div) => div.innerText);
                        const competition = await pagematch.$eval('h2', (h2) => h2.innerText.split(' ')[0] + h2.innerText.split(' ')[1]);
                        await pagematch.waitForSelector('.venue[itemprop="location"]');
                        const ubication = await pagematch.$eval('.venue[itemprop="location"]', (div) => div.innerText);
                        await pagematch.waitForSelector('div.video');
                        await pagematch.waitForSelector('.row.teams');
                        let equipos = await pagematch.$$eval('.row.teams .team', (equipos) => {
                            return equipos.map((equipo) => {
                                const nombre = equipo.querySelector('[itemprop="name"]').innerText;
                                const urlImagen = equipo.querySelector('[itemprop="logo"]').getAttribute('content');

                                return { name_team: nombre, logo: urlImagen };
                            });
                        });

                        await pagematch.waitForSelector('table')

                        const dataPlayer = await pagematch.evaluate(() => {
                            const tablas = document.querySelectorAll('tr.starters > td[width="45%"] table');
                            const resultados = [];
                            tablas.forEach((tabla) => {
                                const datos = [];
                                // Seleccionar todas las filas de la tabla
                                const filas = tabla.querySelectorAll('tr.player');
                                filas.forEach((fila) => {
                                    const filaDatos = {};
                                    // Obtener datos de cada celda
                                    const celdas = fila.querySelectorAll('td');
                                    filaDatos.nationality = celdas[0]?.querySelector('.flag')?.getAttribute('title') || '';
                                    filaDatos.number = celdas[1]?.textContent.trim() || '';
                                    filaDatos.name = celdas[2]?.querySelector('span[itemprop="name"]')?.textContent.trim() || '';
                                    filaDatos.age = celdas[3]?.textContent.trim() || '';
                                    datos.push(filaDatos);
                                });
                                resultados.push(datos);
                            });
                            return resultados;
                        });

                        // OBTENER DATOS DE SUSTITUTOS
                        const dataSusti = await pagematch.evaluate(() => {
                            const tablas = document.querySelectorAll('tr.reserves > td[width="45%"] table');
                            const resultados = [];
                            tablas.forEach((tabla) => {
                                const datos = [];
                                // Seleccionar todas las filas de la tabla
                                const filas = tabla.querySelectorAll('tr.player');
                                filas.forEach((fila) => {
                                    const filaDatos = {};
                                    // Obtener datos de cada celda
                                    const celdas = fila.querySelectorAll('td');
                                    filaDatos.nationality = celdas[0]?.querySelector('.flag')?.getAttribute('title') || '';
                                    filaDatos.number = celdas[1]?.textContent.trim() || '';
                                    filaDatos.name = celdas[2]?.querySelector('span[itemprop="name"]')?.textContent.trim() || '';
                                    filaDatos.age = celdas[3]?.textContent.trim() || '';
                                    datos.push(filaDatos);
                                });
                                resultados.push(datos);
                            });
                            return resultados;
                        });

                        await pagematch.waitForLoadState('load');
                        // OBTENER DATA DE TECNICO
                        const dataCoach = await pagematch.evaluate(() => {
                            const tablas = document.querySelectorAll('tr.coaches > td[width="45%"] table');
                            const resultados = [];
                            tablas.forEach((tabla) => {
                                const datos = [];
                                // Seleccionar todas las filas de la tabla
                                const filas = tabla.querySelectorAll('tr.player');
                                filas.forEach((fila) => {
                                    const filaDatos = {};
                                    // Obtener datos de cada celda
                                    const celdas = fila.querySelectorAll('td');
                                    filaDatos.nationality = celdas[0]?.querySelector('.flag')?.getAttribute('title') || '';
                                    filaDatos.name = celdas[2]?.querySelector('span[itemprop="name"]')?.textContent.trim() || '';
                                    filaDatos.age = celdas[3]?.textContent.trim() || '';
                                    datos.push(filaDatos);
                                });
                                resultados.push(datos);
                            });
                            return resultados;
                        });
                        // OBTENER SCORE
                        const score = await pagematch.evaluate(() => {
                            let objScore = {};
                            const result = document.querySelector('div.result > span');
                            const goal = document.querySelector('div.goals');
                            const score = result.textContent.replace(goal.textContent, '');
                            objScore = {
                                goal: (parseInt(score.split(' : ')[0]) + parseInt(score.split(' : ')[1])),
                                goal_local: score.split(' : ')[0],
                                goal_visit: score.split(' : ')[1],
                                result: score + ' \n ' + goal.textContent
                            };
                            return objScore;
                        });
                        // OBTENER EL VIDEO PERO VALIDANDO SI TIENE VARIAS PARTES
                        const existeElemento = await pagematch.evaluate(() => {
                            return !!document.querySelector('div.m-t.alert.alert-warning');
                        });

                        let video = [];

                        if (existeElemento) {
                            console.log('El elemento existe en la página.');
                            video = await pagematch.evaluate(async() => {
                                document.querySelector('#jwplayer_display_button').click()
                                let vid = [];
                                const url = document.querySelector('video').getAttribute('src')
                                vid.push(url);
                                document.querySelector('span.jwnext.jwbuttoncontainer > span > button').click()
                                const url1 = document.querySelector('video').getAttribute('src');
                                vid.push(url1);
                                return vid;
                            })
                        } else {
                            // SOLO TIENE UN VIDEO
                            console.log('El elemento no existe en la página.');
                            video = await pagematch.evaluate(async() => {
                                document.querySelector('#jwplayer_display_button').click()
                                let vid = [];
                                const url = document.querySelector('video').getAttribute('src');
                                vid.push(url);
                                return vid;
                            })
                        }

                        for (let row = 0; row < equipos.length; row++) {
                            const [first, ...rest] = dataSusti[row];
                            const [head, ...element] = dataCoach[row];
                            equipos[row].players = dataPlayer[row];
                            equipos[row].substitutes = rest;
                            equipos[row].coach = element[0];
                        }

                        const matches = {
                            language, title,
                            instance, season,
                            competition, ubication,
                            team_local: equipos[0],
                            team_visit: equipos[1],
                            score,
                            video
                        }
                        await matchesModel.create(matches);
                        await pagematch.close()
                    }
                    await page1.close();
                } catch (error) {
                    console.error('Error durante la navegación de la paginación:', error);
                }
            }
        }
        return ResponseOk(res, 200, urls)
    } catch (err) {
        return ResponseException(res, 500, err.message)
    } finally {
        await browser.close();
    }
}

module.exports = {
    GetWebs, PostScraping
}