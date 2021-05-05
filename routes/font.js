let express = require('express')
let router = express.Router()
const { stablishedConnection, closeDbConnection } = require('../dbconn');
var readline = require('readline');
let fs = require('fs');
const bodyParser = require('body-parser')
var multer = require('multer')
var upload = multer()
let svg2ttf = require('svg2ttf');
const { nanoid } = require('nanoid');
// const spc = require('svg-png-converter')
const svgparse = require('svg-parser')
const rgbHex = require('rgb-hex');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
/**
 * 
 * @param {string} num 
 * @returns input string of hex plus one
 */

//此处代码在同一时刻只允许一个进程进入执行
const plusOne = (num) => {
    const jinwei = (num) => {

        switch (num) {
            case '0':
                return ['1', false]
            case '1':
                return ['2', false]
            case '2':
                return ['3', false]
            case '3':
                return ['4', false]
            case '4':
                return ['5', false]
            case '5':
                return ['6', false]
            case '6':
                return ['7', false]
            case '7':
                return ['8', false]
            case '8':
                return ['9', false]
            case '9':
                return ['A', false]
            case 'A':
                return ['B', false]
            case 'B':
                return ['C', false]
            case 'C':
                return ['D', false]
            case 'D':
                return ['E', false]
            case 'E':
                return ['F', false]
            case 'F':
                return ['0', true]
            default:
                return [false, false]
        }
    }
    console.log('pl', num);
    let res = jinwei(num[4])
    num = num.slice(0, 4) + res[0]
    if (res[1]) {
        res = jinwei(num[3])
        num = num.slice(0, 3) + res[0] + num.slice(4)
        if (res[1]) {
            res = jinwei(num[2])
            num = num.slice(0, 2) + res[0] + num.slice(3)
            if (res[1]) {
                res = jinwei(num[1])
                num = num.slice(0, 1) + res[0] + num.slice(2)
                if (res[1]) {
                    res = jinwei(num[0])
                    num = num.slice(0, 0) + res[0] + num.slice(1)
                }
            }
        }
    }
    console.log(num);
    return num
}

/**
 * READ UNICODE FROM code.json AND PLUS ONE 
 * @returns Promise
 */
const getUnicode = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('src/code.json', (err, data) => {
            if (err) {
                console.log('Get unicode from code.json error: ', err);
                reject('error')
            } else {
                console.log('Get unicode from code.json: ', data);
                let code = data.toString()
                code = JSON.parse(code)
                code = code.unicode
                console.log(code);
                resolve(code)
            }
        })
    })
}
/**
 * 
 * @param {string} unicode unicode of new font
 * @param {string} d path of svg of new font
 * @param {string} IDS structions and components of new font
 * @returns the latest name of .ttf  
 */
const getNum = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('src/code.json', (err, data) => {
            if (err) {
                console.log('Get num from code.json error: ', err);
                reject(100)
            } else {
                console.log('Get num from code.json: ', data);
                let num = data.toString()
                num = JSON.parse(num)
                num = num.num
                console.log(num);
                resolve(num)
            }
        })
    })
}
const svgtottf = (unicode, d, IDS) => {
    let ver = nanoid(5)
    var fRead = fs.createReadStream('src/icon.svg');
    var objReadline = readline.createInterface({
        input: fRead
    });
    var arr = new Array();
    objReadline.on('line', function (line) {
        arr.push(line);
    });
    objReadline.on('close', function (line) {
        writesvg(unicode, d, ver, IDS)
    });
    return `myfont${ver}.ttf`
}


// INSERT A NEW LINE INTO TABLE FONT
const insert = (code, d, IDS) => {
    console.log(code);
    // db.connect()

    stablishedConnection()
        .then(db => {
            // console.log(d);
            db.query(`INSERT INTO font VALUES('${code}','','${d}','${IDS}')`, function (err, data) {
                // db.end()
                closeDbConnection(db);
                if (err) {
                    console.log("数据库访问出错1");
                    stablishedConnection()
                        .then(db => {
                            db.query(`INSERT INTO font VALUES('${code}','','${d}','')`, function (err, data) {

                                closeDbConnection(db);
                                if (err) {
                                    console.log("数据库错2", err);
                                    return false
                                } else {
                                    console.log(data);
                                    return true
                                }
                            })
                        },
                            (err) => {
                                console.log(err);
                            })

                } else {
                    return true
                } //⿰��水水

            })
        },
            (err) => {
                console.log(err);
            })
}

