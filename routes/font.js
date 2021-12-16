let express = require('express')
let router = express.Router()
const { stablishedConnection, closeDbConnection } = require('../dbconn');
const readline = require('readline');
let fs = require('fs');
let svg2ttf = require('svg2ttf');
const { nanoid } = require('nanoid');
// const spc = require('svg-png-converter')
const svgparse = require('svg-parser')
const rgbHex = require('rgb-hex');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const AsyncLock = require('async-lock');
const lock = new AsyncLock();


router.post('/add_font',
    async (req, res, next) => {
        await lock.acquire('key1', async function () {
            let code = await check(req.body.d, req.body.IDS)
            if (code) {
                let name = await getLatest()
                if (name !== 'fail') {
                    res.json({
                        status: 'success',
                        code,
                        fontName: name,
                    })
                }
                else {
                    res.json({
                        status: "fail",
                    })
                }
            }
            else {
                code = await generateUnicode()
                if (code) {
                    let name = await svgtottf(code, req.body.d)
                    res.json({
                        status: 'success',
                        code,
                        fontName: name,
                    })
                } else {
                    res.send(JSON.stringify({
                        status: 'fail'
                    }))
                }
            }
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
    async (req, res, next) => {
        let num = await getNum()
        res.json({
            num: num ? num : 'fail'
        })
    }
)

router.post('/upload_svg', multipartMiddleware,
    async (req, res, next) => {

        await lock.acquire('key1', async function () {
            let filepath = req.files.filepond.path
            if (filepath.slice(filepath.length - 3) !== "svg") {
                res.send('need svg file')
            }
            let d = await getSvgFile(filepath)
            let code = await check(d)
            if (code) {
                let name = await getLatest()
                if (name !== 'fail') {
                    res.json({
                        status: 'success',
                        code,
                        fontName: name,
                    })
                } else {
                    res.json({
                        status: "fail",
                    })
                }
            }
            else {
                let ver = nanoid(5)
                let code = await generateUnicode()
                writesvg(code, d, ver)
                res.json({
                    status: 'success',
                    code: code,
                    fontName: `myfont${ver}.ttf`,
                })
            }
        })
    }
)

/**
 * hexadecimal plus one
 * @param {string} num 
 * @returns {string}
 */
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
    return num
}

/**
 * read unicode from code.json and plus one
 * @returns {Promise}
 */
const generateUnicode = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('src/code.json', (err, data) => {
            if (err) {
                resolve('')
            } else {
                let code = data.toString()
                code = JSON.parse(code)
                code = code.unicode
                code = plusOne(code)
                resolve(code)
            }
        })
    })
}
/**
 * get the sum of all characters
 * @returns {number}
 */
const getNum = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('src/code.json', (err, data) => {
            if (err) {
                resolve('')
            } else {
                let num = data.toString()
                num = JSON.parse(num)
                num = num.num
                resolve(num)
            }
        })
    })
}

/**
 * input unicode and d of character, auto append to src/icon.svg and generate ttf file.
 * @param {string} unicode 
 * @param {string} d 
 * @returns the result name of .ttf
 */
const svgtottf = async (unicode, d) => {
    let ver = nanoid(5)
    writesvg(unicode, d, ver)
    return `myfont${ver}.ttf`
}

/**
 * insert code, d, IDS of character to database
 * @param {string} code 
 * @param {string} d 
 * @param {string} IDS 
 */
const insert = async (code, d, IDS) => {
    let db = await stablishedConnection()
    try {
        let res = await db.query(`INSERT INTO font VALUES('${code}','','${d}','${IDS}')`)
    } catch (err) {
        await db.query(`INSERT INTO font VALUES('${code}','','${d}','')`)
    }
    closeDbConnection(db)
}

/**
 * check if there has the same character
 * @param {string} d 
 * @param {string} IDS 
 * @returns {Promise}
 */
