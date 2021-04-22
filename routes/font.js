let express = require('express')
let router = express.Router()
const { stablishedConnection, closeDbConnection } = require('../dbconn');
var readline = require('readline');
let fs = require('fs');
let svg2ttf = require('svg2ttf');
const { nanoid } = require('nanoid');
const { resolve } = require('path');

/**
 * 
 * @param {string} num 
 * @returns input string of hex plus one
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
        let after = arr.splice(arr.length - 3)
        let line1 = `            <glyph  unicode="&#x${unicode};"`
        let line2 = `                d="${d}"`
        let line3 = `                horiz-adv-x="200" />`
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
    return `myfont${ver}.ttf`
}


// INSERT A NEW LINE INTO TABLE FONT
const insert = (code, d, IDS) => {
    console.log(code);
    // db.connect()

    stablishedConnection()
        .then(db => {
            db.query(`INSERT INTO font VALUES('${code}','','${d}','${IDS}')`, function (err, data) {
                // db.end()
                closeDbConnection(db);
                if (err) {
                    console.log("数据库访问出错", err);
                    return false
                } else {
                    return true
                }
            })
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
                                closeDbConnection(db);
                                resolve(data[i].unicode)
                            }
                        }
                    }
                    console.log('no same');
                    closeDbConnection(db);
                    resolve('')
                })
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
module.exports = router