/**
 * 
 * @param {string} d 
 * @returns Promise always resolve() 
 */
const check = (d) => {
    return new Promise((resolve, reject) => {
        stablishedConnection()
            .then(db => {
                db.query("SELECT unicode,d FROM font", function (err, data) {

                    // db.end()
                    if (err) {
                        console.log("数据库访问出错", err);
                    } else {
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].d === d) {
                                console.log('same');
                                closeDbConnection(db);
                                resolve(data[i].unicode)
                            }
                        }
                    }
                    console.log('no same');
                    closeDbConnection(db);
                    resolve('')
                })
            },
                (err) => {
                    console.log(err);
                })

    })

}

// const imgtosvg = (filepath) => {
//     var potrace = require('potrace'),
//         fs = require('fs');
//     return new Promise((resolve, reject) => {

//         potrace.trace(filepath, {
//             color: 'black',
//             threshold: 120
//         }, function(err, svg) {
//             if (err) resolve(false);
//             fs.writeFileSync('src/test.svg', svg);
//             resolve(true)
//         });
//     })
// }
const getPath = (d, children, resolve) => {
    let minColor = "ff"
    for (let i = 0; i < children.length; i++) {
        console.log("chileren i", children[i]);
        path = children[i]
        let color = path.properties.fill === "none" ? path.properties.stroke : path.properties.fill
        if (color.substr(0, 3) === "rgb") {
            color = '#' + rgbHex(color)
        }
        if (color.substr(1, 2) < minColor) {
            minColor = color.substr(1, 2)
        }
    }
    for (let i = 0; i < children.length; i++) {
        console.log("chileren i", children[i]);
        path = children[i]
        let color = path.properties.fill === "none" ? path.properties.stroke : path.properties.fill
        if (color.substr(0, 3) === "rgb") {
            color = '#' + rgbHex(color)
        }
        if (color.substr(1, 2) == minColor) {
            d += path.properties.d
        }
    }
    console.log(d);
    resolve(d)
    // return d
}
// const imgtosvg = (filepath) => {
//     return new Promise(async (resolve, reject) => {

//         const result = await spc.png2svg({
//             tracer: 'imagetracer',
//             optimize: true,
//             input: fs.readFileSync(filepath),
//             numberofcolors: 24,
//             pathomit: 1,
//         })
//         console.log(result);
//         const parsed = svgparse.parse(result.content)
//         let children = await parsed.children[0].children
//         let d = await getPath("", children, resolve)


//     })
// }