const check = (d, IDS = '') => {
    return new Promise(async (resolve, reject) => {
        let db = await stablishedConnection()
        let res = await db.query(`SELECT unicode FROM font WHERE d='${d}'`)
        closeDbConnection(db);
        res = JSON.parse(JSON.stringify(res))
        if (res.length) {
            resolve(res[0].unicode)
        }
        else {
            await insert(await generateUnicode(), d, IDS)
            resolve('')
        }
        // })
    })

}

/**
 * get attrite "d" from <Path>
 * @param {string} d 
 * @param {object} children 
 * @param {function} resolve 
 */
const getPath = (d, children, resolve) => {
    let minColor = "ff"
    for (let i = 0; i < children.length; i++) {
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
        path = children[i]
        let color = path.properties.fill === "none" ? path.properties.stroke : path.properties.fill
        if (color.substr(0, 3) === "rgb") {
            color = '#' + rgbHex(color)
        }
        if (color.substr(1, 2) === minColor) {
            d += path.properties.d
        }
    }
    resolve(d)
}

/**
 * write unicode and d of character to src/icon.svg
 * @param {string} unicode 
 * @param {string} d 
 * @param {string} ver 
 */

const writesvg = (unicode, d, ver) => {
    let fRead = fs.createReadStream('src/icon.svg');
    let objReadline = readline.createInterface({
        input: fRead
    });
    let arr = new Array();
    objReadline.on('line', function (line) {
        arr.push(line);
    });
    objReadline.on('close', function (line) {
        let after = arr.splice(arr.length - 3)
        let line1 = `            <glyph  unicode="&#x${unicode};"`
        let line2 = `                d="${d}"`
        let line3 = `                horiz-adv-x="400" />`
        let writerStream = fs.createWriteStream('src/icon.svg');
        writerStream.write([...arr, line1, line2, line3, ...after].join('\n'), 'UTF8', (err) => {
            
            let ttf = svg2ttf(fs.readFileSync('src/icon.svg', 'utf8'), { familyname: "集大字库" });

            fs.writeFileSync(`src/myfont${ver}.ttf`, new Buffer.from(ttf.buffer), 'utf8');
            // fs.writeFileSync(`C:/Program Files/nginx-1.18.0/html/myfont${ver}.ttf`, new Buffer.from(ttf.buffer), 'utf8');
            // fs.writeFileSync(`/let/www/html/myfont${ver}.ttf`, new Buffer.from(ttf.buffer), 'utf8');
            let jsonWriteStr
            getNum()
                .then((num) => {
                    jsonWriteStr = JSON.stringify({
                        "unicode": unicode,
                        "name": `myfont${ver}.ttf`,
                        "num": num + 1
                    })

                    fs.writeFileSync('src/code.json', jsonWriteStr, 'utf8')
                },
                    (num) => {
                        jsonWriteStr = JSON.stringify({
                            "unicode": unicode,
                            "name": `myfont${ver}.ttf`,
                            "num": num + 1
                        })
                        fs.writeFileSync('src/code.json', jsonWriteStr, 'utf8')
                    }
                )
        });
    });
}


/**
 * get the latest file name of .ttf  
 * @returns the latest name of .ttf
 */
const getLatest = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('src/code.json', 'utf8', (error, data) => {
            if (error) {
                resolve('fail')
            } else {
                let name = data.toString()
                name = JSON.parse(name)
                name = name.name
                resolve(name)
            }
        })
    })
}

/**
 * input svg file path, get attribute "d"
 * @param {string} filepath 
 * @returns {Promise} arrtibute "d" of <Path>
 */
const getSvgFile = (filepath) => {
    return new Promise(async (resolve, reject) => {
        fs.readFile(filepath, 'utf8', (err, data) => {
            if (err) {
                console.error(err)
                return
            }
            const parsed = svgparse.parse(data)
            let children = parsed.children[0].children[0].children
            let d = getPath("", children, resolve)
        })
    })
}
module.exports = router