async function getSvg(filepath) {
    let webdriver = require('selenium-webdriver'),
        chrome = require('selenium-webdriver/chrome')
    By = webdriver.By,
        until = webdriver.until,
        options = new chrome.Options();
    options.addArguments('headless'); // note: without dashes
    options.addArguments('disable-gpu')
    options.addArguments('no-sandbox')
    let service = new chrome.ServiceBuilder().build();
    chrome.setDefaultService(service);
    let driver = new webdriver.Builder()
        .forBrowser('chrome')
        .withCapabilities(webdriver.Capabilities.chrome())
        .setChromeOptions(options)                         // note this
        .build();
    return new Promise(async (resolve, reject) => {
        try {
            driver.get(`https://www.pngtosvg.com/`);
            await driver.setDownloadPath(`D:/`)
            console.log('wa1');
            await (driver.wait(until.elementLocated(By.css('#file')), 10000)
                .then(async el => {
                    // let struct = await el.getText()
                    // return struct
                    console.log(el);
                    console.log(filepath);
                    el.sendKeys(filepath)
                })
            )
            await (driver.wait(until.elementLocated(By.css('.ezmob-footer-close')), 10000000, () => { console.log('fail'); })
                .then(async el => {
                    // let struct = await el.getText()
                    // return struct
                    el.click()
                })
            )
            await (driver.wait(until.elementLocated(By.css('#imageContainer .btn-primary')), 10000000, () => { console.log('fail'); })
                .then(async el => {
                    // let struct = await el.getText()
                    // return struct
                    el.click()
                })
            )
            // while (true) {
            //     let text
            //     await (driver.wait(until.elementLocated(By.css('#loadingMsg')), 10000000, () => { console.log('fail'); })
            //         .then(async el => {
            //             // let struct = await el.getText()
            //             // return struct
            //             return el.getText()
            //         })
            //         .then(data => {
            //             text = data
            //         })
            //     )
            //     if (text != 'Generating Vector 50%') {
            //         console.log('wait',text);
            //         await driver.sleep(2000)
            //     } else {
            //         console.log('break');
            //         break
            //     }
            // }
            await (await driver).sleep(7000)
            console.log('download');
            await (await (await driver).findElement(By.css('#download-btn'))).click()
        } finally {
            // await driver.quit();
            // driver.close()
            // return s
        }

    })
}
const writesvg = (unicode, d, ver, IDS) => {
    var fRead = fs.createReadStream('src/icon.svg');
    var objReadline = readline.createInterface({
        input: fRead
    });
    var arr = new Array();
    objReadline.on('line', function (line) {
        arr.push(line);
    });
    objReadline.on('close', function (line) {
        let after = arr.splice(arr.length - 3)
        let line1 = `            <glyph  unicode="&#x${unicode};"`
        let line2 = `                d="${d}"`
        let line3 = `                horiz-adv-x="400" />`
        var writerStream = fs.createWriteStream('src/icon.svg');
        writerStream.write([...arr, line1, line2, line3, ...after].join('\n'), 'UTF8', (err) => {
            console.log('write json');
            var ttf = svg2ttf(fs.readFileSync('src/icon.svg', 'utf8'), { familyname: "集大字库" });

            fs.writeFileSync(`src/myfont${ver}.ttf`, new Buffer.from(ttf.buffer), 'utf8');
            // fs.writeFileSync(`C:/Program Files/nginx-1.18.0/html/myfont${ver}.ttf`, new Buffer.from(ttf.buffer), 'utf8');
            // fs.writeFileSync(`/var/www/html/myfont${ver}.ttf`, new Buffer.from(ttf.buffer), 'utf8');
            let jsonWriteStr
            getNum()
                .then((num) => {
                    jsonWriteStr = JSON.stringify({
                        "unicode": unicode,
                        "name": `myfont${ver}.ttf`,
                        "num": num + 1
                    })

                    fs.writeFileSync('src/code.json', jsonWriteStr, 'utf8')
                    console.log('before ins', unicode);
                    insert(unicode, d, IDS)
                },
                    (num) => {
                        jsonWriteStr = JSON.stringify({
                            "unicode": unicode,
                            "name": `myfont${ver}.ttf`,
                            "num": num + 1
                        })
                        fs.writeFileSync('src/code.json', jsonWriteStr, 'utf8')
                        console.log('before ins', unicode);
                        insert(unicode, d, IDS)
                    }
                )


        });
    });
}
const getsvgd = () => {
    return new Promise((resolve, reject) => {
        var fRead = fs.createReadStream('src/test.svg');
        var objReadline = readline.createInterface({
            input: fRead
        });
        var arr = new Array();
        objReadline.on('line', function (line) {
            arr.push(line);
        });
        objReadline.on('close', function (line) {
            let d = arr[1]
            let ind = arr[1].indexOf('"')
            d = d.slice(ind + 1)
            ind = d.indexOf('"')
            d = d.substr(0, ind)
            // console.log(d);
            resolve(d)
        })
    })
}


/**
 * 
 * @returns the latest name of .ttf
 */
const getLatest = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('src/code.json', 'utf8', (error, data) => {
            if (error) {
                reject('fail')
            } else {
                console.log(data);
                let name = data.toString()
                name = JSON.parse(name)
                name = name.name
                // console.log(name);
                // resolve(name)
                resolve(name)
            }
        })
    })

}
// router.post('/upload', multipartMiddleware, (req, res) => {
//     // let formData = req.body;
//     // console.log('form data', formData);
//     // console.log(req.files);
//     console.log(req.files.filepond.path);
//     imgtosvg(req.files.filepond.path)
//         // .then(status => {
//         //     if (status) {
//         //         return getsvgd()
//         //     }
//         // })
//         .then(d => {
//             check(d)
//                 .then(hasCode => {
//                     console.log('check after', hasCode);
//                     if (hasCode !== '') {
//                         getLatest()
//                             .then(name => {
//                                 if (name !== 'fail') {

//                                     res.json({
//                                         status: 'success',
//                                         code: hasCode,
//                                         fontName: name,
//                                     })
//                                 } else {
//                                     res.json({
//                                         status: "fail",
//                                     })
//                                 }
//                             })
//                     } else {
//                         let ver = nanoid(5)
//                         getUnicode()
//                             .then(unicode => {
//                                 unicode = plusOne(unicode)
//                                 writesvg(unicode, d, ver, '')

//                                 res.json({
//                                     status: 'success',
//                                     code: unicode,
//                                     fontName: `myfont${ver}.ttf`,
//                                 })

//                             })
//                     }
//                 })
//         })



// });


const getSvgFile = (filepath) => {
    return new Promise(async (resolve, reject) => {
        fs.readFile(filepath, 'utf8', (err, data) => {
            if (err) {
                console.error(err)
                return
            }
            // console.log(data)
            const parsed = svgparse.parse(data)
            // console.log(parsed.children[0].children);
            let children = parsed.children[0].children[0].children
            // console.log(children);
            let d = getPath("", children, resolve)
        })
    })
}
router.post('/add_font',
    (req, res, next) => {
        console.log('before getuni');
        console.log(req.body.d);
        check(req.body.d)
            .then(hasCode => {
                console.log('check after', hasCode);
                if (hasCode !== '') {
                    getLatest()
                        .then(name => {
                            if (name !== 'fail') {
                                res.json({
                                    status: 'success',
                                    code: hasCode,
                                    fontName: name,
                                })
                            } else {
                                res.json({
                                    status: "fail",
                                })
                            }


                        })
                } else {
                    getUnicode()
                        .then((code) => {
                            console.log('then1', code);
                            return new Promise((resolve, reject) => {

                                if (code === 'error') {
                                    console.log('get error');
                                    reject('error')
                                } else {
                                    console.log('pro', code);
                                    resolve(plusOne(code))
                                }
                            })
                        })
                        .then((code) => {
                            console.log('then2', code);
                            if (code === 'error') {
                                console.log('code error');
                                res.send(JSON.stringify({
                                    status: 'fail'
                                }))
                            } else {
                                let name = svgtottf(code, req.body.d, req.body.IDS)
                                console.log(name);
                                res.json({
                                    status: 'success',
                                    code: code,
                                    fontName: name,
                                })
                            }


                        })
                        .catch((err) => {
                            console.log(err);
                        })
                }
            })
            .catch(error => {
                console.log('error', error);
            })

    }
)
router.get('/get_latest',
    (req, res, next) => {
        fs.readFile('src/code.json', 'utf8', (error, data) => {
            if (error) {
                res.json({
                    status: "fail",
                })
            } else {
                console.log(data);
                let name = data.toString()
                name = JSON.parse(name)
                name = name.name
                res.json({
                    status: "success",
                    name
                })
            }

        })
    }
)
router.get('/get_num',

    (req, res, next) => {
        getNum()
            .then((num) => {
                res.json({
                    num
                })

            }, (err) => {

                res.json({
                    num: err
                })

            })
    }
)

router.post('/test', multipartMiddleware,
    (req, res, next) => {

        getSvg(req.files.filepond.path)
            .then(data => {
                res.send('good')
            })
    }
)

router.post('/upload_svg', multipartMiddleware,
    (req, res, next) => {
        let filepath = req.files.filepond.path
        if (filepath.slice(filepath.length - 3) !== "svg") {
            res.send('need svg file')
        }
        getSvgFile(filepath)
            .then(d => {
                check(d)
                    .then(hasCode => {
                        console.log('check after', hasCode);
                        if (hasCode !== '') {
                            getLatest()
                                .then(name => {
                                    if (name !== 'fail') {

                                        res.json({
                                            status: 'success',
                                            code: hasCode,
                                            fontName: name,
                                        })
                                    } else {
                                        res.json({
                                            status: "fail",
                                        })
                                    }
                                })
                        } else {
                            let ver = nanoid(5)
                            getUnicode()
                                .then(unicode => {
                                    unicode = plusOne(unicode)
                                    writesvg(unicode, d, ver, '')

                                    res.json({
                                        status: 'success',
                                        code: unicode,
                                        fontName: `myfont${ver}.ttf`,
                                    })

                                })
                        }
                    })
            })

    }

)
module.exports = router